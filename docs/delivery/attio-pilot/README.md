# Attio-inspired agent development pilot

Prepared 9 November 2026 (Australia/Sydney). **Opt-in trial, not replacement policy or automatic agent dispatch.** This pack adds a small context-selection tool, reusable task playbooks, a handoff validator and a measured trial to our existing delivery process. It does not install personal skills, start agents, add provider calls, or change application behavior.

## Start here

1. Read repository instructions and the live issue/PR. [The current delivery workflow](../agent-workflow.md) remains authoritative; live Delivery blocks establish assignments.
2. Use [the continuous discovery/session prompts](continuous-prompts.md) for normal operation. The [original task-specific prompts](prompts.md) remain as historical pilot-start examples. Keep an existing session's branch and work intact. Use a fresh Claude context when independent review is required.
3. Use [the reusable playbooks](playbooks.md) and select relevant lessons with the tool below.
4. Use [the handoff template](handoff.template.json), validate its structure, then have the receiving agent inspect the actual evidence.
5. Run the [three-task trial](trial.md). Measure before choosing whether to retain or automate anything.

## What we are combining

| Source practice | Our existing foundation | Pilot addition | Deliberately deferred |
| --- | --- | --- | --- |
| Attio's Alexandria: scoped lessons available to coding tools | AGENTS, ADRs, delivery rules and retrospectives | Small reviewed lesson records selected by affected paths; source links and revision identity | An MCP service until CLI use demonstrates a real integration need |
| Attio's advisory automated review | Claude review-only, exact-head evidence, Codex fixes | Findings tied to lesson, location, reproduction and disposition; track false positives | Autonomous approvals, merges, or a second review bot |
| Attio's consistent agent definitions and tests | Fixture API, contracts, budget/fault controls, browser regressions | Common development run/handoff record; deterministic validation of its structure | A new production agent framework or live provider integration |
| Attio's capability selection and provider abstraction | Explicit Codex/Claude/OpenClaw roles and environment limits | Per-task capability declaration and specific Mac-only handoffs | Treating prose permissions as enforced sandbox controls |
| Attio's product observability | Logs, exact build identities, artifact hashes | Comparable records of rework, review noise, elapsed effort and evidence gaps | Unmeasured claims about speed or productivity |
| Attio's support/engineering collaboration | Synthetic research, UX findings, real-user gates | Promote repeated, accepted findings into reviewed lessons | Treating synthetic actors as real customers |

The first two Attio practices concern **building software with agents**. Thread Agent and Ask Attio concern **building agent features into a product**. We borrow their consistency and verification principles without assuming these are the same harness.

## Current project fit

Grounded against main `f81b2d71c29bea725970e8988384d124d4f5ed57` and live #23/#10/PR #76 on 9 November. The latest hub checkpoint says #76 has Claude GO and six passing CI checks, with local-Mac zoom and durable final evidence still outstanding. #10 remains the next bounded Codex build. These are dated observations, not new assignments; reread GitHub before acting.

- **Codex:** implementation and fixes; ordinary checks here or in CI, accurately identified as builder-run.
- **Claude:** PR review and reviewer-run reproduction; no implementation commits.
- **OpenClaw:** verification requiring Nissan's local Mac, plus its scoped evidence handoff. Record its actual configured model; OpenClaw itself is a harness.
- Retain two implementation issues maximum, exclusive shared-path ownership, owner/human decision gates, fixture-only execution and existing merge authority. This pilot adds no merge permission and revokes no authority already given in a session.
- #10 is a good prospective first build because it crosses contracts, generated assets and UI words. Preserve the approved vocabulary and leave export parity open until an export exists. #76 is useful for testing evidence handoffs, but cannot be retroactively claimed as an agent-build experiment.

## Tools included

Python 3.10+ standard library only, from repository root:

```sh
# Planned files, before implementation. Paths may include files not created yet.
python docs/delivery/attio-pilot/pilot.py context --role builder \
  --path packages/contracts/schemas/v1.schema.json \
  --path design/system/components/bundle.js \
  --path apps/web/src/lib/present.ts

# Actual changed paths between two full commit IDs. Deletions and both sides
# of a rename are included. Replace placeholders; shell does not infer them.
python docs/delivery/attio-pilot/pilot.py context --role reviewer \
  --base FULL_BASE_SHA --head FULL_HEAD_SHA

# Fill a COPY of the template outside the tracked tree with actual observations.
python docs/delivery/attio-pilot/pilot.py validate /absolute/path/handoff.json \
  --head FULL_TESTED_HEAD_SHA

python -m unittest discover -s docs/delivery/attio-pilot -p 'test_*.py' -v
```

