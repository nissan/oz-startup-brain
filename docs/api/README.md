# Oz Startup Brain API, slice 1A-0 (fixture mode)

This is the first runnable increment (#24). The API serves a fixed fictional corpus through a deterministic responder, using development credentials. It makes no network, database or model call. Every program, round, organisation and URL it returns is invented and uses the reserved `.invalid` domain. Nothing here is advice, and a fixture answer is not evidence of answer quality.

## Run it

You need Node 22.12 or later on the 22 line, and npm 10.

```sh
npm ci
npm run build
export OZSB_API_KEY=$(npm run -s dev:keys)   # stores the digest in .ozsb/dev-keys.json (gitignored); prints the key once
npm run -s api:start                          # http://127.0.0.1:3000
```

In a second shell, with the same `OZSB_API_KEY`:

```sh
npm run -s client:fixture                                          # scripted tour of every fixture behaviour; exit 1 on any failure
npm run -s client:fixture -- --question "Is round A1 open?"        # one query, printed as JSON
npm run -s client:fixture -- --question "What should I do next for support?" --jurisdiction unknown
```

To do both in one step, run `npm run demo:fixture`. It builds, starts the API on a free loopback port with an ephemeral in-memory key, runs the standalone client over HTTP, then stops the API. CI runs the same script.

With curl:

```sh
curl -s -H "X-API-Key: $OZSB_API_KEY" -H 'Content-Type: application/json' \
  -d '{"question":"What does round A2 require today?"}' http://127.0.0.1:3000/v1/queries
```

## Contract

- **Source of truth:** [`packages/contracts/schemas/v1.schema.json`](../../packages/contracts/schemas/v1.schema.json), in JSON Schema 2020-12. Three things are derived from it:
  - the TypeScript types in `packages/contracts/src/generated/`;
  - the runtime validators, which the API applies to every request and response;
  - `components.schemas` in the NestJS-generated [`openapi.json`](openapi.json), which uses OpenAPI 3.1.
- **Generated client:** [`packages/api-client`](../../packages/api-client) is generated from `openapi.json` with openapi-typescript and openapi-fetch. It validates every response against the contract and never retries query POSTs.
- **Compatibility:** [`openapi.v1.baseline.json`](openapi.v1.baseline.json) is the frozen v1 baseline. `npm run check:compat` fails on any change that could break a v1 client (API10):
  - an operation, documented response, property or requirement is removed;
  - a type changes;
  - an enumeration loses a value, or gains one in a response;
  - a request field is newly required or narrowed;
  - a property is added to a response schema. v1 response schemas are closed, so this counts as breaking.

  An additive request field, such as the later ADR 002 `task_intent`, passes. Update the baseline only when deliberately publishing a new contract version.
- **Drift:** `npm run check:generated` regenerates the types, the OpenAPI document and the client, then fails if any committed file differs.

| Endpoint | Scope | Notes |
| --- | --- | --- |
| `POST /v1/queries` | `query:execute` | Takes a `QueryRequest`. Returns a `QueryEnvelope` with HTTP 200 whether `status` is `answer`, `clarification` or `insufficient_evidence`. |
| `GET /v1/capabilities` | `capabilities:read` | Announces `credential_mode: development`, `responder: fixture`, `budget_store: in_process_development`, the pinned clock and whether harness controls are on. |
| `GET /v1/sources/{sourceId}` | `sources:read` | Returns public metadata. It includes an excerpt of at most `OZSB_EXCERPT_MAX_CHARS` characters (default 280), and only when `rights_status` is `cleared`. Snapshot paths are never returned. |
| `GET /health/live` | public | Returns `{"status":"ok"}`. |

Errors always use the `ErrorResponse` shape and carry a server-generated `request_id`, which is also sent in the `X-Request-Id` header. The API never returns a stack trace.

| Status | Codes |
| --- | --- |
| 400 | `invalid_request`, with `details` |
| 401 | `unauthenticated`. The response is identical whether the key is missing, invalid, expired or revoked. |
| 403 | `insufficient_scope` |
| 404 | `not_found` |
| 413 | `payload_too_large`. The body limit is 16 KB. |
| 429 | `budget_exhausted` or `concurrency_limited`, with `retry_after_seconds` and a `Retry-After` header |
| 504 | `retrieval_timeout` |
| 500 | `internal_error` |

Authentication and scope checks run before the body is read, validated or admitted. A rejected call therefore starts no retrieval and uses no allowance.

## Credentials and budget (development mode only)

- **Key format:** keys look like `ozsb_<key_id>_<secret>`, with a 256-bit secret.
- **Registry:** the registry (`OZSB_DEV_KEYS` as JSON, or `OZSB_DEV_KEYS_FILE`, default `.ozsb/dev-keys.json`) stores only SHA-256 digests. Each request's key is checked against them in constant time. The API refuses to start if the registry contains anything that looks like a raw key.
- **Revocation and expiry:** to revoke a key, set its `revoked_at`; to make one expire, set its `expires_at`. Restart the API for either change to take effect.
- **Budget:** a per-consumer, single-process counter with a daily allowance (`OZSB_DAILY_QUERY_ALLOWANCE`, default 500) and concurrency leases (`OZSB_MAX_CONCURRENT_QUERIES`, default 4; a lease expires after 30 s). This is not a durable or global spend cap and records no monetary reservations. API06 and API07 cannot pass in this mode.
- **Never public:** development mode refuses to start when `VERCEL`, `VERCEL_ENV` or `NODE_ENV=production` is set. The only accepted values are `OZSB_RESPONDER=fixture` and `OZSB_CREDENTIAL_MODE=development`; any other value is a startup error.

## Pinned clock and harness controls

**Pinned clock.** Answers are computed at a pinned `as_of`, which is the corpus default `2026-11-05T00:00:00Z`. The currency rule applies at that instant (see [docs/04-data-and-ontology.md](../04-data-and-ontology.md)):
- a claim is **future-effective** when its `valid_from` is after `as_of`;
- a claim is **historical** when its `valid_to` is on or before `as_of`;
- a claim is **unverified** when its evidence falls outside the source class's staleness window, or its verification date is after `as_of`.

Future-effective and historical claims never appear in today's actions. Unverified evidence is labelled "Needs a current check" and is never stated as current.

**Harness controls.** These set the clock and the named faults (`vector_timeout`, `budget_exhausted`, `graph_unavailable`) for local test processes only (docs/06-delivery.md). All of the following must hold, or the API refuses to start:
- `OZSB_HARNESS_CONTROLS=enabled` and `OZSB_HARNESS_ENV=isolated-local-test` are both set;
- the host is loopback;
- the responder is the fixture responder;
- credential mode is development;
- no public-deployment marker is set.

Setting `OZSB_HARNESS_AS_OF` or `OZSB_HARNESS_FAULT` without the enabling pair is also a startup error. Once the harness is enabled, those two variables set the starting clock and fault.

Tests change the clock and fault through the in-process `HarnessControls.set()`, and `reset()` restores the configured start. No HTTP route, header, query parameter or body field can change either.

| Fault | Response |
| --- | --- |
| `vector_timeout` | 504 `retrieval_timeout` |
| `budget_exhausted` | 429 before retrieval |
| `graph_unavailable` | 200 with `retrieval_mode: fixture_passages_only`, `prerequisite_sequence: null` and a `graph_unavailable` service warning. Capabilities reports the graph as `unavailable`. |

## What this slice does not establish

- **API scenarios still pending:** API04–API09, API11, API12, API14 and API15. API10's website half waits for #25.
- **Founder scenarios:** the fixture states for clarification, SC22 explicit Unknown, SC23 future-effective, closed rounds and insufficient evidence are shown at the API level only. The full founder scenarios also need the UI, persona tasks and live evidence.
- **Not included:** live retrieval, the graph, a decision provider, model quality, durable credentials or budget, hosting, streaming, MCP and `task_intent`.
