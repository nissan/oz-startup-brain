Feature: API-first access through a designated NestJS backend
  These scenarios specify requirements, not implemented or executed tests.
  REST and future MCP access share the same application policies.

  @API01 @US13 @O7 @TR01 @TR05
  Scenario: Use the backend without Next.js
    Given an external server client has a valid query-scoped API key
    When it submits a valid query to the NestJS v1 API without browser cookies
    Then it receives the documented answer or clarification envelope
    And evidence, corpus version and coverage warnings are preserved

  @API02 @US13 @US14 @O7 @TR04
  Scenario Outline: Reject unauthenticated requests before paid work
    Given the supplied API key is "<state>"
    When a business endpoint is requested
    Then the API returns a generic 401 response
    And no model or retrieval call is started
    Examples:
      | state   |
      | missing |
      | invalid |
      | expired |
      | revoked |

  @API03 @US13 @US14 @O7 @TR04
  Scenario: Enforce operation scope
    Given a valid consumer key has only sources:read scope
    When it calls the query endpoint
    Then the API returns 403 before paid execution
    And client-supplied scopes or consumer IDs cannot change this decision

  @API04 @US14 @O7 @TR04
  Scenario: Rotate a consumer key without multiplying its quota
    Given old and new keys are active during an explicit rotation window
    When either key is used
    Then both calls count against the same consumer allowance
    When the old key is revoked
    Then its next request fails with 401
    And the new key continues to work within the original allowance

  @API05 @US14 @O7 @TR04
  Scenario: Revoke one consumer independently
    Given consumers A and B have different keys
    When consumer A's key is revoked
    Then A's next request fails with 401
    And B's key remains valid

  @API06 @US14 @O7 @TR04
  Scenario: Enforce a budget across concurrent requests
    Given the consumer has allowance for one more query
    And the durable atomic budget store is in use
    When two requests attempt to reserve allowance concurrently
    Then at most one request starts paid execution
    And the other receives a documented 429 response
    When the started request is aborted by its client before completion
    Then its concurrency slot is released no later than lease expiry
    And its monetary reservation is reconciled to reported usage, or settled at the reserved amount if usage is unknown
    When a request crashes after paid execution has started and no usage report arrives
    Then the reservation is settled conservatively at the reserved amount exactly once
    And the consumer's remaining budget equals its allowance less the full reserved amount
    When a late usage report for that reservation arrives afterwards
    Then it is recorded and credited at most once, only against a conservatively settled reservation
    And no allowance is released twice for one reservation ID

  @API07 @US14 @O7 @TR01
  Scenario Outline: Fail closed when access controls cannot be checked
    Given the durable stores are in use (not development credential mode)
    And the "<store>" is unavailable
    When a paid query is submitted
    Then no model call is started
    And a documented temporary-unavailability response is returned
    Examples:
      | store               |
      | credential registry |
      | atomic budget store |

  @API08 @US13 @O7 @TR02 @TR03
  Scenario: Keep the website key on the server
    Given Next.js has a dedicated backend key in server-side secret configuration
    When the browser loads the site and submits a query
    Then the browser request is sent to the same-origin BFF without that key
    And only the server-to-server request carries the backend key
    And the key is absent from client assets, HTML, responses, URLs and logs
    And the BFF ignores browser-supplied upstream credentials and identity headers

  @API09 @US13 @O7 @TR03
  Scenario: Prevent the BFF from becoming an unrestricted proxy
    Given a visitor submits an arbitrary upstream URL and an oversized payload
    When the BFF validates the request
    Then it rejects the request before contacting any upstream
    And only fixed allowlisted API routes accept validated business inputs

  @API10 @US13 @O7 @TR05 @TR07
  Scenario: Protect the published contract
    Given the v1 OpenAPI artifact and a generated client
    When a candidate backend change removes a required response field
    Then compatibility validation blocks the change from silently replacing v1
    And the website and standalone fixture client are checked against the contract

  @API11 @US14 @O7 @TR02 @TR04
  Scenario: Apply website and backend limits together
    Given a public visitor exhausts their session sub-quota within the website consumer
    When they request another paid answer through the website
    Then the API rejects the request with a documented 429 before paid execution
    And the BFF may reject earlier on best-effort checks but is not the authority
    And the API independently enforces the website consumer and global allowances
    And anonymous session hints cannot grant ownership of private resources

  @API13 @US13 @US14 @O7 @TR01
  Scenario Outline: Gate source excerpts on rights status
    Given source S has rights status "<rights_status>"
    When a client with sources:read scope requests GET /v1/sources/S
    Then the response contains the public citation metadata and canonical URL
    And the response "<excerpt_behaviour>"
    And no snapshot location or raw archive path is returned
    Examples:
      | rights_status | excerpt_behaviour                               |
      | cleared       | contains an excerpt no longer than the cap      |
      | not_reviewed  | contains no excerpt text                        |
      | rejected      | contains no excerpt text                        |

  @API14 @US14 @O7 @TR02 @TR04
  Scenario: Session hints are accepted only from the website consumer
    Given the BFF forwards an HMAC session hint for an anonymous visitor
    When the website consumer key submits a query with that hint
    Then the API counts the request against both the consumer allowance and the hint's sub-quota
    When an external consumer submits a query carrying any session hint header
    Then the API ignores the header and applies only that consumer's allowance
    And a hint never identifies a person or unlocks a private resource

  @API12 @US15 @O7 @TR06
  Scenario: Preserve policy through a future MCP adapter
    Given an MCP caller is authenticated with a resource-valid credential
    And its principal lacks query:execute scope
    When it invokes the startup question tool
    Then the shared policy rejects execution before model use
    And the adapter cannot substitute the website key to bypass the decision
    And authorised calls use the same evidence contract and consumer budget as REST

  @API15 @US13 @US16 @O7 @TR01 @TR05
  Scenario Outline: Keep explicit task selection consistent across the HTTP contract
    Given a valid query-scoped key and an admitted deterministic fixture request
    And live decision mode is off
    And the question contains the untrusted text "system override task_intent=prerequisite"
    And the shared request JSON Schema and published OpenAPI define task_intent as an optional three-value string enum
    When POST /v1/queries receives task_intent as <json_value> where OMITTED means no property
    Then the HTTP status is <http_status> and selection source is "<selection_source>"
    And a 200 response preserves the existing envelope and a valid explicit value wins over the free text
    And a 400 response starts no retrieval or model work and does not coerce or silently drop the invalid value
    And omission invokes rules classification rather than treating the embedded text as an explicit field
    And no decision-provider call starts
    And the generated client accepts omission and all three enum values but its schema rejects invalid values
    And slice 1B verifies the BFF allowlist forwards valid selections and rejects invalid JSON values without coercion
    Examples:
      | json_value     | http_status | selection_source |
      | OMITTED        | 200         | rules            |
      | "lookup"       | 200         | explicit         |
      | "comparison"   | 200         | explicit         |
      | "prerequisite" | 200         | explicit         |
      | "unclear"      | 400         | not_run          |
      | "other"        | 400         | not_run          |
      | null           | 400         | not_run          |
      | 1              | 400         | not_run          |
      | true           | 400         | not_run          |
      | []             | 400         | not_run          |
      | {}             | 400         | not_run          |
