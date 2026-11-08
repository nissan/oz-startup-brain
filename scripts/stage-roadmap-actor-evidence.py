"""Fetch optional pre-staged actor PNG blobs. Never log response bytes or credentials."""
import base64
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import urllib.error
import urllib.request

PREFIX = 'research/synthetic-ux/runs/consolidation-20261108/actors/'
MANIFEST = Path('scripts/roadmap-actor-staging.json')
OUT = Path('_roadmap-capture')
MAX_BYTES = 10 * 1024 * 1024


class NoRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        return None  # Never forward the job token to a redirect destination.


def valid_path(value):
    return (isinstance(value, str) and value.startswith(PREFIX) and value.endswith('.png')
            and str(PurePosixPath(value)) == value
            and all(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', part) for part in value.split('/')))


def main():
    if (os.environ.get('GITHUB_REPOSITORY'), os.environ.get('GITHUB_REF'), os.environ.get('GITHUB_EVENT_NAME')) != (
            'nissan/oz-startup-brain', 'refs/heads/ci/roadmap-capture-20261108', 'push'):
        raise ValueError('unexpected workflow identity')
    OUT.mkdir(exist_ok=True)
    receipt = {'provided': MANIFEST.exists(), 'manifest_path': str(MANIFEST), 'manifest_sha256': None, 'entries': []}
    if MANIFEST.exists():
        raw = MANIFEST.read_bytes()
        entries = json.loads(raw)
        if not isinstance(entries, list) or not 1 <= len(entries) <= 30:
            raise ValueError('staging manifest must be a list of 1–30 entries')
        receipt['manifest_sha256'] = hashlib.sha256(raw).hexdigest()
        seen = set()
        total = 0
        # Validate the entire list before making any authenticated request.
        for entry in entries:
            if not isinstance(entry, dict) or set(entry) != {'blob_sha', 'sha256', 'bytes', 'path'}:
                raise ValueError('invalid staging entry fields')
            if not valid_path(entry['path']) or entry['path'] in seen:
                raise ValueError('invalid or duplicate actor path')
            seen.add(entry['path'])
            if not isinstance(entry['blob_sha'], str) or not re.fullmatch(r'[0-9a-f]{40}', entry['blob_sha']):
                raise ValueError('invalid blob SHA')
            if not isinstance(entry['sha256'], str) or not re.fullmatch(r'[0-9a-f]{64}', entry['sha256']):
                raise ValueError('invalid content hash')
            if type(entry['bytes']) is not int or not 24 <= entry['bytes'] <= MAX_BYTES:
                raise ValueError('invalid image size')
            total += entry['bytes']
        if total > 100 * 1024 * 1024:
            raise ValueError('staging set exceeds 100 MiB')
        token = os.environ['GH_TOKEN']
        opener = urllib.request.build_opener(NoRedirects())
        for entry in entries:
            request = urllib.request.Request(
                f"https://api.github.com/repos/nissan/oz-startup-brain/git/blobs/{entry['blob_sha']}",
                headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
                         'X-GitHub-Api-Version': '2022-11-28'})
            with opener.open(request, timeout=45) as response:
                payload = response.read(15 * 1024 * 1024 + 1)
            if len(payload) > 15 * 1024 * 1024:
                raise ValueError('blob response too large')
            blob = json.loads(payload)
            if blob.get('sha') != entry['blob_sha'] or blob.get('encoding') != 'base64' or blob.get('size') != entry['bytes']:
                raise ValueError('blob metadata mismatch')
            data = base64.b64decode(''.join(blob['content'].split()), validate=True)
            if len(data) != entry['bytes'] or hashlib.sha256(data).hexdigest() != entry['sha256']:
                raise ValueError('actor image content mismatch')
            if hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest() != entry['blob_sha']:
                raise ValueError('Git blob hash mismatch')
            if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
                raise ValueError('actor image is not PNG')
            relative = 'actors/' + entry['path'][len(PREFIX):]
            target = OUT / relative
            if target.exists():
                raise ValueError('actor staging destination already exists')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            receipt['entries'].append({**entry, 'artifact_path': relative})
    (OUT / 'actor-staging.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(f"Verified {len(receipt['entries'])} actor PNG blobs for LFS preservation")


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        print(f'Actor blob download failed with HTTP {error.code}; response withheld', file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        # Do not print arbitrary response text, request objects, environment or token values.
        print(f'Actor blob staging failed ({type(error).__name__}); no evidence commit is permitted', file=sys.stderr)
        sys.exit(1)
