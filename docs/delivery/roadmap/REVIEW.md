# Roadmap review — 8 November 2026

Scope: documentation-only status page and matching Markdown; no product/runtime, corpus, paid service or deployment configuration changes in the product repository.

## Content verification

At the 08:38 UTC historical snapshot, reads of #23/#45/#42/#28/#61/#62, open PR queue and #69 reviews recorded main `ab6c768`, candidate `013e5df`, evidence `2e8f49d`. #69 had no submitted reviews at snapshot time. Candidate evidence counts are explicitly reported, not independently accepted here. No human findings or release permissions were invented. Later merges supersede these historical statuses; they are not current assignments.

## Visual review

Browser: cloud Chromium. The actual managed preview was inspected directly and through an authored same-origin iframe QA harness at CSS widths 390, 768 and 1440. This is viewport layout checking, not browser-zoom, assistive-technology or real-device acceptance.

- Initial desktop composition: cream paper, hairline rules, clear hero/release notice, five distinct continuity stages, editorial workstream rows. No competing primary action.
- Highest-impact weakness: the initial 390px hero used a four-line 46px heading and pushed the release status down. Changed phone heading to 36px and reduced top padding by 10px. Re-rendered: heading occupies two lines and release notice appears substantially earlier, with no clipping.
- Inspected phone light/dark hero and phone dark filter/results, tablet dark workstreams, desktop dark workstreams and desktop light handoffs. 390/768/1440 checks reported no horizontal overflow. Desktop screenshot viewport clipped the outer QA harness beyond its own width; the contained page reported 1440px and no overflow.
- Embedded Fraunces, Atkinson regular/bold and JetBrains Mono all reported loaded through the QA harness. Intended families visibly rendered.
- All filters operated: 10 total, 2 delivered, 2 review/verification, 5 next gates, 1 later. Theme control changed its label; evidence disclosure opened via Enter. In-page navigation to handoffs worked.
The original inspection used in-session viewport screenshots; its initial screenshot was not preserved. That historical evidence gap remains explicit.

Durable final evidence is available at [evidence commit f89f95c](https://github.com/nissan/oz-startup-brain/tree/f89f95cc156b885867571d33467e5886b8d8bb9f/design/exports/roadmap-20261108) and in this PR: full-page 390px and 1440px captures in light and dark, with exact hashes and conditions in the manifest. [Capture run 42466173078](https://github.com/nissan/oz-startup-brain/actions/runs/42466173078) rendered unchanged HTML from `99c516df8af4b94cb05bbbf63855b8d6ce35f3eb`, using Playwright 1.63.0 / Chromium 153.0.8010.12, 900px viewport height, device scale factor 1, en-AU locale, UTC and reduced motion.

The run verified painted Fraunces, Atkinson regular/bold and JetBrains Mono; filter counts 10/2/2/5/1; theme switching; Enter-operated disclosure; and no horizontal overflow at captured widths. These scripted checks do not establish a full keyboard sweep, actual zoom, screen-reader acceptance or real-device behaviour.

The run also produced an explicitly **reconstructed comparison**, restoring documented phone heading 46px and hero top padding 38px. It is not the lost historical initial screenshot. Hash, exact CSS override and capture-script commit are in the manifest. The comparison remains in the run's `roadmap-captures-20261108` artifact until 6 February 2027; only final renders are committed.

A separate Codex reviewer, independent of page implementation but author of the capture helper independently reviewed by the coordinator, downloaded fresh LFS bytes and checked hashes, sizes and canonical pointers. The reviewer inspected all four final renders and the reconstruction. The final phone heading uses two lines instead of four, moving the release notice from approximately y=646 to y=508 and bringing it fully into the first 900px. Desktop columns, mobile stacking, long revision links and both themes remain legible without material clipping or overlap. This is same-provider review and not independent review of that reviewer's capture tooling.

Judgement: scoped visual review complete; missing durable final evidence resolved. The lost original initial capture remains a disclosed limitation. This does not approve product/corpus release, accessibility conformance or historical assignments as current work.

## Checks

Passed: HTML structural/local-anchor checks, embedded-script syntax, Markdown/HTML revision parity and whitespace checks. The capture workflow additionally passed the recorded browser/image-integrity checks. Product clean-install suites are not applicable: no apps/, packages/ or docs/api/ changes.
