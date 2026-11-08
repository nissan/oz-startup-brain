# Consolidation and fresh work plan — 8 November 2026

This replaces the old active assignments in HANDOVER and iteration #23. Live issue Delivery blocks and exact-head reviews remain authoritative. Nissan asked Codex to take over published work across Codex, Claude and OpenClaw, complete it, then reassess the next distribution. Run: `codex-consolidation-20261108`.

The coordinator reconciled repository-visible work. It cannot stop or inspect unconnected external sessions or recover their unpushed local edits. Previous builders should preserve branches/evidence and reconcile this plan before resuming. Posting this plan does not launch a session.

## What is delivered

| Work | Outcome |
| --- | --- |
| Follow-up continuity #45 | PR #67 merged `054c4bd`; #69 evidence merged `323f56a`. Claude code GO, fresh Codex evidence review, integrity checks and fresh separate-turn T03/T05 retests on merged product. |
| Failure/recovery tooling #42 | #65/#68 previously merged. #71 merged `7251253`; actual main-push browser cycles passed for vector, budget and graph, including cleanup. |
| Focused UX remediation #27 | Requirement/preparation and Gympie layout fixes were already merged. Continuity now verified; T01 adjacent primed regression passed. This retrospective closes the selected remediation loop when its evidence is merged. T13 remains #53/#55. |
| Roadmap #70 | A dated 19:38 AEDT snapshot with its own visual review/evidence. Use this newer assessment and #23 for current assignments; its historical handoffs are not dispatch. |
| Source preparation | #64 Queensland exception audit and #66 blank federal human checklist already merged. No source release or human results implied. |

