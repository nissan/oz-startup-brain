# Build record for #26: the slice 1A-UI fixture journey (facilitator only)

Written by the #25 builder for the facilitator who runs the first synthetic round. It records what the build can do and how to reset it. It is not a readiness verdict and not evidence that any task passes: readiness is recorded by the facilitator in preflight, per variant, against the pinned build, and observations only count after an actor records an action ([runbook](../runbook.md)). Synthetic actors must not read this file.

## Build identity

- Repository `nissan/oz-startup-brain`, PR #39 (issue #25). Pin the exact merge commit on `main` in the session record; do not run a round against a moving branch.
- Fixture corpus `fixture-2026-11-05.1`, pinned clock `2026-11-05T00:00:00Z`, design system artifact version `1793913295-8883` consumed as committed.
- The fonts are the pinned Fontsource faces; painted-font verification is part of the browser tests at this commit.

## Start and reset

```sh
npm ci && npm run build
export OZSB_API_KEY=$(npm run -s dev:keys)
npm run -s api:start                                                             # API on 127.0.0.1:3000
OZSB_API_BASE_URL=http://127.0.0.1:3000 OZSB_API_KEY=$OZSB_API_KEY npm run web:start   # app on 127.0.0.1:3100
```

- **Session reset:** a fresh, isolated browser context per persona. The app keeps only one per-viewer value in browser storage, the theme (`osb-theme`); it keeps no question, context or answer between loads.
- **Budget reset:** the in-process daily allowance (500 queries per development key) resets when the API process restarts. Restart it between rounds.
- **Faults and clock (T15 variants, T03's pinned time):** facilitator setup only, on the API process, with `OZSB_HARNESS_CONTROLS=enabled OZSB_HARNESS_ENV=isolated-local-test` and `OZSB_HARNESS_FAULT=<vector_timeout|budget_exhausted|graph_unavailable>` or `OZSB_HARNESS_AS_OF=<instant>`. Start one API per state on its own port and point one app at each, as `apps/web/e2e/serve.mjs` does. There is no page control, query parameter or header that selects a fault; an actor cannot reach them, and must not be told about them.
- **Fictional corpus:** every program, round, organisation and URL is invented (`.invalid` domains). The page labels this on load ("Local fixture mode"; "Development mode — fixture data, not live sources").

## Questions the corpus answers

| Question (verbatim) | What happens |
| --- | --- |
| `What should I do next for support?` | Asks for jurisdiction once (clarification). Unknown is offered and, once chosen, never asked again; national routes only, with the left-out state routes named. Queensland adds the hub route and a third prerequisite step. Another state gets "Outside current coverage". |
| `Is round A1 open?` | A closed round: the planner abstains from recommending an application and offers the next round. |
| `Is round B1 open?` | Stale evidence: "Needs a current check"; the summary never says the round is open. |
| `What does round A2 require today?` | A requirement that takes effect on 1 December 2026 is dated and kept out of today's actions; "Effective date not stated" appears on a claim that lacks one. |
| anything else | `insufficient_evidence`: no answer rather than a guess, with the question kept. |

Starter tasks prefill these questions; typing them is equivalent.

## Capability presence at this build (builder's statement, to be confirmed in preflight)

| Capability ID | Present at this build? | Where it shows | Evidence at this commit |
| --- | --- | --- | --- |
| `founder_text` | yes | Textarea "Your question", "Ask the planner" (also Ctrl/Cmd+Enter); goes through `/api/bff/query` to the labelled fixture API | `apps/web/test/bff.spec.ts`, `apps/web/e2e/journey.spec.ts` ("journey") |
| `context_edit` | yes | "Your situation" chips open an inline editor; "Not set" and "Unknown" are distinct; saving re-asks the current question | e2e "journey" (edit to Queensland changes the answer) |
| `evidence_panel` | yes | "Show supporting passage" opens Evidence: source, version, verification date, link, rights-gated excerpt, every claim with its decided applicability and dates | e2e "journey" (cleared and not-cleared sources) |
| `prerequisite_view` | yes | "What comes first": the map plus the equivalent list; sourced vs editorial labelled; left out with a service notice when the graph is unavailable | e2e "journey", "graph_unavailable" |
| `coverage_notice` | yes | Coverage banner from `/v1/capabilities`; "Outside current coverage" condition for an uncovered state | e2e "journey"; API tests |
| `mobile_layout` | yes, emulated | 390×844 CSS viewport, Chromium device emulation; evidence opens inside the selected card | e2e `phone` project. **Emulation, not a device**: record that in the session. |
| `keyboard_controls` | yes | Every control is a native button, link, textarea or radio; ochre focus ring; focus moves to the results heading after an answer and to the Evidence heading on inspect | e2e "keyboard" |
| `recoverable_error` | yes, facilitator-configured | Outage/budget panels keep the draft; a previous answer stays visible labelled "Stale"; graph degradation is a service notice, not an evidence label | e2e "faults" |
| `browser_zoom` | runner-dependent | The layout is fluid; real browser zoom at 200% must be demonstrated by the runner, not by a CSS viewport | not established by the build |
| `api_contract`, `api_quickstart` | yes | `docs/api/openapi.json`, `docs/api/README.md`, `apps/web/README.md` | #33 |
| comparison/export (`T04`), voice/visual input, live retrieval | **no**, deferred by #25's exclusions | not present on the page; no disabled placeholders are shown | record `deferred_not_implemented` |

## Task-by-task notes for preflight (T01, T03, T05, T13, T14, T15)

| Task | Variant(s) | Builder's note |
| --- | --- | --- |
| T01 (P1) | T01-base | All three required capabilities present. The explicit-Unknown route is the "What should I do next for support?" question with "Keep as unknown". |
| T03 (P2) | T03-base | Needs the pinned fixture time; the default clock is already `2026-11-05`. The future-effective qualifier appears on the A2 question; sourced vs editorial sequencing on the support question with Queensland. Previously `blocked_pending_test_controls`; the controls now exist (#24), so preflight can reassess. |
| T05 (P3) | T05-base | Phone viewport is emulated. "Outside current coverage" is reached by setting a state other than Queensland. |
| T13 (UX7) | T13-base | Keyboard route and textual sequence are present. No screen reader was run by the builder; that remains #9. |
| T14 (UX7) | T14-base | Context correction by keyboard works; real browser zoom at 200% is a runner facility to demonstrate. |
| T15 (UX8) | T15-vector, T15-budget, T15-graph | Each needs its own API process with the fault set (above). The draft is kept and the earlier answer labelled stale; budget/concurrency accounting is not observable from the page, as the task's scope says. |

Nothing above is an observation. Record readiness per variant in preflight with `present`/`absent`/`unknown` and the evidence you saw on the pinned build.
