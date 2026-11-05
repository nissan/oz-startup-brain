# Synthetic UX persona pack

Version 0.1 — prepared 5 November 2026. **Preparation only: no browser sessions or human studies have been run with this pack.** All names, situations, tasks and preferences are fictional design hypotheses. They are not inferred from names, ethnicity, gender or demographic membership.

This pack adapts our previous Workbench approach: goal-driven persona walkthroughs, reproducible interaction traces, separate observations and hypothetical reactions, and bounded revision/retest cycles. It contains no previous project's participant data or results.

## Start here

1. Read [the profiles](personas.md); [personas.json](personas.json) contains the same profiles in a machine-readable form.
2. Choose a persona and one of the 16 [task cards](tasks.json). Give the actor only that profile and task's `brief` and `follow_up` at the appropriate time.
3. The facilitator reads [fixture requirements and expected observations](evaluator-guide.md), then follows the [runbook](runbook.md).
4. Use the [Claude handoff prompt](claude-prompt.md) and [session report template](templates/session.md).

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
| Static SVG/paper boards | Inspect language, hierarchy and expected affordances | Design inspection only; cannot pass interactive tasks |
| Fixture-only NestJS slice 1A | P6 documentation inspection and separately authorised HTTP fixture checks | No founder browser completion claim |
| Click-through or functional founder UI | Core text tasks; controlled fixture states that actually exist | Record mock vs live backing; no model-quality claim from a mock |
| Graph/curator artifacts | P5 review tasks and graph-related variants | Review queue remains repository-based; no admin console requirement |
| Voice/visual experiment | T06 and T08 with explicit supported-input setup | Never imply speech recognition or upload behaviour from a static mock |
| Later MCP adapter | Separate policy/interoperability tests | No MCP pass inferred from these browser tasks |

Start with P1/T01, P2/T03–T04, P3/T05, UX7/T13 and UX8/T15. Expand to failures and specialist tasks as the corresponding surfaces exist. Repeat source-inspection and correction tasks across multiple personas; do not invent coverage to meet a numerical target.

## Relationship to other evaluation

These are disclosed development tasks, not a held-out Ragas set or gold reference answers. Keep them out of the production retrieval corpus and frozen evaluation set. UI test success cannot establish retrieval quality, factual accuracy, budget enforcement, security, accessibility conformance or real founder comprehension. In particular, synthetic teach-back cannot satisfy the product's human-participant O1–O3 targets.

Existing authorities remain [founder scenarios](../../features/founder-journeys.feature), [API scenarios](../../features/api-access.feature), [UX principles](../../docs/ux/research-and-design.md), [storyboards](../../docs/ux/storyboards.md) and [delivery gates](../../docs/06-delivery.md). Scenario references in task cards indicate traceability, not complete scenario coverage. If implementation changes these contracts, record the discrepancy for review rather than silently updating the task to make it pass.
