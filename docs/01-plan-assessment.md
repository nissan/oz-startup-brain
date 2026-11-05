# Plan assessment

## Recommendation

Proceed as a staged learning project with two explicit goals: help founders choose an evidence-backed next action, and demonstrate when graph-augmented retrieval improves a conventional RAG system. Avoid treating architecture complexity, popularity or confident language as evidence of usefulness.

| Original idea | Assessment | Refined decision |
| --- | --- | --- |
| Build an LLM about the ecosystem | Good application scope; model training is unnecessary | Use a hosted model with a versioned retrieval corpus. Model choice stays replaceable. |
| Use the paper and all raw sources | Strong provenance starting point; historical material becomes stale | Recover the original archive if available; independently fetch and classify every cited source. Distinguish historical and current views. |
| Qdrant plus hosted graph | Feasible for a small corpus, but two stores add operational work | Qdrant Cloud Free plus Neo4j AuraDB Free; keep a vector-only baseline and a labelled fallback. |
| Reason over raw data to discover relationships | Useful for candidate extraction, unsafe as automatic fact publication | A typed ontology, evidence spans, schema checks, alias resolution and human approval before promotion. |
| Ragas and LLM judges | Useful complementary measurement | Add deterministic citation, date, workflow and security checks; calibrate judges against humans. |
| X hashtags and highly reposted answers | Useful demand research; weak correctness evidence | Use engagement only for question sampling. Reference answers need dated source evidence and review. |
| API-first backend | Required for website, external developer and agent reuse | Designated NestJS API project; server-side Next.js key; per-consumer scopes and quotas; later MCP adapter. |
| Vercel Hobby | Suitable for this non-commercial demonstration | Separate web/API projects with shared limits; short requests and offline jobs. Check terms before commercial use. |
| Voice and visualisations | Promising when they remove task friction | Stable, accessible UI with typed input first. Add speech and visual input through measured experiments. |

## Product scope

The first release answers three question families: where to begin, how two pathways compare, and which prerequisite or human contact comes next. It returns a next-step card, evidence and an explicit indication of what still needs checking. It does not submit applications or adjudicate personal grant, migration, tax or regulatory eligibility.

The article motivates routing by founder circumstances, product, stage, geography and relevant interpreters. We turn that into a small maintained application rather than reproducing the article as a chatbot persona. Its July verification date makes temporal provenance a core requirement. [R1]

Start with federal sources plus one state chosen after the Stage 1 source dispositions; coverage of every Australian state and territory is the destination, and the corpus expansion to reach it is planned work (Stage 2a in the [delivery plan](06-delivery.md)). When a jurisdiction is not covered, say so. Seed research, student and regional founder paths, then broaden after representative feedback. Do not silently infer a person's citizenship, visa, gender or finances from their chosen path.

## Main design decisions

1. **Outcome before interface:** measure whether someone can explain their next action and why it fits, not whether they liked a fluent response.
2. **Evidence before edges:** graph claims carry sources and dates. An LLM confidence value is extraction metadata, not a probability that a claim is true.
3. **Demand and truth are separate:** popular questions deserve coverage; popular answers still require checking.
4. **Graph value is an experiment:** compare dense retrieval, hybrid retrieval and hybrid plus graph under the same model and evidence budget.
5. **Short online workflow:** deterministic routing and bounded graph lookups, with one optional recovery attempt. No open-ended research agent during a visitor's request.
6. **Visible limits:** stale, disputed, unknown and unavailable are distinct UI states.
7. **Stable interface with adaptable content:** schema-validated cards and controls, not arbitrary model-generated executable UI.
8. **API-first reuse:** NestJS owns the backend and its versioned contract. Next.js, external API clients and a future MCP adapter share capabilities and policy; see [ADR 001](decisions/001-api-first-nestjs.md).

## Current evidence and uncertainty

- Public article retrieved; 135 unique external source links extracted. Original raw snapshots, research notes and complete research inventory remain unrecovered.
- Qdrant and Neo4j free service limits checked in official documentation. This is not account provisioning or a capacity test. [R2–R4]
- X discovery searches did not establish a reproducible post sample or engagement ranking. No claim is made that the seed questions represent actual popular posts.
- Personas are design hypotheses, not interviewed participants. Storyboards are discussion aids; no real user feedback has been collected.
- Model, embedding dimension, corpus token count, API budget and exact dependency versions must be selected during the implementation spike.

## Deliberately deferred

Persistent accounts and conversations, live web browsing on every query, autonomous applications, complete international coverage, fine-tuning, graph community summarisation, arbitrary text-to-Cypher, full-duplex realtime voice, and automatic self-modifying ontology. These can be revisited after the baseline produces useful evidence.

References: [research register](references.md).
