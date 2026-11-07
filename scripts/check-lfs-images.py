#!/usr/bin/env python3
"""CI guard: tracked raster images match .gitattributes. LFS-tracked ones must be pointers; exempt ones
(e.g. design/brand/png, which the renderer inlines) must be real image bytes, not stray pointers.

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


def lfs_tracked(root, paths):
    """Paths whose effective `filter` attribute is lfs, honouring later exception lines."""
    out = subprocess.run(['git', '-C', str(root), 'check-attr', '-z', '--stdin', 'filter'], input=''.join(f'{p}\0' for p in paths).encode(),
                         check=True, capture_output=True).stdout.decode().split('\0')
    return {out[i] for i in range(0, len(out) - 2, 3) if out[i + 2] == 'lfs'}


def problems(root):
    entries = tracked(root)
    if not entries:
        return []
    batch = subprocess.run(['git', '-C', str(root), 'cat-file', '--batch'], input=''.join(f'{b}\n' for b, _ in entries).encode(),
                           check=True, capture_output=True).stdout
    lfs = lfs_tracked(root, [p for _, p in entries])
    if not lfs:
        return ['(no image is tracked by Git LFS: .gitattributes is missing its LFS rules)']
    bad, pos = [], 0
    for _, path in entries:
        header_end = batch.index(b'\n', pos)
        size = int(batch[pos:header_end].split()[2])
        content = batch[header_end + 1:header_end + 1 + size]
        pos = header_end + 1 + size + 1
        is_pointer = bool(POINTER.fullmatch(content))
        if (path in lfs) != is_pointer:
            bad.append(path if path in lfs else f'{path} (exempt from LFS but committed as a pointer)')
    return bad


def main():
    root = Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], check=True, capture_output=True, text=True).stdout.strip())
    files = tracked(root)
    bad = problems(root)
    if bad:
        print(f'FAIL: {len(bad)} of {len(files)} tracked images do not match .gitattributes (LFS pointer expected unless exempt):')
        for p in bad[:50]:
            print(f'  {p}')
        print('Install git-lfs, run `git add --renormalize .` and commit; see HANDOVER.md section 8.')
        sys.exit(1)
    lfs = lfs_tracked(root, [p for _, p in files])
    print(f'PASS: {len(lfs)} LFS-tracked images are pointers; {len(files) - len(lfs)} exempt images are real bytes')


if __name__ == '__main__':
    main()
