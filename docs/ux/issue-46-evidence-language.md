# Issue 46 — evidence language handoff

Refs #46. Builder: Kit, run `kit-46-20261107`. Builder-run primed verification, **not independent review or participant research**.

Current checkpoint (8 November, PR47 review corrections): the #46 increment is committed and published through `reddinft/oz-startup-brain` into [upstream PR47](https://github.com/nissan/oz-startup-brain/pull/47), together with reviewed readiness prerequisites on main409d327. PR47's original head is743d9f0923088de6725127d11b597368210e87e0. Review corrections fix A2 map labels, off-topic matching, pending stale-state copy and paragraph semantics. The [durable review evidence](issue47-review-evidence/README.md) contains original before/after bytes, revised renders and current validation; its containing commit identifies the corrected candidate. Nothing here establishes merge, deployment or resulting-main verification. The older verification blocks below are explicitly historical evidence, not the current delivery status.

## Identity and scope

Branch `fix/46-evidence-language-20261107` starts at prerequisite `8c3eaee88c1f009675417c7ace87244e4fccb30b` (reviewed local readiness candidate). Prerequisite implementation commits: `f8f5fbd5`, `ccee39ce`, `8c3eaee8`; report ancestor `efc0d720`; original main `d3f54e887fb946bccf399f142791ed87e6be1b76`. The #46 patch is incremental from **8c3eaee8**, not a standalone patch against main.

Live main rechecked as `409d327eb89c4a7ae09650916621705adcf716c7`; PR43 remains `da46471df67398a4186807b442c0abfd765c38d8`, untouched. Main’s changes since the original base are source tooling/data, workflows and architecture/delivery documentation; no Journey/test/style overlap observed in the live compare. Reconcile readiness prerequisites and main before integration; this handoff is not an integration/merge/deployment claim.

