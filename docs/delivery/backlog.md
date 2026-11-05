# Ordered product backlog

Live status, owner and iteration are in the linked issues, not this roadmap index. Priority is relative delivery order, not a claim about defect severity. The first aim is a polished, testable fixture journey; the hosted stack can follow observed UX feedback.

| Order | Outcome / work item | Prerequisites / boundary |
| --- | --- | --- |
| 0 | Finish active [PR #20](https://github.com/nissan/oz-startup-brain/pull/20) review corrections | Review the latest head; do not adopt a checker with unresolved findings as a CI gate |
| 1A | [#24 Fixture API and standalone client](https://github.com/nissan/oz-startup-brain/issues/24) | Ready independently of design approval; no paid or hosted dependencies |
| 1B | [#22 Intended fonts and visual evidence](https://github.com/nissan/oz-startup-brain/issues/22) | Coordinate renderer ownership with #20; parallel to API work when WIP permits |
| 2 | [#8 Owner design approval](https://github.com/nissan/oz-startup-brain/issues/8), [#9 accessibility sessions](https://github.com/nissan/oz-startup-brain/issues/9) | Distinct evidence; synthetic or automated checks do not grant owner approval or accessibility conformance |
| 3 | [#25 Polished fixture browser journey](https://github.com/nissan/oz-startup-brain/issues/25) | #24, #22, #8; thin Next.js BFF, local fixture API; coordinate vocabulary with #10 |
| 4 | [#26 First synthetic browser round](https://github.com/nissan/oz-startup-brain/issues/26) | #25 plus demonstrated task capabilities, fixtures and runner support |
| 5 | [#27 Fix and retest observed UX findings](https://github.com/nissan/oz-startup-brain/issues/27) | #26 report and actual triaged findings; preserve original observations |
| Parallel, when capacity permits | [#28 Source dispositions](https://github.com/nissan/oz-startup-brain/issues/28) | Metadata/rights audit can proceed offline; owner chooses initial real jurisdiction at exit |
| Next increment | [#10 Shared evidence vocabulary](https://github.com/nissan/oz-startup-brain/issues/10) | Begin API/UI parity with #25 after #24/#8; export parity remains open until implemented |
| Later | [#29 Live foundation and vector baseline epic](https://github.com/nissan/oz-startup-brain/issues/29) | Decompose into Ready child issues first; corpus, spend/provider inputs and fixture feedback precede live release |
| Coordination | [#30 Native Project views](https://github.com/nissan/oz-startup-brain/issues/30) | Authenticated Projects write access; does not block issue-based dispatch |

After the vector baseline, follow [the roadmap](../06-delivery.md): national corpus expansion; measured graph benefit; bounded decision-policy experiments; expanded comparison/export interface; voice/visual experiments; public demonstration; external keys and MCP. The optional ADR002 rules/fake-provider increment can follow #24 independently, but must not block #25 or enlarge #24. Create bounded issues before assigning these stages; an epic is not a builder task.

## Priority and readiness

- P0: critical path for the current outcome or a release-blocking defect.
- P1: next important outcome; take only when dependencies and capacity permit.
- P2: useful follow-up that does not block the current outcome.

Ready means an outcome, scope exclusions, acceptance evidence, dependencies, role and relevant persona/task or API scenario IDs are explicit. Unknown implementation details that require investigation become a bounded spike with a decision artifact. Blocked work stays linked to the blocking issue/input; do not silently lower its acceptance criteria.
