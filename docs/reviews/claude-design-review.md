# Claude design review: Oz Startup Brain founder journey design

Review date: 5 November 2026 (Australia/Sydney). Reviewer: Claude (Anthropic), working from a clone of the repository. This is a documentation review with documentation corrections; no application code, infrastructure, accounts or spend were created.

## 1. Reviewed revisions and scope

| Item | Value |
| --- | --- |
| Repository | https://github.com/nissan/oz-startup-brain |
| Design PR | https://github.com/nissan/oz-startup-brain/pull/1 (draft, open, base `main`) |
| Design branch | `docs/founder-journey-design` |
| Reviewed head SHA | `1b6342377f67f9baad88086b4090315fe8425d4d` (fetched from the PR API on 5 November 2026; matches the last known head supplied with the review request) |
| `main` at review time | `375c9c27319d2626c0b66c1e4ef34d18511374ab` (contains only the initial workspace commit; the design lives only on the PR branch) |
| Review branch | `docs/claude-design-review`, based on `1b63423` |

Files read in full: `README.md`, `.gitignore`, `docs/01-plan-assessment.md`, `docs/02-product.md`, `docs/03-architecture.md`, `docs/04-data-and-ontology.md`, `docs/05-evaluation.md`, `docs/06-delivery.md`, `docs/references.md`, `docs/decisions/001-api-first-nestjs.md`, `docs/ux/research-and-design.md`, `docs/ux/storyboards.md`, `features/founder-journeys.feature`, `features/api-access.feature`, `evaluation/seed-questions.jsonl`, `data/sources/article-bibliography.json` (structure and all 135 records). The four storyboards (`docs/ux/sb1-student.svg` … `sb4-payments.svg`) were rendered to PNG with `rsvg-convert` and inspected visually, not judged from their prose descriptions alone. The repository contains no `CLAUDE.md`, `CONTRIBUTING.md` or other contributor instructions at the reviewed SHA.

Owner requirements treated as fixed and preserved throughout: educational Australian founder journey planner grounded in the Founder Journey Planner article; designated NestJS API project and separate Next.js frontend; website API credential server-side with independent scoped credentials for external consumers; LangChain integrations with LangGraph orchestration; Qdrant hosted vector retrieval plus a hosted graph with a free tier; future MCP access reusing backend capabilities and authorisation; outcome-driven design with explicit provenance and measurable evaluation; personal/non-commercial hobby deployment initially. No finding below proposes replacing any of these. Where a finding touches one, the alternatives are recorded for owner decision in section 8.

Standing caveats carried into every judgment: the 135 bibliography URLs are discovered references, not an ingested or verified corpus; the twelve seed questions are synthetic and have no approved reference answers; the persona walkthroughs and storyboard observations in this document are simulated design critiques, not user research. Reviewing my own Round 2 revisions is not independent validation and is labelled as such.

## 2. Verification of vendor and protocol claims

Checked on 5 November 2026 against primary documentation where reachable from this session. "Verified" means the primary page was fetched and the claim matched; "consistent" means only secondary reporting was reachable.