[Verification record and raw evidence](../../research/synthetic-ux/runs/consolidation-20261108/README.md) contains exact SHAs, browser conditions, failures, artifact links and acceptance limits. Main `7251253807444ecffaa4e31ccdd65213e6354184` passed six checks in [run 42465748158](https://github.com/nissan/oz-startup-brain/actions/runs/42465748158). Later documentation merges must retain this tested product identity. Issue closure follows reviewed evidence publication; the issue records, not this table, establish the final closed state.

## Fresh assessment

The fixture journey works and preserves bounded conversational scope. It is not a released source-backed service. The next highest-value product fix is keyboard dismissal/focus return, followed by consistent state words. Remaining findings and gates are explicit:

| Issue | Readiness / next action |
| --- | --- |
| #55 | Ready for next build after consolidation: action evidence dismissal, focus restoration, narrow inline layout and source-return preservation. |
| #10 | Queued for Codex after #55, as a bounded existing-surface vocabulary increment; export acceptance stays open until an export exists. |
| #53 | Verification blocked on #55; fresh isolated T13 source → return → dismiss attempt, separate from primed checks. |
| #9 | Continue available component activation/actual zoom coverage; actual screen-reader evidence needs a real available tool/operator. Prior #56 scope is not full acceptance. |
| #72 / #73 | P2 backlog after #55; context explanations and evidence presentation. Coordinate shared labels with #10. |
| #61 Part B | Nissan must decide Queensland use, retention and attribution after the exception audit. Part A complete. |
| #62 | Name a human checker and target date; record actual findings for 15 federal priority questions. All 26 human results remain pending. |
| #28 | Agent preparation complete to current scope; corpus release blocked on remaining decisions, checks and explicit release. Seven reviewed versions do not imply release. |
| #29 | Planning-only epic: decompose after source/release and provider/spend inputs; no live build or paid calls dispatched. |
| #54 | Real-founder research backlog; synthetic observations do not replace it. |
| #30 | Native Project access blocked; issue index remains usable. |

## Current provider roles — owner update, 8 November 2026

Nissan removed Claude build assignments for now: **Codex builds, Claude reviews PRs only, and OpenClaw performs verification that requires local Mac commands.** This supersedes the earlier two-provider build plan. External sessions are not automatically started or stopped by this record.

| Session | Current responsibility | Boundary |
| --- | --- | --- |
| Codex | Implementation, review fixes, coordination and checks available in this environment or CI. Build #55 first; queue #10's existing-surface increment next. | Separate bounded PRs. Preserve existing acceptance and export deferral. Builder-run checks are labelled as such, not independent review. |
| Claude | Review PRs at their exact heads, including code, UX/evidence interpretation and any local verification evidence PR. May reproduce applicable checks and probe the build as reviewer evidence, without implementation commits. | No build assignments, implementation commits or review-fix ownership. Return findings to Codex; re-review changed heads. Use a fresh context where possible and disclose prior context. |
| OpenClaw | Execute scoped verification requiring commands on Nissan's local Mac. | Receive a pinned checkout plus exact commands, expected evidence, cleanup and stop conditions. No general build assignment or blanket verification ownership; no product fixes. |

Default sequence: Codex builds #55 → Claude reviews and independently reproduces applicable acceptance checks at the exact head → Codex fixes findings → run remaining verification in Codex/CI, handing only local-Mac-required checks to OpenClaw → Claude reviews any verification evidence PR → merge under standing authority → check resulting build → reconcile issues. Then Codex takes #10. The two-implementation-issue maximum remains a ceiling, not a target; there is no Claude parallel build lane.

For non-Mac acceptance, Claude may execute checks and probe the exact PR build as part of review, without taking implementation ownership or pushing commits. Record the SHA, commands, results and limitations; this is reviewer-run reproduction, separate from Codex's builder-run evidence. A review alone, or CI alone, does not imply independent reproduction. If required checks cannot run, record the gap and leave that verification gate open rather than treating it as waived.

Codex owns remaining `data/sources/` implementation and record-transcription follow-ups under #28/#61/#62, including `release/decisions.json`. Transcribe only Nissan's explicit written selections and the named human checker's written results, with their provenance; do not infer decisions, create human results or change release gates without their required evidence. Claude reviews these PRs. Those inputs remain owner/human responsibilities, and any resulting work obeys the WIP limit.

#53 remains blocked on #55 readiness. Codex coordinates its fresh isolated actor retest; OpenClaw participates only if the required execution needs the local Mac. For #9, Mac browser/VoiceOver/actual zoom work may require OpenClaw, but tooling availability and actual execution must be recorded. Do not equate a command, viewport emulation or DOM inspection with observed assistive-technology behaviour.

Record exact model ID, run, branch and base SHA when claiming work. One builder owns each shared path and root manifest at a time. OpenClaw is a harness, not a model provider; its configured model and Claude's enabled version have not been independently inventoried. Use a capable coding model for Codex implementation and a capable reasoning model for Claude review. Fast models may assist bounded triage and log summaries, not sole semantic, visual, security or merge sign-off.

## Copyable start prompts

### Codex — implementation

> Build nissan/oz-startup-brain #55 first; queue #10's bounded existing-surface vocabulary increment next in a separate PR. Read HANDOVER, AGENTS, this current provider-role update and live #23/#55/#10 before claiming. Record exact model/run/branch/base and unique ownership. Implement and fix review findings, run applicable clean checks and visual review, and publish exact-head evidence. Claude reviews PRs only, including reviewer-run reproduction. Own source-record transcriptions under #28/#61/#62 only from explicit owner/human written records, in separate reviewed PRs. Perform ordinary verification here or through CI, accurately labelled; hand OpenClaw only checks requiring local Mac commands, with pinned SHA, commands, evidence paths, cleanup and stop conditions. Preserve #53/#9 gates and #10's deferred export parity. Do not claim external sessions ran.

### Claude — PR review only

> Review PRs for nissan/oz-startup-brain only; do not take build tasks, implement #10, or push fixes. Read AGENTS, the current #23 provider roles, each PR's exact head and linked acceptance/evidence. Assess code, regressions, visual quality and evidence limits as applicable. Reproduce applicable non-Mac checks and probe the exact head as reviewer evidence; record commands, results, SHA and limitations without pushing implementation commits. Leave required unrun checks explicitly open. Post actionable findings with file/location and severity, or scoped GO; disclose context and re-review changed heads. Return implementation findings to Codex. Review local Mac verification evidence PRs when provided; do not substitute review for tests that have not run.

### OpenClaw — local Mac verification only

> Perform only scoped verifications that require commands on Nissan's local Mac for nissan/oz-startup-brain. Wait for Codex's pinned SHA and command handoff. Record the actual model, macOS/tool/browser versions, commands, outputs, failures and cleanup; preserve artifacts and hashes in an evidence PR for Claude review. Do not take general build work, product fixes or repeat verification already completed in Codex/CI without a stated need. For browser/VoiceOver/zoom work, report only actual executed coverage and unavailable capabilities. Keep fresh synthetic actors isolated from expected outcomes and separate from primed checks. No invented human findings, source-release choices or secret-bearing logs.

## Retrospective

1. **Separate delivery from acceptance.** #69's large evidence set did not establish two actual separate follow-ups. Review exposed the gap; focused fresh retests supplied the missing observations without relabelling original partial attempts.
2. **Review exact identities, then check the merged build.** Candidate GO and tree equivalence are useful but did not replace #42's final actual main browser cycle. #71 now makes that bounded cycle repeatable in CI.
3. **Preserve evidence when it is produced.** Screenshots seen in a tool session are insufficient for later review. Actor captures now have canonical LFS objects and hashes; roadmap evidence is versioned separately. Reconstructed comparisons must say reconstructed, never original.
4. **Treat environment failures separately.** Loopback isolation and denied Unix sockets were runner constraints. Same-session fixture startup and the existing CI runner resolved them without weakening security or calling the product defective.
5. **Keep the queue truthful.** New P2 friction is #72/#73; dismissal and accessibility remain open. Human source checks and owner release choices cannot be completed by simulated users or automated validators.
6. **Reduce duplicate coordination.** One current issue hub, explicit file ownership and two implementation slots replace stale provider handoffs. This run used fresh same-provider Codex reviewers; it did not impersonate Claude or OpenClaw sign-off.

Next checkpoint: #55 dismissal demonstrated and #10 existing-surface parity reviewed, with resulting-build evidence and the actual remaining source/AT blockers reassessed. No deadline or automatic dispatch is implied.
