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

**Round 1.** Findings recorded before any edit (commit `b3397ed`). Documentation corrections then applied on `docs/claude-design-review` (commit `4292fb3`): `06-delivery.md`, `03-architecture.md`, `decisions/001-api-first-nestjs.md`, `04-data-and-ontology.md`, `05-evaluation.md`, `02-product.md`, `ux/storyboards.md`, both feature files, `evaluation/seed-questions.jsonl`, `ux/sb1-student.svg`, `ux/sb2-research.svg`, `README.md`. No owner requirement was changed.

**Round 2.** Re-review of the affected documents and cross-document consistency. Checks re-run: relative links and anchors (0 broken, including the new `#answer-time-currency-rule` anchor); scenario tags in both directions between `02-product.md` and the feature files; JSON/JSONL validity; SVG parse and re-render of the two edited boards. Two traceability defects were found and fixed in the same round (R2-01 below). One wording gap in the new session-hint contract was closed (R2-02). Reviewing my own edits is not independent validation; the owner should read the diff of `4292fb3` and the Round 2 commit with the same scepticism applied to the originals.

**Round 3 (external review by the repository owner).** After Round 2 I had recorded that no Critical or High finding remained at the design level. The owner then reviewed commit `5873e4c` on PR #2 (comment 6656764382, 5 November 2026) and raised four findings, two High and two Medium, all of which I accept as real defects in my Round 1 corrections. This is the independent validation that Rounds 1–2 could not provide. Corrections applied in the Round 3 commit; each is linked below (R3-01 to R3-04). No further rounds: the loop is at its three-round limit and the owner's findings are closed at the design level.

