# Outcome-based delivery plan

This is an implementation backlog, not a calendar commitment. No databases, paid API accounts or Vercel project have been provisioned.

| Stage | Outcome and deliverable | Exit evidence |
| --- | --- | --- |
| 0: Design review | Agree on first founder tasks and run paper-prototype sessions | Observed usability findings and prioritised changes; provisional decisions accepted or amended |
| 1: Corpus audit | Recover original research where possible; classify all 135 cited links; approve 20–30 initial sources | Source disposition report, rights decisions, temporal fields and repeatable fetch/extraction fixtures |
| 2: Vector baseline | Deploy a bounded LangChain/LangGraph route using Qdrant | B1/B2 reports on reviewed pilot questions; citations, dates, unknowns and outage handling verified |
| 3: Graph experiment | Add reviewed ontology and Neo4j traversal | Edge review audit; B3 vs B2 slice comparison with equal evidence budget; keep graph optional if no material gain |
| 4: Founder interface | Replace paper answers with validated cards, tables and prerequisite views | O1–O4 task evidence, accessibility checks and export verification |
| 5: Multimodal experiments | Add transcript-confirmed speech, then confirmed visual extraction | Correction tasks, privacy/retention behaviour, equivalent text paths and measured benefit |
| 6: Public demonstration | Publish a personal non-commercial Vercel demo and reproducible educational walkthrough | Budget controls, restore drill, current corpus release, documented limitations and no leaked private data |

## First vertical slice

One founder task: a Queensland early-stage founder asks for a next support step. The app clarifies stage if needed, retrieves reviewed current sources, presents up to three options with conditions and dates, and lets the founder inspect a citation. A synthetic closed-round fixture exercises abstention from recommending a closed application route. This slice must work without Neo4j before graph complexity is added.

## Proposed future repository layout

`apps/web/`: Next.js interface and request handlers.

`packages/workflow/`: LangGraph states, nodes, typed tools and output schemas.

`packages/retrieval/`: Qdrant and Neo4j adapters with baseline switch.

`packages/contracts/`: shared corpus, claim and answer contracts.

`jobs/ingest/`: bounded fetch/extract/review/export pipeline.

`evaluation/`: Python Ragas harness, reference-set manifests and reports.

`data/`: public metadata, rights-cleared fixtures and schemas only.

Exact package versions are selected and locked during implementation, not guessed in the design.

## Decisions still requiring input or implementation evidence

- Location of the original raw research archive, beyond the recovered published bibliography.
- Monthly spend ceiling and preferred model provider; provider accounts/credentials belong in secret storage.
- Whether federal plus Queensland is the preferred first coverage slice, or another state is more useful for recruitment.
- Which real founders/navigators can participate in early feedback.
- Whether future use remains personal/non-commercial; reassess hosting before turning it into a business offering.

These do not block review of the documentation. They do affect live-data completeness, paid service activation and user validation. There is no implied claim that the design has been user-approved or empirically validated.

## Implementation checks

At the relevant stages, test source-table extraction and qualifiers, entity merge ambiguity, unsupported edge rejection, corpus version consistency, temporal status, source injection, allowlisted queries, anonymous-session isolation, keyboard navigation, microphone denial, editable transcription, cancellation, budget exhaustion, graph/vector outages and restoration from versioned exports. Keep live-model evaluations separate from deterministic CI.
