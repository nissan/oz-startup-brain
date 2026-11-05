# ADR 002: Bounded decision models within the existing workflow

Status: **owner-approved direction; implementation and measured benefit pending**. Recorded 5 November 2026 following the owner's acceptance of the decision-layer recommendation. This authorises documentation and a staged experiment, not live spend, automatic activation or deployed API changes. Read [architecture](../03-architecture.md), [evaluation protocol](../evaluation/decision-models.md) and [acceptance scenarios](../../evaluation/decisions/decision-routing.feature) together.

## Decision and first scope

Add a provider-independent `DecisionProvider` beside the generation and embedding interfaces. NestJS owns configuration, credentials, admission and accounting; a bounded LangGraph node consumes the adapter. Keep ordinary code responsible for which transitions are permitted. TypeSafe Jev and OpenAI Decisions are experiment candidates, not selected production dependencies. "System One" describes the bounded-decision use case; it is not a guarantee of speed, calibration or correctness on our data.

The first task is **`task_intent.v1`**, classifying the founder's requested operation. This is distinct from classifying the founder's legal/regulatory status. No decision model determines eligibility, permission to operate, factual truth, source rights or graph-edge approval.

| Choice | Operational meaning | Application mapping |
| --- | --- | --- |
| `lookup` | Ask for a fact, explanation or next support step without an explicit comparison or prerequisite request | Existing passage-based route |
| `comparison` | Explicitly compare named options or ask for common comparison criteria | Existing comparison output; retrieve passages under normal filters |
| `prerequisite` | Explicitly ask what must precede a milestone or how dependencies are sequenced | Existing bounded graph expansion if available; otherwise labelled passage fallback (SC17) |
| `unclear` | The requested operation is ambiguous, mixed without a clear primary request, or not covered by this vocabulary | Generic passage route with the existing clarification/evidence checks; no automatic factual refusal or extra clarification |

Examples: "Where should I begin?" → lookup; "Compare A with B" → comparison; "What must happen before applying to A?" → prerequisite; "Compare A and B, and map all dependencies" → unclear unless the user explicitly selects a primary operation. Label adjudication records genuinely ambiguous cases as unclear. Intent is independent of answerability: a clear lookup with insufficient evidence is still a lookup, followed by the existing insufficient-evidence handling.

A validated explicit starter-task selection takes precedence and skips paid classification. Specify an optional `task_intent` request field with only `lookup`, `comparison` or `prerequisite`; omitted means classify, invalid values return 400. Existing callers that omit it remain compatible. UI starter tasks map to these values through the generated API client; no new endpoint or response status is added. Map UI/API task selections through the server allowlist; free text claiming to be a system override is not an explicit selection. Missing jurisdiction does not by itself make intent unclear. Confirmed context, including deliberate Unknown, cannot be inferred or overwritten by a decision result. The existing missing-field logic still determines whether one clarification is necessary; it must retain SC22 behavior.

### Starter-task contract

| Selected UI task | Explicit `task_intent` |
| --- | --- |
| Find my next step | `lookup` |
| Compare options | `comparison` |
| Check a prerequisite | `prerequisite` |
| No selected task (text input alone) | Omit the field; run classification |

The generated client and BFF use this table; labels inside free text do not set the field. A new starter task requires an explicit contract decision. API15 covers exact string values, omission and rejection of invalid/non-string JSON values without coercion.

## Internal contract to implement

Put schemas and versioned types in `packages/contracts/`; put provider adapters and the frozen baseline classifier in `packages/decisions/`. The following TypeScript is a proposed interface, not shipped code or a provider SDK schema:

