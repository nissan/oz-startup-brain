# Three-task road test

## Hypothesis

Path-scoped lessons and structured handoffs will reduce repeated mistakes and clarification loops without weakening review, visual quality, human evidence boundaries or delivery flow. This is a small operational trial, not a causal productivity study.

## Sequence

1. **Setup/review:** Claude reviews this pack and its tests. Keep it opt-in, outside required CI and outside the production application. Do not add an MCP daemon or new model subscription.
2. **Handoff rehearsal:** if #76 is still at its pending Mac-evidence stage, apply the record to that existing authorized handoff. Preserve already completed reviews; no blanket re-review solely for this experiment. Do not count this as a prospective build result.
3. **Prospective task A:** #10's bounded existing-surface vocabulary work, only after its existing coordinator/dependency gates permit it. Select governance, evidence, contract and UI lessons. Preserve existing approved words; validate one-to-one vocabulary and generation; leave unimplemented export acceptance open.
4. **Prospective tasks B/C:** the next two independently scoped, Ready, coordinator-selected changes. #72/#73 are candidates, not dispatches. Include at least one different boundary if the actual queue supports it; don't expand a product change just to diversify the experiment.
5. **Retrospective:** compare with up to three recent similar PRs only where records exist. Historical unknowns remain null. Report raw task-level results; no unsupported percentage gain or model ranking.

## Measurements

| Measure | Definition | Collection |
| --- | --- | --- |
| Context preparation | Minutes spent reconciling task, selecting and reading context | Agent/operator observed timing; don't infer from commit gaps |
| First-pass checks | Required checks passing before first review / required checks attempted | Exact-head command records; blocked and unrun separate |
| Rework cycles | Fix submission followed by re-review | PR timeline with head IDs |
| Repeat mistakes | Confirmed defects already covered by a selected lesson | Reviewer finding and lesson ID |
| Review precision | Accepted actionable findings / all adjudicated actionable findings | Exclude unresolved from denominator; report counts and duplicates separately |
| Handoff friction | Clarification round trips caused by missing identity, steps or evidence | Receiver records question and cause |
| Evidence gaps | Required observations or artifacts missing at handoff | Separate capability, execution, preservation and interpretation gaps |
| Cost/latency | Available model/tool usage and observed active effort | Null if unavailable; do not fabricate provider totals |
| Quality escapes | Confirmed regression after review/merge during the observation window | Linked reproduction, severity and affected head |

Use one row per run in a local CSV or PR table: `task, role, run_id, model, base_sha, head_sha, catalog_sha256, lesson_ids, context_minutes, checks_passed, checks_attempted, checks_blocked, rework_cycles, repeat_defects, accepted_findings, rejected_findings, duplicate_findings, unresolved_findings, handoff_clarifications, evidence_gaps, observed_cost, active_minutes, escapes, source_links`. Unknown numeric fields are blank, not zero. Record observation window and which sessions shared context.

## Proposed decision rules

After three prospective tasks, **retain** only if every task has traceable head/evidence identity, no weakened gate, and the coordinator/reviewer can name a concrete avoided mistake or reduced handoff ambiguity. **Revise** lessons that repeatedly load irrelevantly, duplicate canonical instructions or generate rejected findings. As a pilot trigger, inspect the review approach if more than one in four adjudicated actionable findings is rejected; report small denominators and do not treat that threshold as a statistical result.

**Stop expansion** if maintenance effort outweighs observed usefulness, required verification is skipped, or the process starts producing ceremonial evidence. Rollback is simply to stop invoking this optional pack and continue the existing workflow; application code and required CI are untouched.

## Later automation, only after evidence

- Add lesson-catalog/schema validation to CI after the CLI has proved useful and the change is reviewed.
- Add path-based PR annotations only if Claude's manual advisory workflow shows acceptable signal. Keep deterministic checks distinct from LLM advice; deduplicate findings and preserve human ownership.
- If CI later calls a model, use approved spend, least-privilege tokens and a trusted workflow definition. Never run untrusted PR code with write credentials; treat diff text and embedded instructions as data. This pack makes no API calls or CI permissions changes.
- Add a read-only MCP adapter only if a current client cannot reliably use the CLI/files. Suggested tools: `list_lessons(paths, role)`, `read_lesson(id, revision)`, `validate_handoff(record, expected_head)`. Reuse the catalog, not a second store. No write, merge, deployment or unrestricted shell tools.
- Consider agent output evaluation and provider variants under #29's separate release/spend gates. Do not make live calls under the current fixture-only pilot.
