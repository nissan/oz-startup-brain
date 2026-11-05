# ADR 001: API-first NestJS backend

Date: 5 November 2026. Status: required architectural direction requested by the owner; implementation and operational details remain to be validated. Supersedes the initial proposal to execute retrieval directly in Next.js handlers.

## Decision and rationale

Build a designated `apps/api` NestJS project with independently deployable REST endpoints. The Next.js application in `apps/web` consumes this API through its server-side handlers. External consumers can later use their own API keys, and an MCP adapter can expose the same application capabilities to agents.

The extra service boundary adds deployment configuration, network latency and credential management. It is justified by the explicit goal of backend reuse. Start with one modular NestJS application, not separate microservices for retrieval, graph queries and generation.

## Technical requirements

| ID | Requirement |
| --- | --- |
| TR01 | NestJS owns runtime validation, authentication, authorisation, quotas, LangChain/LangGraph execution, retrieval and evidence-backed response contracts. |
| TR02 | Next.js owns presentation and a thin backend-for-frontend (BFF). It must not import the retrieval/workflow implementation or connect directly to model/database services. |
| TR03 | The BFF calls an allowlisted NestJS origin over HTTPS using a dedicated, least-privilege server-side API key. No browser receives that key. |
| TR04 | Each consumer has its own identity, credentials, scopes, limits and revocation state. The website key is never distributed to third parties. |
| TR05 | Versioned `/v1` REST contracts, OpenAPI documentation and a generated TypeScript client allow use without Next.js. |
| TR06 | A future MCP adapter reuses the same application services and authorisation policy. It must preserve caller identity, scopes, evidence and quotas. |
| TR07 | The API and website deploy independently; integration and contract tests exercise the real HTTP boundary. |

## Ownership and trust boundaries

The browser sends user input to same-origin Next.js routes. Server-only code calls NestJS using `OZ_STARTUP_API_BASE_URL` and `OZ_STARTUP_API_KEY`. Only NestJS holds the online LLM and database credentials. Offline ingestion retains separately scoped write credentials.

Use a `server-only` module for the Next.js API client. Do not prefix the key with `NEXT_PUBLIC_`, place it in `next.config.js` public `env`, return it through props/HTML/JSON, log it, put it in a URL or expose it through browser storage. Runtime configuration must fail closed when the backend origin or credential is missing. Next.js documents the distinction between private and browser-bundled environment variables. [R18]

The browser-facing BFF remains callable by visitors. Hiding its upstream key does not prevent visitors or bots from consuming its allowance. Enforce payload limits, request-shape validation and best-effort burst limits at the BFF, with authoritative per-consumer, per-session and global limits in NestJS. CORS is not authentication. Cookie-authenticated operations require appropriate CSRF/origin protections; public origin checks alone are not a bot defence.

Session-hint contract (per-visitor fairness within the single website consumer): the BFF sets an `HttpOnly`, `SameSite=Lax` cookie holding a random session ID with a short lifetime; on each upstream call it sends `X-Session-Hint: <HMAC-SHA256(server_secret, session_id)>` and nothing else about the visitor. NestJS accepts this header only from the website consumer identity, ignores it from every other consumer, and enforces per-hint sub-quotas (requests per hour and per day, concurrent requests) inside the website consumer's allowance using the same durable budget store. A hint never identifies a person, never grants ownership of any resource, and is rotated by the BFF when the cookie expires. The BFF never counts sessions in process memory as if that were authoritative, because Vercel Functions share no memory.

The BFF forwards only validated business inputs to fixed endpoints. It strips client-supplied credentials, consumer IDs, scopes and identity headers and never acts as a general URL proxy. MVP has no persisted private user resources. If accounts or private saved journeys are added, authenticate users separately and enforce per-user ownership; the shared website API key identifies the application, not an individual. Session hints used for anonymous quotas are never ownership credentials.

## API key authentication and authorisation

