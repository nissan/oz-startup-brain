# Decision-model experiment protocol

Implements the evaluation direction in [ADR 002](../decisions/002-decision-models.md). Status: specification only; no labelled benchmark, provider calls, calibrated thresholds or measured winner yet. This supplements [RAG evaluation](../05-evaluation.md), which continues to hold the model fixed when comparing B0–B4.

## Question, alternatives and controls

Question: can a bounded task-intent decision improve routing quality or reduce total workflow cost/latency without degrading evidence-backed answers? First evaluate `task_intent.v1` only. Clarification selection, document scoring, graph-edge judgments and LLM-as-judge replacement are outside this experiment.

| Arm | Decision mechanism | Purpose |
| --- | --- | --- |
| D0 | Explicit selection wins; otherwise comparison-only cues → comparison, prerequisite-only cues → prerequisite, both → unclear, neither → lookup | Credential-free baseline and operational fallback; freeze exact cue definitions and rules version |
| D1 | Small generative LLM with schema-constrained choice | Measure whether a dedicated decision API adds value over ordinary structured generation |
| D2 | Version-pinned Jev choice adapter | System One candidate |
| D3 | Version-pinned OpenAI Decisions choice adapter | Decision API candidate |

Run available arms on identical permitted inputs. If model snapshots are unavailable, record requested/reported identifiers, execution time and provider version limitations; do not claim exact future reproducibility. Do not convert an inaccessible arm to a failing score. Freeze wording/choice definitions after development; adapters may translate SDK syntax but cannot supply different factual context or coaching. Record model-specific prompts and their development budget. D1 uses a fixed label-only schema, no reasoning trace, no extra tools and no second attempt; record its generation settings.

Use two complementary evaluations:

- **Component replay:** each arm classifies the same frozen question/context/explicit-selection state without retrieval or answer generation. Score raw classification and abstention/selection policy separately. Explicit selections bypass every model; count them separately rather than letting easy bypasses inflate model accuracy.
- **Paired end-to-end replay:** freeze corpus, answer generator/settings, evidence budget, retrieval configuration, graph availability and all non-decision prompts. Vary only the intent mechanism/policy; downstream retrieval may change as a consequence of its selected route. That change is the effect being measured. Keep graph off initially to isolate B2; after Stage 3, repeat a separately reported fixed-graph configuration. Never attribute a simultaneous B2→B3 change to the decision model.

Report raw-choice end-to-end replays separately from threshold-policy replays. Raw-choice experiments are offline diagnostics only, not permitted production policies. D1 without a probability distribution can contribute a raw-choice comparison, but its final guarded policy falls back; disclose that coverage rather than manufacturing confidence. D0 remains the deployable baseline. Compare D2/D3 against both D0 and D1, disclosing if they beat a model baseline but not inexpensive rules. Do not compare a cached candidate against an uncached baseline without separate reporting. Randomise run order; report cold/warm runs, request concurrency, retries (should be zero), timeouts and gateway/direct configuration. Use repeated paired runs where generation nondeterminism matters, clustering uncertainty by original intent group rather than treating repeats as new questions.

## Dataset and label schema

Start with **200 reviewed decision cases as an exploratory pilot**: 100 development, 50 validation, 50 frozen test. This pilot is not the activation sample, nor is the separate 60-question answer benchmark. They may share inputs only with original cluster/split boundaries preserved; no held-out answer case may be used for decision tuning. Retain the proposed 2-percentage-point non-inferiority margin and plan a larger, separately frozen paired end-to-end set using the power procedure below. Do not widen the margin to make a small pilot pass. If review capacity or the approved evaluation budget cannot support the plan, publish exploratory results and keep routing off.

Cover ordinary lookup/comparison/prerequisite requests, mixed intent, explicit starter-task selection, Unknown/missing context, regional terminology, paraphrases, irrelevant requests, misleading embedded instructions and provider failure fixtures. Keep operational faults separate from semantic accuracy denominators. Balance diagnostic classes, but also report a deployment-weighted view if an independently measured traffic mix exists; never invent those weights.

Split by intent/conversation group and keep paraphrases together; hold out program/source families and a later time slice where feasible. Prefer independently human-labelled intent. Use two reviewers for ambiguous or high-consequence cases and adjudicate differences. Model-generated seeds are permitted as disclosed synthetic inputs after human label review, not as gold labels. Neither candidate nor the answer judge may set the labels.

Required case fields (to become a shared JSON Schema under `packages/contracts/`):

