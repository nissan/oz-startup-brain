# Preparation checks

From the repository root:

```sh
python research/synthetic-ux/tools/validate_pack.py
python -m unittest discover -s research/synthetic-ux/tools -p 'test_*.py' -v
```

The validator exits 1 with a rule and affected record/file on failure, for example `FAIL actor-boundary: T01: unexpected/missing fields ['fixture_id']`. Checks also run under `python -O`; they do not depend on assertions. Fix the named input, then rerun. No browser, model call or UX session is performed.

## Review scenario changes

The facilitator-only [review checkpoint](../facilitator/scenario-review.json) records hashes of feature files and each task's `observation_scope`, `observes`, `related` and variant mappings. A normal validation run is read-only and fails if these differ. Entire feature files are hashed deliberately: Background steps, tags and Examples can change scenario meaning. A change to any feature file conservatively requires review of mappings for that file, including context-only references; it may also require updating tasks with no observed scenario.

When validation reports `scenario-review`:

1. Inspect the feature-file and facilitator task diffs against the last reviewed commit. Read changed scenarios in full, including Background and Examples. Identify every parent task and variant that references them in `observes` or `related`.
2. Check what the task's surface can actually demonstrate. Keep UI subsets separate from backend, retention, budget, security and full-scenario claims. Update mappings, scope prose and fixture guidance where needed; do not expand coverage merely to make a check pass.
3. Once the review is complete, explicitly record its rationale:

   ```sh
   python research/synthetic-ux/tools/validate_pack.py --record-scenario-review "Reviewed SCxx change against Txx: describe the boundary retained or corrected"
   ```

4. Commit the checkpoint with the feature/scope changes. Include the rationale in the PR for another reviewer to assess, then run normal validation and regression tests.

The initial checkpoint was recorded by Codex after reviewing all 16 task mappings against the feature definitions. It is an agent review record, not human approval. A hash detects changed inputs, not semantic correctness: the explicit record command can accept incorrect prose if its operator skips review. It must never run automatically as a fix in CI. Existing ID, variant and actor-boundary checks still run before a checkpoint can be recorded. Neither checkpoint freshness nor passing tests demonstrates any UX outcome.