Protect business endpoints by default through NestJS guards/policy services; explicitly allow only minimal liveness and sanitised public documentation. [R19] REST uses `X-API-Key` over HTTPS. Invalid, absent, expired or revoked keys receive a generic `401`; valid identities lacking scope receive `403`.

Issue high-entropy random secrets (at least 256 bits) with a non-secret lookup ID, formatted with a recognisable prefix such as `ozsb_<key_id>_<secret>` so leaked keys can be found by secret scanners; store a SHA-256 digest of the secret (a slow password hash is unnecessary for secrets of this entropy) and compare digests in constant time. The raw key is shown once at issuance and held in the consumer's secret manager.

Development credential mode (slice 1A only): a registry loaded from environment configuration containing key IDs, scopes and digests, with an in-process single-instance budget. This mode must announce itself in `GET /v1/capabilities` (`credential_mode: development`) and is never deployed publicly. API06 and API07 cannot pass in this mode and are gated on the durable stores in slice 1B. A persistent registry records consumer ID, key ID, scopes, created/expiry/revoked timestamps and limits. Do not store raw secrets in the graph, repository or analytics.

Initial scopes: `query:execute`, `sources:read`, `capabilities:read`. The website receives these scopes only. No public key gets ingestion, review or administrative rights. Model instructions cannot expand scope. Derive consumer identity from verified credentials rather than request JSON or forwarded headers.

Rotation issues a second key for the same consumer, switches the consumer, then revokes the old key. Keep overlap explicit and brief; both keys share the consumer's quota. A revoked key must fail on the next request: validate registry state per request for MVP, with no stale positive authentication cache. Revocation stops new requests; it does not promise cancellation of work already in flight.

Before live operation, select a durable credential registry and atomic rate/budget store. These are operational dependencies, separate from corpus and LangGraph state; they are not assumed to be provided by Qdrant or process memory. Auth-registry failure fails closed. Reserve a conservative per-request cost allowance before model execution, under a lease that outlives the application deadline, and reconcile actual usage on every outcome (completion, abort, timeout, error); expired leases are reclaimed by the store. Budget-store failure denies new paid work. The same store holds the per-request usage ledger described in the architecture document. Apply consumer and global concurrency/cost limits across both REST and MCP, with provider spend caps as a backstop. No new paid infrastructure is provisioned by this ADR.

## Initial API surface

| Endpoint | Scope | Behaviour |
| --- | --- | --- |
| `POST /v1/queries` | `query:execute` | Typed question and confirmed context; returns an answer, clarification or insufficient-evidence result |
| `GET /v1/sources/{sourceId}` | `sources:read` | Public citation metadata (publisher, title, canonical URL, source class, version dates, `last_verified_at`, rights status) for every known source; a bounded text excerpt only when `rights_status` is cleared, with the excerpt length a configuration value; never private snapshots or raw archive paths. The rights gate is enforced in code, not by omission from the index (API13) |
| `GET /v1/capabilities` | `capabilities:read` | Supported tasks, corpus version, coverage and feature availability |
| `GET /health/live` | Public | Minimal liveness; no credentials, database URLs or detailed errors |

The query envelope includes `schema_version`, `request_id`, `status`, `corpus_version`, `as_of`, `retrieval_mode`, structured answer/actions, claim-to-citation references, warnings and optional clarification. `status` is an enumeration: `answer`, `clarification` or `insufficient_evidence`; all three are domain results returned with HTTP `200`. Distinguish evidence insufficiency (a normal domain result) from service failure. Use stable error codes with request IDs: `400` invalid input, `401` invalid authentication, `403` insufficient scope, `429` rate/budget limit with retry/reset information when known, `503` unavailable dependency, and `504` elapsed deadline. Never expose stack traces or internal prompts.

The request carries `confirmed_context`, in which any field may hold the explicit value `unknown`. The workflow never returns a `clarification` for a field the caller has marked `unknown`; it answers with a coverage warning naming the options excluded or the conditions left unresolved because of it. This keeps the one-clarification rule and SC01 consistent with a founder's right not to disclose.

