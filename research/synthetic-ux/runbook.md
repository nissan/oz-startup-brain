# Browser walkthrough runbook

## Prepare a repeatable session

1. Pin the target commit, deployment URL/build identity, interface version, corpus/fixture version and test clock. Verify the deployment corresponds to that commit; if this cannot be verified, record `build_match: unverified` and do not attribute findings to a PR as confirmed regressions.
2. Record the declared release scope and available capabilities. Read the relevant repository instructions. Use the installed browser-control integration and its documented APIs; do not invent selectors, endpoints or controls. No browser session is needed merely to prepare this pack.
3. Map the selected fixture from [the evaluator guide](evaluator-guide.md) to actual setup. Default to local/preview fixtures with paid calls disabled. Failure injection, data resets and configured spend limits are facilitator setup, outside the actor's role. Avoid live-account mutations and third-party form submissions.
4. Use one persona per isolated browser context. Record browser/version, CSS viewport, zoom, input mode, session reset and network settings. A second tab shares storage and is not isolation. If the integration cannot isolate or reset safely, record the limitation and block the affected task. Never clear an unrelated user's browser state.
5. Start from the normal landing page/docs entry, not a hidden deep link. Each task starts clean unless its recorded setup explicitly seeds a prior answer. Present the profile and initial brief only; reveal `follow_up` after the initial attempt. The actor must not see expected paths, source code, old findings or the evaluator's answer key before its first attempt.

If a single agent serves as actor and evaluator, explicitly label it a **primed inspection** once it has seen the oracle. Do not claim independence. Separate roles are an optional execution arrangement, not permission to spawn agents automatically.

## Run and collect evidence

- Let the actor choose visible controls according to the profile's knowledge and preferences. After each meaningful action, capture the observed state and rationale briefly. Do not script clicks toward an assumed perfect path.
- On first failure, allow one sensible visible recovery attempt. After two unsuccessful attempts at the same action or three unproductive navigation loops, record the obstruction and stop that attempt. This is a reproducibility bound, not a model of human patience. A facilitator hint starts a separately labelled assisted attempt.
- Use a default safety ceiling of 25 meaningful UI actions per task variant. Setup and evidence capture do not count. If exceeded, record the limit and unfinished outcome rather than calling it a product failure automatically.
- Capture the initial state, key context change, evidence panel, terminal state and every reproducible error. Record actual elapsed tool/wall-clock time only if measured and useful; it includes automation overhead and is never human time-on-task.
- For keyboard tasks, operate keys. Do not use DOM clicks or programmatic state changes to rescue an unreachable control. Accessibility snapshots may explain a failure afterwards. Zoom, mobile emulation and real-device testing are distinct conditions.
- For speech, use an explicitly prepared synthetic audio/transcript fixture and record whether recognition or only its UI was exercised. If the tool cannot play/record audio, mark those parts unverified. Never fabricate heard speech or a successful microphone test.
- For images, use the authored synthetic drawing specified by F08. Upload only to the authorised test app. A rendered preview alone cannot prove that unconfirmed extraction was excluded from backend decisions.
- Record only synthetic data and redacted evidence. Never copy credentials, authenticated URLs or actual personal data into screenshots, logs, PRs or the public repository. If an unexpected disclosure occurs, stop that path and preserve a redacted reproduction record.
- At the end ask the actor to explain its next action and uncertainty using only what it saw. Store this under hypothetical interpretation, separate from the observed trace. A fluent explanation does not validate the underlying source claim.

## Record one run

Create a new immutable folder such as `research/synthetic-ux/runs/<YYYY-MM-DD>-<commit8>-r1/` when a run actually happens. Do not prepopulate results with expected successes. Suggested files:

- `manifest.json`: metadata and capability/fixture setup.
- `sessions/<persona>-<task>-<variant>.md`: copy of [session.md](templates/session.md).
- `traces.jsonl`: observed actions and state changes, one record per meaningful action.
- `findings.csv`: deduplicated findings tied to evidence and task variants.
- `summary.md`: coverage, unresolved issues, proposed changes and limits.
- `evidence/`: redacted screenshots/download inspections with stable names.

Manifest template (null means unknown/not yet recorded):

```json
{
  "run_id": null,
  "status": "not_run",
  "synthetic": true,
  "pack_version": "0.1",
  "pack_commit": null,
  "target_commit": null,
  "deployment_url": null,
  "build_match": "unverified",
  "build_identity_evidence": null,
  "interface_mode": null,
  "declared_release_scope": [],
  "available_capabilities": [],
  "fixture_mapping": {},
  "corpus_version": null,
  "as_of": null,
  "started_at": null,
  "timezone": null,
  "browser_and_version": null,
  "viewport_css_px": null,
  "zoom_percent": null,
  "input_mode": null,
  "isolation_method": null,
  "network_profile": null,
  "runner_model": null,
  "runner_version": null,
  "sampling_configuration": null,
  "prompt_version": null,
  "primed_inspection": null,
  "paid_calls_enabled": false,
  "tool_limitations": [],
  "task_variants": []
}
```

Trace record fields: `run_id`, `persona_id`, `task_id`, `variant_id`, `step`, `observed_at`, `url_redacted`, `visible_state_before`, `action`, `visible_state_after`, `evidence_refs`, `assistance`, `evidence_class`. Include the visible target label and actual action; an invented action is not a trace. For artifact/API companion checks use the corresponding evidence class and a separate trace, not a browser label.

Findings CSV header:

```csv
finding_id,persona_ids,task_ids,variant_ids,severity,evidence_class,observed,expected,evidence_refs,repro_steps,proposed_change,acceptance_check,owner,status,first_seen_commit,retest_commit,retest_result
```

Quote CSV cells with commas/newlines using a CSV writer. Use finding states `open`, `accepted_for_fix`, `deferred_with_reason`, `fixed_pending_retest`, `verified_fixed`, `not_reproduced`. Duplicate observations share one finding ID while preserving the affected personas and traces.

## Review and regression loop

Summarise planned, attempted, completed, assisted, failed, environment-blocked and deferred variants with explicit denominators. Keep design inspections separate from executed variants. Do not pool browser, artifact and API completion or report fictional personas as participants. No satisfaction/retention/adoption percentage is justified by this exercise.

Before changes, finish the current run and preserve its artifacts. Propose the smallest fixes with acceptance checks. After a reviewable change, rerun the failing variants and adjacent core text/evidence/correction paths on the new pinned build. Keep fixture version, task wording, viewport, input method and runner settings constant where possible; record every difference. Repeated stochastic runs provide repeated observations, not independent human samples.

Only mark `verified_fixed` after reproduction on the revised build. A source fix without a browser retest is `fixed_pending_retest`. Keep the original finding and add links to new evidence. Compare first-pass discovery and assisted completion separately; later attempts are exposed to the interface.

End each round with: what changed, what was observed, what remains uncertain, the next human-validation questions and the next proposed work. Recommend a bounded iteration or human study; do not automatically merge, deploy, create issues or message people as part of testing. Publishing a findings PR should be explicitly requested for that run.
