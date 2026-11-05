# Claude handoff prompt

Replace the bracketed run inputs before execution. If the build URL or corresponding commit is missing, perform preparation only and report that no browser testing was executed. Task preparation does not authorise paid calls or unrelated account changes.

```text
Run a synthetic UX walkthrough of nissan/oz-startup-brain using
research/synthetic-ux/README.md and its linked pack.

Inputs:
- Target commit: [full SHA]
- Preview/local URL and evidence that it serves that commit: [URL/evidence]
- Declared release scope and fixture setup: [capabilities, fixture mapping]
- Persona/task selection: [e.g. P1/T01, P2/T03-T04, P3/T05, UX7/T13, UX8/T15]
- Allowed test environment: [isolated local or preview]
- Optional HTTP companion allowed: [yes/no; default no]
- Output destination: [new run folder]
- Publishing: local artifacts only unless I explicitly request a PR for this run.

These are fictional profiles. Do not invent observations, quotes from humans,
usability rates or results. Follow repository instructions and the browser
integration's documented control workflow. Do not provision, deploy, merge,
spend on models, grant a real microphone or submit third-party forms.

1. Verify build identity and stage prerequisites. Read the facilitator runbook
   and map the requested fixtures. Record unsupported actions or missing
   capabilities. An API-only stage does not fail because it has no website.
2. Keep actor input separate from the evaluator oracle if the environment
   supports it. Give the actor only its persona and initial task brief; provide
   the follow-up afterwards. If the same agent has already read the expected
   results, label the run primed inspection. Do not claim an independent or
   blinded test. Do not spawn agents without separate authorisation.
3. Start fresh for each persona/task, using only observed visible controls.
   Respect keyboard/mobile/zoom constraints. Preserve evidence before offering
   a hint. One recovery attempt, then report the obstruction; follow the
   runbook's bounds rather than forcing completion.
4. Record actual browser actions, state changes and redacted screenshots.
   Separate browser_observed, artifact_observed, api_observed, source_inspected
   and hypothesis. A static mock is not a functional test. The screen cannot
   prove backend quotas, key isolation, retention or corpus release atomicity.
5. Complete the session templates and findings matrix. Include positive
   observations, reproducible defects, hypothetical reactions and real-user
   questions in distinct sections. Leave unavailable criteria unverified.
6. Produce a prioritised report with evidence links, severity, scope limits,
   proposed acceptance checks and the smallest next iteration. Preserve prior
   runs. Do not repair the app during the baseline run or silently update the
   scripts to match incorrect behaviour.

Stop after the report. Return what actually ran, what could not run, the
highest-priority findings, artifact paths and the proposed retest selection.
No result from this exercise satisfies human-research or live-model gates.
```
