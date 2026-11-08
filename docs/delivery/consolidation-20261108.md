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
| #10 | Ready for a bounded existing-surface vocabulary increment; export acceptance stays open until an export exists. Coordinate exact file ownership below. |
| #53 | Verification blocked on #55; fresh isolated T13 source → return → dismiss attempt, separate from primed checks. |
| #9 | Continue available component activation/actual zoom coverage; actual screen-reader evidence needs a real available tool/operator. Prior #56 scope is not full acceptance. |
| #72 / #73 | P2 backlog after #55; context explanations and evidence presentation. Coordinate shared labels with #10. |
| #61 Part B | Nissan must decide Queensland use, retention and attribution after the exception audit. Part A complete. |
| #62 | Name a human checker and target date; record actual findings for 15 federal priority questions. All 26 human results remain pending. |
| #28 | Agent preparation complete to current scope; corpus release blocked on remaining decisions, checks and explicit release. Seven reviewed versions do not imply release. |
| #29 | Planning-only epic: decompose after source/release and provider/spend inputs; no live build or paid calls dispatched. |
| #54 | Real-founder research backlog; synthetic observations do not replace it. |
| #30 | Native Project access blocked; issue index remains usable. |

## Next two implementation lanes

These are prepared assignments for the next sessions, not claims that external runtimes have started. Each session posts its exact model ID, run, branch and base SHA; coordinator confirms the unique claim before editing. At most two implementation issues, including review fixes. No lane owns the root manifests until explicitly needed and assigned.

| Session / recommended model class | Exclusive build boundary | Reviewer | Verifier / stop gate |
| --- | --- | --- | --- |
| Codex — strong coding/reasoning model | #55: `Journey.tsx`, `EvidencePanel.tsx`, dismissal/focus styles and scoped UI regressions. Own `journey.spec.ts` during this increment. No shared vocabulary edits. | Claude in a fresh review context | OpenClaw exact-head keyboard/phone/desktop, both themes; then merged-build smoke and #53 actor. Stop if shared labels/contracts are needed; coordinate first. |
| Claude — strongest available reasoning/coding tier | #10: new shared vocabulary table in `packages/contracts`, API/schema consumers, `EvidenceLabel`/`StatusNotice`, design bundle generator and its tests/docs. No Journey/EvidencePanel/`journey.spec.ts` edits while #55 owns them. | Codex in a fresh review context | OpenClaw label parity/browser checks after reviewed head. Export parity remains explicitly incomplete; no export invention to close the issue. |
| OpenClaw — verification harness using its configured capable model | No concurrent product edits. Reproduce candidates and merged builds; preserve hashes, failures and actual runner/browser/model IDs. #53 fresh actor only after #55 readiness. Inventory real AT/zoom tools for remaining #9. | Claude assesses UX/AT interpretation; Codex checks integrity and exact-head provenance | Never self-certify its own evidence as independent acceptance. If a check cannot run, report blocked; no substitute relabelled as AT/human evidence. |

OpenClaw is a harness, not a model provider. This session has not inspected its current model configuration or Claude's enabled versions. Do not invent those IDs. For a Codex session offering GPT-6.1, use its coding-focused option for bounded #55 implementation and a stronger reasoning option for difficult contract/security review; use the exact offered model name in the claim. Fast/cheap models may triage, format or summarize logs under review, but should not be sole semantic/visual/security/merge reviewers. A fresh context is still necessary even when changing model.

Sequence: confirm #55 and #10 file claims → build separately → cross-review exact heads → OpenClaw verifies → coordinator merges one at a time under standing owner authority → verify resulting build → reconcile issues. #55 and #10 may run in parallel only within the disjoint boundaries above. If both need a shared path or root lockfile, serialize that part. #53 is a verification lane, not a third implementation lane. Reserve review capacity; do not start #72/#73 while review fixes occupy both slots.

## Copyable start prompts

### Codex

> Work on nissan/oz-startup-brain #55. Read HANDOVER's current checkpoint, AGENTS, docs/delivery/consolidation-20261108.md, issue #55 and its latest comments. Claim one unique run/model/branch at current main and obtain the coordinator’s unique-claim confirmation before editing. Implement bounded action-evidence dismissal with accessible keyboard control and focus return, including narrow inline placement at actual zoom where available. Own Journey.tsx, EvidencePanel.tsx and journey.spec.ts; coordinate any contract/label/manifest change with #10. Preserve source-return, rights gating, context and prerequisite toggles. Capture before/refined-after phone/desktop, light/dark evidence through LFS. Run applicable clean checks, open a bounded PR with exact head, request fresh Claude review, then hand OpenClaw the pinned verification target. Do not close #53/#9 or claim external sessions ran.

### Claude

> Work on nissan/oz-startup-brain #10's existing-surface increment. Read current checkpoint, AGENTS, delivery plan and latest #10/#55 comments. Claim exact model/run/branch and disjoint files. Centralize approved state/service words in contracts and wire existing API/UI/design consumers with meaningful drift tests. Do not change the words or implement an export just to satisfy an absent surface. Keep #10 open for export parity. Codex #55 owns Journey.tsx, EvidencePanel.tsx and journey.spec.ts; agree a handoff before touching them or root manifests. Validate generated files, compatibility and actual rendered labels as applicable. Open a bounded PR and request fresh Codex review. Also review #55 in a fresh context when ready, disclosing shared context if isolation is unavailable.

### OpenClaw

> Take the verification lane for nissan/oz-startup-brain under docs/delivery/consolidation-20261108.md and #23. Record the actual configured model, browser, tools and runner; do not assume a model name. First preserve/check any unpushed prior evidence against the consolidation record; don't repeat accepted runs without a changed target or unresolved concern. Wait for reviewed exact heads for #55/#10; verify acceptance, phone/desktop and both themes, preserve artifacts/hashes/failures in a separate evidence PR. For #53 after #55, create a fresh isolated actor context receiving only the registered T13 packet, URL and constraints; do not expose expected outcomes. Distinguish primed regression, fresh synthetic attempts, actual zoom and real AT. Inventory available screen reader/zoom tools for remaining #9 and state blocked coverage honestly. No product edits, source-release decisions or fabricated human findings. Request Claude interpretation and Codex integrity review, then verify the actual merged identity.

## Retrospective

1. **Separate delivery from acceptance.** #69's large evidence set did not establish two actual separate follow-ups. Review exposed the gap; focused fresh retests supplied the missing observations without relabelling original partial attempts.
2. **Review exact identities, then check the merged build.** Candidate GO and tree equivalence are useful but did not replace #42's final actual main browser cycle. #71 now makes that bounded cycle repeatable in CI.
3. **Preserve evidence when it is produced.** Screenshots seen in a tool session are insufficient for later review. Actor captures now have canonical LFS objects and hashes; roadmap evidence is versioned separately. Reconstructed comparisons must say reconstructed, never original.
4. **Treat environment failures separately.** Loopback isolation and denied Unix sockets were runner constraints. Same-session fixture startup and the existing CI runner resolved them without weakening security or calling the product defective.
5. **Keep the queue truthful.** New P2 friction is #72/#73; dismissal and accessibility remain open. Human source checks and owner release choices cannot be completed by simulated users or automated validators.
6. **Reduce duplicate coordination.** One current issue hub, explicit file ownership and two implementation slots replace stale provider handoffs. This run used fresh same-provider Codex reviewers; it did not impersonate Claude or OpenClaw sign-off.

Next checkpoint: #55 dismissal demonstrated and #10 existing-surface parity reviewed, with resulting-build evidence and the actual remaining source/AT blockers reassessed. No deadline or automatic dispatch is implied.