```ts
type TaskIntent = 'lookup' | 'comparison' | 'prerequisite' | 'unclear';
type DecisionMode = 'off' | 'enabled'; // live server configuration only

type DecisionInput = {
  decisionId: string;             // server-created; links to request and ledger
  task: 'task_intent.v1';
  question: string;               // untrusted input, not instructions
  confirmedContext: Record<string, string | null>; // allowlisted; 'unknown' is explicit, null is missing
  contextSchemaVersion: string;
  inputVersion: string;           // fixture/replay identity, no public private-text hash
};

type DecisionMeta = {
  provider: string;
  modelRequested: string;
  modelReported: string | null;
  adapterVersion: string;
  questionVersion: string;
  latencyMs: number;
  usage: { inputTokens: number | null; outputTokens: number | null };
  usageStatus: 'reported' | 'unknown';
};

type DecisionResult = {
  status: 'ok';
  choice: TaskIntent;
  probabilities: Record<TaskIntent, number> | null;
  providerConfidence: number | null; // separate vendor quantity; not P(choice)
  meta: DecisionMeta;
} | {
  status: 'abstain' | 'refused' | 'unavailable' | 'invalid';
  reasonCode: string;             // closed, documented codes; no raw provider body
  meta: DecisionMeta;
};

interface DecisionProvider {
  decide(input: DecisionInput, signal: AbortSignal): Promise<DecisionResult>;
}
```

The adapter returns a **candidate**, never a workflow command. Maintain a separate internal `DecisionOutcome` with mode, candidate status/choice, selected route, source (`explicit`, `rules`, `candidate`, `fallback`), policy version and fallback code. The node owns the final outcome. Do not add raw provider confidence or decision internals to the founder response; preserve ADR 001's evidence envelope. Privileged internal diagnostics are not a new public endpoint.

Provider capabilities are explicit: supports choice/distribution, maximum input, model pin support and refusal/usage representation. Rules and structured-output LLM baselines may return `probabilities: null`; never fabricate a one-hot distribution or reinterpret self-reported confidence as calibrated probability. Task v1 uses choice only; predicate/score adapters can be introduced later with their own contracts and evaluations.

Validation at the boundary:

- Accept only the four exact choices. If a distribution is supplied, require all four labels exactly once, finite values in [0,1], and sum within 1e-3 of 1; reject malformed results rather than silently renormalising them. Missing/partial distributions are not actionable in enabled decision-model mode.
- Validate the provider's documented choice/confidence semantics in its adapter. Preserve distributions and confidence separately. With a valid raw distribution, an exactly tied top probability means abstention (`tied_top`); otherwise a vendor choice different from its unique raw argmax is `invalid` (`choice_probability_mismatch`), never silently substituted. Any approved calibration transform must preserve the top class in v1; if it changes it, abstain (`calibration_rank_changed`). Retain raw choice/probabilities for permitted evaluation diagnostics.
- An eligible candidate must have a unique top class other than unclear, exceed its validated probability threshold (class-specific or the global fallback) and exceed the policy's top-two margin. Thresholds, margin and any calibration transform belong to a versioned policy following the protocol's validation minimums and fitting rules; the smaller-data global fallback fixes its margin in development and validates the resulting policy without fitting an extra transform. No default 0.8/0.9 threshold is assumed portable between models. Absence of an approved calibration/policy artifact disables candidate routing.
- Pre-call ineligibility skips the provider and its reservation; post-call timeouts, refusals, unexpected versions, invalid/missing distributions, low probability/margin and provider errors fall back to the frozen baseline with settlement. Record the specific reason below. Do not retry or escalate to a reasoning model in this first experiment.

Closed v1 diagnostic codes (extend the schema/version explicitly, never emit raw provider text):

| Phase / result | Allowed codes |
| --- | --- |
| Pre-call skip, no decision reservation | `mode_off`, `explicit_task`, `outside_cohort`, `no_approved_policy`, `input_limit_exceeded`, `no_decision_credential`, `unsupported_configuration`, `insufficient_remaining_time`, `decision_budget_denied` |
| Post-call `abstain` | `low_probability`, `low_margin`, `unclear_choice`, `tied_top`, `calibration_rank_changed` |
| Post-call `refused` | `provider_refusal` |
| Post-call `unavailable` | `provider_timeout`, `provider_error` |
| Post-call `invalid` | `invalid_label`, `invalid_distribution`, `missing_distribution`, `choice_probability_mismatch`, `unexpected_model_version`, `unexpected_answer_shape` |
| Request termination (no fallback work) | `request_cancelled` |

