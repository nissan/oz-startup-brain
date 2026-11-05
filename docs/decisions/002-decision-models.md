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
| `unclear` | The requested operation is ambiguous, mixed without a clear primary request, or not covered by this vocabulary | Existing baseline classification/recovery policy; no automatic factual refusal or extra clarification |

Examples: "Where should I begin?" → lookup; "Compare A with B" → comparison; "What must happen before applying to A?" → prerequisite; "Compare A and B, and map all dependencies" → unclear unless the user explicitly selects a primary operation. Label adjudication records genuinely ambiguous cases as unclear. Intent is independent of answerability: a clear lookup with insufficient evidence is still a lookup, followed by the existing insufficient-evidence handling.

A validated explicit starter-task selection takes precedence and skips paid classification. Specify an optional `task_intent` request field with only `lookup`, `comparison` or `prerequisite`; omitted means classify, invalid values return 400. Existing callers that omit it remain compatible. UI starter tasks map to these values through the generated API client; no new endpoint or response status is added. Map UI/API task selections through the server allowlist; free text claiming to be a system override is not an explicit selection. Missing jurisdiction does not by itself make intent unclear. Confirmed context, including deliberate Unknown, cannot be inferred or overwritten by a decision result. The existing missing-field logic still determines whether one clarification is necessary; it must retain SC22 behavior.

## Internal contract to implement

Put schemas and versioned types in `packages/contracts/`; put provider adapters and the frozen baseline classifier in `packages/decisions/`. The following TypeScript is a proposed interface, not shipped code or a provider SDK schema:

