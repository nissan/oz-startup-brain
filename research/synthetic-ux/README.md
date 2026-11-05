# Synthetic UX persona pack

Version 0.2 — revised after PR review on 5 November 2026. **Preparation only: no browser sessions or human studies have been run with this pack.** All names, situations, tasks and preferences are fictional design hypotheses. They are not inferred from names, ethnicity, gender or demographic membership.

This pack supports goal-driven persona walkthroughs, reproducible interaction traces, separate observations and hypothetical reactions, and bounded revision/retest cycles.

## Start here

1. The facilitator selects from eight [actor profiles](actor/personas.json) and sixteen [actor task cards](actor/tasks.json). The richer [persona hypotheses](personas.md) are facilitator-only.
2. For the first attempt give the actor only the assigned record from `actor/personas.json`, the initial brief from `actor/tasks.json`, the starting URL and input constraints. Reveal `follow_up` afterwards. Never include fixture/scenario mappings, success hypotheses or this README's linked facilitator pack in an unprimed actor context.
3. The facilitator separately reads [task mappings](facilitator/tasks.json), the [capability registry](facilitator/capabilities.json), [expected observations](facilitator/evaluator-guide.md) and [runbook](runbook.md).
4. Use the [actor-first Claude prompt](claude-prompt.md) and [session report template](templates/session.md). A fresh actor context must not inherit the facilitator conversation; merely changing role labels does not remove prior exposure.

File separation limits accidental exposure; it does not enforce a security boundary or guarantee unbiased simulation. A context that has read expected outcomes before acting must be reported as a primed inspection.

The six core identities retain the IDs in [the product plan](../../docs/02-product.md). UX7 and UX8 are additional testing variants, not a change to product scope or a claim that two new market segments have been validated.

| Profile | Main behaviour to explore | Tasks |
| --- | --- | --- |
| P1 Mei | New founder; cautious about unknown rights and personal context | T01–T02 |
| P2 Arun | Research founder; checks dependencies and comparison evidence | T03–T04 |
| P3 Jess | Regional founder; mobile, short sessions, optional dictation | T05–T06 |
| P4 Sam | Experienced payments founder; presses for a definite answer | T07–T08 |
| P5 Alex | Navigator/curator; questions provenance and date conflicts | T09–T10 |
| P6 Priya | Integrator; distinguishes interface claims from executable evidence | T11–T12 |
| UX7 Taylor | Founder using keyboard and zoom; needs an equivalent textual route | T13–T14 |
| UX8 Morgan | Returning founder; corrects context and checks recovery and isolation | T15–T16 |

## What can run when

These are prerequisites, not new roadmap gates. A declared API-only release must not fail because its website has not been built. Conversely, a feature promised for the release that is missing is a failure, not automatically deferred.

| Available surface | Valid activity | Evidence limit |
| --- | --- | --- |
| Static SVG/paper boards (0/0a) | Inspect language, hierarchy and expected affordances | [Registry](facilitator/capabilities.json): design inspection only; no runtime capabilities proven |
| Fixture-only NestJS slice 1A | P6 documentation inspection and separately authorised HTTP fixture checks | [Registry](facilitator/capabilities.json): `api_quickstart`, `api_contract`; no founder browser completion |
| Founder UI (1A-UI local fixtures; 1B live; Stage 4 full interface) | Core text tasks; controlled fixture states that exist | [Registry](facilitator/capabilities.json): `founder_text`, `context_edit`, `evidence_panel`, `comparison` etc.; record mock/live backing |
| Graph/curator artifacts (Stage 3; baseline reports Stage 2) | P5/P6 artifact tasks | [Registry](facilitator/capabilities.json): `repository_review_artifact`, `evaluation_report`; no admin console required |
| Voice/visual experiment (Stage 5) | T06 and T08 with explicit supported-input setup | [Registry](facilitator/capabilities.json): `voice_input`, `transcript_edit`, `text_fallback`, `visual_upload`, `extraction_confirmation` |
| Later MCP adapter (Stage 7) | Separate policy/interoperability tests | [Registry](facilitator/capabilities.json): deliberately no MCP capability or pass assigned by this pack |

The [early fixture UI and first run](../../docs/delivery/iterations/iteration-01.md) bring supported text tasks forward. Registry stage labels remain the broader planned delivery stages; its existing earlier-prototype rule requires actual presence evidence before a task can run. This planning change does not mark any capability or task as passed. T04 remains deferred until comparison/export exists.

The registry lists each of the 22 capability IDs once, its planned delivery stage, presence evidence, contract mapping and absent-state handling. These are planning identifiers, not invented fields in `GET /v1/capabilities`. Bind them to actual implementation evidence in the run manifest. A stage label alone never proves a capability exists.

T02/T03/T15 initially have `blocked_pending_test_controls`; T06/T08 have `blocked_pending_fixture`. Others start `not_run`, which does not imply readiness. There are 20 named variants across 16 parent tasks: T06 has correction/denial/timeout variants and T15 has vector/budget/graph variants. Assess readiness before execution; none are attempted until an actual action is recorded.

Start with P1/T01, P2/T03–T04, P3/T05, UX7/T13 and UX8/T15. Expand to failures and specialist tasks as the corresponding surfaces exist. Repeat source-inspection and correction tasks across multiple personas; do not invent coverage to meet a numerical target.

## Relationship to other evaluation

These are disclosed development tasks, not a held-out Ragas set or gold reference answers. Keep them out of the production retrieval corpus and frozen evaluation set. UI test success cannot establish retrieval quality, factual accuracy, budget enforcement, security, accessibility conformance or real founder comprehension. In particular, synthetic teach-back cannot satisfy the product's human-participant O1–O3 targets.

Existing authorities remain [founder scenarios](../../features/founder-journeys.feature), [API scenarios](../../features/api-access.feature), [UX principles](../../docs/ux/research-and-design.md), [storyboards](../../docs/ux/storyboards.md) and [delivery gates](../../docs/06-delivery.md). Facilitator mappings separate `observes` (only the visible subset in `observation_scope`) from `related` (context only). Count executed variant evidence, not entire scenario passes or parent-task union lists. If implementation changes these contracts, record the discrepancy for review rather than silently updating the task to make it pass.

Validate the pack from the repository root with `python research/synthetic-ux/tools/validate_pack.py`. This checks structure, traceability and the scenario-review checkpoint; it executes no browser task. See [validation and review instructions](tools/README.md) for diagnostics, regression tests and the explicit checkpoint update process.
