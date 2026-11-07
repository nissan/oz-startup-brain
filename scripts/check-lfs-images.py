#!/usr/bin/env python3
"""CI guard: every tracked raster image must be a Git LFS pointer (see .gitattributes).

Checks the staged blobs (the index), not the working tree, so it gives the same answer whether or not
LFS has smudged the real images into the checkout. A raw image here means it was committed without
Git LFS installed, or from a workspace that cannot upload LFS objects. Standard library only.
"""
import re
import subprocess
import sys
from pathlib import Path

PATTERNS = ('*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.PNG', '*.JPG', '*.JPEG', '*.GIF', '*.WEBP')  # match .gitattributes
POINTER = re.compile(rb'version https://git-lfs\.github\.com/spec/v1\noid sha256:[0-9a-f]{64}\nsize \d+\n')


def tracked(root):
    """(blob id, path) for every staged image."""
    out = subprocess.run(['git', '-C', str(root), 'ls-files', '-s', '-z', '--', *PATTERNS], check=True, capture_output=True).stdout
    entries = []
    for rec in out.decode().split('\0'):
        if rec:
            meta, path = rec.split('\t', 1)
            entries.append((meta.split()[1], path))
    return entries


def problems(root):
    entries = tracked(root)
    if not entries:
        return []
    batch = subprocess.run(['git', '-C', str(root), 'cat-file', '--batch'], input=''.join(f'{b}\n' for b, _ in entries).encode(),
                           check=True, capture_output=True).stdout
    bad, pos = [], 0
    for _, path in entries:
        header_end = batch.index(b'\n', pos)
        size = int(batch[pos:header_end].split()[2])
        content = batch[header_end + 1:header_end + 1 + size]
        pos = header_end + 1 + size + 1
        if not POINTER.fullmatch(content):
            bad.append(path)
    return bad


def main():
    root = Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], check=True, capture_output=True, text=True).stdout.strip())
    files = tracked(root)
    bad = problems(root)
    if bad:
        print(f'FAIL: {len(bad)} of {len(files)} tracked images are not Git LFS pointers:')
        for p in bad[:50]:
            print(f'  {p}')
        print('Install git-lfs, run `git add --renormalize .` and commit; see HANDOVER.md section 8.')
        sys.exit(1)
    print(f'PASS: all {len(files)} tracked images are Git LFS pointers')


if __name__ == '__main__':
    main()