The context tool emits matching lessons, matching reasons, authoritative source paths, lesson-catalog hash and commit IDs when using diff mode. Unknown paths are flagged for manual context review; no match never means no risk. Prefix selection is deterministic, not semantic retrieval. A cross-cutting issue may require adding paths manually. Re-run after scope or head changes.

The validator checks structure, head identity and evidence bookkeeping. It **does not** fetch links, inspect logs, verify signatures, run tests, enforce tool permissions, determine independence, grant approval, or mark an issue Done. A structurally valid handoff can contain failures and unrun checks. The receiver must evaluate them. No workflow, webhook or MCP server is installed by this pack.

## Two harnesses, with different jobs

**Development harness (this pilot):** the agent's existing host tools + repository instructions + selected lessons + role playbook + handoff record. Work flows through the existing builder → reviewer → remaining verification → authorized merge → resulting-build check process. Invalid records go back for correction; a product failure goes to Codex; a missing Mac capability stays blocked.

**Product test harness (already in the repo):** `apps/api/src/harness.ts` and `research/synthetic-ux/tools/phase-controller/`. Keep pinned clocks, named fixture faults, validated atomic changes and private local controls. Do not add an HTTP control endpoint or replace these tools. Later live-agent work belongs to the separately gated #29 plan: define an agent input/output schema, allowed tools, request identity, cost/time/step budget, cancellation, bounded retries and model variant; compare on fixed evaluation cases before enabling it.

Suggested later evaluation cases: contradictory sources, stale versus future-effective evidence, absent provenance, unavailable retrieval, graph degradation, exhausted budget, revoked capabilities, malformed structured output and a provider timeout. Deterministic schema/security/budget assertions remain separate from model-based answer scoring; research tasks and fixtures stay outside held-out evaluation data. No new product capability is claimed here.

## Lesson maintenance

`lessons.json` is a compact index and checklist, not a second source of policy. A lesson needs a concrete trigger, actionable rule, counterexample, check and existing source. The included lessons are proposed condensations of repository rules, pending review. When a review reveals reusable knowledge, Codex proposes one small lesson change, Claude checks scope and evidence, and the coordinator retains or retires it after the pilot. Do not convert stylistic preferences or one-off environment accidents into universal rules. Revalidate affected lessons when their source changes. Keep human research out of this shared development context.

## Sources and attribution boundaries

- [Attio: Building better software with AI](https://attio.com/engineering/blog/building-better-software-with-ai), Alexander Christie, June 2025: scoped Markdown lessons, advisory PR annotations and Claude Code via a local MCP server. We implement a simpler JSON catalog and CLI; these are our design choices.
- [Attio: You can't just prompt your way to great AI features](https://attio.com/engineering/blog/you-cant-just-prompt-your-way-to-great-ai-features), Jamie Davies, June 2025: consistent definitions, provider variation, typed outputs, agent tests and execution visibility. We apply those principles to handoffs and propose later product evaluation; we are not copying their framework.
- [Attio: Ask Attio — a technical look at our new agent](https://attio.com/engineering/blog/ask-attio-a-technical-look-at-our-new-agent), Jamie Davies, March 2026: contextual capabilities, provider failover and schema-backed streaming UI. Per-task capability reporting is our adaptation, not an Attio development policy.
- [Jam: Support and Engineering at Attio](https://jam.dev/blog/how-support-and-engineering-collaborate-at-attio/), December 2025: customer/support feedback informing engineering. Our finding-to-lesson loop is an inference from that practice.
- [AI Revolution interview](https://www.iheart.com/podcast/1333-the-ai-revolution-show-331253717/episode/how-attio-is-rebuilding-the-crm-331253719/), April 2026: optional leadership context, especially the published 11:27 and 14:14 chapters. No workflow rule depends on an unreviewed video/audio transcript.

Local foundations: [AGENTS](../../../AGENTS.md), [consolidation](../consolidation-20261108.md), [foundation retrospective](../retrospectives/foundation-pr32-pr33.md), [visual standards](../../ux/visual-quality.md), [ADR001](../../decisions/001-api-first-nestjs.md), [ADR002](../../decisions/002-decision-models.md). This pack records no Attio productivity statistics and no Oz Startup Brain improvement results.
