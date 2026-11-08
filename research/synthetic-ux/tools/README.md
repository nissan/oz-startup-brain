# Preparation checks

From the repository root:

```sh
python research/synthetic-ux/tools/validate_pack.py
python -m unittest discover -s research/synthetic-ux/tools -p 'test_*.py' -v
```

The validator exits 1 with a rule and affected record/file on failure, for example `FAIL actor-boundary: T01: unexpected/missing fields ['fixture_id']`. Checks also run under `python -O`; they do not depend on assertions. Fix the named input, then rerun. No browser, model call or UX session is performed.

## Review scenario changes

The facilitator-only [review checkpoint](../facilitator/scenario-review.json) records hashes of feature files and each task's `observation_scope`, `observes`, `related` and variant mappings. A normal validation run is read-only and fails if these differ. Entire feature files are hashed deliberately: Background steps, tags and Examples can change scenario meaning. The hash is taken over a normalised form that drops only what Gherkin itself ignores, and only outside docstrings — trailing whitespace on a line, `#` comment lines, and runs of blank lines (collapsed to one) — so a formatting-only touch does not demand a recorded review. Everything else is hashed byte for byte: indentation, tags, steps, table cells and their inner spacing, and the whole of every docstring (`"""` or ``` delimited, with or without a content type), whose `#` lines, blank lines and trailing whitespace are payload, not formatting. Any other change to a feature file conservatively requires review of mappings for that file, including context-only references; it may also require updating tasks with no observed scenario.

When validation reports `scenario-review`:

1. Inspect the feature-file and facilitator task diffs against the last reviewed commit. Read changed scenarios in full, including Background and Examples. Identify every parent task and variant that references them in `observes` or `related`.
2. Check what the task's surface can actually demonstrate. Keep UI subsets separate from backend, retention, budget, security and full-scenario claims. Update mappings, scope prose and fixture guidance where needed; do not expand coverage merely to make a check pass.
3. Once the review is complete, explicitly record its rationale:

   ```sh
   python research/synthetic-ux/tools/validate_pack.py --record-scenario-review "Reviewed SCxx change against Txx: describe the boundary retained or corrected"
   ```

4. Commit the checkpoint with the feature/scope changes. Include the rationale in the PR for another reviewer to assess, then run normal validation and regression tests.

`.github/workflows/checks.yml` runs the validator and these tests on every pull request and on pushes to `main`. CI never runs `--record-scenario-review`: a `scenario-review` failure there is a review task for a person, not something to fix in the workflow. A green run establishes no UX outcome, no hosted-artifact behaviour and no owner approval.

The initial checkpoint was recorded by Codex after reviewing all 16 task mappings against the feature definitions. It is an agent review record, not human approval. A hash detects changed inputs, not semantic correctness: the explicit record command can accept incorrect prose if its operator skips review. It must never run automatically as a fix in CI. Existing ID, variant and actor-boundary checks still run before a checkpoint can be recorded. Neither checkpoint freshness nor passing tests demonstrates any UX outcome.

## Same-page API phase controller (#42)

[`phase-controller/`](phase-controller/README.md) is the facilitator-only procedure for T14/T15 healthy → named fault → recovery on one mounted page. It restarts only the fixture API, with the same port and key, under the existing guarded harness settings, and is driven through a private Unix socket. `test_phase_controller.py` runs here with the other tests; its browser check runs only with `OZSB_PHASE_BROWSER=1` and a build.
