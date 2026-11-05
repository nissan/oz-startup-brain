# Outcome-based delivery plan

This is an implementation backlog, not a calendar commitment. No databases, paid API accounts or Vercel project have been provisioned.

| Stage | Outcome and deliverable | Exit evidence |
| --- | --- | --- |
| 0: Design review | Agree on first founder tasks and run paper-prototype sessions | Observed usability findings and prioritised changes; provisional decisions accepted or amended |
| 1: Corpus audit | Fetch every cited link afresh as a new source version (the original research archive is not pursued; decision 9); classify all 135 cited links; approve 20–30 initial sources | Source disposition report, rights decisions, temporal fields and repeatable fetch/extraction fixtures. Scale note: 84 of the 135 discovered URLs are `.au` hosts, about 50 are non-Australian and only 3 are on `advance.qld.gov.au`, so expect many "out of initial scope" dispositions and a small first approved set |
| 1a: API foundation (slice 1A, development mode) | Create the NestJS project, the `/v1` query contract and JSON Schema, a fictional fixture corpus, development credentials and a standalone fixture client | A standalone client exercises the authenticated API end to end in fixture mode with no hosted service, no rights-cleared content and no paid call; API01–API03, API13 (with fixtures) and the standalone part of API10 (schema and generated-client compatibility checks) pass; API04–API09, API11, API12 and API14 are recorded as pending later slices, not implied to pass |
| 1b: Live foundation (slice 1B) | Add the Next.js BFF, durable credential registry and atomic budget store, session-hint sub-quotas and hosted Qdrant | The website and the standalone client use the same authenticated API; API04–API09, API11 and API14 pass against the durable stores and the real BFF, and the website-dependent part of API10 (the generated client used by `apps/web`) passes; API12 remains pending Stage 7; fixture mode still works without the hosted stores |
| 2: Vector baseline | Deploy a bounded LangChain/LangGraph route inside NestJS using Qdrant | B1/B2 reports on reviewed pilot questions; citations, dates, unknowns and outage handling verified |
| 3: Graph experiment | Add reviewed ontology and Neo4j traversal | Edge review audit reporting sourced versus editorial `BEFORE` edges separately; B3 vs B2 slice comparison with equal evidence budget on at least 30 multi-hop questions; keep graph optional if no material gain |
| 4: Founder interface | Replace paper answers with validated cards, tables and prerequisite views | O1–O4 task evidence, accessibility checks and export verification |
| 5: Multimodal experiments | Add transcript-confirmed speech, then confirmed visual extraction | Correction tasks, privacy/retention behaviour, equivalent text paths and measured benefit |
| 6: Public demonstration | Publish a personal non-commercial Vercel demo and reproducible educational walkthrough | Budget controls, session-hint sub-quotas, the weekly maintenance and resume policy for the free-tier stores with the pre-demo readiness procedure, a rehearsed restore drill from versioned exports (Qdrant is deleted after four idle weeks and Aura after 30 paused days), current corpus release, documented limitations and no leaked private data |
| 7: External and agent access | Onboard independent API consumers; add an MCP adapter when needed | Independent key revocation and quotas; API12 passes; MCP interoperability, OAuth and policy-parity checks |

## First vertical slice

One founder task: an early-stage founder asks for a next support step. The app clarifies stage if needed, retrieves current sources, presents up to three options with conditions and dates, and lets the founder inspect a citation. A synthetic closed-round fixture exercises abstention from recommending a closed application route. This slice must work without Neo4j before graph complexity is added. Business logic must not depend on a browser session or Next.js runtime.

The slice is delivered in two parts so that development can start before rights review, hosted services or the durable stores exist:

