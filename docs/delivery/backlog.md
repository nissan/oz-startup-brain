# Ordered product backlog

Live status, owner and iteration are in the linked issues, not this roadmap index. Priority is relative delivery order, not a claim about defect severity. The first aim is a polished, testable fixture journey; the hosted stack can follow observed UX feedback.

The foundation checkpoint is documented in [the #32/#33 retrospective](retrospectives/foundation-pr32-pr33.md). #20, #22/#32 and #24/#33 are merged; their issue completion records carry exact evidence. The next critical outcome is still the first polished browser feedback loop.

| Order / lane | Outcome / work item | Prerequisites / boundary |
| --- | --- | --- |
| Owner decision complete | [#8 Design approval](https://github.com/nissan/oz-startup-brain/issues/8) | Nissan explicitly approved the design baseline on 6 November 2026; decision recorded in #8 and all three handoffs |
| Claude, proposed next | [#34 Dependency remediation](https://github.com/nissan/oz-startup-brain/issues/34) | Ready for bounded investigation/fix; root dependency ownership; no forced major upgrade. Resolve the release gate before hosted/preview deployment or uploads |
| Codex, proposed parallel | [#28 Source dispositions](https://github.com/nissan/oz-startup-brain/issues/28) | Metadata/rights audit only; no shared lockfile or API edits. Fresh fetches are new versions; unknown rights are not approval. Owner chooses initial real jurisdiction at exit |
| Next browser build | [#25 Polished fixture journey](https://github.com/nissan/oz-startup-brain/issues/25) | #24 and #22 complete; #8 approved. Ready and unclaimed. Sequence root package edits after #34 or an explicit ownership handoff; local-only thin BFF |
| Then | [#26 Synthetic browser round](https://github.com/nissan/oz-startup-brain/issues/26) | #25 plus demonstrated task capabilities, resettable fixtures and runner support; isolated actors |
| Then | [#27 Fix and retest UX findings](https://github.com/nissan/oz-startup-brain/issues/27) | Actual observations from #26; preserve original evidence |
| Coordinated with UI | [#10 Shared vocabulary](https://github.com/nissan/oz-startup-brain/issues/10) | One owner for shared contracts during #25; export parity remains open until an export exists |
| Separate evidence | [#9 Accessibility sessions](https://github.com/nissan/oz-startup-brain/issues/9) | Actual keyboard, screen-reader and browser zoom evidence; unavailable tooling remains blocked |
| Later | [#29 Live foundation/vector epic](https://github.com/nissan/oz-startup-brain/issues/29) | Decompose before assignment; source rights, spend/provider inputs and fixture feedback precede live release |
| Coordination | [#30 Native Project views](https://github.com/nissan/oz-startup-brain/issues/30) | Authenticated Projects write access; does not block issue-based dispatch |

Proposed lanes are not agent dispatch. Keep two active lanes including review fixes; #28 consumes one in this pairing. Claude reviews Codex's #28 evidence; Codex reviews Claude's #34/#25 code. Reviewers disclose context and do not authorize their own merge.

After the vector baseline, follow [the roadmap](../06-delivery.md): national corpus expansion; measured graph benefit; bounded decision-policy experiments; expanded comparison/export interface; voice/visual experiments; public demonstration; external keys and MCP. The optional ADR002 rules/fake-provider increment can follow #24 independently, but must not block #25 or enlarge #24. Create bounded issues before assigning these stages; an epic is not a builder task.

## Priority and readiness

- Untriaged: not yet placed on the P0–P2 scale; the coordinator triages at the next handoff.
- P0: critical path for the current outcome or a release-blocking defect.
- P1: next important outcome; take only when dependencies and capacity permit.
- P2: useful follow-up that does not block the current outcome.

Ready means an outcome, scope exclusions, acceptance evidence, dependencies, role and relevant persona/task or API scenario IDs are explicit. Unknown implementation details that require investigation become a bounded spike with a decision artifact. Blocked work stays linked to the blocking issue/input; do not silently lower its acceptance criteria.
