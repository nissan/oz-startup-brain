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
