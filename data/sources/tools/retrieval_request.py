#!/usr/bin/env python3
"""Checks a retrieval request and reports whether it still needs running (CI helper, standard library).

A request names shortlisted sources and a single-use public key that the snapshots are encrypted
to. It is pending until a retrieval log for its run_id is committed under audits/.
"""
import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
RUN_ID = re.compile(r'retrieval-\d+-\d{8}[a-z]')


def check(request, manifest):
    errors = []
    shortlisted = {s['source_id'] for s in manifest['sources'] if s['shortlist_tier']}
    if request.get('request_format') != '1':
        errors.append('request_format must be 1')
    if not RUN_ID.fullmatch(request.get('run_id', '')):
        errors.append('run_id must look like retrieval-<issue>-<yyyymmdd><letter>')
    if request.get('transport') not in ('direct', 'configured-proxy'):
        errors.append('unknown transport')
    sources = request.get('sources') or []
    if not sources or len(sources) != len(set(sources)) or not set(sources) <= shortlisted:
        errors.append('sources must be distinct shortlisted manifest IDs')
    via = request.get('via_observed_redirect', [])
    redirects = {s['source_id'] for s in manifest['sources'] if s['observed_redirect_url']}
    if not set(via) <= set(sources) & redirects:
        errors.append('via_observed_redirect must name requested sources that have a reviewed redirect destination')
    pem = (request.get('snapshot_recipient') or {}).get('public_key_pem', '')
    if not (pem.startswith('-----BEGIN PUBLIC KEY-----') and pem.rstrip().endswith('-----END PUBLIC KEY-----')):
        errors.append('snapshot recipient must be a PEM public key')
    if 'PRIVATE KEY' in json.dumps(request):
        errors.append('a request must never contain a private key')
    return errors


def log_path(run_id):
    return ROOT/'audits'/f'{run_id}.json'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('request', type=Path)
    p.add_argument('--field', choices=('run_id', 'sources', 'transport', 'pending'))
    args = p.parse_args()
    request = json.loads(args.request.read_text())
    errors = check(request, json.loads((ROOT/'article-bibliography.json').read_text()))
    if errors:
        sys.exit('\n'.join(errors))
    if args.field == 'sources':
        print(' '.join([f'--source-id {s}' for s in request['sources']]
                       + [f'--via-observed-redirect {s}' for s in request.get('via_observed_redirect', [])]))
    elif args.field == 'pending':
        print('false' if log_path(request['run_id']).exists() else 'true')
    elif args.field:
        print(request[args.field])
    else:
        print(f"PASS: {request['run_id']} ({len(request['sources'])} sources)")


if __name__ == '__main__':
    main()
