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

The browser-facing BFF remains callable by visitors. Hiding its upstream key does not prevent visitors or bots from consuming its allowance. Enforce payload limits, verified anonymous-session budgets and abuse controls at the BFF, with authoritative per-consumer and global limits in NestJS. CORS is not authentication. Cookie-authenticated operations require appropriate CSRF/origin protections; public origin checks alone are not a bot defence.

The BFF forwards only validated business inputs to fixed endpoints. It strips client-supplied credentials, consumer IDs, scopes and identity headers and never acts as a general URL proxy. MVP has no persisted private user resources. If accounts or private saved journeys are added, authenticate users separately and enforce per-user ownership; the shared website API key identifies the application, not an individual. Session hints used for anonymous quotas are never ownership credentials.

## API key authentication and authorisation

Protect business endpoints by default through NestJS guards/policy services; explicitly allow only minimal liveness and sanitised public documentation. [R19] REST uses `X-API-Key` over HTTPS. Invalid, absent, expired or revoked keys receive a generic `401`; valid identities lacking scope receive `403`.

Issue high-entropy random secrets with a non-secret lookup ID; store a cryptographic hash of the secret and compare verified digests in constant time. The raw key is shown once at issuance and held in the consumer's secret manager. A persistent registry records consumer ID, key ID, scopes, created/expiry/revoked timestamps and limits. Do not store raw secrets in the graph, repository or analytics.

Initial scopes: `query:execute`, `sources:read`, `capabilities:read`. The website receives these scopes only. No public key gets ingestion, review or administrative rights. Model instructions cannot expand scope. Derive consumer identity from verified credentials rather than request JSON or forwarded headers.

Rotation issues a second key for the same consumer, switches the consumer, then revokes the old key. Keep overlap explicit and brief; both keys share the consumer's quota. A revoked key must fail on the next request: validate registry state per request for MVP, with no stale positive authentication cache. Revocation stops new requests; it does not promise cancellation of work already in flight.

Before live operation, select a durable credential registry and atomic rate/budget store. These are operational dependencies, separate from corpus and LangGraph state; they are not assumed to be provided by Qdrant or process memory. Auth-registry failure fails closed. Reserve a conservative per-request cost allowance before model execution and reconcile actual usage afterward. Budget-store failure denies new paid work. Apply consumer and global concurrency/cost limits across both REST and MCP, with provider spend caps as a backstop. No new paid infrastructure is provisioned by this ADR.

## Initial API surface

| Endpoint | Scope | Behaviour |
| --- | --- | --- |
| `POST /v1/queries` | `query:execute` | Typed question and confirmed context; returns an answer, clarification or insufficient-evidence result |
| `GET /v1/sources/{sourceId}` | `sources:read` | Public citation metadata and only rights-cleared excerpts; no private snapshots or raw archive paths |
| `GET /v1/capabilities` | `capabilities:read` | Supported tasks, corpus version, coverage and feature availability |
| `GET /health/live` | Public | Minimal liveness; no credentials, database URLs or detailed errors |

The query envelope includes `schema_version`, `request_id`, `status`, `corpus_version`, `as_of`, `retrieval_mode`, structured answer/actions, claim-to-citation references, warnings and optional clarification. Distinguish evidence insufficiency (a normal domain result) from service failure. Use stable error codes with request IDs: `400` invalid input, `401` invalid authentication, `403` insufficient scope, `429` rate/budget limit with retry/reset information when known, `503` unavailable dependency, and `504` elapsed deadline. Never expose stack traces or internal prompts.

Start with JSON responses. Add optional POST response streaming only after validating it through both deployments: named progress events and a terminal validated result/error, the same response schema, disconnect cancellation and bounded duration. Native browser EventSource is not required. Clients must not automatically retry paid query POSTs; a later durable idempotency implementation can safely enable selected retries.

During implementation, generate a version-controlled OpenAPI artifact from NestJS DTOs/controllers and verify it in CI. Include security schemes, examples, errors and limits; generate the website client from that contract. Detect breaking changes before merge, retain `/v1` compatibility and introduce `/v2` for incompatible changes. NestJS provides OpenAPI generation support. [R20] This ADR is a contract requirement, not a claim that an OpenAPI artifact already exists.

## Future MCP layer

MCP is another interface to the same backend, not a separate reasoning stack. Initial candidates are `ask_startup_question`, `get_source` and `get_capabilities`; each has a precise input/output schema, scope mapping and limits. Responses retain citations, dates and coverage warnings. Do not expose arbitrary Cypher, raw database credentials, ingestion or unbounded tool loops. Tools can be read-only with respect to the corpus while still consuming an inference budget.

A future `apps/api` MCP module may call application services directly after normalising and validating an auth context. Enforcement lives in shared policy/application services as well as transport guards, so this path cannot bypass REST protections. A separately deployed adapter remains possible but must preserve equivalent identity and scope enforcement.

For broad remote HTTP MCP interoperability, plan OAuth-based authorisation and protected-resource discovery in accordance with the MCP version selected at implementation. An arbitrary API-key header is not universally supported by MCP clients. API keys remain appropriate for controlled server-to-server REST clients and potentially a local stdio wrapper holding its own scoped key. Validate token audience and scopes; do not forward MCP access tokens to unrelated upstream services or use the website key for every MCP user. [R22]

MCP implementation, OAuth setup and public consumer onboarding are later milestones. The first delivery proves that a non-Next.js client can use the same authenticated API and receive the same evidence contract.

## Deployment and validation

Keep `apps/web` and `apps/api` as separate projects in this repository and separate deployment roots. Proposed first hosting: two Vercel projects. Vercel supports NestJS as a Vercel Function; function limits still apply. [R21] Recheck Hobby eligibility and shared account limits; two projects do not double the free allowance. Use separate preview and production keys/data and pair preview frontend deployments with the intended API environment.

Validate the added hop, cold starts, cancellation and end-to-end latency before enabling streaming. Persistent workers and ingestion remain outside these request handlers. The API remains portable to another Node.js host if usage or runtime requirements outgrow this deployment.

Acceptance: [API scenarios](../../features/api-access.feature), stories US13–US15 and outcome O7 in the [product specification](../02-product.md).
