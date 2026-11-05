# Evaluation and social question discovery

## What counts as success

Ragas measures aspects of retrieval and responses; LLM judges help apply rubrics at scale. Neither proves external truth. A response can be faithful to an outdated document and still be wrong today. The benchmark therefore combines source-grounded reference answers, temporal checks, user-task outcomes and operational tests. [R8–R9]

## Question discovery using X

No X dataset has been collected or ranked for this proposal. Preliminary web searches did not yield a reproducible sample with reliable engagement counts. The questions in this repository are explicitly authored synthetic seeds.

Proposed discovery seeds: `#StartupAus`, `#AusStartups`, `#StartupAustralia`, `#BuildInPublic`, `#FinTech`, `#DeepTech` and `#AI`, combined with Australia, Queensland, Brisbane, founder, grants, university IP, accelerator and fundraising terms. These are candidates to test, not claims about hashtag activity. Broad tags require Australian relevance checks.

1. Use permitted X API access or a user-supplied lawful export; establish a spending cap first. Official docs describe pay-per-use access and separate recent/full-archive search. Do not assume free full-archive access. [R10]
2. Record query, time window, language, pagination coverage, sampling method, post ID/URL, conversation ID, posted_at, metrics_captured_at and available public metrics. Retain text only as permitted.
3. Retrieve question threads and their answers, not just isolated popular posts. Distinguish replies, quotes and reposts.
4. Extract and anonymise question intents; manually confirm Australian applicability. Cluster paraphrases, remove repeated campaigns and obvious spam, and group all variants from the same conversation.
5. Sample a mix of high-engagement, ordinary and low-engagement questions, plus regions and founder types underrepresented on X. Interviews, community office hours and official FAQs fill gaps.
6. Use capped `log1p(repost_count)` as one *sampling-priority feature*, with a common observation window where feasible. Report missing metrics and selection bias. It never enters a correctness score.
7. Verify answer claims against current primary sources. A popular but unsupported answer becomes a misconception test, not a reference answer.

Reposts can signal controversy, reach, humour or coordinated attention. They do not establish expertise, independence, representativeness or correctness. Normalisation by impressions is inappropriate when impressions are absent or incomparable.

## Dataset plan

Start with a 60-question pilot; expand toward 150 only when human review capacity exists. Suggested pilot split: 30 development, 15 validation and 15 frozen test questions. With small slices, report counts and uncertainty; do not claim statistically established gains from a few examples.

Coverage includes factual lookup, comparison, two-hop dependencies, temporal status, missing prerequisites, contradiction, unsupported questions, prompt injection and modality corrections. Record persona, jurisdiction, question origin and risk class. Split by intent cluster and conversation, keeping paraphrases together. Hold out some programs/source families for transfer checks, and use a later time slice to test freshness. Keep reference answers and benchmark labels out of retrieval indexes. Source evidence belongs in the corpus; answer keys do not.

Reference-answer fields: question_id, question, as_of, confirmed_context, origin, split_group, evidence_source_versions, evidence_spans, accepted_claims, required_caveats, acceptable_next_actions, must_not_claim, answerability, reviewer, reviewed_at, rubric_version. A second reviewer adjudicates high-consequence or disputed labels. If only one reviewer is available, disclose that limitation.

The [seed question file](../evaluation/seed-questions.jsonl) is a behavioural design fixture. It has no approved reference answers or factual scores and cannot support an accuracy claim.

## Controlled retrieval comparison

| Run | Retrieval strategy | Purpose |
| --- | --- | --- |
| B0 | No retrieval | Diagnose unsupported model recall; never the public factual fallback |
| B1 | Dense Qdrant retrieval | Minimum RAG baseline |
| B2 | Dense + sparse fusion and optional rerank | Establish a strong non-graph baseline |
| B3 | B2 + bounded reviewed graph expansion | Measure graph contribution |
| B4 | Graph only, optional diagnostic | Find questions requiring textual context that edges omit |

Keep model, prompt, generation settings, corpus, final evidence-token allowance and evaluation questions fixed. Keep reranking identical between B2 and B3. Report added graph lookup/extraction cost separately. Compare factual, relational, temporal and persona slices; do not hide regressions in one average. Label any fallback run distinctly. Check whether extra passages alone explain a gain by testing equal-token alternatives.

## Measures

| Layer | Measures | Interpretation |
| --- | --- | --- |
| Retrieval | Recall@k against reviewed passage IDs, nDCG@k, Ragas context precision/recall | Retrieval and ranking quality; document the metric variant and its required reference fields |
| Response | Ragas faithfulness, factual correctness, response relevancy | Separate support by retrieved context from correctness against dated reference evidence |
| Evidence | Citation validity, claim-level citation precision/coverage, quoted-span integrity | A valid URL alone is not entailment |
| Graph | Entity resolution precision, reviewed edge precision, prerequisite-path validity, supported path coverage | Graph correctness before answer fluency |
| Behaviour | Abstention precision/recall, clarification usefulness, stale/conflict disclosure | Avoid passing by refusing every question |
| Product | Task completion, time to next action, evidence findability, user corrections | Usability alongside answer quality |
| Operations | End-to-end p50/p95, retrieval latency, tokens/cost, fallback and error rates | Include cold starts and paused services |

## LLM judge protocol

Use an independently configured judge, preferably a different model family when budget permits. Hide system identity and retrieval strategy; randomise answer order and reverse pairwise comparisons. Score factual support, relevance, actionability, uncertainty and prohibited claims separately on an anchored 0–2 rubric (0 wrong/missing, 1 partial, 2 satisfies). A fatal unsupported eligibility/permission claim fails regardless of prose quality. Ask for evidence-linked reasons, not hidden reasoning traces.

Calibrate on at least 20 human-reviewed cases before trusting aggregate judge scores. Include verbose wrong answers, concise correct ones, plausible fake citations, disputed sources and explicit abstentions. Repeat a subset to measure instability; report agreement/confusion matrices and human-adjudicated disagreements. No evaluator is allowed to change reference labels to improve the system's apparent score. Published work documents position, verbosity and self-preference biases in LLM judges. [R9]

## Provisional release gates

- Deterministic fixtures: 100% valid evidence IDs and dates, no cross-session leakage, no document-triggered tool execution, correct stale/outage handling.
- Human-reviewed test set: no critical fabricated eligibility or permission claim. Target claim-level citation precision ≥95% and evidence recall@8 ≥85%, with numerator/denominator and slices reported.
- Ragas faithfulness target ≥0.90 after calibration; never a replacement for source truth or human review.
- Graph default-on gate: a practically meaningful target of +10 percentage points on supported multi-hop answers versus B2, no critical factual regression, acceptable latency/cost. This is a decision threshold, not an achieved result; extend the sample if uncertainty is too large.
- Product gate: validate O1–O3 on real participants, not simulated persona praise.

Pin code commit, corpus hash, dataset version, schema, package versions, models, embedding model, prompts, metrics and timestamp in each report. Save failure examples and total evaluation cost. Live judge runs are manually triggered and budgeted; credential-free CI checks only fixtures and schemas.
