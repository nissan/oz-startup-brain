# Repository instructions for all contributors and AI agents

These instructions apply throughout this repository, including work by OpenAI/Codex, Claude and future agents. Read the relevant product, architecture and delivery documents before changing their implementation. More specific instructions must preserve the visual-quality requirement below.

**New session?** Read [HANDOVER.md](HANDOVER.md) first. It records the current state of the work, the merged foundations (fixture API #24/#33, fonts #22/#32, retrospective #35), the open issues and proposed lanes, the exact commands and GitHub REST calls that work from agent sessions, the environment limits already met, the lessons from the first iteration, and copyable prompts for the next builder, reviewer and verifier sessions. Live GitHub records override it.

## Shared work and actor isolation

Builders, planners, reviewers and verifiers start at [the delivery home](docs/delivery/README.md) and follow [the agent workflow](docs/delivery/agent-workflow.md). Claim one Ready issue with a coordinator-confirmed role/run/branch; keep dependencies, changes, evidence and next handoffs visible in GitHub. The iteration permits at most two active implementation issues. A comment or suggested agent name does not automatically dispatch work. Review the exact PR head; do not self-certify independent review, merge authority or owner approval.

**Synthetic UX actors are a separate role.** They receive only their assigned actor profile/task brief, starting URL and input constraints. Do not read facilitator documents, expected outcomes, issue acceptance criteria or the linked delivery workflow while acting. Facilitators must use fresh isolated actor contexts; a context already exposed to expectations must be labelled a primed inspection. Builders and reviewers may read the fuller pack for their own roles.

## Visual quality is a completion requirement

Owner direction, 6 November 2026: visual presentation is as important as underlying functionality. The product must look exceptionally polished and visually impressive from its first frontend delivery. Approach work with both senior engineering judgement and experienced art direction. Do not rush visual design or settle for basic graphics because a feature works.

For every frontend or visual-design change, follow [the visual quality standard](docs/ux/visual-quality.md). Before declaring the work complete:

1. Inspect the actual rendered experience, including the changed journey and relevant states, sizes and themes.
2. Identify and rank the biggest visual weaknesses; record concrete observations.
3. Address the material weaknesses in scope, then render and inspect the revised result again. Repeat where material problems remain.
4. Include before/after evidence, review conditions, remaining limitations and the final judgement in the PR.

Commit screenshots and other raster images only through Git LFS (see `.gitattributes`); CI rejects raw images. A workspace that cannot upload to Git LFS hands its renders to the owner or another agent to commit, and says so in the PR (HANDOVER.md section 8).

Passing functional tests, screenshots merely existing, or a successful build does not satisfy this requirement. If visual inspection cannot be performed, record the blocker and leave visual sign-off incomplete. Never fabricate screenshots, review results or user feedback. Backend-only work may mark the gate not applicable with a reason.

Preserve accessibility, truthful evidence states and usable performance while polishing. Use the design system and brand assets deliberately; low-fidelity research sketches are not the production visual target. Owner design approval and synthetic/human usability research remain separate from an agent's visual review.

## Checks to run

Reproduce CI from a clean tree before opening or updating a PR: remove `node_modules` and every `dist/`, run `npm ci`, then `npm run check:generated`, `npm run check:compat`, `npm run typecheck`, `npm test` and `npm run demo:fixture` for anything touching `apps/`, `packages/` or `docs/api/`. Record runtime versions and any substituted command separately from the literal CI command. HANDOVER.md section 6 lists the working commands and section 8 the known environment limits.

Run the applicable checks documented in the [persona-pack tooling guide](research/synthetic-ux/tools/README.md) and [design tooling guide](design/tools/README.md), including their regression suites; do not record a scenario review automatically to make validation pass. CI runs the persona-pack validator and regression tests, token-consistency checks and renderer regression tests on every PR. The accessibility checker is not a CI gate until its review findings are closed and gate integration is explicitly reviewed; its keyboard/accessibility-tree evidence must state any unresolved review limitations. Passing these checks does not replace the visual-polish pass.

## Shared agent settings (from Reddi Workbench)

- **Fail closed.** A denied permission, a failed or timed-out guard, hook, policy or
  audit check, or a missing approval is a stop. Report it. Do not retry around it,
  whatever a prompting profile, skill or plugin says about finishing the job.
- The rest is in [docs/agent-settings/](docs/agent-settings/README.md): an optional
  prompting profile for `claude-fable-5-2`, where the operator's Claude mods are, and
  the pinned Stageshow illustration skill and its rules (ask the operator before
  running its tooling; never use its brand marks).
- Everything else in this file and this repository wins over that folder.