Pre-call skips live in `DecisionOutcome`, not a fictitious paid adapter response. Post-call codes populate `DecisionResult.reasonCode` or the selector outcome as appropriate. Missing distributions are permitted for D0/D1 diagnostics; the enabled D2/D3 selector rejects them. Validate raw shape, then tie/choice consistency, then calibration and eligibility; record the first applicable code. Cancellation takes precedence at every step.

## LangGraph integration and deterministic boundaries

Insert a `classifyTask` node at the current step 2, after authentication, input checks, immutable release resolution and budget admission, and before clarification/retrieval. State gains `decisionOutcome` and the selected policy/configuration version; it does not gain arbitrary executable tool arguments.

1. Resolve server configuration once per request. Browser fields/headers cannot select providers, models, thresholds, shadow mode or policy versions.
2. Honour an explicit valid task selection. Otherwise evaluate the frozen rules baseline: comparison cues only → comparison; prerequisite cues only → prerequisite; both cue families → unclear; neither cue family → lookup. Keep the exact cue definitions and rule version in code and the report. Thus the three single-intent examples above produce their stated labels, and the mixed example produces unclear. Rules can miss implicit or out-of-vocabulary intent; count that as an ordinary baseline error against independently reviewed labels, not a reason to redefine the labels. The baseline's unclear path uses generic passage retrieval and existing clarification/evidence checks, not graph lookup inferred from a low-confidence candidate.
3. `off` uses that baseline with zero decision-provider calls. **Shadow is an offline harness operation, not a live mode**; reject `shadow` as invalid live configuration before serving traffic. Run approved replay as a manually triggered, bounded job in the intended API deployment region under the separate evaluation budget. Record region, transport, network-inclusive timing and cold/warm conditions before any canary. The live path remains off; no founder requests launch background calls or feed the replay. No fire-and-forget work is added to Vercel requests.
4. In `enabled`, first check cohort membership, approved policy, credentials/capabilities, bounded input and remaining time, before attempting a decision monetary reservation. A failed preflight records a skip code, takes no decision reservation, makes no provider call and retains the admitted baseline. If reservation is denied, record `decision_budget_denied` and proceed on the baseline. Otherwise call at most one selected provider. The final selector accepts only a candidate passing the policy above; otherwise it retains the baseline and settles any incurred usage. Retrieving graph evidence still requires known entities and an allowlisted parameterised query with the existing hop/claim/deadline limits.
5. The rest of the workflow is unchanged: deterministic temporal/rights rules, source-ID validation, bounded recovery retrieval and evidence-preserving generation. A model cannot bypass a denied permission, insufficient budget, Unknown context or a missing graph service.

Initial bounds, to implement as server configuration and measure: one decision call, at most 4,000 input tokens including instructions/schema/context, a 1,000 ms decision deadline capped by the remaining application deadline. The end-to-end deadline remains 30 seconds, not 31. Use provider token counting or a conservative documented bound; if input cannot fit, skip classification without silent truncation. Nonretrying SDK settings are required; disable automatic paid retries. Caller cancellation propagates to the decision adapter. A cancelled user request does not start fallback retrieval/generation; provider timeout with a still-live request may continue on the baseline.

These bounds are initial engineering limits, not vendor performance claims. Direct providers and gateways are distinct configurations; measure network time from the deployed region, not only vendor inference time.

## Cost, privacy and operational controls

Reserve decision work under the same verified consumer/global budget and concurrency policy as the rest of the request. Use a distinct idempotent ledger item linked to the parent request for decision usage; include gateway fees and cache charges where relevant. Admission must leave the pre-reserved baseline workflow budget intact. If optional classification cannot be reserved, skip it; if baseline admission fails, return the existing budget/unavailability response without paid work.

A timeout/abort can still incur charges. Unknown decision usage is conservatively settled at its reservation, never freed merely on cancellation, following ADR 001; late usage reconciles at most once. Do not double-count provider and gateway billing records for one call. Offline evaluation/shadow replay uses its own operator-approved evaluation budget, never a founder's allowance. Provider outages must not create a retry storm or a second provider cascade.