- **Slice 1A (development mode, no hosted service).** NestJS `apps/api` only. A fictional fixture corpus (invented programs, rounds and sources, clearly labelled) is embedded into a local Qdrant instance or an in-process vector adapter. Credentials come from a development registry (hashed keys in environment configuration) and the budget store is an in-process, single-instance implementation labelled as such. The standalone fixture client submits the Queensland-style question and the closed-round question and receives the `/v1/queries` envelope with valid citation IDs, dates and an unresolved condition. Exit evidence: contract tests against the JSON Schema; API01–API03, API13 (fixtures) and the standalone part of API10 pass; `insufficient_evidence`, `clarification`, explicit-unknown (SC22) and future-effective (SC23) paths demonstrated with fixtures; no paid call. API08, API09 and the website-dependent part of API10 need `apps/web` and belong to slice 1B; API12 needs the MCP adapter and belongs to Stage 7.
- **Slice 1B (live foundation).** Add the Next.js BFF, Qdrant Cloud, the durable credential registry and atomic budget store, session-hint sub-quotas and the first reviewed real sources from Stage 1. Exit evidence: the website and the standalone client get identical envelopes for the same request; API04–API09, API11, API14 and the website-dependent part of API10 pass; fixture mode still runs without any hosted dependency. API12 stays pending until Stage 7.

Jurisdiction for the first real corpus remains an open decision (see below); slice 1A does not depend on it because its sources are fictional.

## Proposed future repository layout

`apps/web/`: Next.js interface and thin server-side BFF; server-only backend key and generated API client.

`apps/api/`: independently deployable NestJS API with guards, DTOs, policy/quota services, workflow providers and a future MCP transport module.

`packages/workflow/`: LangGraph states, nodes, typed tools and output schemas.

`packages/retrieval/`: Qdrant and Neo4j adapters with baseline switch.

`packages/decisions/`: provider-independent bounded-decision adapters, fake provider and frozen task-intent rules; shared schemas remain in `packages/contracts/` ([ADR 002](decisions/002-decision-models.md)).

`packages/contracts/`: shared corpus, claim and answer contracts, the `/v1` query envelope JSON Schema, and the trace-record and run-manifest schemas that the Python evaluation harness reads.

`packages/api-client/`: generated TypeScript client from the versioned NestJS OpenAPI artifact.

`docs/api/`: generated OpenAPI artifact, usage examples and compatibility policy, added during implementation.

`jobs/ingest/`: bounded fetch/extract/review/export pipeline in TypeScript (decision 7), sharing `packages/contracts/` and the LangChain document loaders, so that record schemas exist once; Python stays confined to the Ragas harness.

`evaluation/`: Python Ragas harness, reference-set manifests and reports. `evaluation/decisions/` holds the separate decision experiment harness and proposed component acceptance scenarios; decision fixtures and outputs must not enter the retrieval corpus.

`data/`: public metadata, rights-cleared fixtures and schemas only.

Exact package versions are selected and locked during implementation, not guessed in the design.

## Owner decisions recorded 5 November 2026

Decided by the owner after the design review; each replaces the corresponding open item. Nothing below provisions a service or spends money.

