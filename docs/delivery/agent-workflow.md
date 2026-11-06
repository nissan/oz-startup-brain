# Shared agent delivery workflow

## Roles and authority

| Role | Responsibility | Handoff evidence |
| --- | --- | --- |
| Coordinator (initially Nissan) | Prioritize, confirm one builder, manage WIP and dispatch the next role | Issue Delivery block, confirmed run/branch and next owner |
| Planner | Turn an outcome into a bounded Ready issue; identify dependencies and exclusions | Acceptance criteria, scenario/task references and proposed decisions |
| Builder | Implement one accepted issue in an isolated branch/worktree | PR linked to issue, exact SHA, validation and visual evidence |
| Reviewer | Independently inspect scope, code/design, risks and evidence | Findings with severity, location, reproduction and requested change; reviewed SHA |
| Verifier | Reproduce acceptance and inspect the actual build | Commands/browser actions, build identity, results, limitations and retest links |
| Owner | Product/design, spending and merge decisions where required | Explicit decision recorded in GitHub |

Roles are portable across Claude, Codex and other models. GitHub Assignee identifies an actual accountable account, not a fictional agent username. Record agent/model, session/run ID and role in the issue. A different role label in the same context is not independent review. Prefer a fresh reviewer context (and a different model when useful); disclose shared context. Builders must not self-certify an independent review or authorize their own merge.

Fast/System One models may help with bounded triage, summaries, schema/format checks and repeatable test execution, with a named reviewer accountable for the result. They are not the sole authority for semantic acceptance, research interpretation, security, visual polish or merge decisions. This development workflow is separate from the product's ADR002 decision-model evaluation.

## Claim and dispatch

1. Read AGENTS.md, the issue, dependencies and latest PR/comments. Confirm the scope is Ready and the two-implementation-issue WIP limit permits starting. Review fixes consume their existing WIP slot until resolved; avoid parallel edits to shared renderer/contracts.
2. Post a claim containing role, agent/model, run ID, branch/worktree and intended scope. The coordinator confirms the unique builder/run and updates the Delivery block to In progress. Comments are not an atomic lock: conflicting claims wait for coordinator resolution before editing.
3. Work on that branch only; check the latest base and existing work before changing files. Keep shared-contract changes coordinated and split unrelated changes into issues.
4. Post a handoff when opening the PR, encountering a blocker, changing scope or finishing. Update canonical state; do not depend on chat memory. Never overwrite another agent's evidence or force-push their branch.
5. The coordinator explicitly dispatches the reviewer/verifier with the issue and PR links. Comments, mentions and assignees do **not** automatically start an LLM session. No webhook/orchestrator is implemented by these documents.

For abandoned runs, the coordinator records an explicit release/reassignment, preserving branch and partial evidence. Elapsed time alone does not transfer ownership. Ask for missing product decisions only when the issue cannot progress independently.

## State transitions

Backlog becomes Ready after refinement. Ready becomes In progress after a confirmed claim. In progress becomes In review with a reviewable PR; requested changes return it to In progress. In review becomes Verification after findings are addressed at a specified head. Verification becomes Done only when acceptance, required approvals and merge/completion evidence are recorded. A verification failure returns to In progress. Any active state can become Blocked with a concrete reason, dependency and next action; the coordinator resumes it in the appropriate state when resolved.

Code/design issues require a merged PR and verification of the resulting build for Done. Research/decision issues may complete with reviewed artifacts or an explicit owner decision; record which applies. Do not use `Closes #N` if a PR only partially satisfies an issue or if post-merge verification remains outstanding. Use `Refs #N` and close after evidence is recorded. Merge authority is explicit, never inferred from passing CI.

At each review, record the exact head SHA. Recheck after updates; previous approval is not automatically evidence for new commits. Verify CI for the actual candidate head, and after merge verify the resulting build/preview identity. If base changes affect the reviewed scope, rerun affected checks. Reconcile issue status and PR links after completion.

## Copyable claim / handoff

