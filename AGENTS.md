# Repository instructions for all contributors and AI agents

These instructions apply throughout this repository, including work by OpenAI/Codex, Claude and future agents. Read the relevant product, architecture and delivery documents before changing their implementation. More specific instructions must preserve the visual-quality requirement below.

## Visual quality is a completion requirement

Owner direction, 6 November 2026: visual presentation is as important as underlying functionality. The product must look exceptionally polished and visually impressive from its first frontend delivery. Approach work with both senior engineering judgement and experienced art direction. Do not rush visual design or settle for basic graphics because a feature works.

For every frontend or visual-design change, follow [the visual quality standard](docs/ux/visual-quality.md). Before declaring the work complete:

1. Inspect the actual rendered experience, including the changed journey and relevant states, sizes and themes.
2. Identify and rank the biggest visual weaknesses; record concrete observations.
3. Address the material weaknesses in scope, then render and inspect the revised result again. Repeat where material problems remain.
4. Include before/after evidence, review conditions, remaining limitations and the final judgement in the PR.

Passing functional tests, screenshots merely existing, or a successful build does not satisfy this requirement. If visual inspection cannot be performed, record the blocker and leave visual sign-off incomplete. Never fabricate screenshots, review results or user feedback. Backend-only work may mark the gate not applicable with a reason.

Preserve accessibility, truthful evidence states and usable performance while polishing. Use the design system and brand assets deliberately; low-fidelity research sketches are not the production visual target. Owner design approval and synthetic/human usability research remain separate from an agent's visual review.

## Checks to run

Run the applicable checks documented in the [persona-pack tooling guide](research/synthetic-ux/tools/README.md) and [design tooling guide](design/tools/README.md), including their regression suites; do not record a scenario review automatically to make validation pass. PR #19 supplies the CI validator, token-consistency and renderer checks once merged. The accessibility checker from PR #20 must satisfy its review findings before being treated as keyboard/accessibility-tree evidence or added as that CI gate. Passing these checks does not replace the visual-polish pass.