| ID | Severity | Status after Round 2 | Evidence / reason |
| --- | --- | --- | --- |
| P-01 | High | Resolved | `06-delivery.md`: slice 1A/1B split with distinct exit evidence; 1A has no rights-review or hosted-service dependency |
| P-02 | Medium | Resolved | SC22 added; ADR and UC01 define explicit `unknown`; SB1 label aligned |
| P-03 | Medium | Resolved | ADR: export is a client rendering of the envelope; required fields listed; UC04 cross-references it |
| P-04 | Medium | Resolved in documentation; decision deferred to owner | Counts recorded in `06-delivery.md`; first-jurisdiction choice remains open; slice 1A independent of it. Note: `01-plan-assessment.md` still states a federal + Queensland start; left as the owner's stated preference (R2-03) |
| P-05 | Low | Resolved | US14 now assigned to an Operator role |
| P-06 | Low | Resolved as a recommended default; owner to confirm | `06-delivery.md` layout and open-decision list |
| A-01 | High | Resolved | Lease/reconcile rule in `03` step 1 and ADR; cancellation mechanism paragraph; API06 extended |
| A-02 | High | Resolved at design level; store selection deferred to owner with a recommended default | Development credential mode defined in ADR; API06/API07 gated on durable stores; `06` open-decision entry |
| A-03 | High | Resolved at design level; drill is a Stage 6 exit criterion | "Expected paused states and restoration" in `03`; Stage 6 row updated |
| A-04 | Medium | Resolved | Hosting table row, cost-control bullets and usage-ledger requirement in `03`, with verification date |
| A-05 | Medium | Resolved | `status` enumeration, HTTP mapping and JSON Schema requirement in ADR |
| A-06 | Medium | Resolved | Release-switch paragraph in `03`; SC15 wording references the manifest |
| A-07 | Low | Resolved | Driver-lifecycle paragraph in `03` |
| S-01 | High (public) | Resolved at design level; remains a public-deployment prerequisite until implemented | Session-hint contract in ADR; API11 rewritten; API14 added; `03` fairness bullet |
| S-02 | Medium | Resolved | Explicit no-model-tools statement in `03` step 1 |
| S-03 | Medium | Resolved | API13 added; endpoint row updated |
| S-04 | Low | Resolved | Key format and digest sentence in ADR |
| S-05 | Medium | Resolved | Preview rules paragraph in ADR |
| S-06 | Low | Resolved | MCP 2026-07-28 note in ADR |
| D-01 | High | Resolved | "Answer-time currency rule" in `04`; referenced from `03` step 6; SC06 cites the label and window |
| D-02 | Medium | Resolved | "Expectations for prerequisite evidence" in `04`; UC02 and Stage 3 updated |
| D-03 | Medium | Resolved | Leakage paragraph in `05` |
| D-04 | Low | Deferred to owner | Changes a data file's schema; listed in `06` open decisions |
| D-05 | Low | Resolved | Count in `06` Stage 1 row |
| D-06 | Low | Resolved | Identifier sentence in `04` |
| E-01 | High | Resolved | Gate text in `05` requires ≥30 multi-hop questions and intervals; Stage 3 row updated |
| E-02 | Medium | Resolved | `kind` field added to all 12 records; explained in `05` |
| E-03 | Low | Resolved | κ target and failure action in `05` |
| E-04 | Low | Resolved | Contracts package now lists trace and run-manifest schemas |
| U-01 | High | Resolved at specification level; drawing deferred | SB5 specified in `storyboards.md` with the five exact labels; SVG to be drawn before Stage 0 sessions (owner/designer) |
| U-02 | Medium | Deferred (drawing task) | Requirement recorded in `storyboards.md` |
| U-03 | Medium | Resolved | SB1/SB2 text edits applied and re-rendered; contrast unchanged |
| U-04 | Medium | Resolved at specification level | SB5 panel 5 |
| U-05 | Low | Resolved | Sentence in `storyboards.md` |
| U-06 | Low | No action | Positive finding |
| U-07 | Low | Resolved | Sentence in ADR deployment section |
| R2-01 | Low | Resolved (Round 2) | Pre-existing: `API03` carried `@US13` only while the US14 row cites API02–API07; introduced in Round 1: API13 tagged `@US13` without appearing in the US13 row. Both fixed; both-direction tag check now passes |
| R2-02 | Low | Resolved (Round 2) | ADR now states the BFF overwrites and never forwards a browser-supplied `X-Session-Hint` |
| R3-01 | High (owner) | Resolved (Round 3) | Currency rule conflated freshness with applicability: `valid_from` was not checked, so a verified-but-future-effective requirement could be presented as applicable today. `04-data-and-ontology.md` now defines two independent tests (fresh at `as_of`; in effect at `as_of`), the future-effective qualifier "takes effect from [date]", the "effective date not stated" caveat, and a lower bound of `published_at` for null `valid_from`. SC23 added; a future-effective fixture is in the next task (criterion 5) |
| R3-02 | High (owner) | Resolved (Round 3) | Lease expiry released a monetary reservation even if a provider call had already incurred charges. ADR 001 now separates the concurrency lease (reclaimed on expiry) from the monetary reservation (never released on expiry; settled exactly once, idempotently by reservation ID, either reconciled to a usage report or conservatively at the reserved amount; late reports credited at most once); `03` step 1 and the cancellation paragraph updated; API06 extended with crash-after-paid-start and late-report cases, with the expected remaining budget stated |
| R3-03 | Medium (owner) | Resolved (Round 3) | A Qdrant alias switch plus a manifest update is not atomic across stores. `03` now pins each request to one immutable manifest (concrete collection identifier plus graph corpus version) resolved once at request start and carried through retrieval, graph lookup and recovery; old releases are retained for at least the maximum request deadline; partial failure writes no manifest; rollback flips the pointer. SC15 reworded; SC24 added for requests spanning promotion, partial failure and rollback |
| R3-04 | Medium (owner) | Resolved (Round 3) | Slice 1A required API08–API10 (which need `apps/web`) and slice 1B required API12 (which needs the MCP adapter). `06-delivery.md` roadmap rows and slice descriptions now gate 1A on API01–API03, API13 (fixtures) and the standalone part of API10; API08, API09 and the website-dependent part of API10 on 1B; API12 on Stage 7. Deferred checks are listed as pending, not implied to pass. Section 11 below updated to match |
| R2-03 | Low | Disputed / left for owner | `01-plan-assessment.md` asserts a federal + Queensland start; `06-delivery.md` (at the reviewed SHA and after edits) treats it as open. I did not change `01` because it reads as the owner's preference; the owner should either confirm it or soften `01` |

## 6. Traceability gaps

Outcome → persona → story → use case → scenario → storyboard was traced for every row of `02-product.md`. Gaps that remain after Round 2 (none blocks slice 1A):

- SC01 (one clarification) and SC02 (previous answer marked as based on earlier context) are mapped to SB1–SB3 but no drawn panel shows either; SB5 panel 5 covers SC02 once drawn, and SB4 panel 2 is the only drawn clarification.
- SC06, SC07, SC17 and SC18 are mapped to "All" boards but no drawn board shows a limit or failure state; SB5 is specified for this.
- SB3 renders "Compare options" and "Export my checklist" (SC08, SC09) but the storyboard table lists only SC01/02/05/10/11 for SB3; SB1 renders "Compare options" for a persona with nothing to compare (template artefact). Minor table update for the owner when SB5 is drawn.
- US08 (curator) and US09 (developer) have scenarios SC14–SC16 and prose journeys but no board; the design says a console is unnecessary for the first demo, which is consistent.
- O5 (reproducibility) depended on an unspecified trace format; now named in the contracts package but no schema exists yet.
- No scenario yet covers the keep-alive/restore behaviour; it is listed in `06` implementation checks and should get a scenario when slice 1B is specified. The usage ledger is now exercised indirectly by API06's settlement cases.
- `article_html_sha256` and the 135-link count in the manifest could not be verified from this session (section 2).

