# Consolidation verification — 8 November 2026

Run: `codex-consolidation-20261108`. Refs #23, #27, #42, #45. This is reviewed synthetic/fixture evidence, not human research, real-source validation or public-release approval.

## Identity and provenance

| Boundary | Exact identity / evidence |
| --- | --- |
| Continuity candidate, Claude code GO | `013e5df6e43ebd8c3d68f8b1fbfd4afb7a9dc1da`, PR #67, review 5816940720 |
| OpenClaw candidate evidence | `2e8f49d772426897fe7d3e95cd4c4121683766cb`, PR #69; Codex review 5817282477 |
| Continuity merge | `054c4bdb7d21b80f4797bd2a59c644c20c3faa08` |
| Evidence merge / fresh actor build | `323f56a676a7dcafb699db57c8e40513391b9c5c` |
| Recovery CI integration | PR #71, head `3f942904d2babc98eb53bec00adb23097bdfc326`, review 5817301218 |
| Actual main recovery build | `7251253807444ecffaa4e31ccdd65213e6354184` |
| Main push checks | [run 42465748158](https://github.com/nissan/oz-startup-brain/actions/runs/42465748158), six checks passed |
| Main recovery screenshots | [artifact 13611786224](https://github.com/nissan/oz-startup-brain/actions/runs/42465748158/artifacts/13611786224), 30-day CI retention; JSON identity/report/events copied here |
| Actor capture preservation | [run 42466173078](https://github.com/nissan/oz-startup-brain/actions/runs/42466173078), Git LFS PNGs in `actors/`; hashes in `capture-manifest.json` |

The coordinator checked all 162 artifact joins and all 135 actual PNG byte hashes/sizes/signatures in #69 (114 distinct image objects), including canonical LFS pointers. A fresh Codex reviewer independently assessed interpretation and sampled six screenshots. These are complementary checks; they are not Claude interpretation sign-off. Candidate tests and original actor limitations remain in #69.

The predicted #67 merge tree `36ac134fb755a043e17f28c1168855ee3c9b98c4` matched its actual merge. Product paths `apps/`, `packages/`, `docs/api/` were unchanged from the reviewed candidate through actor build `323f56a` and main CI build `7251253`. The actor build used a clean `npm ci` and `npm run build`, Node 22.23.4/npm 10.9.9. Later documentation-only merges do not become new actor runs.

## Fresh task-directed follow-up retests

The earlier #69 actors did not both submit a separate follow-up: T03 reasoned from the evidence; T05 combined its questions. This supplement addresses that gap without rewriting those historical attempts.

Two fresh Codex contexts received only the registered profile/task packet, starting URL, input constraints and an explicit protocol to submit the brief and supplied follow-up as separate turns. They received no success criteria, facilitator mapping, implementation or prior findings. Isolation is the coordinator's procedural attestation. This is a **fresh task-directed synthetic retest**, not evidence that a person would spontaneously discover or choose the follow-up. It is not cross-provider human research.

| Task | Observed continuity | Broader actor outcome | Conditions |
| --- | --- | --- | --- |
| T03 / Arun | Separate second response says “Continuing with Round A2.” Distinct visible request IDs in before/after captures. | Partial: distinguished current conditions, editorial preparation, future condition and unknowns; did not establish eligibility or evidence sufficiency. | 1440×900, light, 100% default, desktop emulation |
| T05 / Jess | Separate second response says “Continuing with Gympie.” Unsupported-locality caveat retained. | Partial: found useful next questions, no verified Gympie contact. | 390×844, light, 100% default, synthetic phone/touch emulation |

Reports, visible-text captures, packets and failure records are under `actors/T03/` and `actors/T05/`; all 16 PNGs are preserved through LFS and independently re-read against SHA-256, byte length and PNG signature. Python 3.12.14, Playwright 1.51.0 and Chromium 153.0.8010.0. No actual zoom change, screen reader or real device. Neither actor visited external publisher pages. T03 runner code was not retained; its report and visible evidence are retained. T05 runner is included with its working directory sanitized to `<merged-worktree>`; restore that placeholder to the actual pinned checkout before replay. Local absolute paths in historical records are runner provenance, not portable URLs.

Both initial navigations failed because separate executor sessions isolated loopback. An environment-only launcher instruction allowed each actor to start the provided fixture server and browser in one persistent session, then use a new context. This did not reveal expected outcomes. T03 also had one button-role locator timeout before clicking the exact visible evidence label. Failures are retained, not counted as product defects. Launchers were stopped after the attempts.

Fresh reviewer inspection of both reports, packets, failure records, visible text and ten screenshots found no remaining P1 continuity blocker. The reviewer is a separate Codex context, same provider, not Claude; its interpretation does not convert partial actor goals into complete usability passes.

## Primed regression and adjacent control

Main push CI passed the founder UI suite and the unchanged controller browser check. The T01-adjacent generic-question → clarification → explicit Unknown → dated-steps route, keyboard terms and context edits are deterministic browser regressions in `apps/web/e2e/journey.spec.ts`. They are **primed regression evidence on the merged product**, not a new fresh T01 actor. #69 retains the earlier candidate T01 actor with its replay/locator limitations. No broader capability or accessibility success is inferred.

Demonstrated readiness at these builds: T03/T05 separate-turn scope retention; T01 fixture clarification/Unknown/dated-steps path; T15 three same-page fault variants. Export/comparison, actual AT, remaining zoom coverage and live-source correctness are not demonstrated by this run.

## Actual merged same-page recovery

See `merged-phase-identity.json`, `merged-phase-report.json` and `merged-phase-events.jsonl`, copied from the downloaded main-push artifact and compared with job output. The check ran on actual checkout `7251253`, event `push`, run `42465748158`.

| Variant | Fault | Recovery | Mounted page |
| --- | --- | --- | --- |
| vector_timeout | 504 retrieval_timeout; previous Idea answer labelled stale after Prototype edit | 200 Prototype answer | One document load, same web process |
| budget_exhausted | 429 budget_exhausted, Retry-After 3600; draft and prior answer retained | 200 Prototype answer | One document load, same web process |
| graph_unavailable | 200 fixture_passages_only; sequence omitted | 200 fixture with sequence | One document load, same web process |

All variants report `ok: true` and `same_mounted_page: true`. Cleanup reports no raw key in checked logs and both ports free. The two navigation events per variant are not two document loads. The controller remains facilitator-only with a private Unix socket; no product control endpoint or browser fault switch was introduced. The budget cycle is simulated recovery, not durable quota/reset enforcement. This is primed tooling verification; no fresh T15 actor or full #9 accessibility acceptance is claimed.

Local Unix-socket creation was denied by the executor. PR #71 runs the existing guarded check on GitHub's runner without weakening those guards; future main pushes retain this verification path.

## Scope disposition

- #45 continuity: implementation merged, candidate reviewed, actual merged-product retests complete within the limits above.
- #42 reproducibility: controller and candidate evidence merged; actual main browser cycle now demonstrated.
- #27 selected remediation: continuity and adjacent control verified; [retrospective and fresh assessment](../../../../docs/delivery/consolidation-20261108.md) records the next priorities. T13 and accessibility remain separate.
- Follow-up presentation friction: [#72](https://github.com/nissan/oz-startup-brain/issues/72) structured context explanation; [#73](https://github.com/nissan/oz-startup-brain/issues/73) dated editorial suggestions, repeated caveats/evidence and phone ordering. These are bounded P2 follow-ups, not permission to infer founder facts or change approved state words.
- #55 dismissal and #53 completion retest remain open; #9, #28/#61/#62 and human research retain their own gates.

Closure is recorded in the live issue Delivery blocks after this evidence PR is reviewed and merged. Historical records remain intact.