```text
Type: claim | progress | blocked | review | verification | completion
Issue / PR:
Role / agent / model / run ID:
Accountable person / coordinator confirmation:
Branch / base SHA / head SHA / build URL:
Outcome and scope:
Changes or findings:
Evidence: commands, results, artifact links, browser conditions
Visual polish: findings -> fixes -> revised inspection, or N/A reason
Unresolved blockers / dependencies / remaining acceptance:
Proposed status / next role and action:
```

Keep comments concise and link large evidence artifacts at immutable commits or durable PR attachments. Never include secrets, personal data or private source text. A scope/architecture decision belongs in an issue comment plus the relevant ADR/document; link both from the PR. A review finding stays on its PR until resolved; deferred work requires a linked issue with outcome and acceptance.

## Review and verification practices from the foundation retrospective

Apply these when the change touches the relevant boundary; do not repeat unrelated suites merely to increase the check count. See the [#32/#33 retrospective](retrospectives/foundation-pr32-pr33.md).

- Start with a clean locked install and the declared runtime. Build workspace dependencies before typechecking consumers. Record any environment limitation and the exact substitute command separately from normal CI results.
- For each corrected defect, retain the original reproduction and show the regression fails on the old behaviour. For temporal changes, cover both sides of freshness/effective-date boundaries and check summary, claims, recommendations and warnings for agreement. Assert prohibited output is absent, not just that a caveat exists.
- For contract changes, exercise operation schemas, referenced components and reference siblings, parameters, security and the actual caller/callee boundary. Use a validating-client counterexample to establish a break. Compare against the prior baseline before considering a deliberate baseline update.
- Keep the PR's current handoff concise: tested head, remaining findings and next role. Historical evidence belongs in the comment trail; do not silently attribute an old review to a new commit.
- Recheck main immediately before merging. If it advanced, inspect overlaps and verify the combined tree's affected boundaries. After merging, fetch the actual commit, compare its tree with the tested one and run a relevant smoke check. Retain source/CI identities; an empty PR-only workflow query is not evidence that push CI passed.
- For dependency changes or release verification, record audit results, dependency paths and reachability at that time. Link each deferred finding to an owner and a release trigger. Do not force a major upgrade or weaken the gate solely to obtain a green audit.

These are procedural requirements, not newly implemented CI gates. Independent review, primed builder verification, owner design decisions and isolated synthetic actors remain distinct roles/evidence.

## Synthetic UX loop and evidence boundaries

This section is **facilitator guidance**. Synthetic actors must stop at their assigned actor profile/task brief and starting URL; do not read the facilitator pack, this section's linked runbook, evaluation rubrics or expected outcomes. The facilitator launches a fresh actor context without inherited builder/reviewer discussion. If it is primed, label it a primed inspection; do not claim an unprimed simulation.

Facilitators use [the persona runbook](../../research/synthetic-ux/runbook.md), verify capabilities against the exact build, and record task variants actually attempted. Preserve the original trace. Turn observed friction into deduplicated UX issues, fix bounded priorities, perform the visual-polish pass and retest affected and adjacent paths. Separate fresh usability exploration from primed regression checks.

Issue #26 starts with T01/T03/T05/T13/T14 and supported T15 variants. Comparison/export T04 waits for those capabilities; T06/T08 wait for authored voice/visual fixtures. An unavailable runner, missing fixture or absent capability is not a pass. Actual browser zoom must be distinguished from CSS viewport simulation. Screen-reader evidence requires an actual screen reader. Do not relabel expected behaviour as observed feedback.

Synthetic UX does not establish human comprehension, accessibility conformance, factual answer quality, durable budgets or security. Keep persona tasks, expected answers and development fixtures out of the production retrieval corpus and held-out Ragas set. No social engagement metric is answer ground truth. Human research, owner design approval, deterministic checks and model evaluations retain their separate gates.

## Cadence

Use one-week planning windows, not deadline promises. At the start, choose the smallest outcome and at most two active implementation issues; keep a reviewer/verifier available. At each handoff reconcile statuses. At the end, record completed evidence, carry-over/blockers, UX findings fixed/retested, visual limitations, escaped defects and one process improvement in the iteration issue. Select the next outcome from the ordered backlog. No scheduled automation is implied.
