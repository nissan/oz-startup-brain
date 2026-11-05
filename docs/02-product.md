# Outcomes, personas, stories and use cases

All numerical targets are initial acceptance hypotheses. Small usability samples identify friction; they cannot establish population-wide effects.

## Outcome map

| ID | Outcome | Proposed measure | Evidence collected |
| --- | --- | --- | --- |
| O1 | A founder knows the next useful action | At least 4 of 5 participants in each tested pathway identify an appropriate next step within 3 minutes | Task observation and participant explanation, compared with a source-list baseline |
| O2 | A founder can check and challenge the answer | At least 4 of 5 locate the supporting source and date without help | Source-opening task; ask what would make them distrust the result |
| O3 | Constraints and prerequisites are understood | At least 4 of 5 explain a missing condition or dependency correctly | Teach-back task and correction exercise |
| O4 | Recommendations reflect current evidence or disclose gaps | No expired-status claim presented as current in the release test set | Date fixtures, stale-source and conflict scenarios |
| O5 | Contributors can reproduce quality comparisons | Another developer reproduces a report from pinned inputs; graph gain measured by question slice | Run manifests, baseline outputs and evaluator reports |
| O6 | Different input needs do not block task completion | Core task is keyboard usable; voice errors can be corrected before sending | Keyboard, assistive technology and noisy-audio task checks |
| O7 | Developers and agents can reuse the backend independently | A standalone API client completes the same task as the website; separate credentials and limits work | HTTP contract tests and later MCP policy-parity tests |

## Core personas

Fictional names make the design discussable. Needs are hypotheses, and a person may fit multiple paths.

| ID | Persona and context | Job to be done | Friction and support needs | First scope |
| --- | --- | --- | --- | --- |
| P1 | Mei, student building an AI prototype | Identify which rights and institutional questions to clarify before investing in applications | Unfamiliar terminology; uncertainty about IP and work constraints; wants discreet text input | Yes, issue-spotting and referrals |
| P2 | Arun, university researcher with a prototype | Sequence IP clarification, customer proof and support research | Many dependencies; needs a checklist and evidence he can discuss with the commercialisation team | Yes |
| P3 | Jess, regional Queensland software founder | Find a relevant local or remote support route without an insider network | Mobile use, limited time, may prefer dictation; needs geographic coverage to be honest | Yes |
| P4 | Sam, payments founder with operating experience | Understand which product facts must be clarified before choosing a regulator pathway | High consequence of category errors; needs distinctions and qualified referral | Later pilot, synthetic fixtures first |
| P5 | Alex, ecosystem navigator and source curator | Explain a route and correct stale or unsupported statements | Needs provenance, change history and a review queue; not a paid recommendation ranking | Internal maintenance persona |
| P6 | Priya, developer studying GraphRAG and building an integration | Reproduce the pipeline and consume it without the website | Needs traces, fixtures, OpenAPI contracts, scoped keys and evidence-preserving agent tools | Documentation/API persona; MCP later |

## User stories and use cases