Use fictional/redacted, approved replay inputs initially. Do not start logging private founder prompts for shadow evaluation. Any later opt-in real-input collection requires a documented consent, retention and deletion policy before collection. Default operational traces record IDs, versions, timing, coarse result/fallback codes and ledger references, not questions, source text, raw responses or secrets. Dataset access stays separate from the public corpus and held-out answer keys never enter retrieval.

Before a canary sends founder inputs, update the processor inventory and user-facing disclosure for the selected provider and any gateway intermediary, including the applicable retention/region configuration. Fix canary membership server-side: use an experiment-salted deterministic bucket of the verified consumer ID plus the BFF-authenticated session-hint hash for website traffic; external consumers require a server-managed allowlist. Ignore caller-supplied cohort flags and external session hints. Missing website hints remain outside the canary. This is rollout sampling, not identity or authorisation; session resets do not bypass consumer/global spend caps.

## Provider implementation notes

Checked 5 November 2026; recheck access and pin versions before live integration. Provider-specific fields belong inside adapters, not in workflow branching:

- Jev accepts state and typed questions and returns structured choices/distributions. Confirm the deployed model ID, SDK, confidence semantics, input limits and account access using TypeSafe's docs [R23].
- OpenAI Decisions uses `/v1/decisions` with documented model `gpt-6-luna`. The official guide now describes it as generally available, and the changelog records GA on 22 October 2026, following beta; do not preserve a stale beta-only claim. Rechecked 5 November 2026 [R24]. A successful HTTP response can contain an answer with `type: "refusal"`; map that answer to `refused` / `provider_refusal` and settle usage, rather than treating HTTP success as an `ok` choice. Pin/test the current SDK and response schema before live use; GA is not a guarantee against schema changes. Generation keeps its separate interface.
- Vercel AI Gateway also documents a Decisions-compatible endpoint, including Jev and `openai/gpt-6-luna-decisions`. This gateway identifier differs from the direct OpenAI identifier. Gateway use is optional, not required because hosting is Vercel; treat gateway and direct routes as distinct latency/cost/data-processing configurations [R25].

No advertised latency, price or calibration figure is an acceptance result for this application. Type-safe values can still be wrong. The selected provider remains gated by verified account access/credits, the recorded spend cap and the experiment results.

## Delivery order and builder completion criteria

1. In a **subsequent slice 1A increment, in its own PR after 1A-0**, define contracts and fixtures; implement off mode/rules, explicit-task precedence, selector and fake provider responses. This work does not gate or enlarge 1A-0 acceptance. No dependency on a paid SDK, Next.js, hosted store or decision-model availability. Implement DEC01–DEC06, DEC09, DEC11 and API15's standalone contract cases using the local harness; DEC03 uses a fake replay job here, with actual regional timing deferred to Stage 2b.
2. After live foundation and B1/B2 exist, run **Stage 2b: decision experiment**, independently of the graph experiment. Build provider adapters behind injected configuration; validate durable settlement/cancellation (DEC07) and no public overrides (DEC06). Implement the offline harness and report format in the [evaluation protocol](../evaluation/decision-models.md). DEC08 and DEC10 govern rollout and experiment integrity.
3. Collect reviewed labels, evaluate all available alternatives, and document unavailable providers as not run. An unavailable candidate does not block the vector baseline or imply a loss/win.
4. Keep default mode off. Move through offline shadow to a bounded, owner-approved enabled canary only after the preregistered gates pass; record report/policy/versions, cohort size, spend cap and rollback conditions. Any inconclusive result keeps off mode.
5. Add clarification judgments, passage relevance, contradiction flags, entity matching or ontology triage only as separately specified experiments with new task versions, labels and tests. A decision-model judge is also a separate experiment and never its own reference authority. A reasoning-model escalation cascade is deferred.

Builder deliverables: shared schemas; frozen rules; fake provider; diagnostic-only D1 structured-LLM adapter; Jev and OpenAI candidate adapters where accessible; selector and fixtures; ledger/cancellation integration; offline decision dataset/report schemas; reproducible commands; stage-specific acceptance results. D1 without a validated distribution is never an enabled provider. Keep the existing independent judge and Ragas evaluation. Documentation acceptance is not implementation acceptance, and model ranking must not be invented from fixture outputs.
