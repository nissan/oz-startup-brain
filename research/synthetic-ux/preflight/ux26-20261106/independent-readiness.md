# Independent source-readiness review

Reviewer: Codex, separate verifier context `ux26_readiness_verifier`, for facilitator run `ux26-20261106`. Checkpoint date: 7 November 2026 (Australia/Sydney).

Target independently checked in the shared checkout: `d3f54e887fb946bccf399f142791ed87e6be1b76`, tree `8bc14aef68ca54c8b0b79db7f8badfb703be8ae5`. The verifier did not implement the product or author README.md, manifest.json or validation.md. This is an independent source and checkpoint review in a shared checkout, not a clean-room runtime reproduction, an actor session or an unprimed usability inspection.

## Evidence and verdict

I read the repository instructions, handover, actor briefs/profiles, runbook, facilitator task/capability/fixture records, and relevant application, fixture and e2e source. I independently checked the target commit/tree and inspected the three checkpoint documents. My initial source assessment preceded their creation. No product files were changed by this verifier; only this assessment was written.

The checkpoint's substantive source-readiness conclusions are accurate. It correctly records a preflight checkpoint with zero actor attempts, completions and failures; does not manufacture browser traces; and does not turn capability declarations, unit tests or source inspection into executed UX coverage. Its selected-variant denominator is eight. T04's documented exclusion is kept separate.

The facilitator reports the Node 22.23.4/npm 10.9.9 install/build, workspace typechecks, 127 unit tests, compatibility check, nine HTTP demo checks, 13 pack regression tests and token check; the literal generated-file command failure and substitute; the browser installer failure and refused browser connection. I did **not** reproduce those executions or independently inspect their original execution logs. This assessment checks their attribution and evidence boundaries, not their runtime correctness. Issue #41/#42 creation and live issue status are likewise facilitator-reported here; I did not independently inspect those external records.

Two corrections were requested before final checkpoint signoff:

1. Attribute validation.md's executions to the **facilitator**, rather than the builder.
2. Record declared release scope separately from runtime capability presence in manifest.json, with its evidence basis, as required by runbook.md:13. An exact-fixture mismatch must remain distinct from a wholly absent or explicitly deferred product capability.

Both corrections were applied by the facilitator and inspected by this verifier: validation.md now says "Facilitator-run checks," and manifest.json records declared scope/basis separately from unknown runtime presence, including release exclusions, runner prerequisites and exact-fixture limitations. No further checkpoint correction is requested. The checkpoint is suitable as a truthful blocked-preflight record within the evidence boundaries above; this is not runtime or browser signoff.

## Constraints confirmed from source

| Variant | Confirmed constraint and references |
| --- | --- |
| T01-base | The Unknown/IP/university-contact subset exists. F01 also specifies an unresolved matched-contribution condition (`facilitator/evaluator-guide.md:17`), absent from the corpus's complete claim list (`apps/api/fixtures/corpus.json:117`) and support topic (`:196`). A partial observation cannot establish full F01 completion. |
| T03-base | The A2 future-effective claim is present, but its topic has no sequence, editorial suggestion or matched-contribution condition (`apps/api/fixtures/corpus.json:160`, `:175`, `:176`). The support topic's separate sequence (`:211`) cannot silently substitute for the A2 brief and F03 requirements (`facilitator/evaluator-guide.md:19`). |
| T05-base | F05 requires Gympie to be outside local coverage and a static directory (`facilitator/evaluator-guide.md:21`). Actual coverage is QLD/national (`apps/api/fixtures/corpus.json:5`), with regional Queensland sessions (`:130`). The uncovered-state logic (`apps/api/src/fixture/responder.ts:237`) does not model the required Gympie exclusion. Changing the actor's state is an invalid workaround. No directory is implemented in the inspected journey; a reference to one in error copy is not a directory. |
| T13-base | The support map/list and source controls exist. Keyboard operation, visible focus and returning to the route must be observed. The existing desktop e2e expects Shift+Tab from action evidence to reach the last card, not necessarily the opener (`apps/web/e2e/journey.spec.ts:146`). It is not a complete return-to-place observation. |
| T14-base | The stage editor explicitly says stage does not change fixture answers (`apps/web/src/components/Journey.tsx:306`). Prior result context is stored (`:142`) but not rendered; the stale notice names question/time (`:347`). A seeded idea-stage state, actual 200% browser zoom and the exact old/new context criteria remain necessary. Keyboard editing alone does not establish full F14 completion. |
| T15-vector / T15-budget / T15-graph | Startup-fixed fault pairs (`apps/web/e2e/serve.mjs:17`) do not demonstrate a healthy answer followed by stage change and a named fault on the same mounted page. Navigating to the fault origin resets UI state (`apps/web/e2e/journey.spec.ts:160`). The separate stale-answer test aborts a browser route (`:193`), which is a different failure mechanism. A facilitator-controlled transition and recorded recovery schedule remain necessary. Stage limitations also apply. Graph failure produces a successful passage-only response (`apps/api/src/fixture/responder.ts:95`), so it must not be treated as a timeout/error-panel variant. |

References above are repository-relative; `facilitator/` references resolve under `research/synthetic-ux/`.

## Conditions for continuing

- Demonstrate the actual browser can reach the pinned app and establish a fresh isolated browser context. A new tab alone is insufficient (`research/synthetic-ux/runbook.md:8`). Keep browser identity, viewport, input mode, zoom and isolation unknown until observed.
- Supply each fresh actor only the assigned profile, initial brief, URL and input constraints. Keep this review, source, expected outcomes and canonical-query coaching out of that context. Reveal the follow-up after the initial attempt (`runbook.md:9`).
- Operate real keys for T13/T14; DOM focus/click rescue is not keyboard evidence. Demonstrate actual browser zoom independently of viewport resizing or device scale (`runbook.md:21`).
- Preserve the mounted page during T15 facilitator-controlled backend transitions. Never expose fault controls or development credentials through public pages, parameters or headers.
- Prepare appropriate local/intercepted destinations before claiming external source-page opening (`facilitator/evaluator-guide.md:11`). The UI passes fictional canonical URLs to source links (`apps/web/src/components/EvidencePanel.tsx:50`); inspecting its evidence panel is a distinct observation.
- Resolve exact fixture/scope gaps or explicitly review and version revised scope before full-variant completion claims. Scope unknown, missing runner facilities, missing fixtures and promised-but-absent product behavior have different classifications (`runbook.md:13`). None is an executed actor failure without an action trace.

This assessment does not sign off browser readiness, visual quality, accessibility, source correctness, any task outcome, or completion of issue #26.
