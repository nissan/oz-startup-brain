# Presentation architecture artifacts — 7 November 2026

These files were recovered from the ChatGPT project conversation and committed here as **target-architecture communication artifacts**, not deployment evidence.

- [Technical tier visualization (1920 × 1080 SVG)](oz-startup-brain-technical-architecture.svg) — editable vector artwork for presentations; shows technology tiers, trust boundaries, implemented versus planned integrations.
- [Technical architecture narrative](oz-startup-brain-architecture-2026-11-07.md) — accompanies the graphic and explains Next.js UI, thin server-only BFF, NestJS API, contract boundary, LangGraph/LangChain orchestration, Qdrant, Neo4j, provider adapters, source controls, security and evaluation.
- [Canonical engineering architecture](../03-architecture.md) and [API-first ADR](../decisions/001-api-first-nestjs.md) are the governing design sources. Resolve discrepancies against current source/ADRs before presenting architecture as operational.

**Important:** The live app and services have fixture-only implementation; do not suggest that Supabase, model providers, hosted databases, or other pictured integrations are already provisioned. The graphic is an architecture proposal, not an assurance of security, release readiness, or service availability.

The 7 November conversation also generated a PNG rendering of the technical architecture and a separate “Evidence-Backed Founder Journey” PNG. Those binary originals remain saved in the originating ChatGPT artifact library, but were **not byte-for-byte transferred by this change**. The SVG is the committed presentation-ready vector source; the missing raster binaries are tracked below.
