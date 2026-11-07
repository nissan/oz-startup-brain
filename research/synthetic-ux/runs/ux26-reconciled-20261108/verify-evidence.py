"""Read-only byte/link verification for this historical evidence publication."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def verify(path, digest, size):
    target = ROOT / path
    if not target.resolve().is_relative_to(ROOT) or not target.is_file():
        raise ValueError(f'Missing or escaped evidence path: {path}')
    data = target.read_bytes()
    if len(data) != size or hashlib.sha256(data).hexdigest() != digest:
        raise ValueError(f'Byte identity mismatch: {path}')


artifacts = json.loads((ROOT / 'artifact-hashes.json').read_text())
for row in artifacts:
    verify(row['path'], row['sha256'], row['bytes'])
images = json.loads((ROOT / 'image-index.json').read_text())
pointers = 0
for row in images:
    target = ROOT / row['repo_path']
    head = target.read_bytes()[:200] if target.is_file() else b''
    if head.startswith(b'version https://git-lfs.github.com/spec/v1\n'):
        # Images are stored with Git LFS (8 November 2026). Without `git lfs pull` the checkout holds a
        # pointer; its oid is the SHA-256 of the image and its size the byte count, so both still verify.
        if not target.resolve().is_relative_to(ROOT):
            raise ValueError(f'Missing or escaped evidence path: {row["repo_path"]}')
        fields = dict(line.split(' ', 1) for line in head.decode().splitlines() if ' ' in line)
        if fields.get('oid') != f'sha256:{row["sha256"]}' or int(fields.get('size', -1)) != row['bytes']:
            raise ValueError(f'LFS pointer does not match the index: {row["repo_path"]}')
        pointers += 1
        continue
    verify(row['repo_path'], row['sha256'], row['bytes'])
    if not target.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(f'Not a PNG: {row["repo_path"]}')
for path in ROOT.rglob('*.json'):
    json.loads(path.read_text())
for path in ROOT.rglob('*.jsonl'):
    for line in path.read_text().splitlines():
        if line.strip():
            json.loads(line)
print(f'PASS: {len(artifacts)} artifacts; {len(images)} image references; '
      f'{len({row["sha256"] for row in images})} distinct PNGs ({pointers} checked as Git LFS pointers); JSON/JSONL valid')
