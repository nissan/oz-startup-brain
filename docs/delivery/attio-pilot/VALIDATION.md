# Preparation validation

9 November 2026, Codex run `codex-attio-pilot-20261109`. Builder-run checks in the authoring context; no independent review, external session execution or product improvement is claimed.

- Python 3.12.14, Git 2.51.1. The tool uses standard-library modules and adds no runtime dependency or package/lockfile edit.
- `python -m unittest discover -s docs/delivery/attio-pilot -p 'test_*.py' -v`: **14 tests pass**.
- The same suite under `python -O`: **14 tests pass**, confirming validations do not depend on assertions.
- Negative cases cover invalid paths/ref arguments, the excluded synthetic-actor role, wrong tested head, impossible command pass bookkeeping, duplicate checks, missing visual rationale and the unfilled template. A structurally valid unrun check remains visibly unrun. A temporary real Git repository verifies rename old/new paths, deletion and spaces.
- The initial boundary test incorrectly expected `apps/web-other/x` to match no lesson. The general `apps` lesson correctly applies; the test was corrected to require that the narrower UI lesson does not apply. No selector behavior was weakened.
- Planned #10 paths selected OSB-001/002/003/004/005/006.
- The actual #76 diff from `f81b2d71c29bea725970e8988384d124d4f5ed57` to `fda0911b910a2a40f394d36e6c2e4fea1487f2e1` selected OSB-001/002/003/005/006. Its workflow and handoff-document paths were flagged for manual context review. This is context-selection validation, not a new review or verification of #76.
- Existing `python research/synthetic-ux/tools/validate_pack.py` and `python design/tools/tokens_css.py --check`: pass. No scenario checkpoint was modified and no UX session was run.
- Application/contract files, dependencies, required CI and generated assets are unchanged. Application/browser/design-renderer suites were not run locally for this isolated tooling proposal; any PR CI results are separate, head-specific evidence.

Remaining: Claude review of this proposal, actual use by the three existing sessions, and three prospective task records. The template is intentionally invalid until real identity fields are filled. Tool validation does not verify cited artifacts, independently attest observations, enforce capabilities or make acceptance/merge decisions. Frontend visual gate: not applicable to this documentation/CLI-only change.

## Claude review fixes — 9 November 2026 (AEDT)

Run `codex-pilot-review-fixes-20261109`, continuing builder/integration context,
not independent review. Review baseline: `32960bc7903871a7399f713040473743d57dfeab`.
The final published/tested commit is recorded in PR #77's exact-head handoff.

Accepted F1–F5: open work requires remaining items; unknown top-level keys are
rejected; performed visuals need references; diff selection uses and reports the
unique merge base; loaded-catalog IDs are checked and digest equality reported.
F6 adds explicit visual/open-item/notice output; exit 0 remains structural-only,
with this contract documented. F7 is resolved by documenting the manual workflow/
process coverage gap, without inventing an untested new lesson. F8 now scopes GO
to the unchanged reviewed head. F9 adds dated maintenance triggers to the two
assignment/scope-specific lessons. F10 adds missing exit-code cases, uses the
current interpreter and removes the fixed lesson-count assertion.

CP1 removes document-conferred authority. CP2 clarifies explicit named handoffs
and changed-head re-reviews; the coordinator's current claim on PR #77 records
that decision within existing authority, not a universal future review dispatch.
CP3 makes the optional expanded checkpoint a superset of the canonical workflow
handoff, preserving that template's authority.

Actual preparation checks (Python 3.12.14 / Git 2.51.1):

- 21 unique unit cases pass normally and under `python3 -O`.
- F1/F2/F3 counterexamples were accepted by the reviewed 32960bc implementation
  and rejected by this revision. A real divergent Git graph reproduces F4: the
  old selector includes the base-only file, the corrected one selects only the
  feature file. Temporary Git fixtures are removed by their context manager.
- Persona-pack validator and token consistency pass; no research session runs.
- Local Markdown targets, code fences and whitespace checks pass.
- The corrected #78 draft at `ca8c6961fa0c70df27282bbdd19726f6540a5f21`
  is structurally valid with open items and pending visual status. Its old
  catalog digest is reported as different; it is not relabelled as adopted or
  accepted evidence. No #78 files are modified by this pilot fix.

No application, dependencies, lockfile or required CI changes; product visual
inspection is not applicable to this CLI/documentation delta. No Mac checks,
independent re-review, trial productivity gains or prospective build claimed.
