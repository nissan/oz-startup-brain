#!/usr/bin/env python3
"""Opt-in public-URL fetch probe. Retains metadata/hashes only, never response bodies.

For a trusted, reviewed manifest in a local CLI, not an arbitrary-URL web service.
No credentials, cookies, retries, proxy bypass, rights promotion or corpus ingestion.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from pathlib import Path
import socket
import threading
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_BYTES = 2 * 1024 * 1024
TIMEOUT = 8
HOST_LOCKS = {}
LOCK = threading.Lock()


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec='microseconds')


def public_url(url):
    u = urlsplit(url)
    if u.scheme != 'https' or not u.hostname or u.username or u.password or u.port not in (None,443):
        raise ValueError('Only public HTTPS URLs on port 443 are accepted')
    host = u.hostname.lower()
    if host == 'localhost' or host.endswith(('.localhost','.local','.internal','.invalid')):
        raise ValueError('Non-public host')
    addresses = socket.getaddrinfo(host,443,type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError('Non-public destination address')
    return url


class PublicRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req,fp,code,msg,headers,newurl)


def result_for(source):
    return dict(source_id=source['source_id'],requested_url=source['url'],attempted_at=utc_now(),
                method='direct_https_get',outcome=None,http_status=None,final_url=None,
                content_type=None,raw_content_sha256=None,bytes_received=None,
                source_version_id=None,fetched_at=None,last_verified_at=None,
                snapshot_location=None,failure_reason=None)


def digest_body(body, source_id, fetched_at):
    digest = hashlib.sha256(body).hexdigest()
    # An observation at a new time is a new version, even for identical bytes.
    version = hashlib.sha256(f'{source_id}\n{fetched_at}\n{digest}'.encode()).hexdigest()[:20]
    return digest, 'sv_'+version


def probe(source):
    result = result_for(source)
    try:
        public_url(source['url'])
        host = urlsplit(source['url']).hostname
        with LOCK:
            lock = HOST_LOCKS.setdefault(host,threading.Lock())
        with lock:
            req = Request(source['url'],headers={'User-Agent':'OzStartupBrain-SourceAudit/0.2 (metadata review; no ingestion)'})
            with build_opener(PublicRedirect()).open(req,timeout=TIMEOUT) as response:
                result.update(http_status=response.status,final_url=response.url,
                              content_type=response.headers.get('Content-Type'))
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
                # The body goes out of scope; it is not written to output or corpus.
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
    args = p.parse_args()
    if not args.network:
        p.error('Network probes require --network')
    sources = json.loads(args.manifest.read_text())['sources']
    if args.source_id:
        known = {s['source_id'] for s in sources}
        if set(args.source_id)-known:
            p.error('Unknown source ID')
        sources = [s for s in sources if s['source_id'] in args.source_id]
    # Exclusive creation protects an earlier run's evidence before network work starts.
    with args.output.open('x') as output:
        with ThreadPoolExecutor(max_workers=6) as pool:
            records = list(pool.map(probe,sources))
        json.dump(dict(format_version='1',note='Fresh transport observations, not verified content or rights clearance. No snapshots retained. Proxy error codes do not prove publisher availability.',attempts=records),output,indent=2)
        output.write('\n')
    print(f'Wrote {len(records)} metadata-only attempts to {args.output}')

if __name__=='__main__':
    main()