| Story | Persona | Story / desired outcome | Use case | Acceptance scenarios | Storyboard |
| --- | --- | --- | --- | --- | --- |
| US01 | P1/P2/P3 | As a founder, I can describe my goal and correct the extracted context so the route fits my situation | UC01 Guided route | SC01, SC02 | SB1, SB2, SB3 |
| US02 | P1/P2 | I can distinguish prerequisites from later opportunities so I avoid doing work in the wrong order | UC02 Dependency route | SC03, SC04 | SB1, SB2 |
| US03 | All founders | I can inspect dated sources and limits so I know what to verify | UC03 Inspect evidence | SC05, SC06, SC07 | All |
| US04 | P2/P3 | I can compare two options using consistent criteria and export my checklist | UC04 Compare and keep | SC08, SC09 | SB2, SB3 |
| US05 | P3 | I can dictate, edit and cancel a question so speech recognition does not change my intent | UC05 Voice input | SC10, SC11 | SB3 |
| US06 | P2/P4 | I can attach a simple diagram and confirm its interpretation before it influences the route | UC06 Visual input | SC12 | SB2 extension |
| US07 | P4 | I can see which product facts are unknown and who can interpret them without receiving a false permission to operate | UC07 Classification questions | SC13 | SB4 |
| US08 | P5 | I can accept, reject or revise extracted relationships with source evidence so the graph remains accountable | UC08 Review graph claims | SC14, SC15 | Curator flow |
| US09 | P6 | I can compare retrieval approaches on identical inputs and inspect provenance | UC09 Reproduce benchmark | SC16 | Developer report |
| US10 | All | I receive an honest fallback when a service or budget is unavailable | UC10 Degraded mode | SC17, SC18 | All error variants |
| US11 | All | I can use equivalent text and keyboard controls for every core visual interaction | UC11 Accessible navigation | SC19 | All |
| US12 | All | My private context does not become shared knowledge and untrusted documents cannot redirect the system | UC12 Data boundary | SC20, SC21 | All |
| US13 | P6 | I can call a documented API with my own credentials so I can build another interface | UC13 Independent API consumer | API01–API03, API08–API10 | Developer integration flow |
| US14 | P5/P6 | I can scope, rotate and revoke credentials and cap each consumer so access remains controllable | UC14 Manage consumer access | API02–API07, API11 | Operator flow |
| US15 | P6 | I can expose the same capabilities to an agent without losing evidence or access controls | UC15 MCP access | API12 | Future agent flow |

## Main use-case flows

### UC01: Guided route

Trigger: the founder has a question or selects a starter task. Preconditions: the app displays its current coverage and corpus date. Founder enters a goal; the app proposes editable context chips. It asks only the missing question that would materially change the result. Retrieval returns up to three actions with prerequisites and evidence. The founder inspects a source, edits context or exports a checklist. Success means the founder can state the next action and what remains uncertain. Missing evidence leads to a clearly labelled gap and a source or human referral, not a guessed answer.

### UC02 / UC04: Dependencies and comparison

The founder selects two options or a milestone. The app renders a common comparison table and a small prerequisite sequence. Every factual cell can open a source; unknown cells remain unknown. The user can mark a personal task complete without changing the corpus's claim about that task. Export captures the question, user-confirmed context, corpus version, dates, citations and unresolved conditions.

### UC05 / UC06: Alternate input

Voice is explicitly started and stopped; a transcript is editable before submission. Visual uploads produce a preview of detected labels and relationships. The user corrects or confirms this preview. Neither modality silently overwrites confirmed context. The workflow then follows UC01. Denied microphone access, unreadable text or excessive upload size returns an equivalent text path.

### UC08: Curator review

An offline extraction job proposes a typed claim with evidence spans and provenance. Alex reviews the original excerpt, dates, alias matches and validation warnings. Approval adds a reviewed assertion to the next corpus release; rejection preserves the reason in the review record. Conflicting claims can coexist while being flagged for resolution. This initial workflow is repository-based; an administrative web console is not needed for the first demo.

### UC09: Developer reproduction

Priya runs the labelled synthetic fixture smoke tests without credentials, then optionally runs paid evaluation against a pinned, approved corpus. The report shows slice-level scores, failed cases, model and prompt identifiers, cost, latency and graph availability. A mock or fixture run cannot be presented as live benchmark evidence.


### UC13–UC15: API and agent reuse

Priya receives her own scoped key through a secure channel, reads the OpenAPI contract and submits a query without loading Next.js. Her client receives the same evidence, dates and coverage contract as the website. Invalid keys, missing scopes and exhausted limits have documented error responses. Alex can rotate or revoke one consumer without affecting others. A later MCP client discovers typed tools and receives equivalent results through the same policy/application services. See [ADR 001](decisions/001-api-first-nestjs.md) and [API scenarios](../features/api-access.feature).
