# #26 resume checkpoint — preflight, not a UX round

**7 November 2026 (Australia/Sydney). Status: blocked before actor execution.**

Run `ux26-20261106` resumed at the owner’s request. The exact target remains #39’s merge, `d3f54e887fb946bccf399f142791ed87e6be1b76` (tree `8bc14aef68ca54c8b0b79db7f8badfb703be8ae5`). A fresh checkout and local build were verified. No browser reached the app.

This directory deliberately lives under **preflight/**, not **runs/**. There are no actor sessions, traces, screenshots, task completions or product-UX failure counts. Nothing here closes #25, #26, #9 or enables #27 as a completed browser-findings round.

## What progressed

- Recovered issue #26’s claim, #25’s merged-build handoff and #9’s actual-zoom deferral. No remote research/26 branch or prior actor run was found at resumption.
- Checked out the exact target and created the local research branch.
- Installed Node 22.23.4 / npm 10.9.9 and ran a clean locked install. Earlier Node 24/npm 11 installation was superseded and is not acceptance evidence.
- Built all four workspaces. All workspace typechecks passed, 127 unit tests passed, compatibility passed, and the standalone fixture client passed all nine HTTP checks.
- Validated the research pack and its 13 regression tests. Token consistency passed.
- A fresh verifier context separately inspected source readiness and found exact-fixture/task mismatches. Its assessment is in [independent-readiness.md](independent-readiness.md).
- Filed [#41](https://github.com/nissan/oz-startup-brain/issues/41) and [#42](https://github.com/nissan/oz-startup-brain/issues/42) as **preflight remediation**, not observed persona failures or new dispatches.

See [validation.md](validation.md) for substitutions and blocked checks, and [manifest.json](manifest.json) for per-variant state.

## Readiness by variant

| Variant | Supported by source inspection | Still needed before a faithful attempt |
|---|---|---|
| P1 / T01-base | Unknown jurisdiction, IP contact and evidence panel paths | Isolated reachable browser; exact F01 matched-contribution condition (#41). A partial subset must be labelled as such. |
| P2 / T03-base | A2 future-effective claim and pinned clock | A2 currently has no prerequisite sequence or editorial suggestion; matched contribution also absent (#41). The support question cannot silently replace A2. |
| P3 / T05-base | State-level QLD/national routes | F05 excludes Gympie locally and requires a directory; current fixture does not represent that (#41). Do not change the founder to another state. |
| UX7 / T13-base | Prerequisite map/list and source controls | Best first candidate after browser isolation, actual keyboard access and source-link handling are demonstrated. |
| UX7 / T14-base | Stage editor exists | Actual 200% zoom (#9), prior-state setup, supported stage/context expectations (#42). Stage currently does not change fixture answers. |
| UX8 / T15-vector | Named API timeout response exists; BFF test passes | Same mounted page with a prior healthy answer, stage change, named fault and recovery schedule (#42). |
| UX8 / T15-budget | Named API budget response exists; BFF test passes | Same-page transition, stage fixture and recovery schedule (#42). The UI cannot prove budget accounting. |
| UX8 / T15-graph | Named graph-degraded passage-only response exists; BFF test passes | Same-page transition and stage fixture (#42). This is a successful degraded answer, not a timeout. |

All eight selected variants are blocked by the current browser environment and remain **unattempted**. T04 is separately deferred because comparison/export is out of scope. These are setup/readiness classifications, not eight product failures. No completion percentage is calculated.

## Browser and setup limitations

The Next.js/NestJS launcher reported listening on loopback in its execution session. The browser tool’s attempt to open `http://127.0.0.1:3110` returned `net::ERR_CONNECTION_REFUSED`. A later shell connection from another execution invocation also failed. This establishes unsuccessful access from those surfaces, not the cause or a product defect.

The pinned Playwright browser installer attempted Chromium 153.0.8010.12 (v1243); download extraction repeatedly failed with “End of central directory record signature not found” and the installer exited 1. No e2e suite ran. No actual viewport, theme, keyboard route, zoom, browser version, storage isolation or rendered UI was verified.

A new tab is not browser-context isolation. The available browser API did not establish a fresh isolated context. Do not expose this development-credential/fault-enabled app publicly to work around local access.

## Exact continuation

1. Keep the target fixed at `d3f54e8` unless the owner/reviewer records a new build and rechecks changed scope.
2. Use a local runner that can install the pinned dependencies/browser and reach the fixture app. Follow `facilitator/build-25-fixture-ui.md`; prove source/build identity and fresh isolated browser state. Record actual runtime/browser versions, viewport, input and reset evidence.
3. Resolve or explicitly review/version the affected fixture scopes in #41/#42. Do not automatically update the scenario-review checkpoint or alter the actor’s facts to make a task pass.
4. Start with T13 once its required capabilities are operated and recorded. T01 may have a separately disclosed partial inspection, but no full F01 verdict until its fixture is faithful.
5. Keep T14 blocked until #9 supplies real 200% zoom evidence on the exact build. Neither CSS resize nor device scale is zoom.
6. For T15, preserve the page while the facilitator transitions the backend through named states; record the schedule. A new origin or generic route abort is a different test.
7. Spawn fresh actor contexts containing only the assigned persona, initial brief, URL and input constraints. Reveal follow-up only after freezing the initial attempt. Never include this document, expected outcomes, source code or canonical query coaching.
8. Create the immutable `runs/` folder only when actual actor actions start. Preserve traces and screenshots before fixes. Separately review the completed report.

External evidence links use fictional `.invalid` hosts. Prepare approved local/intercepted test destinations before claiming external source opening; an evidence panel is a different observation.

## Scope

No application, contract, lockfile, fixture, persona or source-corpus files were changed. No paid service, deployment, actor attempt, user study, accessibility conformance or live answer quality is claimed. The facilitator is primed by source and criteria; the separate source verifier is independent of this checkpoint’s implementation, not an unprimed actor.