The envelope is the only input to the checklist export (SC09). Export is a client-side rendering with no additional endpoint, so the envelope must carry everything the export needs: the confirmed context as used, `corpus_version`, `as_of`, each citation's publisher, canonical URL, source-version date and verification date, each unresolved condition, the evidence-state label per claim, and the standing "information and routing, not an application or approval" statement.

A minimal JSON Schema for this envelope, committed under `packages/contracts/`, is the first artefact of slice 1A; the OpenAPI document generated from NestJS must validate against it.

Start with JSON responses. Add optional POST response streaming only after validating it through both deployments: named progress events and a terminal validated result/error, the same response schema, disconnect cancellation and bounded duration. Native browser EventSource is not required. Clients must not automatically retry paid query POSTs; a later durable idempotency implementation can safely enable selected retries.

During implementation, generate a version-controlled OpenAPI artifact from NestJS DTOs/controllers and verify it in CI. Include security schemes, examples, errors and limits; generate the website client from that contract. Detect breaking changes before merge, retain `/v1` compatibility and introduce `/v2` for incompatible changes. NestJS provides OpenAPI generation support. [R20] This ADR is a contract requirement, not a claim that an OpenAPI artifact already exists.

## Future MCP layer

MCP is another interface to the same backend, not a separate reasoning stack. Initial candidates are `ask_startup_question`, `get_source` and `get_capabilities`; each has a precise input/output schema, scope mapping and limits. Responses retain citations, dates and coverage warnings. Do not expose arbitrary Cypher, raw database credentials, ingestion or unbounded tool loops. Tools can be read-only with respect to the corpus while still consuming an inference budget.

A future `apps/api` MCP module may call application services directly after normalising and validating an auth context. Enforcement lives in shared policy/application services as well as transport guards, so this path cannot bypass REST protections. A separately deployed adapter remains possible but must preserve equivalent identity and scope enforcement.

For broad remote HTTP MCP interoperability, plan OAuth-based authorisation and protected-resource discovery in accordance with the MCP version selected at implementation. As of the 2026-07-28 specification (checked against the official MCP blog on 5 November 2026), Dynamic Client Registration is deprecated in favour of Client ID Metadata Documents and clients must validate the authorization server's `iss`; do not design the later milestone around DCR. An arbitrary API-key header is not universally supported by MCP clients. API keys remain appropriate for controlled server-to-server REST clients and potentially a local stdio wrapper holding its own scoped key. Validate token audience and scopes; do not forward MCP access tokens to unrelated upstream services or use the website key for every MCP user. [R22]

MCP implementation, OAuth setup and public consumer onboarding are later milestones. The first delivery proves that a non-Next.js client can use the same authenticated API and receive the same evidence contract.

## Deployment and validation

Keep `apps/web` and `apps/api` as separate projects in this repository and separate deployment roots. Proposed first hosting: two Vercel projects. Vercel supports NestJS as a Vercel Function; function limits still apply. [R21] Recheck Hobby eligibility and shared account limits; two projects do not double the free allowance, and the BFF hop means each website query is billed in two functions. Use separate preview and production keys/data and pair preview frontend deployments with the intended API environment.

Preview rules for a public repository: preview deployments of `apps/api` run in fixture mode or against a preview corpus with preview-only keys and never hold production store credentials; preview deployments of `apps/web` only ever target a preview API; pull requests from forks must not receive any secret; preview deployments keep Vercel Authentication enabled. Phase 2 voice input will need a transcription path (an endpoint with its own scope and budget, or a provider route through NestJS) that is not part of the initial `/v1` surface.

Validate the added hop, cold starts, cancellation and end-to-end latency before enabling streaming. Persistent workers and ingestion remain outside these request handlers. The API remains portable to another Node.js host if usage or runtime requirements outgrow this deployment.

Acceptance: [API scenarios](../../features/api-access.feature), stories US13–US15 and outcome O7 in the [product specification](../02-product.md).