```json
{
  "case_id": "decision-example-001",
  "schema_version": "decision-case.v1",
  "task": "task_intent.v1",
  "question": "Which steps must come before applying to Fictional Program A?",
  "confirmed_context": {"jurisdiction": "unknown"},
  "explicit_task": null,
  "expected_intent": "prerequisite",
  "selection_source_expected": "classifier",
  "split": "development",
  "split_group": "fictional-prerequisite-family-a",
  "origin": "authored_synthetic",
  "persona_ids": ["P2"],
  "risk_class": "ordinary",
  "label_status": "unreviewed",
  "reviewers": [],
  "adjudication_note": null,
  "source_family": "fictional-program-a",
  "as_of": "2026-11-05T00:00:00Z"
}
```

This is a schema example, not a reviewed benchmark record. `expected_intent` is a label proposal until `label_status=reviewed`; required reviewer identifiers/review timestamps must then be supplied. Real names are unnecessary. For explicit selections, record `selection_source_expected=explicit`; for an unclear model candidate, raw expected intent and the eventual baseline-selected route are separate labels. Link end-to-end cases to the existing approved, dated answer references using `answer_question_id`; no invented reference answers are added by this experiment.

## Scores and uncertainty

| Dimension | Required report |
| --- | --- |
| Classification | Confusion matrix, macro-F1, per-class precision/recall and denominators; raw errors versus final-policy errors separately |
| Cost of mistakes | Count and weighted cost of consequential misroutes, missed prerequisites and unnecessary clarifications; publish the error-cost matrix before tuning |
| Selective prediction | Accepted-candidate coverage, error rate among accepted decisions, unclear/refusal rate, fallback rate and risk-versus-coverage curve; no passing by abstaining everywhere |
| Calibration | Multiclass Brier score (sum of squared class errors per case), log loss with documented numerical clipping, reliability diagram and expected calibration error with binning/counts; show raw and calibrated probabilities separately |
| End-to-end answer | Existing dated factual/citation checks, abstention and clarification usefulness, Ragas and independent blinded judge protocol; retain critical-claim veto |
| Performance | Decision and total-workflow p50/p95, input/output/cache usage, billed cost per request and per successfully completed supported answer, error/timeout/fallback frequency; paid classifications followed only by clarification, with their cost |
| Robustness | Per-persona, regional, ambiguity, Unknown, multi-intent and input-attack slices; explicit-selection, cancellation and injected-failure contract results |

No comparable probability metric for D0/D1 unless they actually provide validated probability distributions. A parsed label or verbal confidence is not a probability estimate. `providerConfidence` may mean something different from selected-class probability; do not pool it across vendors or use it as an evidence-quality badge. For calibration bins with few examples, show counts and uncertainty rather than smooth-looking confidence claims.

Fit calibration transforms, acceptance thresholds and any tunable top-two margin on validation data only, using preregistered error costs and a coverage constraint. Freeze candidate grids and the selection procedure in development. Require at least **100 independent validation groups overall** for an activation policy. Per-class thresholds additionally require at least **50 reviewed positive and 50 negative groups for each class**; otherwise fit just one global threshold with identity calibration and a single top-two margin fixed during development, not four fitted thresholds and an extra fitted transform. The pilot's 50 validation cases support exploratory diagnostics only. A fitted calibration transform requires its own disjoint fitting/tuning subsets meeting the same minimums, or a preregistered group-aware cross-fitting procedure; document effective counts. These are conservative project minimums, not proof of calibration. Record raw and transformed probabilities, including `choice_probability_mismatch` and rank-change counts. Freeze the selected policy before one final held-out evaluation; a failed test requires a new version and a new held-out assessment, not retuning on test labels.

### Sample-size plan for activation

Use candidate-minus-D0 supported-answer success on paired, independently reviewed cases as the primary quality endpoint. For a planning approximation, let `d` be the probability that the two arms disagree on binary success and assume true mean difference zero. Then the paired difference variance is `d`, and `n ≈ (1.96 + 0.842)^2 × d / 0.02^2` gives roughly 80% power for the lower end of a two-sided 95% interval to exceed −0.02. At an **assumed, not measured** discordance of 0.10 this is approximately 1,963 independent pairs; round the initial planning target to **2,000 eligible independent groups**. At 0.20 it is approximately 3,926. Repeats and paraphrases do not increase the independent count. Neither calculation is an achieved power claim or permission to spend.

