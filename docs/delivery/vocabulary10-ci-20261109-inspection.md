# Archived CI render inspection — 9 November 2026, 21:45 AEDT

Refs #82, #81, #10. Run `openclaw-82-20460-20261109`. Harness OpenClaw 2026.10.5; actual configured model `openai/gpt-6.1-sol`. Continuing primed archive-verifier context, not independent Claude review. This addresses the visual-evidence note in Claude's review of evidence head `4b20b921f7ea779fb5cecd721fd687fdcbbb6139`.

## Identity and performed checks

Product PR head `191f83ca1fc1696f807e03fba2b73d8d5e10997e`; tested source `f56a584c9313fe985f4b6c68722b638e06d21286`; CI checkout `ff7d8c71bd249dc9577f6077e15f54f3a0703ffb`. Capture producer remains CI run `42528875433`, artifact `13636453180`; original hash manifest and image bytes unchanged. Before inspection, Python hashlib read all ten already-hydrated PNG bodies and recomputed SHA-256 against the reviewed manifest: 10/10 match. This local recheck is justified by the new visual review; no duplicate upload or remote archival pass claimed.

Used `view_image` on these three actual archived PNGs, not generated previews or a running app:

- **desktop-answer-qld-light.png:** “Source checked” date badges are readable in cards and evidence panel; “Needs a current check” wraps cleanly with its source title; “Suggested next step” labels remain within the prerequisite column. Evidence heading and Close evidence control fit their row. No cropped label or overlap observed.
- **desktop-fault-graph-light.png:** “Graph unavailable: passage evidence only” is readable as the service notice. The trailing “passages only” detail fits after its separator. Source-checked dates, Needs a current check, action cards and evidence panel remain legible. Long source URL wraps within its panel; no visible clipped edge. No new defect observed in this archived scene.
- **phone-fault-budget-dark.png:** “Daily budget reached” is fully readable in the notice at 390 px. The heading “Today’s query allowance is used up” wraps onto two lines inside the panel, not outside it. Explanatory text, preserved draft, Try again later and Change my context controls fit with visible boundaries. No clipped service word or control observed.

## Interpretation and limits

Scoped judgement: these three archived final scenes show the inspected evidence/service words as approved, without visible clipping. This closes the specific unexamined-durable-render observation for these scenes; Claude and Codex decide final acceptance/integration. Seven other archived images were not visually inspected in this continuation. This is not complete visual coverage of all nine vocabulary values; disagree/outside/paused remain covered by the separately reported rendered-text parity checks, not claimed visible here.

No application was executed on the Mac. No browser, zoom, screen reader, fixture services or settings were operated; no accessibility conformance, physical-phone, fresh actor, human research or owner-design approval claimed. macOS 27.2/build 26B123 and tools are as recorded in the original archive receipt; no new browser/runtime version probe was needed. No product code, PNG bytes, hashes or raw logs changed. The initial git status probe omitted portable LFS from PATH and failed to refresh the index; repeating it with the portable LFS path succeeded, with no mutation from the failed probe.

Original fresh upstream readback remains 10/10 at `4b20b92`, immutable receipt https://github.com/nissan/oz-startup-brain/pull/82#issuecomment-6730589462 . This delta adds interpretation only; no reason to redownload unchanged objects. No temporary artifacts or services were created, so no additional cleanup required. Source checkout retained for review.

Claude: review this inspection delta. Codex: reconcile the bounded visual gap, verify unchanged image/manifest identities, then integrate eligible #81/#82 and verify resulting build under existing authority. Keep #10 export parity, fresh #53 and actual AT #9 separate. No merge authority or completion certificate follows from structural validation.
