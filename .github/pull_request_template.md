## Outcome

What problem does this solve, and what can the user do or understand afterwards?

## Delivery and handoff

- Issue and iteration links; acceptance criteria covered and explicitly remaining:
- Role / agent / model / run ID; confirmed builder and branch:
- Base/head SHA and build or artifact identity:
- Dependencies, linked follow-ups and next reviewer/verifier:
- Use `Refs #N` for partial work or pending post-merge verification. Do not auto-close before the issue's completion evidence exists.

## Validation

Checks actually run, results and material limitations. Separate functional, visual and usability evidence.

- Runtime and clean-install/build conditions; exact commands and any environment workaround:
- Relevant negative/boundary cases; for review fixes, original reproduction and failing-before regression evidence:
- Contract changes: prior-baseline comparison and real client/validator counterexamples where applicable:
- Dependency changes: dated audit results, reachability and linked dispositions; no unreported release blocker:

Record the reviewed head and whether the reviewer/verifier used an independent context. Synthetic UX reports must identify task/variant, fixture, runner and priming; passing CI is not a user study. Recheck affected evidence after new commits. Merge authorization and owner design approval are separate records.

## Visual polish

Required for frontend/design changes; otherwise state why this is not applicable. Follow the [visual quality standard](../docs/ux/visual-quality.md).

- Scope and reviewed build/artifact version:
- Screens/states, CSS viewport sizes, browser, themes and font/asset loading:
- Biggest visual weaknesses found, ranked by impact:
- Changes made to address them:
- Before/after PR attachments or links to final exports at exact commit SHAs (no duplicate image sets committed), and result of inspecting the revised render:
- Remaining issues, linked follow-ups and any incomplete visual sign-off:

- [ ] Dedicated visual-polish pass and post-fix review completed, or explicitly not applicable with reason.
- [ ] Relevant responsive, accessibility, evidence-state and adjacent-flow checks completed; limitations recorded.
- [ ] Owner approval status is accurate; synthetic observations are not presented as human research.