```ts
type TaskIntent = 'lookup' | 'comparison' | 'prerequisite' | 'unclear';
type DecisionMode = 'off' | 'shadow' | 'enabled';

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
- Validate the provider's documented choice/confidence semantics in its adapter. Preserve distributions and confidence separately; record any tie-handling transformation. Our selector uses the largest class probability, with a tie treated as abstention. The vendor's choice is retained for diagnosis rather than silently substituted.
- An eligible candidate must have a unique top class other than unclear, exceed that class's validated probability threshold and exceed a validated top-two margin. All thresholds and any calibration transform belong to a versioned policy fitted on validation data. No default 0.8/0.9 threshold is assumed portable between models. Absence of an approved calibration/policy artifact disables candidate routing.
- Timeouts, refusals, unknown versions, input-limit excess, invalid responses, uncalibrated/missing distributions, low confidence and provider errors fall back to the frozen baseline. Record the specific reason. Do not retry or escalate to a reasoning model in this first experiment.

## LangGraph integration and deterministic boundaries

Insert a `classifyTask` node at the current step 2, after authentication, input checks, immutable release resolution and budget admission, and before clarification/retrieval. State gains `decisionOutcome` and the selected policy/configuration version; it does not gain arbitrary executable tool arguments.

1. Resolve server configuration once per request. Browser fields/headers cannot select providers, models, thresholds, shadow mode or policy versions.
2. Honour an explicit valid task selection. Otherwise evaluate the frozen rules baseline; explicit selection wins; otherwise select prerequisite, comparison or lookup only when a single cue family applies, with unclear for mixed/no recognized cues. Keep the exact rule version in code and the report. The baseline's unclear path uses generic passage retrieval and existing clarification/evidence checks, not graph lookup inferred from a low-confidence candidate.
3. `off` uses that baseline with zero decision-provider calls. `shadow` initially means **offline replay only**: the live path remains off; the harness evaluates the same bounded inputs and records candidate-vs-baseline differences without applying candidate routes. No fire-and-forget work is added to Vercel requests.
4. In `enabled`, call at most one selected provider, if admitted. The final selector accepts only a candidate passing the policy above; otherwise it retains the baseline. Retrieving graph evidence still requires known entities and an allowlisted parameterised query with the existing hop/claim/deadline limits.
5. The rest of the workflow is unchanged: deterministic temporal/rights rules, source-ID validation, bounded recovery retrieval and evidence-preserving generation. A model cannot bypass a denied permission, insufficient budget, Unknown context or a missing graph service.

Initial bounds, to implement as server configuration and measure: one decision call, at most 4,000 input tokens including instructions/schema/context, a 1,000 ms decision deadline capped by the remaining application deadline. The end-to-end deadline remains 30 seconds, not 31. Use provider token counting or a conservative documented bound; if input cannot fit, skip classification without silent truncation. Nonretrying SDK settings are required; disable automatic paid retries. Caller cancellation propagates to the decision adapter. A cancelled user request does not start fallback retrieval/generation; provider timeout with a still-live request may continue on the baseline.

These bounds are initial engineering limits, not vendor performance claims. Direct providers and gateways are distinct configurations; measure network time from the deployed region, not only vendor inference time.

## Cost, privacy and operational controls

Reserve decision work under the same verified consumer/global budget and concurrency policy as the rest of the request. Use a distinct idempotent ledger item linked to the parent request for decision usage; include gateway fees and cache charges where relevant. Admission must leave the pre-reserved baseline workflow budget intact. If optional classification cannot be reserved, skip it; if baseline admission fails, return the existing budget/unavailability response without paid work.

A timeout/abort can still incur charges. Unknown decision usage is conservatively settled at its reservation, never freed merely on cancellation, following ADR 001; late usage reconciles at most once. Do not double-count provider and gateway billing records for one call. Offline evaluation/shadow replay uses its own operator-approved evaluation budget, never a founder's allowance. Provider outages must not create a retry storm or a second provider cascade.

Use fictional/redacted, approved replay inputs initially. Do not start logging private founder prompts for shadow evaluation. Any later opt-in real-input collection requires a documented consent, retention and deletion policy before collection. Default operational traces record IDs, versions, timing, coarse result/fallback codes and ledger references, not questions, source text, raw responses or secrets. Dataset access stays separate from the public corpus and held-out answer keys never enter retrieval.

## Provider implementation notes

Checked 5 November 2026; recheck access and pin versions before live integration. Provider-specific fields belong inside adapters, not in workflow branching:

- Jev accepts state and typed questions and returns structured choices/distributions. Confirm the deployed model ID, SDK, confidence semantics, input limits and account access using TypeSafe's docs [R23].
- OpenAI Decisions uses `/v1/decisions`; the current documented model is `gpt-6-luna`. Use a choice question for task v1 and map refusal/usage explicitly. Generation stays on its separate generation interface [R24].
- Vercel AI Gateway also documents a Decisions-compatible endpoint, including Jev and `openai/gpt-6-luna-decisions`. This gateway identifier differs from the direct OpenAI identifier. Gateway use is optional, not required because hosting is Vercel; treat gateway and direct routes as distinct latency/cost/data-processing configurations [R25].

No advertised latency, price or calibration figure is an acceptance result for this application. Type-safe values can still be wrong. The selected provider remains gated by verified account access/credits, the recorded spend cap and the experiment results.

## Delivery order and builder completion criteria

1. In slice 1A, define contracts and fixtures; implement off mode/rules, explicit-task precedence, selector and fake provider responses. No dependency on a paid SDK, Next.js, hosted store or decision-model availability. Implement DEC01–DEC06 and DEC09 contract cases using the local harness.
2. After live foundation and B1/B2 exist, run **Stage 2b: decision experiment**, independently of the graph experiment. Build provider adapters behind injected configuration; validate durable settlement/cancellation (DEC07) and no public overrides (DEC06). Implement the offline harness and report format in the [evaluation protocol](../evaluation/decision-models.md). DEC08 and DEC10 govern rollout and experiment integrity.
3. Collect reviewed labels, evaluate all available alternatives, and document unavailable providers as not run. An unavailable candidate does not block the vector baseline or imply a loss/win.
4. Keep default mode off. Move through offline shadow to a bounded, owner-approved enabled canary only after the preregistered gates pass; record report/policy/versions, cohort size, spend cap and rollback conditions. Any inconclusive result keeps off mode.
5. Add clarification judgments, passage relevance, contradiction flags, entity matching or ontology triage only as separately specified experiments with new task versions, labels and tests. A decision-model judge is also a separate experiment and never its own reference authority. A reasoning-model escalation cascade is deferred.

Builder deliverables: shared schemas; frozen rules; fake, structured-LLM, Jev and OpenAI adapters where accessible; selector and fixtures; ledger/cancellation integration; offline decision dataset/report schemas; reproducible commands; stage-specific acceptance results. Keep the existing independent judge and Ragas evaluation. Documentation acceptance is not implementation acceptance, and model ranking must not be invented from fixture outputs.