## 7. Simulated storyboard observations

These are my own walkthroughs of the rendered boards, playing each persona. They are design critiques, not participant data, and must not be reported as usability findings.

- **SB1 (Mei).** The route from goal to a university conversation is legible in four panels and the success criterion ("I know the next conversation") is testable. Likely stumbles: panel 1 offers "Compare options" before she has anything to compare; panel 3's evidence line is a placeholder ("source + checked date"), so a participant cannot attempt the O2 task of finding the date; nothing on the board shows what happens when the only material is historical, so the failure variant cannot be tested from this board.
- **SB2 (Arun).** The prerequisite list mixes a user status ("Customer evidence: in progress") with corpus conditions ("Program conditions: to check") without saying who set which; a participant will reasonably ask whether the app is tracking them. The comparison now shows the defined "Source checked [date]" label and an evidence affordance per row, but the only criteria are stage and conditions, which is thin for a "consistent criteria" test. "Add a diagram (later)" is visible but inert, which may draw attention away from the task.
- **SB3 (Jess).** The intentional-start recording and editable transcript are clear. The board is desktop-proportioned, so the mobile constraints that motivate the persona (thumb reach, keyboard over transcript) are untested. "Cancel recording" in the review panel occurs after recording has stopped; "Discard transcript" would describe the action. Coverage is "shown explicitly" in words only; the outside-coverage state the persona most needs is not drawn.
- **SB4 (Sam).** The single clarification ("who holds customer funds?") with a "Keep as unknown" option is the strongest panel in the set and directly exercises SC13. "Source track A / B" is abstract; a participant will not know what a track is without an example. The success framing ("a better adviser conversation") avoids any permission language, as intended.

## 8. Remaining decisions, owners and recommended defaults

| Decision | Owner | Recommended default | Needed by |
| --- | --- | --- | --- |
| Accept the slice 1A/1B split and the development credential mode | Owner | Accept; it preserves every stated requirement and removes the dependency of first code on rights review and hosted services | Before slice 1A |
| Durable credential registry and atomic budget/usage store | Owner | One managed Postgres with a free tier, single transaction per reservation; Redis-compatible store as the alternative | Slice 1B |
| Model provider and monthly spend ceiling | Owner | Not needed for slice 1A acceptance (deterministic fixture responder); set a currency-specific cap before any live call | Slice 1B / Stage 2 |
| First real jurisdiction | Owner | Keep federal + Queensland as the hypothesis but confirm after seeing Stage 1 dispositions; `01-plan-assessment.md` wording to match | Stage 1 |
| Ingestion language | Owner | TypeScript sharing `packages/contracts` | Stage 1 |
| Bibliography manifest schema extension (`publisher`, `source_class`, `jurisdiction`) | Owner | Extend at Stage 1 with `manifest_version` bump | Stage 1 |
| Draw SB5 and a phone-width SB3 | Owner / designer | Use the five exact evidence-state labels | Before Stage 0 sessions |
| Original research archive location | Owner | If unrecoverable within Stage 1, state so in the README and proceed on fresh fetches | Stage 1 |
| Recruitment of real founders/navigators | Owner | Start with P2 and P3 as the storyboards doc already suggests | Stage 0/4 |
| Keep-alive scheduler for free-tier stores | Owner | Manual weekly trigger documented in the restore drill; external scheduler only if cost is known | Stage 6 |
| Hobby eligibility if the demo is linked from a company property | Owner | Keep the demo on a personal account and unbranded until the commercial question is settled | Stage 6 |

## 9. Blockers: starting development versus public deployment

Blockers to starting development (slice 1A): **none remaining** after the Round 1 edits, provided the owner accepts the slice split and development credential mode (first row of section 8). Everything slice 1A needs is specified: contract shape, status enumeration, explicit-unknown rule, currency rule, fixture-mode behaviour, no-tools boundary, development credentials.

Prerequisites before any public deployment (slice 1B / Stage 6), each traceable to a finding:

