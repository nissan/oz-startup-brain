# Reconciled #26 evidence record (PR #43 follow-up)

This updates the original draft preflight, not a completed UX-round claim. Original preflight files remain unchanged. Agent-authored reconciliation, 8 November 2026. Current report publication: [PR #48](https://github.com/nissan/oz-startup-brain/pull/48), targeting `main`; product publication: [PR #47](https://github.com/nissan/oz-startup-brain/pull/47). Neither publication implies merge or resulting-build verification.

## What actually happened

| Evidence cohort | Identity | Actual result |
|---|---|---|
| Original browser continuation | `d3f54e8`; original/manifest.json | 36 browser regressions and 127 unit checks; T13 partial/blocked_environment; seven variants setup-blocked |
| Follow-up | Attempt-specific identities in reports/traces; reviewed final source `8c3eaee8` | Seven formerly blocked variants executed, NOT seven passes; 134 unit and 38 browser checks |
| #46 and current-main integration | Base `409d327`; integrated `743d9f0`, published in [#47](https://github.com/nissan/oz-startup-brain/pull/47) | Fresh 134 unit, 42 browser and 9 demo checks; 22 design, 13 persona and 55 source tests; independent source QA accepted that head. Subsequent review changes need their own validation. |

## Actor outcomes, not pooled test counts

- T01 exact-brief rerun: narrow path completed; terminology/clarification friction retained.
- T03: partial follow-up; A2 topic lost, recovered by restating A2.
- T05: partial follow-up; Gympie caveat lost. Publisher visit/return in T05 does not complete T13.
- T14 light: fresh scoped keyboard task at actual 200% zoom. Earlier partial attempts retained; dark check separately primed.
- T15 vector: 504 → same-page 200 retry. Budget: 429 → same-page 200 retry, not a real budget reset. Graph: 200 passage-only degradation → healthy 200 resubmission, not an error-retry scenario.

## What remains open

1. T13 genuine source-link navigation/return and inline panel-close: unfinished; fresh isolated actor still required.
2. #45: A2/Gympie continuity; fixes and fresh retests required.
3. #46: reviewed wording/disclosure work is published in [#47](https://github.com/nissan/oz-startup-brain/pull/47); review corrections, merge and resulting-build verification remain outstanding.
4. #9: zoom evidence is scoped; actual screen-reader and broader accessibility acceptance remain incomplete.
5. Real participant comprehension and real-source rights/fact/corpus gates remain separate.

## Durable evidence and provenance

[Open the screenshot gallery](IMAGE-GALLERY.md). All 552 indexed path references now resolve to 196 distinct committed PNG files in `images/`; these are exact historical screenshot bytes, not 552 unique images or task passes. `image-index.json` maps original group/path to portable `repo_path`, byte size and SHA-256. PNG filenames also carry their SHA-256. Anonymous hosted presentation links are no longer needed to inspect this committed evidence. Image availability enables reviewer readback; it does not claim a new independent visual verdict.

`artifact-hashes.json` records the 28 published reports/traces/validation artifacts. Two copied files have workstation-path-only normalization, documented with original and published hashes in `path-normalization.json`. Otherwise historical reports, actions, outcomes and verdicts are unchanged. Original source bytes remain in retained local bundles, but portable paths and committed images are the public review route. No browser profiles, caches, private transcripts or credentials are included.

## Delivery boundary

This report PR targets upstream `main` and includes #43’s four original preflight files plus the reconciled record. An owner decides #43’s disposition after merge; this update does not close #26/#43 or substitute for the separate product integration in #47. Incomplete T13 and separate product/accessibility gates remain explicit. Previous reviews of a different base/head are historical and do not automatically approve this update.
