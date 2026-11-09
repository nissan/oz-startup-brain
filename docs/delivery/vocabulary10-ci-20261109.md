# #81 vocabulary CI archival — Mac authenticated transport

Refs #10, #81, #23. Run openclaw-81-20457-20261109, 9 November2026 AEDT. OpenClaw2026.10.5 harness; actual configured model openai/gpt-6.1-sol from session status. Continuing primed verifier context, not independent Claude review. Scope is authenticated artifact/LFS archival only under handoff6727849607; no application build/test/browser/zoom/AT or fresh research executed.

## Exact identities

- PR/source archive base191f83ca1fc1696f807e03fba2b73d8d5e10997e.
- Tested application sourcef56a584c9313fe985f4b6c68722b638e06d21286.
- CI run42528875433: head191f83c, completed/success; all six CI checks reported green.
- CI checkoutff7d8c71bd249dc9577f6077e15f54f3a0703ffb, from artifact name. These three SHAs are intentionally distinct.
- Artifact13636453180, evidence-vocabulary-ff7d8c71bd249dc9577f6077e15f54f3a0703ffb, 2292373bytes, unexpired; expires2027-02-06T22:10:18Z.
- Actual downloaded ZIP SHA25642a3e3c9289b5292b9322a1da1581c90069aaa94788165a165cba71e28e33e53 equals supplied API digest. ZIP is not committed; extracted unchanged PNG bytes are LFS.

## Actual commands/results

`gh api repos/nissan/oz-startup-brain/actions/runs/42528875433` and `/artifacts`: exit0; unique unexpired evidence-vocabulary artifact, correct run/head. `gh api repos/nissan/oz-startup-brain/actions/artifacts/13636453180/zip`: exit0. Local Python recomputed ZIPSHA256 and compared literal digest: PASS. Inspected ZIP entries before extraction: no absolute/parent/backslash/symlink paths; exact ten expected basenames, no duplicates; PNG signatures, dimensions, sizes and SHA256 verified10/10. Extraction flattened only those validated names into a dedicated owned directory; no paths from ZIP used as arbitrary destinations.

Fresh disposable clone with hooks/fsmonitor disabled and LFS smudge skipped; local config standard origin reviewed. Detached product base used to create owned branch evidence/81-ci-20457; no existing builder branch touched. Fetched CIcheckoutff7d8c7. Literal `git diff --exit-code f56a584c9313fe985f4b6c68722b638e06d21286 ff7d8c71bd249dc9577f6077e15f54f3a0703ffb -- apps/ packages/ design/system/ docs/api/ package.json package-lock.json`: exit0, no scoped product-path difference. No whole-tree identity claim.

Mac macOS27.2/26B123; Python3.15.2; AppleGit2.54.0/157; portableLFS3.8.1. No Node/npm/browser executed or version asserted for this archive-only task. Source captures produced by repository CI, desktop1280px/phone390px (individual dimensions in hashes manifest), not Codex's unpublished local1440px substitute-browser images. No manual visual inspection claimed by this archive; signatures/dimensions/hashes are archive checks only.

Reviewed pilot selector applied OSB-001/002/005, cataloga5b06880ce74cb3d74e4f0997a13ecf66921cf78f82315ebf07e5be6e17fbcb5. Docs receipt path unmatched; explicit handoff and evidence-only scope supply manual context. Structural record supplement is not behavioral acceptance. Initial selector command was mistakenly attempted from workspace root and exited2 for missing path, then executed successfully in the isolated checkout; no mutation resulted. No full suite repeated.

## Publication/readback and cleanup

Stage only new design/exports/vocabulary10-ci-20261109 and docs/delivery/vocabulary10-ci-20261109* files. Pointer guard and delta whitespace results recorded in publication checkpoint. Push actual10objects, then fresh-empty-store upstream LFS download and compare PNG signatures/sizes/SHA256/pointerOIDs. Exact evidence commit/readback are immutable checkpoint receipts on this PR, not self-referential hashes in this report. Failed/missing readback means incomplete archival, never a pass.

No services, browser sessions, settings or product files changed. Temporary ZIP/extraction/store retained until successful durable publication; cleanup receipt names their disposal or retention. Branch/report preserved for audit. No merge/deploy/issue closure/paid calls or secret export. Six original local Codex captures remain unpublished; these ten are separately CI-labelled.

Claude reviews archive interpretation at exact head; Codex verifies integrity, integrates/retargets evidence under existing authority, and verifies resulting build. Keep #10 open for export parity; this archive does not implement exports, clear actual AT9 or fresh53. Prior #78 Mac evidence is reviewed/merged and not repeated. No general Mac app execution requested by #81 handoff.