1. Durable credential registry and atomic budget store selected and implemented; API04–API07 passing (A-02).
2. Session-hint sub-quotas implemented and API11/API14 passing, because one visitor can otherwise exhaust the site (S-01).
3. Concurrency leases, conservative monetary settlement and cancellation validated on the actual Vercel runtime (A-01, R3-02).
4. Keep-alive policy and a rehearsed restore drill with recorded cost, because both free-tier stores pause and are eventually deleted (A-03).
5. Acceptance of Vercel Hobby behaviour: no spend management, 30-day feature pause on overage, one-hour logs; usage ledger implemented (A-04).
6. Rights gate on `/v1/sources` implemented and every served real source dispositioned (S-03, D-04).
7. Model-provider spend cap and monthly ceiling set (open decision).
8. No claim about O1–O3 until real participants have been observed; SB5 drawn before paper sessions (U-01).
9. Per-request release pinning (SC24) demonstrated across a promotion and a rollback before the first corpus release is swapped under live traffic (R3-03).

## 10. Readiness verdict

**Ready for the first slice (1A) with specified prerequisites.** The proposal is coherent, its security model is sound at the design level, and after the Round 1 and Round 3 corrections it is specified tightly enough to begin a fixture-mode NestJS slice. The owner's Round 3 review found two High defects in my own Round 1 corrections (freshness versus applicability; monetary settlement on lease expiry), which is a reminder that the verdict rests on the owner's reading of the final diff, not on my re-review. It is **not** ready for public deployment: the nine prerequisites in section 9 stand between slice 1A and a live demo, and most of them are decisions or operational work rather than design gaps.

Scope judgment: the design is appropriately ambitious for a learning project but carries a long tail (voice, visual input, MCP, OAuth, X discovery, curator tooling) that is correctly deferred. The corrections keep that tail deferred and make the head small enough to build.

## 11. Smallest recommended next implementation task

**Task: slice 1A-0, "fixture-mode `/v1/queries` contract".** Build `apps/api` as a NestJS project that serves the query contract end to end against a fictional fixture corpus, with development credentials, no Next.js, no hosted service, no Neo4j and no paid call. Generation uses a deterministic fixture responder behind the same interface a model-backed generator will later implement.

Acceptance criteria (all checkable without credentials, in CI):

1. `apps/api` boots locally; `GET /health/live` returns `200` with no authentication and no configuration details.
2. `packages/contracts/query-envelope.schema.json` exists; the OpenAPI document generated from the NestJS DTOs is committed, and a CI check validates the envelope examples against the schema and fails on a removed required field (the standalone part of API10; the website-dependent part waits for `apps/web` in slice 1B).
3. Development credential registry loads from environment configuration: a key in `ozsb_<key_id>_<secret>` form with scopes `query:execute`, `sources:read`, `capabilities:read`; a missing, malformed or unknown key gets a generic `401`; a key holding only `sources:read` gets `403` on `POST /v1/queries`; tests assert that no retrieval call starts in either case (API02 for the `missing`/`invalid` rows, API03).
4. A fictional fixture corpus of at least ten passages across at least three invented programs, including one round whose status passage is dated outside the 14-day window, one closed round, and one requirement whose `valid_from` is after the fixture `as_of` date, loaded into a local Qdrant container or an in-process vector adapter behind the retrieval interface; the fixture README states that every program, round and source is invented.
5. `POST /v1/queries` with the early-stage founder fixture question returns `status: answer`, at most three actions, `as_of`, `corpus_version`, `retrieval_mode: dense`, and citation IDs that all resolve to fixture passages; the stale fixture's citation carries the computed label "Needs a current check"; the future-effective requirement is absent from today's prerequisites and, where cited, carries "takes effect from [date]" (D-01, R3-01; SC05, SC06, SC23).
6. The closed-round fixture question returns no action that recommends applying to that round, and the condition is shown as unresolved (SC04, SC06 fixture).
7. A question whose fixture pathways differ by jurisdiction returns `status: clarification` when jurisdiction is absent, and `status: answer` with a coverage warning when `confirmed_context.jurisdiction` is `unknown` (SC01, SC22).
8. `GET /v1/capabilities` returns `credential_mode: development`, the corpus version and the coverage statement; `GET /v1/sources/{id}` returns metadata for every fixture source and an excerpt only for fixtures marked `cleared` (API13 with fixtures).
9. A standalone fixture client (a script, not Next.js) runs criteria 3–8 over real HTTP against the running API and exits non-zero on any failure; CI runs it. This is the O7/API01 evidence in its smallest form.

Explicitly pending after this task, not implied to pass: API04–API09, API11, API12, API14, the website-dependent part of API10, SC15/SC24 under live promotion, and all durable-store behaviour (slice 1B and later).

Explicitly out of scope for this task: Next.js, Qdrant Cloud, Neo4j, durable stores, real sources, streaming, voice, MCP, and any model call (a model-backed generator may be added behind a flag with a key, but acceptance does not depend on it).