| # | Decision | Effect on the plan |
| --- | --- | --- |
| 1 | Slice 1A/1B split and development credential mode accepted | Slice 1A-0 (fixture-mode `/v1/queries`) may start now |
| 2 | Durable credential registry, budget counters and usage ledger in one managed Postgres: **Supabase free tier first; Neon if Supabase does not fit** | Selected at slice 1B; reached only from NestJS; single-transaction reservation and settlement |
| 3 | Model access is **provider-agnostic** behind one adapter interface. Before the first live call, probe which providers carry free credits on the owner's existing subscriptions and use that provider first; set a currency-specific monthly cap | Slice 1A uses the deterministic fixture responder; the adapter and the credit probe are slice 1B tasks; subsequent clarification: ADR 002 separates generation, embedding and decision capabilities without changing provider-agnostic access |
| 4 | Free-tier upkeep is a **weekly manual maintenance and resume check**, documented with the restore drill. Continuous availability is not promised: Aura Free pauses after 72 idle hours and will pause between weekly checks whenever there is no traffic; Qdrant Free suspends after seven idle days. The accepted consequences are (a) a paused graph is served as a labelled vector-only fallback (SC17) while a resume is requested, (b) a pre-demo readiness procedure (resume both stores, run the fixture smoke query, confirm the capabilities response) is run before any demo or shared link, and (c) if continuous availability is ever wanted, a cadence below 72 hours and the activity that counts as use must be agreed and recorded separately | Architecture "Expected paused states" aligned; Stage 6 exit evidence |
| 5 | Hosting starts on a personal Vercel Hobby account; **Redditech's Vercel Pro team is the capacity fallback** if the free tier fails or usage pauses the demo | Hosting tier and commercial purpose are recorded separately. The demo is personal and non-commercial, which is what Hobby's fair-use terms turn on; branding is not the eligibility test, and moving to Pro for capacity does not by itself make it commercial. Reassess eligibility when actual use changes, and move off Hobby before any commercial use, independently of usage-limit exhaustion |
| 6 | First jurisdiction decided after Stage 1 dispositions; **national coverage of every Australian state and territory is the target**, so corpus expansion beyond the article's 135 links is planned work, not an afterthought | New Stage 2a below; `01-plan-assessment.md` wording aligned |
| 7 | Ingestion in TypeScript, sharing `packages/contracts/` | Layout above |
| 8 | Extend the bibliography manifest with `publisher`, `source_class`, `jurisdiction` at Stage 1 (bump `manifest_version`) | Stage 1 deliverable |
| 9 | Original research archive is not pursued; the corpus is built from **fresh fetches**, each recorded as a new source version | README statement to be updated at Stage 1; no historical-completeness claim |
| 10 | Claude designs the remaining storyboards (SB5, phone-width SB3), the mock-ups, branding materials and a **design system** of look-and-feel tokens and reusable components, using Claude Design artifacts | New Stage 0a below |
| 11 | Early feedback starts with P2 and P3, five participants each; untested pathways are reported | Stage 0 and Stage 4 |

Direction is accepted above; the following **implementation inputs are still required**, each gated to the stage that needs it. The no-live-spend gate stays in force until the first three are supplied.

| Pending input | Needed by | Gate |
| --- | --- | --- |
| Monthly spend ceiling: the actual amount and currency | Slice 1B, before the first live model call | No live model, embedding or transcription call until recorded in secret configuration and the budget store |
| Verified model provider: which provider actually carries free credits on the owner's subscriptions, confirmed by the probe in decision 3 | Slice 1B | Same gate; the probe result is recorded in the release manifest |
| Initial real jurisdiction (decision 6 keeps it open until the Stage 1 dispositions are seen) | Stage 1 exit | The capabilities response lists only covered jurisdictions |
| Recruitment of consenting founders and navigators (P2 and P3 first) | Stage 0 and Stage 4 | No O1–O3 claim until observed |
| Vercel Pro move, if the Hobby limits or commercial use require it | Stage 6 | Hosting tier re-recorded with the reason |

### Stages added by these decisions

| Stage | Outcome and deliverable | Exit evidence |
| --- | --- | --- |
| 0a: Design system and mock-ups | A design system (colour, type, spacing, evidence-state components, cards, chips, comparison table, prerequisite map, failure states) and mock-ups for SB5 and phone-width SB3, plus basic branding | First version delivered 5 November 2026 as versioned exports under `design/` (see [storyboards](ux/storyboards.md)); remaining exit evidence: owner review and approval recorded in `design/system/HANDOFF.md`; mock-ups cover SC06, SC07, SC17, SC18 and SC02; token contrast computed at 4.5:1 or better in both themes (not a conformance assessment); keyboard operation and UI/export label parity remain pending validation |
| 2a: Corpus expansion to national coverage | Per-jurisdiction source discovery beyond the article (every state and territory plus federal), dispositioned and rights-reviewed with the Stage 1 process | A coverage table by jurisdiction with approved-source counts; the capabilities response reports exactly which jurisdictions are covered; "Outside current coverage" is returned for the rest |
| 2b: Bounded decision experiment | After B1/B2, compare task-intent rules and a small structured-output LLM with Jev/OpenAI Decisions; graph availability stays fixed per run | ADR 002 and D0–D3 reports; reviewed labels and calibration policy; DEC07/DEC08/DEC10; offline shadow first, default off until the preregistered gates and owner activation record exist |

The API-first NestJS direction and ADR 002 decision-layer experiment are owner-accepted. Numerical experiment gates remain proposals to freeze before evaluation; no empirical validation is claimed.

