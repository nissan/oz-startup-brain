# Oz Startup Brain

An educational, evidence-backed Australian founder journey planner demonstrating **LangChain, LangGraph, Qdrant and a knowledge graph**.

**Status: proposed design, 5 November 2026.** This repository contains research, product documentation, acceptance scenarios and paper-style prototypes. The only runnable code is the fixture-only API, contracts and generated client from slice 1A-0 ([run it](docs/api/README.md)). It serves an invented corpus with development credentials. There is no live application, populated database, validated benchmark or deployment yet.

The product hypothesis is that a founder can identify a useful next action, understand its prerequisites and inspect its evidence faster than by searching scattered ecosystem pages. This uses an existing LLM with retrieval; it does not train a new foundation model.

## Contribution and completion standards

**Ready to assign work:** use [the delivery home](docs/delivery/README.md), [ordered backlog](docs/delivery/backlog.md) and [Iteration 01 hub (#23)](https://github.com/nissan/oz-startup-brain/issues/23). The issue records coordinate planners, builders, reviewers and verifiers across Claude, Codex and other agents. The first sequence is fixture API and intended-font polish, local founder UI, synthetic browser feedback, then fixes and retesting before the live baseline.

All contributors and AI builders must follow [AGENTS.md](AGENTS.md). **Visual presentation has equal priority with functionality.** Every frontend increment requires a dedicated [visual-polish pass](docs/ux/visual-quality.md): identify the biggest weaknesses, address them, inspect the revised result and provide review evidence before declaring completion.

## Review the proposal

1. [Plan assessment and decisions](docs/01-plan-assessment.md)
2. [Outcomes, personas, user stories and use cases](docs/02-product.md)
3. [Architecture and operations](docs/03-architecture.md)
4. [Corpus, provenance and ontology](docs/04-data-and-ontology.md)
5. [Evaluation and social question discovery](docs/05-evaluation.md)
6. [AI UX research and interaction design](docs/ux/research-and-design.md)
7. [Persona storyboards and feedback plan](docs/ux/storyboards.md)
8. [Gherkin acceptance scenarios](features/founder-journeys.feature)
9. [Delivery roadmap and decision gates](docs/06-delivery.md)
10. [Research references](docs/references.md)
11. [API-first NestJS requirements and MCP evolution](docs/decisions/001-api-first-nestjs.md)
12. [API access acceptance scenarios](features/api-access.feature)
13. [Independent design review, findings and readiness verdict](docs/reviews/claude-design-review.md)

14. [Synthetic UX persona profiles, browser tasks and review runbook](research/synthetic-ux/README.md)
15. [Decision-model architecture and Claude builder handoff](docs/decisions/002-decision-models.md)
16. [Decision-model experiment protocol](docs/evaluation/decision-models.md)

## Starting evidence

The [Founder Journey Planner article](https://www.reddi.ai/blog/founder-journey-planner-australian-digital-economy) is the conceptual starting point. Its published verification date is **22 July 2026**, not the current date.

[The recovered bibliography](data/sources/article-bibliography.json) contains **135 distinct external URLs** extracted from the public article on 5 November 2026. These are discovery records: the linked documents have not been ingested, checked for current facts or cleared for redistribution. The original raw research archive is not pursued (decision 9). The [Stage 1 metadata audit](data/sources/audit-report.md) classifies all 135 records and proposes 22 candidates; rights, raw retrieval and the owner jurisdiction decision remain release gates. A fresh fetch must not be described as the historical snapshot used to write the paper.

## Proposed stack

- API-first monorepo: `apps/web` for Next.js and `apps/api` for an independently deployable NestJS backend.
- Next.js calls NestJS using a server-only API key; external consumers receive separate scoped keys.
- NestJS owns the LangChain integrations, LangGraph.js workflow and versioned OpenAPI contract.
- Two Vercel projects are the initial non-commercial hosting proposal; MCP is a later adapter to the same backend services.
- Qdrant Cloud Free for passage retrieval; Neo4j AuraDB Free for reviewed relationships.
- Offline ingestion and Python Ragas evaluation, run locally or in manually triggered CI.
- Optional bounded task-intent decisions: rules and structured-LLM baselines compared with Jev and OpenAI Decisions; default off until evaluated.
- Text and structured cards first; optional push-to-talk and constrained visual input later.

Free infrastructure does not imply free model inference, transcription, embeddings or X API access. All operational limits and acceptance targets below are proposals, not measured results.

No private research notes, credentials, real user profiles, X post bodies or third-party raw documents are included in this public repository.

