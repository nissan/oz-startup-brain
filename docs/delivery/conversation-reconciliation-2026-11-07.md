# Chat-to-GitHub artifact reconciliation — 7 November 2026

**Scope:** Oz Startup Brain project conversation, GitHub repository `nissan/oz-startup-brain`. This is a reconstructed inventory, **not a verbatim chat export** and not a claim that all conversations are accessible.

## Recovery outcome

| Category | Repository evidence | Status |
| --- | --- | --- |
| Architecture and stack | `docs/03-architecture.md`, `docs/decisions/001-api-first-nestjs.md` | Already on main |
| New presentation-quality tier diagram | `docs/architecture/oz-startup-brain-technical-architecture.svg` | Recovered on this branch |
| Technical diagram explanation and implementation distinctions | `docs/architecture/oz-startup-brain-architecture-2026-11-07.md` | Recovered on this branch |
| Design system and mockup source/renders | `design/system/`, `design/exports/`, `design/mockups/HANDOFF.md` | Existing versioned assets |
| Branding and vector assets | `design/brand/`, `design/brand/HANDOFF.md` | Existing versioned assets |
| Product, ontology, evaluation and source policy | `docs/02-product.md`, `docs/04-data-and-ontology.md`, `docs/05-evaluation.md` | Existing |
| Agent and project handoff | `HANDOVER.md`, `AGENTS.md`, `CLAUDE.md`, `docs/delivery/` | Existing, date-sensitive |
| Synthetic persona and UX evidence | `research/synthetic-ux/`, issue #26, PR #43 | Partial; preflight does not equal completed actor study |
| Queensland source retrieval and licensing | issue #28, PR #40 | Review in progress; third-party content not cleared |
| Technical architecture PNG | ChatGPT artifact titled `oz-startup-brain-technical-architecture.png` | **Original binary not copied into GitHub** |
| Founder journey PNG | ChatGPT artifact titled `Oz Startup Brain: Evidence-Backed Founder Journey.png` | **Original binary not copied into GitHub** |
| Complete original chat messages and all unseen image generations | Original ChatGPT conversation | **Not independently export-verified** |

## Important decisions and constraints retained

1. Queensland is the pilot jurisdiction; federal sources alone do not constitute Queensland coverage.
2. The Next.js application calls a NestJS API through a thin server-only BFF. The API key never belongs in browser assets; security and business rules are enforced upstream.
3. Contracts, typed validation, cost/quota boundaries, jurisdiction/freshness checks, evidence provenance and rights gates are design requirements.
4. Qdrant passage retrieval, Neo4j claim relationships, LangGraph execution and model providers are distinct architectural responsibilities. Do not depict planned integrations as production.
5. Synthetic personas and browser checks are test artifacts, not human validation.
6. No merge, paid-service activation, or provider-key exposure is authorized by this archival PR.

## Open work and version caveat

- [PR #40](https://github.com/nissan/oz-startup-brain/pull/40) concerns Queensland source retrieval, blocked HTTP access from tested runner, and human rights/fact decisions.
- [PR #43](https://github.com/nissan/oz-startup-brain/pull/43) records issue #26 preflight; it explicitly does not claim completed browser actor findings.
- The dated root `HANDOVER.md` should be read with **live issue and PR status**, which takes precedence.

## Next archive closure steps

- Export the two identified original PNG files from the ChatGPT artifact library and commit them byte-for-byte under `docs/architecture/exports/` with source attribution, content SHA-256 and preview checks. **Do not substitute a newly rendered lookalike and call it the original.**
- Compare original chat attachments/image generations against the GitHub inventory, mark each `already-in-repo`, `recovered`, `not-applicable` or `unavailable`; archive recoverable originals only when identified.
- Keep a manifest of asset hashes, Git commit, source date, and project decision links. Avoid publishing secrets and private source snapshots.
- After review, update a stable handover entry point to link this reconciliation record.

This reconciliation is documentation-only and does not alter production behavior or imply completion of pending issues.
