# Iteration 01 — make the founder feedback loop executable

Planning window: **6–12 November 2026, Australia/Sydney**. This is a proposed scope window, not a completion promise. [Issue #23](https://github.com/nissan/oz-startup-brain/issues/23) is the live coordination record; it holds membership, dispatch and the retrospective.

## Goal and order

Deliver the fixture API and trustworthy visual foundation, then unlock a polished local founder journey for synthetic browser feedback. No hosted service, model spend or public deployment is needed.

1. The fixture API (#24/#33) and intended-font foundation (#22/#32) have merged and their completion records are in GitHub. Read the [checkpoint retrospective](../retrospectives/foundation-pr32-pr33.md); do not reassign these completed tickets.
2. Proposed independent lanes: **Claude #34 dependency remediation**, **Codex #28 source dispositions**. Both remain unclaimed until explicit dispatch. Keep package/lockfile edits with Claude and source metadata/docs with Codex; cross-review each other's PRs. Research consumes a lane in this pairing.
3. **#8 is ready for Nissan's design decision**, with intended-font evidence available. Record approval in all three handoffs or concrete requested changes. Do not silently remove this gate to accelerate the UI.
4. After #8 approval, schedule **Claude #25 local fixture UI** as the next critical-path build. Finish #34's package changes or explicitly release/reassign its claim before another branch edits the root lockfile. Codex may continue #28 independently. If one lane finishes early, review the other before pulling more work.
5. **#26 first synthetic round** follows a pinned usable #25 build and verified task capabilities. #27 follows actual findings. Available #9 checks remain separate; screen-reader and actual browser zoom evidence cannot be inferred from automation.
6. #29 stays an epic until decomposed; #30 remains access-blocked. Carry unfinished work into the next window rather than dropping visual polish or claiming unrun research.

The early UI brings Next.js/BFF interaction forward from live slice 1B without moving durable quota, security or live-retrieval acceptance forward. The API remains the business-logic authority. Shared vocabulary #10 may be implemented in increments coordinated with #25; it stays open until its export criterion is satisfied.

## Dispatch prompt

```text
Work in nissan/oz-startup-brain. Read AGENTS.md and docs/delivery/README.md.
Use iteration issue #23 and the assigned issue's latest comments as current state.
Assigned issue: #34 for Claude, or #28 for Codex (select one in the dispatch).
Role: builder for #34; researcher/planner for #28. Record model, run ID, base SHA and branch.
Confirm the unique claim with the coordinator before editing; preserve other work.
Implement only this issue's acceptance scope and exclusions. No paid calls or hosting.
Open a PR referencing the issue, with exact validation evidence and pending criteria.
For frontend changes, perform and document the visual-polish/reinspection loop.
Post the handoff on the issue and PR. Do not claim independent review or merge.
```

The coordinator can confirm a builder in the dispatching session and record that confirmation in GitHub; this need not introduce a second user approval. Reassignment and scope changes must still be visible. Reviewers/verifiers receive the same issue/PR with their role and exact head; synthetic actors receive only the isolated actor packet, never this builder prompt.

## Exit and retrospective

Record which artifacts/PRs actually merged and which checks ran. Carry forward unresolved tasks by link. Report the first UX run only if the browser journey exists and tasks were executed; otherwise report the blocker. Track completed tasks by variant, observed friction, fixes/retest results, visual issues remaining and the next smallest outcome. No iteration velocity or human-research claim should be invented from synthetic preparation.