## Fixture-mode test controls

Slice 1A must provide a deterministic test clock (`as_of`, initially `2026-11-05T00:00:00Z`) and named fault fixtures `vector_timeout`, `budget_exhausted` and `graph_unavailable`, so temporal and degraded-response scenarios can be reproduced without live services. These are local harness inputs or dependency-injected adapters, not public query parameters, browser headers or administrative endpoints. No hosted vector/graph database or paid call is needed to exercise the named states.

Enable configurable clocks/fault injection only when all of these hold: fixture responder selected, development credential mode active, and the process runs in an isolated local test environment. Reject startup with these controls enabled in a public deployment or non-development credential mode. Public previews may render fixed labelled mock states but must not expose these configurable controls. Document configuration and reset behaviour; tests must verify the guard as well as the selected clock/failure response.

The local NestJS harness is a slice 1A deliverable. Later browser tasks consume it only when the corresponding local UI exists; this does not add a Next.js dependency to slice 1A. Synthetic tasks T02/T03/T15 remain blocked pending these controls, and audio/diagram tasks remain blocked until their authored fixtures exist. Simulated budget exhaustion checks response behaviour, not correctness of the durable monetary ledger.

## Implementation checks

At the relevant stages, test source-table extraction and qualifiers, entity merge ambiguity, unsupported edge rejection, corpus version consistency, temporal status, source injection, allowlisted queries, anonymous-session isolation, keyboard navigation, microphone denial, editable transcription, cancellation, budget exhaustion, graph/vector outages and restoration from versioned exports. Also verify API contract compatibility, unauthorised access, scope enforcement, key rotation/revocation, client isolation, server-only secret boundaries and REST/MCP policy parity as those features are implemented. Keep live-model evaluations separate from deterministic CI.


## Decision-model implementation increment

The owner accepted the bounded decision-layer experiment on 5 November 2026. Read [ADR 002](decisions/002-decision-models.md) first, then [the evaluation protocol](evaluation/decision-models.md) and [DEC01–DEC11](../evaluation/decisions/decision-routing.feature). This increment does not select a paid provider or expand the first experiment beyond task classification.

- Subsequent slice 1A increment, in its own PR **after 1A-0**: add decision schemas, rules, an injected fake provider, off mode and selector fixtures; verify DEC01–DEC06, DEC09, DEC11 and API15 standalone cases. Deliver the optional `task_intent` request schema in `packages/contracts/`, the matching NestJS OpenAPI artifact and regenerated `packages/api-client/`; test omitted/valid/invalid/non-string values and free-text precedence at the HTTP boundary. This work does not gate or enlarge 1A-0 acceptance. No Next.js or hosted model is required. Fakes cover enabled selection and the separate offline shadow-job contract; actual regional timing remains Stage 2b evidence. API15 BFF forwarding/validation is a slice 1B follow-up.
- Stage 2b, after slice 1B and B1/B2: build accessible provider adapters, durable decision-usage accounting and cancellation (DEC07), then the offline D0–D3 harness (D1 is diagnostic only) and the manually triggered regional shadow job while live mode stays off. Compare decision policies separately from B2/B3 graph gains. This work may proceed independently of Stage 3 and cannot block a functioning rules-based vector baseline.
- Before live evaluation: record the evaluation cap/currency, provider access, reviewed dataset, split manifest and sample-size/power plan; the 200-case pilot is exploratory, not activation evidence. Before activation: freeze the calibration/policy artifact, record held-out gates and obtain the owner activation record with canary/rollback limits and server-selected cohort (DEC08/DEC10); update the processor inventory and disclosure before sending founder inputs. Missing inputs mean not run/off, not a fabricated pass.
- Later proposals only: clarification judgments, passage scoring, contradiction detection and ontology triage, each with separate contracts, labels and acceptance gates. Model-based edge approval, arbitrary tools and automatic reasoning-model cascades are not part of this increment.

The builder should return one fixture-only implementation PR and a separate adapter/evaluation PR. Each reports exactly which DEC scenarios ran, which remain pending, the pinned configurations and any operational limitations. No actual model-quality or UX outcome is established by this documentation amendment.