| Claim in design | Source checked | Result |
| --- | --- | --- |
| Qdrant Cloud Free: 1 GB RAM, 4 GB disk, 0.5 vCPU, 1 node; suspended after one week of inactivity, deleted after four weeks if not reactivated (`03-architecture.md`, R2) | https://qdrant.tech/documentation/cloud/create-cluster/ | Verified. |
| Neo4j AuraDB Free: 200,000 nodes, 400,000 relationships, 1 GB storage, no uptime SLA (R3) | https://neo4j.com/docs/aura/quotas-and-limits/ | Verified. The page also lists "zonal architecture, no high availability" and "one on-demand backup retained at a time". It does not cover pause or deletion. |
| Aura Free pauses after 72 hours of inactivity and is deleted after more than 30 days paused (R4) | https://neo4j.com/docs/aura/managing-instances/instance-actions/ | Verified. The page adds that Free instances do not resume automatically and cannot be manually paused. |
| Vercel Hobby is free and limited to non-commercial personal use; function maximum duration 300 s (R6, R7) | https://vercel.com/docs/plans/hobby (last updated 2026-09-14 per page metadata) | Verified. Additional facts the design does not yet reflect: Hobby has no Spend Management; exceeding an included-usage limit pauses that feature for up to 30 days; runtime logs are retained for 1 hour; log drains are unavailable; included usage is 4 Active-CPU hours, 360 GB-hours provisioned memory and 1,000,000 function invocations per month; preview and production deployments can use Vercel Authentication protection. |
| NestJS deploys to Vercel as a Vercel Function with Fluid compute by default; function limitations apply (R21) | https://vercel.com/docs/frameworks/backend/nestjs (last updated 2026-08-10) | Verified. The page also documents `@Sse()` streaming and cron-triggered routes. |
| LangGraph.js persistence requires an explicit checkpointer; in-memory savers are not durable (R5) | https://docs.langchain.com/oss/javascript/langgraph/persistence | Verified in substance: `MemorySaver`/`InMemorySaver` loses state on restart; `PostgresSaver`/`SqliteSaver` are the durable options. |
| An MCP specification dated 2026-07-28 exists and its authorisation model is OAuth-based (R22) | https://blog.modelcontextprotocol.io/posts/index.xml (official blog feed: "The 2026-07-28 Specification", 28 July 2026; "The New MCP Roadmap", 22 August 2026) | Verified that the version exists. The blog states Dynamic Client Registration is deprecated in favour of Client ID Metadata Documents, issuer validation (RFC 9207) is required, and Enterprise-Managed Authorization is stable. The exact R22 URL was not fetched from this session. |
| X API access is pay-per-use with separate recent/full-archive search (R10) | Secondary reporting only (e.g. https://opentermsarchive.org/en/memos/x-replaces-its-dollar200-entry-level-api-plan-with-a-pay-per-use-model/, https://www.medianama.com/2026/02/223-x-developer-api-pricing-pay-per-use-model/) | Consistent with secondary reporting from February 2026; primary X documentation not fetched. Treat as unverified until provisioning. |
| Founder Journey Planner article exists at the cited URL with a 22 July 2026 verification date and 135 article-body external links; `article_html_sha256` in the manifest (R1) | https://www.reddi.ai/blog/founder-journey-planner-australian-digital-economy | Not verifiable from this session: the URL was not reachable through the session's fetch allowlist or proxy, and it did not surface in web search. The SHA-256 and link count are therefore taken on the manifest's word. Owner can confirm locally with `curl -s <url> \| sha256sum`. |
| Next.js private vs `NEXT_PUBLIC_` environment variables; NestJS guards and OpenAPI generation (R18–R20) | Not re-fetched | Stable, well-known framework behaviour; accepted without re-verification. |

## 3. Checks actually run versus proposed tests

Run during this review (reproducible from a clone of `1b63423`):

- `git` and GitHub REST API: confirmed PR #1 head SHA, base branch, draft status and that `main` lacks the design.
- Relative Markdown link check across all `*.md` files: 0 broken links; 28 distinct external links.
- Scenario tag cross-check: every `SC01–SC21`, `API01–API12`, `US01–US15`, `O1–O7` and `TR01–TR07` referenced in Markdown exists as a Gherkin tag, and every tag is referenced from Markdown (ranges such as `API02–API07` expanded by hand). Research register IDs R1–R22 are all defined and all cited.
- Story → scenario → tag consistency: for every `USxx → SCxx` row in `02-product.md`, the scenario in the feature file carries the `@USxx` tag. No mismatches.
- `article-bibliography.json`: valid JSON; `source_count` 135 equals the record count; 135 unique `source_id` and `url` values; no duplicates after lower-casing, scheme and `www.` normalisation; all `https`; every record has the same 10 keys; all records are `source_role: unclassified`, `fetch_status: not_fetched`, `rights_status: not_reviewed`, `last_verified_at: null`. Host distribution: 84 `.au`, 18 `.com`, 6 `.sg`, 5 `.org`, plus `.ae`, `.uk`, `.hk`, `.vn`, `.eu`, `.fun`, `.vc` and others; only 3 URLs are on `advance.qld.gov.au`.
- `seed-questions.jsonl`: 12 valid JSON lines; all `is_gold_reference: false`, `reference_answer: null`, `review_status: needs_human_reference_authoring`.
- SVG storyboards: all four parse as XML, render with `rsvg-convert` at 1440×1080, carry `role="img"` with `<title>`/`<desc>`, use real `<text>` nodes (36–41 per board), minimum font size 16 px, and the four text colours used measure 4.54:1 or better against the paper background (WCAG AA for normal text).

Proposed only (not run, because no application exists): every scenario in both feature files; contract, cancellation, quota and outage tests in `06-delivery.md`; Ragas/judge runs; usability sessions. Nothing in this review claims any of these passed.

## 4. Findings (Round 1, recorded before any edits)

Severity scale: **Critical** = the first slice could not be built coherently or safely as specified; **High** = blocks a stated stage exit or public deployment unless resolved; **Medium** = concrete defect to fix before the affected stage; **Low** = quality or consistency issue.

Each finding lists: location; concrete failure example; impact; proposed correction; acceptance check. Status after each round is in section 5.

### Pass 1: Product and scope

**P-01 (High) — The "first vertical slice" bundles three heavy prerequisites and contradicts the fixture-first principle.**
Location: `docs/06-delivery.md` "First vertical slice"; stages 1, 1a, 2. Failure example: the slice requires "retrieves reviewed current sources", which depends on Stage 1 (rights review, 20–30 approved sources) and Stage 1a ("durable quota controls", "scoped credentials"), while `03-architecture.md` says a zero-cost fixture mode must remain available and `01-plan-assessment.md` requires fixtures before any live service. A developer cannot start the slice without first completing rights clearance and choosing a durable store. Impact: the first runnable artefact is weeks away and depends on unresolved owner decisions (section 8), so there is no early feedback on the contract, workflow or evidence envelope. Correction: split the slice into 1A (fixture corpus of fictional sources, local Qdrant, static dev credentials, standalone client, no Next.js, no Neo4j, no hosted services) and 1B (hosted Qdrant, reviewed real sources, BFF, durable stores). Acceptance: `06-delivery.md` names 1A and 1B with distinct exit evidence, and 1A has no dependency on rights review or a hosted service.

**P-02 (Medium) — Explicit "Unknown" versus clarification is unspecified; SB1 and SC01 pull in different directions.**
Location: `02-product.md` UC01; `features/founder-journeys.feature` SC01; `docs/ux/sb1-student.svg` panel 2. Failure example: SC01 says the planner asks one clarification when jurisdiction is missing and pathways differ by jurisdiction; SB1 shows "Location: Not specified" and proceeds to a route. The API envelope has a `clarification` status but nothing says what happens on the next request when the founder has deliberately set a field to Unknown: a second clarification would be the "unbounded conversational loop" the design forbids; silently proceeding would contradict SC01. Impact: inconsistent behaviour across website and API clients and an untestable scenario. Correction: define the rule in `02-product.md` and ADR 001: a confirmed-context field may carry the explicit value `unknown`; the workflow never asks a clarification for a field marked `unknown`; it instead returns an answer whose coverage warning states which options were excluded or left unresolved. Acceptance: a new scenario (SC22) covers it and SB1's chip label uses the same word as the rest of the design.

**P-03 (Medium) — Export is a required behaviour (SC09, UC04, O2) with no defined mechanism or location.**
Location: `02-product.md` UC02/UC04; ADR 001 API surface. Failure example: the API surface has no export endpoint and the MVP has no persistence, so the export must be built client-side from the response envelope; nothing says so, nor which fields the envelope must therefore contain (confirmed context, corpus version, `as_of`, citations with dates, unresolved conditions, disclaimer). Impact: a standalone API consumer (O7) cannot produce an equivalent export unless the envelope is complete. Correction: state that export is a client rendering of the envelope with no new endpoint, and list the envelope fields it depends on. Acceptance: ADR 001 envelope description names those fields; SC09 remains satisfiable from the envelope alone.

**P-04 (Medium) — A Queensland-first slice sits on a corpus with almost no Queensland-specific discovered sources.**
Location: `01-plan-assessment.md` "Start with federal and Queensland sources"; `06-delivery.md` first slice; `data/sources/article-bibliography.json`. Failure example: of 135 discovered URLs, 3 are on `advance.qld.gov.au`; NSW (5), SA (2) and VIC (2) state sites are better represented; roughly 50 URLs are non-Australian. Impact: the slice's "reviewed current sources" would be a handful of pages, making the persona P3 task hard to demonstrate honestly, and the coverage statement would be mostly "Outside current coverage". Correction: record the count in the delivery doc, keep Queensland as a hypothesis to confirm (already an open decision), and let slice 1A use fictional fixtures so the choice of first jurisdiction does not gate development. Acceptance: open-decision list cites the counts; slice 1A independent of jurisdiction.

**P-05 (Low) — Credential administration is assigned to the curator persona.**
Location: `02-product.md` US14 "P5/P6". Failure example: Alex (source curator) is the persona who rotates and revokes API keys. Impact: role conflation blurs the ownership of a security-sensitive capability. Correction: introduce an Operator role (the owner for the hobby deployment) for US14; P5 keeps corpus review. Acceptance: US14 persona column updated.

**P-06 (Low) — Ingestion implementation language is unspecified and the two docs lean different ways.**
Location: `03-architecture.md` ("Python remains confined to offline Ragas evaluation initially") versus `06-delivery.md` `jobs/ingest/`. Impact: contracts in `packages/contracts/` are TypeScript; a Python ingestion job would duplicate schemas. Correction: record "TypeScript ingestion, sharing `packages/contracts`; Python only for Ragas" as the recommended default pending owner confirmation. Acceptance: one sentence in `06-delivery.md`.

### Pass 2: Architecture

**A-01 (High) — Budget reservations can leak on abort, timeout or crash; cancellation propagation has no named mechanism.**
Location: `03-architecture.md` online workflow step 1 and "Apply the deadline…"; ADR 001 "Reserve a conservative per-request cost allowance… reconcile actual usage afterward". Failure example: a browser disconnects at 20 s; the BFF function and the NestJS function are still running; if reconciliation only happens on normal completion, the reserved allowance is never released, and repeated disconnects (or a crashed function) drain a consumer's daily budget without any model spend. Impact: denial of service against the website's own allowance; incorrect usage reporting. Correction: specify that reservations carry a lease (TTL) and a reservation ID; completion, abort and timeout paths all reconcile; expired leases are reclaimed by the store; client disconnect is surfaced as an `AbortSignal` in the BFF route handler and forwarded to NestJS, which passes it to LangGraph `config.signal` and per-call Qdrant/Neo4j/LLM timeouts. Acceptance: text added to `03-architecture.md` and ADR 001; API06 extended or a new scenario covers "aborted request releases its reservation".

**A-02 (High) — The durable credential registry and atomic budget store are unnamed, yet Stage 1a's exit criteria and API06/API07 depend on them.**
Location: `06-delivery.md` stage 1a; ADR 001 "Before live operation, select…"; `features/api-access.feature` API06, API07. Failure example: API06 (two concurrent requests, one allowance) cannot pass with process-memory counters on Vercel Functions, which the design itself forbids; API07 requires a store to be unavailable. Stage 1a therefore cannot exit without an owner decision that is still listed as open. Impact: the first stage is blocked on an unresolved decision while fixture mode is simultaneously described as acceptable. Correction: define a development credential mode (hashed keys from environment configuration, in-process budget explicitly labelled single-instance/dev-only, API06 and API07 marked pending) for slice 1A, and move the durable-store requirement to the public-live gate (slice 1B). Record a recommended default for the store. Acceptance: `06-delivery.md` and ADR 001 distinguish the two modes; API06/API07 are tagged as 1B gates.

**A-03 (High) — Paused or deleted stores will be the normal state of a hobby deployment, and the design treats them as outages.**
Location: `03-architecture.md` hosting table and failure behaviour. Failure example (verified limits): a demo with no traffic for four days has an auto-paused Aura instance (72 h) that does not auto-resume; after seven idle days the Qdrant cluster is suspended; after four idle weeks the Qdrant cluster is deleted and the passage index must be rebuilt, which re-incurs embedding cost; after 30 paused days the Aura instance is deleted. The failure-behaviour section handles "unavailable" but not "paused and recoverable" versus "deleted and must be restored". Impact: the public demo spends most of its life degraded or offline; restoration cost is unbudgeted. Correction: add an expected-pause operations section: a keep-alive check with cadence shorter than 72 h for Aura and 7 days for Qdrant (manually triggered or an external scheduler, not assumed free), versioned release exports stored off-platform so rebuild is deterministic, and a documented restore drill whose cost is estimated before Stage 6. Acceptance: section present; restore drill is a Stage 6 exit criterion (already partly listed) with the deletion windows named.

**A-04 (Medium) — Verified Vercel Hobby constraints are not reflected in the design.**
Location: `03-architecture.md` hosting table and cost controls; ADR 001 deployment. Failure example: the design relies on "provider-side spend controls" and logs for operations, but on Hobby there is no Spend Management, exceeding included usage pauses the feature for up to 30 days, runtime logs are kept for one hour and log drains are unavailable (verified 5 November 2026). A bot burst through the public BFF could pause both projects for a month, and nothing would remain in logs to explain it an hour later. Separately, the BFF function waits on the API function, so each query consumes provisioned-memory time in two functions. Impact: public-deployment availability risk and loss of operational evidence. Correction: record the constraints with the verification date; require the API to write a per-request usage record (request ID, consumer, session hint, tokens, cost, outcome) to the durable store so evidence outlives the one-hour log window; note the double-function cost. Acceptance: hosting table row updated; usage record requirement in `03-architecture.md`.

**A-05 (Medium) — The query envelope is described in prose without an enumerated `status` or an HTTP mapping.**
Location: ADR 001 "Initial API surface". Failure example: "returns an answer, clarification or insufficient-evidence result" and "distinguish evidence insufficiency from service failure" do not say whether insufficient evidence is `200` with `status: insufficient_evidence` or a `4xx`, nor what the `status` values are. Impact: the standalone client and BFF would guess differently; contract tests have no target. Correction: enumerate `status ∈ {answer, clarification, insufficient_evidence}` all returned with HTTP `200`, failures only via the listed `4xx/5xx` codes; commit a minimal JSON Schema for the envelope as the first deliverable of slice 1A. Acceptance: ADR text updated; schema file is an acceptance item of the next task.

**A-06 (Medium) — Atomic "active version switch" is undefined for Neo4j Aura Free.**
Location: `03-architecture.md` "Offline ingestion and release"; SC15. Failure example: Qdrant can switch an alias to a shadow collection atomically; Aura Free has a single database with no alias or blue/green facility, so a "shadow graph" must live in the same database. SC15 ("no answer combines the new graph with the old passage index") is unenforceable unless every graph query filters on `corpus_version`. Impact: a half-promoted release could mix versions. Correction: specify that every reviewed claim and relationship carries `corpus_version`, every allowlisted query is parameterised on the active version, the active version is a single value in the application release manifest, and old-version graph data is deleted only after the manifest switch succeeds and capacity requires it. Acceptance: text added; SC15 references the manifest switch.

**A-07 (Low) — Database driver lifecycle on serverless is not addressed.**
Location: `03-architecture.md`. Failure example: a new Neo4j driver and Qdrant client per cold start; Aura connection limits for Free are not documented on the quota page fetched. Correction: note lazy singleton drivers per function instance, explicit per-call timeouts, and a check of connection limits at provisioning. Acceptance: one paragraph.

### Pass 3: Security and operations

**S-01 (High for public deployment) — One abusive visitor can exhaust the whole website's allowance; the BFF's "verified anonymous-session budgets" have no mechanism.**
Location: ADR 001 "The browser-facing BFF remains callable by visitors…"; API11. Failure example: all website traffic authenticates to NestJS as a single consumer, so the per-consumer limit is the site-wide limit. The BFF is told to enforce session budgets but runs as stateless functions with no shared store; a signed cookie counter can be replayed; the ADR simultaneously requires the BFF to strip identity headers. Impact: trivial denial of service of the public demo and of every other visitor; the one shared allowance also hits the Hobby pause behaviour in A-04. Correction: define a BFF-generated session hint: the BFF sets an HttpOnly cookie containing a random ID, derives `X-Session-Hint = HMAC(server_secret, id)` and forwards only that header; NestJS enforces per-hint sub-quotas within the website consumer using the same durable budget store, and ignores the header from any consumer other than the website consumer; hints never grant ownership. Payload-size and basic request-shape checks remain at the BFF. Acceptance: ADR section added; API11 wording aligned; new scenario for per-hint sub-quota.

**S-02 (Medium) — The prompt-injection defence is implicit rather than stated.**
Location: `03-architecture.md` online workflow; SC20. Failure example: SC20 says retrieved text "cannot change the tool allowlist", but the design never states whether the model can call any tool during a visitor request. Impact: an implementer could add a tool-calling node for "recovery retrieval" and reintroduce the attack surface. Correction: state explicitly that the online workflow exposes no model-callable tools; the model produces only typed classification and typed answer objects; retrieval, graph lookup and recovery are deterministic nodes driven by validated state, never by model-emitted actions; every citation ID in the output is validated against the evidence bundle. Acceptance: text added; SC20 unchanged but now backed by a design statement.

**S-03 (Medium) — No scenario enforces the rights gate on `GET /v1/sources/{sourceId}`.**
Location: ADR 001 API surface; `04-data-and-ontology.md` rights checks. Failure example: a source with `rights_status: not_reviewed` is served with an excerpt because the endpoint code has no status check. Impact: redistribution of third-party text contrary to the design's own rule. Correction: add API13: non-cleared sources return metadata and the canonical URL only; cleared sources return bounded excerpts; the excerpt length cap is a configuration value. Acceptance: scenario added; endpoint description updated.

**S-04 (Low) — Key format and hashing choice are unspecified.**
Correction: recommend a recognisable prefix (`ozsb_<keyid>_<secret>`) so leaked keys are scannable, SHA-256 of a ≥256-bit random secret (a password hash is unnecessary for high-entropy secrets), constant-time comparison as already stated. Acceptance: one sentence in ADR 001.

**S-05 (Medium) — Preview deployments from a public repository need explicit rules.**
Location: ADR 001 "Deployment and validation". Failure example: a preview API deployment configured with production Qdrant credentials, or a preview web deployment pointing at the production API, would spend production budget from an unreviewed branch. Correction: preview API deployments run in fixture mode or against a preview corpus with preview keys; preview web deployments only ever target a preview API; third-party pull requests do not receive secrets; preview deployments keep Vercel Authentication on. Acceptance: text added.

**S-06 (Low) — ADR 001's MCP OAuth plan should not assume Dynamic Client Registration.**
Verified from the official MCP blog (5 November 2026) that the 2026-07-28 specification deprecates DCR in favour of Client ID Metadata Documents and requires issuer validation. Correction: add one sentence so the later milestone plans against the current spec. Acceptance: ADR updated; R22 retained.

### Pass 4: Data and ontology

**D-01 (High) — There is no answer-time currency rule; freshness cadences are maintainer schedules, not staleness thresholds.**
Location: `04-data-and-ontology.md` "Freshness policy proposal"; `03-architecture.md` step 6; SC06. Failure example: a round-status passage last verified in July is retrieved in November; the weekly check "should" have run but no automation exists; nothing defines whether the answer is labelled "Source checked" or "Needs a current check". `Passage` has no validity fields; only `SourceVersion` does. Impact: SC06 and O4 are not decidable from the data model. Correction: define computed staleness: a claim or passage is current at `as_of` only if its `SourceVersion.last_verified_at` is within the staleness window for its source class and `valid_to` is null or after `as_of`; otherwise the UI label is "Needs a current check" regardless of whether a check was scheduled. Window defaults: round status/deadlines 14 days, program descriptions 90 days, ecosystem context 365 days (proposals). Acceptance: rule and defaults recorded; SC06 cites the rule.

**D-02 (Medium) — The dependency feature will rest mostly on editorial sequencing from the article.**
Location: `04-data-and-ontology.md` `BEFORE` predicate; US02; SB2. Failure example: official sources rarely state "Milestone A before Milestone B"; the article does. Reviewed `BEFORE` edges will therefore mostly be `assertion_kind: editorial`, which the design correctly bars from factual answers. Impact: the prerequisite map in SB2 will be mostly "Suggested next step" labels, which is honest but may disappoint if not expected. Correction: state this expectation; require the prerequisite map to display assertion kind per edge; count sourced versus editorial edges in the Stage 3 audit. Acceptance: sentences added to `04` and `06`.

**D-03 (Medium) — Reference answers can leak through the article passages in the corpus.**
Location: `05-evaluation.md` dataset plan. Failure example: a reference answer written from the article's routing text is "retrieved" from the article passage during evaluation, inflating faithfulness and recall for B1–B3 equally while telling nothing about primary-source grounding. Correction: reference answers must cite primary-source versions, never the article; run an ablation with article passages excluded from retrieval; report both. Acceptance: text added.

**D-04 (Low) — The bibliography manifest lacks the `SourceDocument` fields the ontology defines.**
Location: `data/sources/article-bibliography.json` versus `04-data-and-ontology.md` `SourceDocument`. Failure example: `jurisdiction`, `publisher`, `source_class` are absent; `source_role` exists instead. Correction: at Stage 1, extend the manifest schema (bump `manifest_version`) rather than keeping two shapes; left for the owner because it changes a data file. Acceptance: recorded as a deferred decision.

**D-05 (Low) — About 50 of 135 discovered URLs are outside Australia.**
Correction: the "out of initial scope" disposition already exists; record the count so Stage 1 effort is estimated honestly. Acceptance: count recorded in `06-delivery.md`.

**D-06 (Low) — Entity-resolution identifiers are not named.**
Correction: Organisation nodes keyed by canonical domain plus ABN/ACN where published; programs keyed by operator plus canonical program URL; ambiguous merges to review (already stated). Acceptance: one sentence in `04`.

### Pass 5: Evaluation

**E-01 (High) — The graph default-on gate is undecidable with the proposed test split.**
Location: `05-evaluation.md` "Dataset plan" and "Provisional release gates". Failure example: 15 frozen test questions across nine coverage categories leave perhaps 3–5 multi-hop questions; "+10 percentage points on supported multi-hop answers" is less than one question. Impact: the Stage 3 decision would be noise. Correction: require a minimum of 30 multi-hop questions in the slice used for the gate (drawing from development and validation sets for the decision, keeping the frozen test for final reporting), report bootstrap intervals, and state that the gate cannot be evaluated below that size. Acceptance: gate text updated.

**E-02 (Medium) — The seed file mixes answerable questions with UX test descriptions.**
Location: `evaluation/seed-questions.jsonl` Q09–Q12. Failure example: "The transcript got my town wrong. Can I fix it before sending?" is a behaviour test, not a founder question with a reference answer, yet it shares the schema. Correction: add a `kind` field (`answer_question` for Q01–Q08, `behaviour_test` for Q09–Q12) and note it in `05-evaluation.md`. Acceptance: file updated, still valid JSONL.

**E-03 (Low) — Judge calibration lacks an agreement target and a failure action.**
Correction: add a provisional target (Cohen's κ ≥ 0.6 against human labels on the 20-case calibration set) and the rule that aggregate judge scores are not reported until it is met. Acceptance: text added.

**E-04 (Low) — No trace/run-manifest schema connects the TypeScript runtime to the Python Ragas harness.**
Correction: add "trace record and run manifest schema" to `packages/contracts/` in the repository layout. Acceptance: layout updated.

### Pass 6: UX

**U-01 (High) — No failure or uncertainty storyboard exists, although US10 claims "All error variants" and the feedback protocol requires a stale-source or service-failure task.**
Location: `docs/ux/storyboards.md`; all four SVGs (rendered and inspected). Failure example: none of the five evidence-state labels defined in `research-and-design.md` ("Source checked [date]", "Needs a current check", "Sources disagree", "Suggested next step", "Outside current coverage") appears on any board; SC06, SC07, SC17 and SC18 have no drawn state; the SB1 "failure variant" exists only as prose. Impact: paper sessions cannot test the behaviours the design considers most important (visible limits). Correction: specify SB5 "Limits and failure states" in `storyboards.md` as a required board (historical-only evidence, sources disagree, outside coverage, vector outage with static directory, budget exhausted with preserved draft), to be drawn before Stage 0 sessions. Acceptance: SB5 specification present; SVG drawing recorded as owner/designer task.

**U-02 (Medium) — SB3 is described as a mobile journey but drawn at desktop proportions.**
Correction: note that SB3 must be re-drawn or annotated at phone width before testing dictation and transcript editing. Acceptance: note added.

**U-03 (Medium) — Label inconsistencies across boards and design text.**
Observed: SB1 "Location: Not specified" versus "Unknown" elsewhere; SB2 "Checked: date" versus "Source checked [date]"; SB1 panel 2 renders the state "IP ownership: Unknown" as the primary button, which reads as an action. Correction: align SB1 to "Unknown"; use the defined evidence label in SB2; relabel the SB1 button as the action "Mark IP as unknown". Acceptance: SVG text edits applied and re-rendered.

**U-04 (Medium) — SC02 and SC08 behaviours are not visible on the boards.**
Observed: no board shows a previous answer marked as based on earlier context; SB2's comparison shows "Conditions: view" without per-cell evidence affordance. Correction: add to the SB5 specification and to the Stage 0 session tasks. Acceptance: text added.

**U-05 (Low) — SB3 transcript panel shows "Stage: working prototype" of unexplained origin.**
Correction: annotate in `storyboards.md` that stage is a chip the founder set, not an inference from speech. Acceptance: sentence added.

**U-06 (Low, positive) — SVG accessibility is adequate.** `role="img"`, `<title>`/`<desc>`, real text nodes, 16 px minimum, contrast ≥ 4.54:1. No action.

**U-07 (Low) — Voice input needs an API change that the API surface does not mention.**
Correction: note that Phase 2 voice requires a transcription endpoint or provider path through NestJS with its own scope and budget; not in `/v1` initially. Acceptance: sentence added to ADR 001.

## 5. Round-by-round resolution log

Round 1: findings recorded above before any edit (commit "docs: record Claude design review findings").

Round 1 edits and Round 2 re-review: see the table appended below after edits were applied.

## 6. Traceability gaps

Filled in after Round 2.

## 7. Simulated storyboard observations

Filled in after Round 2.

## 8. Remaining decisions, owners and recommended defaults

Filled in after Round 2.

## 9. Blockers: starting development versus public deployment

Filled in after Round 2.

## 10. Readiness verdict

Filled in after Round 2.

## 11. Smallest recommended next implementation task

Filled in after Round 2.
