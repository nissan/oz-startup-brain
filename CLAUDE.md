# Claude project instructions

**Start every session by reading [HANDOVER.md](HANDOVER.md) in full.** It is written for a session with no memory of earlier work: the current state of the issues, the rules that are easy to get wrong, the commands that work, how to use GitHub from this environment (GraphQL is blocked; use `gh api` REST calls), the environment limits already met, and the prompts for the next sessions. If HANDOVER.md and a GitHub issue disagree, the issue's Delivery block is current.

Read and follow [AGENTS.md](AGENTS.md) for repository-wide requirements, including the mandatory visual-polish pass, and [the visual quality standard](docs/ux/visual-quality.md) before frontend or design work.

For assigned delivery work, start at [the delivery home](docs/delivery/README.md), read the issue's current state (its Delivery block and every comment) and confirm a unique role/run/branch claim before editing anything. Keep review and verification handoffs in GitHub; a suggested Claude assignment is not an automatic running session. Synthetic actors follow AGENTS.md's isolated actor boundary instead of reading facilitator/planning material.

Visual presentation has equal priority with functionality. Do not declare frontend work complete until you have identified its biggest visual weaknesses, addressed them and inspected the revised render. Include the review evidence in the PR. Use [the delivery plan](docs/06-delivery.md) to keep implementation scoped; visual polish is part of each frontend increment, not a final-release cleanup task.

Hard limits in every session: merge only when the owner says so in the conversation; never call a review of your own work independent (builder self-review is the standing rule from 11 November 2026; see the shared agent settings in AGENTS.md); no paid calls, hosting or provisioning; no raw keys in the repository; never record a scenario review to make a check pass; use `Refs #N`, not `Closes #N`. Reproduce CI from a clean tree (`rm -rf node_modules */*/dist`, `npm ci`, then the checks) before opening a PR. End commits and PRs with the attribution lines your session's system reminder gives you.
