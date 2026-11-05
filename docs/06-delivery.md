# Outcome-based delivery plan

This is an implementation backlog, not a calendar commitment. No databases, paid API accounts or Vercel project have been provisioned.

| Stage | Outcome and deliverable | Exit evidence |
| --- | --- | --- |
| 0: Design review | Agree on first founder tasks and run paper-prototype sessions | Observed usability findings and prioritised changes; provisional decisions accepted or amended |
| 1: Corpus audit | Recover original research where possible; classify all 135 cited links; approve 20–30 initial sources | Source disposition report, rights decisions, temporal fields and repeatable fetch/extraction fixtures. Scale note: 84 of the 135 discovered URLs are `.au` hosts, about 50 are non-Australian and only 3 are on `advance.qld.gov.au`, so expect many "out of initial scope" dispositions and a small first approved set |
| 1a: API foundation (slice 1A, development mode) | Create the NestJS project, the `/v1` query contract and JSON Schema, a fictional fixture corpus, development credentials and a standalone fixture client | A standalone client exercises the authenticated API end to end in fixture mode with no hosted service, no rights-cleared content and no paid call; API01–API03, API13 (with fixtures) and the standalone part of API10 (schema and generated-client compatibility checks) pass; API04–API09, API11, API12 and API14 are recorded as pending later slices, not implied to pass |
| 1b: Live foundation (slice 1B) | Add the Next.js BFF, durable credential registry and atomic budget store, session-hint sub-quotas and hosted Qdrant | The website and the standalone client use the same authenticated API; API04–API09, API11 and API14 pass against the durable stores and the real BFF, and the website-dependent part of API10 (the generated client used by `apps/web`) passes; API12 remains pending Stage 7; fixture mode still works without the hosted stores |
| 2: Vector baseline | Deploy a bounded LangChain/LangGraph route inside NestJS using Qdrant | B1/B2 reports on reviewed pilot questions; citations, dates, unknowns and outage handling verified |
| 3: Graph experiment | Add reviewed ontology and Neo4j traversal | Edge review audit reporting sourced versus editorial `BEFORE` edges separately; B3 vs B2 slice comparison with equal evidence budget on at least 30 multi-hop questions; keep graph optional if no material gain |
| 4: Founder interface | Replace paper answers with validated cards, tables and prerequisite views | O1–O4 task evidence, accessibility checks and export verification |
| 5: Multimodal experiments | Add transcript-confirmed speech, then confirmed visual extraction | Correction tasks, privacy/retention behaviour, equivalent text paths and measured benefit |
| 6: Public demonstration | Publish a personal non-commercial Vercel demo and reproducible educational walkthrough | Budget controls, session-hint sub-quotas, keep-alive policy for the free-tier stores, a rehearsed restore drill from versioned exports (Qdrant is deleted after four idle weeks and Aura after 30 paused days), current corpus release, documented limitations and no leaked private data |
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

`packages/contracts/`: shared corpus, claim and answer contracts, the `/v1` query envelope JSON Schema, and the trace-record and run-manifest schemas that the Python evaluation harness reads.

`packages/api-client/`: generated TypeScript client from the versioned NestJS OpenAPI artifact.

`docs/api/`: generated OpenAPI artifact, usage examples and compatibility policy, added during implementation.

`jobs/ingest/`: bounded fetch/extract/review/export pipeline. Recommended default, pending owner confirmation: TypeScript, sharing `packages/contracts/` and the LangChain document loaders, so that record schemas exist once; Python stays confined to the Ragas harness.

`evaluation/`: Python Ragas harness, reference-set manifests and reports.

`data/`: public metadata, rights-cleared fixtures and schemas only.

Exact package versions are selected and locked during implementation, not guessed in the design.

## Owner decisions recorded 5 November 2026

Decided by the owner after the design review; each replaces the corresponding open item. Nothing below provisions a service or spends money.

| # | Decision | Effect on the plan |
| --- | --- | --- |
| 1 | Slice 1A/1B split and development credential mode accepted | Slice 1A-0 (fixture-mode `/v1/queries`) may start now |
| 2 | Durable credential registry, budget counters and usage ledger in one managed Postgres: **Supabase free tier first; Neon if Supabase does not fit** | Selected at slice 1B; reached only from NestJS; single-transaction reservation and settlement |
| 3 | Model access is **provider-agnostic** behind one adapter interface. Before the first live call, probe which providers carry free credits on the owner's existing subscriptions and use that provider first; set a currency-specific monthly cap | Slice 1A uses the deterministic fixture responder; the adapter and the credit probe are slice 1B tasks |
| 4 | Keep-alive: manual weekly trigger, documented in the restore drill | Stage 6 exit evidence |
| 5 | Hosting starts on a personal Hobby account; **Redditech's Vercel Pro team is the fallback** if the free tier fails or usage pauses the demo | Keep the demo unbranded on Hobby; moving to Pro changes the non-commercial assumption and must be re-recorded |
| 6 | First jurisdiction decided after Stage 1 dispositions; **national coverage of every Australian state and territory is the target**, so corpus expansion beyond the article's 135 links is planned work, not an afterthought | New Stage 2a below; `01-plan-assessment.md` wording aligned |
| 7 | Ingestion in TypeScript, sharing `packages/contracts/` | Layout above |
| 8 | Extend the bibliography manifest with `publisher`, `source_class`, `jurisdiction` at Stage 1 (bump `manifest_version`) | Stage 1 deliverable |
| 9 | Original research archive is not pursued; the corpus is built from **fresh fetches**, each recorded as a new source version | README statement to be updated at Stage 1; no historical-completeness claim |
| 10 | Claude designs the remaining storyboards (SB5, phone-width SB3), the mock-ups, branding materials and a **design system** of look-and-feel tokens and reusable components, using Claude Design artifacts | New Stage 0a below |
| 11 | Early feedback starts with P2 and P3, five participants each; untested pathways are reported | Stage 0 and Stage 4 |

Remaining open item: which real founders and navigators will participate (recruitment itself).

### Stages added by these decisions

| Stage | Outcome and deliverable | Exit evidence |
| --- | --- | --- |
| 0a: Design system and mock-ups | A design system (colour, type, spacing, evidence-state components, cards, chips, comparison table, prerequisite map, failure states) and mock-ups for SB5 and phone-width SB3, plus basic branding | Design system artifact reviewed by the owner; every evidence-state label has a component; mock-ups cover every failure state in SC06, SC07, SC17, SC18; contrast and keyboard-equivalence notes recorded |
| 2a: Corpus expansion to national coverage | Per-jurisdiction source discovery beyond the article (every state and territory plus federal), dispositioned and rights-reviewed with the Stage 1 process | A coverage table by jurisdiction with approved-source counts; the capabilities response reports exactly which jurisdictions are covered; "Outside current coverage" is returned for the rest |

The API-first NestJS direction is owner-requested; the remaining design choices are proposals, and no empirical validation is claimed.

## Implementation checks

At the relevant stages, test source-table extraction and qualifiers, entity merge ambiguity, unsupported edge rejection, corpus version consistency, temporal status, source injection, allowlisted queries, anonymous-session isolation, keyboard navigation, microphone denial, editable transcription, cancellation, budget exhaustion, graph/vector outages and restoration from versioned exports. Also verify API contract compatibility, unauthorised access, scope enforcement, key rotation/revocation, client isolation, server-only secret boundaries and REST/MCP policy parity as those features are implemented. Keep live-model evaluations separate from deterministic CI.