Only Journey explanatory copy, a native terminology disclosure, seven lines of scoped page styling, and browser regressions changed. No API, contracts, corpus, matching, provider, continuity (#45), vocabulary framework (#10), manifests or lockfile changes. The tiny CSS addition gives the native disclosure a quiet border, 44px target and existing token typography; no source-card/evidence-badge treatment.

Loki approved the durable implementation plan and sole builder continuation. Live #45/#46 showed no conflicting claim; canonical #46 claim: https://github.com/nissan/oz-startup-brain/issues/46#issuecomment-6705471275. Our completed #26 local execution is not another implementation lane; Claude’s blocked #28 ownership remains intact. Historical hub/body status needs coordinator reconciliation, not an invented owner release.

## Implementation and acceptance

- Requirement vs preparation: separate labelled paragraphs under the sequence explain having evidence vs gathering it. List position is not a new eligibility rule; dates and qualifiers remain authoritative. The customer-interest overlap is explicitly a general example, not a newly checked source claim.
- “Terms in plain language” is a native keyboard-operable disclosure after the action cards. It appears only with an answer. Definitions carry an explicit editorial label and do not assert contribution amounts/applicability, ability to contribute, IP ownership or eligibility. No source attribution, excerpt or Checked badge is attached.
- Existing rights-gated evidence controls, source dates, future-effective exclusion, stale labels and passage-only degradation remain untouched.
- Targeted A2/prototype regression exercises both permitted and uncleared step evidence. T01-relevant support regression operates Enter/Space, verifies visible focus, caveats and no checked/numeric-contribution claims. Existing wide-screen keyboard predecessor updated for the new native summary control.

## Visual review

Before: unchanged product at `8c3eaee8`; only new test code present. After: candidate implementation tree (identified in the companion manifest / final handoff SHA). Same installed Chrome **156.0.8078.80**, Playwright JS **1.63.0**, 100% zoom / device scale 1, CSS viewports **390×900 and 1440×900**, both light/dark. API clock **2026-11-07T00:00:00Z**, corpus **fixture-2026-11-07.1**. Fresh context per capture. Screens are results-region captures, not whole-page viewport screenshots.

Tasks: T01-relevant question “I am building a software startup in Toowoomba. Where should I begin?” followed by explicit Queensland clarification; T03 initial “What does round A2 require today?” with explicitly selected Working prototype. These are **primed inspections**, not replayed fresh actors or proof that #45 follow-ups work. Before/after use identical context and question. After captures intentionally open the terms disclosure.

Painted-font records confirm custom Fraunces for masthead and Atkinson Hyperlegible for summary/captions, not CSS declarations alone. Full browser font regression separately checks JetBrains Mono. All 16 baseline/final matrix cases have zero document horizontal overflow; the final pass additionally captures open/closed terms and sequence crops. Initial after captures are preserved separately.

| Rank | Observed weakness | Change | Reinspection |
| --- | --- | --- | --- |
| 1 | A2 source requirement and editorial gathering step repeat customer-interest evidence with only a short sequencing footnote | Distinct Requirement / Preparation lead-ins plus overlap example and date reminder | Both sizes/themes: grouped readable paragraphs, original badges/dates and step buttons retained, no new source-conflict claim |
| 2 | Commercialisation and matched contribution appear in actions/conditions without definitions | Native quiet disclosure, bold term anchors, editorial caption, explicit unresolved boundaries | Both sizes/themes: definitions wrap without truncation; source cards retain primary visual emphasis; Enter/Space and focus pass |
| 3 | Long A2 labels from the readiness candidate are clipped by the shared map SVG drawing | No shared component change in #46; complete label text remains in the numbered HTML list immediately below | Present before and after the #46-only increment at8c3eaee8, but introduced relative to upstream main409d327 (A2 sequence was empty there). Therefore this is a blocking integrated PR47 regression, not a pre-existing-main limitation. PR47 review fixes shorten equivalent labels and extend route bounds checks; see [durable review evidence](issue47-review-evidence/README.md) |

Visual judgement: bounded new wording/disclosure was visually inspected; no new overflow or clipping observed. The earlier validation block described below has now passed a bounded test-only continuation; independent exact-byte QA remains a separate gate. A2 map clipping was disclosed but unresolved in that incremental handoff; it remained part of PR47 responsibility and is corrected in the linked PR47 review evidence. Phone pages remain long because inline evidence is preserved; closed-by-default terms avoid adding definition density until requested. Human comprehension, actual screen-reader sessions, owner implementation-design approval and broader UX closure remain pending.

## Verification

Fresh isolated checkout had no node_modules/dist outputs. Locked `npm ci`; Node **22.23.0** from temporary local runtime, npm **10.9.8** (repo advertises 10.9.9; no manifest changes). `npm ci --prefix design/tools` also locked. All app commands use that Node PATH.

- `npm run check:generated`: pass, no generated diff.
- `npm run check:compat`: pass.
- `npm run typecheck`: pass (includes build).
- `npm test`: 134 tests pass (24 contracts, 4 client, 87 API, 19 BFF).
- `npm run demo:fixture`: pass, nine HTTP checks.
- Targeted Playwright: 4/4 pass, desktop/phone. Clean fail-before: two expected missing-copy/disclosure failures on unchanged product; initial harness-label error preserved separately, not counted as product evidence.
- Historical full Playwright: second attempt 41/42, desktop glossary Enter did not set native details open. Targeted earlier 4/4 passed; phone equivalent passed. Builder stopped after two failed full validation attempts. First run had 40 passes / two selector-collision failures: glossary paragraphs reused the answer-summary class. Fixed by removing that class from definitions and scoping their margin styling; the stale-answer assertion was not weakened.
- Renewed bounded continuation, owner20321: independent read-only diagnosis found strong focus-order race evidence. After Queensland selection, the successful response schedules results-heading focus in requestAnimationFrame; merely seeing the summary does not establish that callback has completed. Only T01 gained three assertions: completed heading text, completed heading focus, and summary focus before Enter. Native details, product code and all original semantic assertions are unchanged. Fresh focused checks: 6/6 (three desktop and three phone); full suite: **42/42**, retries 0. Node22.23.0, Playwright1.63.0, Chromium153.0.8010.12. No product rebuild was needed for this test-only change; prior generated/compat/typecheck/unit/design results above are prior evidence on unchanged product bytes, not newly rerun checks.
- Invocation lesson: the root nested npm e2e wrapper dropped Playwright flags and produced an initial zero-test error, not a browser failure. Use the existing Node22 Playwright CLI directly from apps/web when passing grep/repeat/output flags; record the exact command. The corrected command and raw logs are retained with the continuation evidence. No sleeps, removed assertions or retries-until-green were used.
- Persona pack validator and 13 regression tests: pass, no review checkpoint rewritten.
- Design token check and 22 design renderer/a11y-tool regression tests: pass. Used existing Python **3.14.3**, Python Playwright **1.58.0** and installed Chrome **156** rather than README example Python Playwright1.51/Chromium134. No design exports or checker reports regenerated in the source tree. No screen-reader claim.

Matching local Chromium153 was installed for normal browser-suite execution. Before/after visual captures consistently use installed Chrome156; initial targeted fail-before also used installed Chrome via a temporary config, which is excluded from delivery. All environment/tool substitutions are local only.

Companion evidence bundle contains `before/`, `after/`, `observations.json` in each, capture script, check logs, full/targeted browser logs, incremental patch and hashes. Relevant original before/after renders are now committed in [PR47 review evidence](issue47-review-evidence/README.md) for durable review; the historical local bundle is not the sole evidence path. No remote publication, permission workaround or production service is needed for review.

## Next role

Loki owns independent exact-head review of the PR47 corrections, publication to the existing fork branch, inline review responses and verification of GitHub checks. The candidate is a normal upstream PR, not an uncommitted patch or read-only-delivery dead end. The corrected candidate's exact commit is recorded in the delivery handoff and GitHub PR head; the containing commit pins this report and its rendered evidence. Existing historical checks above are not automatically independent approval of revised bytes.

Nissan retains merge/deploy authority. Keep #46 open until normal review/integration and resulting-build verification; #9/#26/#27, #45 continuity, T13, human comprehension, actual screen-reader and real-source gates remain separate. The concise A2 preparation label retains its editorial `Suggested next step` badge and the explicit Requirement / Preparation explanation; it is not an extra eligibility rule.
