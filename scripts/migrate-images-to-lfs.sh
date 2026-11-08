#!/usr/bin/env bash
# Executed once, on a Mac, in #52 (`068c7e7`), on top of #50's `8a30ddd`. Kept for provenance; later commits
# exempt design/brand/png (see .gitattributes), so rerunning it is neither needed nor expected to pass.
# One-time, forward-only conversion of the tracked raster images to Git LFS pointers.
# Run on a machine that can upload to GitHub LFS (not the Claude cloud workspace, whose proxy refuses
# github-cloud.s3.amazonaws.com), from a clean checkout of the branch that adds .gitattributes.
# History is not rewritten: earlier commits keep their image blobs and every cited SHA stays valid.
set -euo pipefail

git lfs version >/dev/null 2>&1 || { echo "git-lfs is not installed (macOS: brew install git-lfs)"; exit 1; }
[ -f .gitattributes ] && grep -q 'filter=lfs' .gitattributes || { echo "run from the branch that adds .gitattributes"; exit 1; }
[ -z "$(git status --porcelain --untracked-files=no -- . ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.PNG' ':!*.JPG' ':!*.JPEG' ':!*.GIF' ':!*.WEBP')" ] || { echo "working tree has other changes; commit or stash them first"; exit 1; }

git lfs install --local
# Record each image's content hash before conversion; an LFS pointer's oid must equal it.
before=$(mktemp)
git ls-files -z -- '*.png' '*.jpg' '*.jpeg' '*.gif' '*.webp' '*.PNG' '*.JPG' '*.JPEG' '*.GIF' '*.WEBP' | xargs -0 shasum -a 256 | sort -k2 > "$before"

git add --renormalize .
git commit -m "Store tracked raster images in Git LFS (forward-only; history unchanged)" \
  -m "Converted by scripts/migrate-images-to-lfs.sh. Every pointer oid equals the SHA-256 of the image it replaces."

# Verify: every committed image is now a pointer whose oid matches the original content hash.
after=$(mktemp)
git ls-files -z -- '*.png' '*.jpg' '*.jpeg' '*.gif' '*.webp' '*.PNG' '*.JPG' '*.JPEG' '*.GIF' '*.WEBP' | while IFS= read -r -d '' f; do
  oid=$(git cat-file -p "HEAD:$f" | sed -n 's/^oid sha256://p')
  [ -n "$oid" ] || { echo "not a pointer: $f"; exit 1; }
  printf '%s  %s\n' "$oid" "$f"
done | sort -k2 > "$after"
diff -u "$before" "$after" && echo "Verified: $(wc -l < "$after" | tr -d ' ') pointers match the original image hashes."
python3 scripts/check-lfs-images.py

echo "Now push this branch: git push   (uploads the LFS objects, then the commit)"