Before collecting the confirmatory set, estimate discordance from development/pilot data only; record the assumed difference, discordance, exclusions and cluster design effect. Recompute the required count, inflate for clustering/exclusions, and verify power/coverage by simulation with the chosen paired interval method. Preregister the method, code version, seed, expected eligible groups and resulting power in the manifest. Use a paired multinomial score interval for independent binary pairs, or a preregistered cluster-aware method when necessary; validate handling of zero/rare discordance rather than accepting a degenerate bootstrap interval as certainty. Paired group-aware bootstrap intervals remain suitable for other quality/cost summaries where their assumptions hold; use exact/binomial intervals where suitable for rare critical events. Zero observed critical errors does not establish zero population risk.

Select one confirmatory candidate on development/validation data before opening the test, or preregister multiplicity control and recalculate sample size for multiple promotion claims. Add approved dated answer references for the larger set; the existing 60-question benchmark cannot stand in for it. Freeze the planned sample size and stopping rule before test outcomes; do not repeatedly add cases until an interval passes. Any necessary redesign after seeing test outcomes requires a new manifest and held-out set. The [manifest template](../../evaluation/decisions/experiment-manifest.template.json) records the planning assumptions and deliberately leaves actual counts, interval implementation, approval and budget unset.

## Rollout gates and decisions

Before paid evaluation, write an experiment manifest with the actual currency-specific cap, provider access, minimum useful coverage, allowable quality loss, required benefit and timeout/error bounds. The following are **proposed initial gate values**, to be confirmed in that manifest before viewing validation/test results, not achieved guarantees:

- All deterministic decision-boundary scenarios for the delivered slice pass; no observed critical fabricated eligibility/permission claim, override of confirmed Unknown, authorisation bypass or accounting defect.
- On the held-out paired answer set, the 95% lower confidence bound for candidate-minus-D0 supported-answer success is at least −2 percentage points. Existing citation/date/factual gates still apply. If sample size cannot establish this, remain off and report inconclusive.
- At least 50% of model-eligible questions accept a candidate without fallback; report per-class coverage. Explicit selections are excluded from this denominator.
- Against the incumbent being replaced, achieve either a preregistered ≥20% reduction in **total** billed workflow cost without >5% total p95 latency regression, or ≥15% lower total p95 latency without >5% total cost regression. Confirm benefit with uncertainty intervals and repeated representative runs; decision-call speed alone cannot satisfy this gate. If D0 is cheaper/faster and quality is not meaningfully better, retain D0.
- If the goal is instead better quality at added cost, preregister a separate quality-improvement margin and explicit extra-cost/latency allowance before experimentation. Do not change objectives after seeing which arm wins.

Sequence: credential-free fixtures → reviewed offline component/end-to-end replay → **manually triggered shadow replay job in the intended API deployment region**, under the evaluation budget, measuring network-inclusive latency and disagreement while live mode stays off → bounded enabled canary. The regional job runs before activation, with the same direct/gateway transport and representative cold/warm/concurrency settings; record any runtime mismatch. Its p95 evidence is required for the preregistered latency gate, not first discovered on founder traffic. Shadow is a harness operation; live configuration accepts only off/enabled. An owner approval record must name the experiment report, policy digest, exact configuration, canary cap/cohort/duration and rollback thresholds. Update the processor inventory/disclosure before sending founder inputs, and use ADR 002's server-resolved cohort buckets/allowlist. Default remains off. No automatic transition based solely on a dashboard score.

In canary operation, any confirmed critical boundary violation triggers immediate off mode; sustained provider errors/timeouts or excess cost/latency trigger the preregistered rollback. Off mode performs no decision call and preserves the baseline route. Cancellation still stops the request. Report canary findings separately from offline results and from human UX outcomes.

## Artifacts and reproducibility

The builder adds `evaluation/decisions/` harness commands plus shared case, policy and report schemas. Use `evaluation/decisions/fixtures/` for credential-free fictional contract inputs and `evaluation/private/decisions/` for approved restricted datasets; keep generated results in ignored `evaluation/runs/decisions/`. Commit only redacted report summaries and permitted manifests, never keys or raw private prompts. Pin commit, corpus, split hashes, policy/calibration, label review version, providers/models/SDKs, question/adapter versions, generator, retrieval settings, deployment region, transport, timestamps, seeds where supported and all cost assumptions.

Each result row records case/arm/run IDs, raw decision, available probability vector, selected route/source, fallback code, policy version, latency, usage and linked settlement/answer-quality result. Missing usage is unknown, not zero. Publish total experiment cost including shadow and judge calls, not only the eventual winning arm. Unavailable providers, operational failures, missing references and skipped cases have explicit statuses and denominators.

Ragas and LLM judges remain independently configured under the existing protocol. A decision-model judge would need its own human calibration and blinded comparison; it is not substituted here. No current fixture, synthetic persona session or benchmark plan constitutes measured model quality.
