# Browser UX outcomes — 7 November 2026

Agent: Loki (Codex), facilitator. Run ux26-loki-20261107. Owner authorised execution and GitHub outcomes comment (Telegram20239). Pinned target main d3f54e887fb946bccf399f142791ed87e6be1b76, tree8bc14aef68ca54c8b0b79db7f8badfb703be8ae5. Local fixture corpus fixture-2026-11-05.1, clock2026-11-05T00:00:00Z.

## Result

**Local browser execution restored, but the full UX round is NOT complete.**

- Locked install and full build pass on Node22.23.0/npm10.9.8.
- Existing deterministic regression suite: **36/36 pass**, zero retries, headless installed Chrome156.0.8078.80; desktop1280×900 and phone-emulated390×844. Checks cover normal journey, explicit Unknown, dated evidence, keyboard, layout/fonts, errors and existing review regressions. These are scripted checks, not36 fresh actors or human sessions.
- Unit/contracts/client/API/BFF tests: **127/127 pass**. Frozen-v1 compatibility passes.
- Fresh isolated synthetic actor: **T13 attempted, partial/environment-limited**.23 real keyboard actions plus initial snapshot,24 screenshots and raw before/after traces. No pointer rescue or facilitator coaching. The actor reached task entry, Queensland selection, map/text sequencing, and inline step evidence with focus moving to Evidence heading. Final local focus returned to a route step. Publisher-link destination/return and panel closure remain unverified. No full T13 pass or accessibility-conformance claim.

## Coverage (registered first-round selection)

| Variant | Attempted? | Outcome |
|---|---|---|
| T01-base | No | blocked_pending_fixture, #41 |
| T03-base | No | blocked_pending_fixture, #41 |
| T05-base | No | blocked_pending_fixture, #41 |
| T13-base | Yes | blocked_environment / partial; external source navigation and full return/close incomplete |
| T14-base | No | blocked_pending_fixture, #42; actual zoom evidence #9 also outstanding |
| T15-vector | No | blocked_pending_fixture, #42 |
| T15-budget | No | blocked_pending_fixture, #42 |
| T15-graph | No | blocked_pending_fixture, #42 |

**8 planned,7 preflight-blocked,1 attempted,0 completed,0 assisted,0 established product-failed variants.** Preflight blocks are not observed UX failures. No completion rate or human metric is inferred.

## Observations and interpretation

1. Keyboard focus evidence: raw rows13 and21 show focus placed on result and evidence headings; screenshots show visible ochre outlines. Final row24 shows route step3 focus with step1 panel still open. Full-page captures do not prove viewport clipping/visibility in every state.
2. Actor attempted two publisher URLs and a browser-tab shortcut. The driver only observed the original page, and fixture destinations are .invalid. This is a runner/fixture destination limitation; unchanged original-page text is not proof the product failed to open a link. Do not claim a successful source-page visit.
3. The actor's Control+A did not select all on this Mac runner; text inserted alongside the shortcut question. OS/runner keyboard mapping is a plausible explanation, not independently reproduced; this is not a demonstrated application bug. Subsequent clarification/route remained usable.
4. Stage remained Not set despite prototype words in the question; the actor did not edit the structured stage field. This observation does not prove stage inference is promised or broken. It reinforces that stage-specific variants need the explicitly reviewed setup in #42.
5. Repeated supporting-passage button labels may create positional tracking friction; this remains a hypothesis, not a newly established accessibility defect.

No new confirmed product defect was promoted to an issue; findings.csv intentionally has headers only. Existing #41/#42 remain concrete source-readiness issues. No fixture/product fixes were made before freezing this run.

## Independent review and limits

Fresh native actor forked with no parent context and only persona/task, starting URL and keyboard operation contract. Separate fresh verifier inspected source/readiness and subsequently frozen report/traces/images, not the live actor. Its review is in independent-review.md. Parent executed regression/unit checks; verifier did not independently rerun them. Assigned actor zoom100% was not measured: manifest correctly retains null and no zoom evidence is claimed. No real screen reader, real device, human comprehension, legal/source correctness or WCAG acceptance established.

## Next work

1. Provide local resolving fictional source pages/interception and popup-aware keyboard browser control, then repeat T13 with a fresh actor; explicitly exercise close/return and all applicable controls.
2. Resolve/review #41 fixtures without changing actor facts. Resolve #42 stage-specific setup and same-origin named-fault/recovery schedule.
3. Link actual zoom evidence under #9 before T14. Run supported variants with fresh actors, preserve outcomes, then feed actual findings into #27. The current scripted checks do not clear those gates.

No merges, deployments, provider calls, production changes or source-corpus work. This run does not close #25/#26 or unblock #27 as a completed UX round. Existing draft43 preserved.
