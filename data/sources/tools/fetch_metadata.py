#!/usr/bin/env python3
"""Opt-in public-URL fetch probe for a trusted, reviewed manifest (a local CLI, not a web service).

By default it retains metadata and hashes only. With --snapshot-dir it also writes each complete
body to a git-ignored or out-of-repository folder, named by its version ID, so an approved snapshot
can be archived privately and re-hashed later. Response bodies are never written to the log.

Transports:
  direct            resolve the host locally and refuse non-global addresses (the 0.2 behaviour)
  configured-proxy  for runtimes without local DNS whose egress goes through an HTTPS proxy given
                    in HTTPS_PROXY; the proxy resolves and connects, so the local address check is
                    delegated to it and recorded as such

No credentials, cookies, retries, access-control bypass, rights promotion or corpus ingestion.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from pathlib import Path
import os
import socket
import subprocess
import threading
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_BYTES = 2 * 1024 * 1024
TIMEOUT = 8
TOOL_VERSION = '0.3'
USER_AGENT = f'OzStartupBrain-SourceAudit/{TOOL_VERSION} (source retrieval for rights review; no ingestion)'
TRANSPORTS = ('direct', 'configured-proxy')
REPO = Path(__file__).resolve().parents[3]
HOST_LOCKS = {}
LOCK = threading.Lock()


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec='microseconds')


def public_url(url, resolve=True):
    """Reject non-HTTPS, credentialed, non-default-port and non-public names; with resolve, also
    reject any non-global resolved address. resolve=False is only for the configured-proxy transport."""
    u = urlsplit(url)
    if u.scheme != 'https' or not u.hostname or u.username or u.password or u.port not in (None,443):
        raise ValueError('Only public HTTPS URLs on port 443 are accepted')
    host = u.hostname.lower()
    if host == 'localhost' or host.endswith(('.localhost','.local','.internal','.invalid')):
        raise ValueError('Non-public host')
    try:
        ipaddress.ip_address(host)
        raise ValueError('Literal IP destinations are not accepted')
    except ValueError as exc:
        if 'Literal' in str(exc):
            raise
    if not resolve:
        return url
    addresses = socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError('Non-public destination address')
    return url


class PublicRedirect(HTTPRedirectHandler):
    resolve = True

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl, resolve=self.resolve)
        return super().redirect_request(req,fp,code,msg,headers,newurl)


class ProxiedPublicRedirect(PublicRedirect):
    resolve = False


def snapshot_dir_allowed(path):
    """A snapshot folder must be outside the repository or git-ignored inside it, so third-party
    bodies cannot be committed by accident."""
    path = path.resolve()
    try:
        path.relative_to(REPO)
    except ValueError:
        return True
    probe_path = path / 'sv_probe.body'
    r = subprocess.run(['git', '-C', str(REPO), 'check-ignore', '-q', str(probe_path)], capture_output=True)
    return r.returncode == 0


METHODS = {'direct': 'direct_https_get', 'configured-proxy': 'https_get_via_configured_proxy'}


def result_for(source, transport='direct'):
    r = dict(source_id=source['source_id'],requested_url=source['url'],attempted_at=utc_now(),
             method=METHODS[transport],outcome=None,http_status=None,final_url=None,
             content_type=None,raw_content_sha256=None,bytes_received=None,
             source_version_id=None,fetched_at=None,last_verified_at=None,
             snapshot_location=None,failure_reason=None)
    if transport != 'direct':
        r.update(etag=None,last_modified=None)
    return r


def digest_body(body, source_id, fetched_at):
    digest = hashlib.sha256(body).hexdigest()
    # An observation at a new time is a new version, even for identical bytes.
    version = hashlib.sha256(f'{source_id}\n{fetched_at}\n{digest}'.encode()).hexdigest()[:20]
    return digest, 'sv_'+version


def probe(source, transport='direct', snapshot_dir=None):
    result = result_for(source, transport)
    resolve = transport == 'direct'
    try:
        if not resolve and not (os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')):
            raise ValueError('configured-proxy transport needs HTTPS_PROXY')
        public_url(source['url'], resolve=resolve)
        host = urlsplit(source['url']).hostname
        with LOCK:
            lock = HOST_LOCKS.setdefault(host,threading.Lock())
        with lock:
            agent = USER_AGENT if transport != 'direct' else 'OzStartupBrain-SourceAudit/0.2 (metadata review; no ingestion)'
            req = Request(source['url'],headers={'User-Agent':agent})
            handler = PublicRedirect() if resolve else ProxiedPublicRedirect()
            with build_opener(handler).open(req,timeout=TIMEOUT) as response:
                result.update(http_status=response.status,final_url=response.url,
                              content_type=response.headers.get('Content-Type'))
                if not resolve:
                    result.update(etag=response.headers.get('ETag'),last_modified=response.headers.get('Last-Modified'))
                body = response.read(MAX_BYTES+1)
                result['bytes_received'] = len(body)
                if len(body)>MAX_BYTES:
                    result.update(outcome='size_limit',failure_reason='Response exceeds 2 MiB; no complete hash/version retained')
                elif not body:
                    result.update(outcome='empty_body',failure_reason='Empty HTTP response; no source version')
                else:
                    when = utc_now()
                    digest,version = digest_body(body,source['source_id'],when)
                    result.update(outcome='http_body_received',fetched_at=when,
                                  raw_content_sha256=digest,source_version_id=version)
                    if snapshot_dir is not None:
                        # Exclusive creation: a snapshot is never overwritten or replaced.
                        with (snapshot_dir/f'{version}.body').open('xb') as f:
                            f.write(body)
                        result['snapshot_location'] = f'snapshot:{version}.body'
                # The body is not written to the log or any corpus.
    except HTTPError as exc:
        result.update(outcome='http_error',http_status=exc.code,
                      failure_reason=f'HTTP {exc.code}; source, proxy or execution environment may have refused access')
    except (URLError,TimeoutError,OSError,ValueError) as exc:
        # Never copy arbitrary response content or exception URLs into logs.
        result.update(outcome='transport_error',failure_reason=type(exc).__name__)
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--manifest',type=Path,default=Path(__file__).resolve().parents[1]/'article-bibliography.json')
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--network',action='store_true',help='Explicitly permit public HTTPS probes')
    p.add_argument('--source-id',action='append',help='Probe selected IDs, otherwise all manifest URLs')
    p.add_argument('--transport',choices=TRANSPORTS,default='direct')
    p.add_argument('--snapshot-dir',type=Path,help='Retain complete bodies here (outside the repository or git-ignored)')
    p.add_argument('--run-id',help='Retrieval run identifier recorded in the log (format 2)')
    args = p.parse_args()
    if not args.network:
        p.error('Network probes require --network')
    if args.snapshot_dir is not None:
        if not snapshot_dir_allowed(args.snapshot_dir):
            p.error('Snapshot folder must be outside the repository or git-ignored')
        args.snapshot_dir.mkdir(parents=True,exist_ok=True)
    retrieval = args.transport != 'direct' or args.snapshot_dir is not None
    if retrieval and not args.run_id:
        p.error('A retrieval (proxy transport or snapshots) needs --run-id')
    sources = json.loads(args.manifest.read_text())['sources']
    if args.source_id:
        known = {s['source_id'] for s in sources}
        if set(args.source_id)-known:
            p.error('Unknown source ID')
        sources = [s for s in sources if s['source_id'] in args.source_id]
    # Exclusive creation protects an earlier run's evidence before network work starts.
    with args.output.open('x') as output:
        started = utc_now()
        with ThreadPoolExecutor(max_workers=6) as pool:
            records = list(pool.map(lambda s: probe(s,args.transport,args.snapshot_dir),sources))
        if retrieval:
            doc = dict(format_version='2',run=dict(run_id=args.run_id,tool_version=TOOL_VERSION,transport=args.transport,
                       method=METHODS[args.transport],user_agent=USER_AGENT,started_at=started,finished_at=utc_now(),
                       address_check='local_dns_global_only' if args.transport=='direct' else 'delegated_to_configured_proxy',
                       snapshots='retained_outside_git' if args.snapshot_dir else 'not_retained'),
                       note='Fresh retrieval of selected sources. A received body is a fetched representation, not verified content, rights clearance or ingestion approval. Snapshots, if any, are kept outside git. Proxy error codes do not prove publisher availability.',
                       attempts=records)
        else:
            doc = dict(format_version='1',note='Fresh transport observations, not verified content or rights clearance. No snapshots retained. Proxy error codes do not prove publisher availability.',attempts=records)
        json.dump(doc,output,indent=2)
        output.write('\n')
    kept = sum(r['snapshot_location'] is not None for r in records)
    print(f'Wrote {len(records)} attempts ({kept} snapshots retained) to {args.output}')

if __name__=='__main__':
    main()
