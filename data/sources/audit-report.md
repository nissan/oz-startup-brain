# Stage 1 source disposition report

6 November 2026 (Australia/Sydney). Refs [#28](https://github.com/nissan/oz-startup-brain/issues/28). Prepared by Codex, run `source28-20261106`, from base `eab8130f0c003b8c7d0b4a76a6af2e20e03b44e6`. This is builder/researcher analysis in the existing project context, not an independent review or an owner decision.

## Recommendation for the owner

Choose **Queensland with relevant federal support sources** as the first bounded corpus. Review the [22-source shortlist](audits/2026-11-06-inventory.md#shortlist-for-review), starting with its **eight core pages**: three Queensland Innovation pages and five business.gov.au pages. Expand through the 14 reserves only when they add a supported founder task and their rights/content checks pass. The requested 20–30 source target is a review queue, not a reason to ingest weak or restricted pages. The smaller eight-page core is an initial extraction/review target, not yet a viable released corpus.

Why Queensland: its three related official pages connect prototype, commercialisation and support routes, the bibliography also has four regional/community pages, and the existing fictional journey already exercises Queensland-style routing. This reduces fixture-to-real integration changes; it is not evidence that Queensland has the best ecosystem. Federal sources add advice, discovery and R&D boundaries. The rights notices for the eight core pages identify an initial route to text reuse with exclusions. The jurisdiction decision remains **pending Nissan**, and this PR does not activate live coverage.

| Option | Evidence in this bibliography | Trade-off |
| --- | --- | --- |
| Queensland + federal (recommended) | 7 Queensland-tagged records, including 3 official Innovation program pages; 54 federal-tagged records across many topics | Small coherent first task, but the observed Ignite Ideas and Spark pages show closed applications; cannot promise an open grant route |
| NSW + federal | 9 NSW-tagged records including 5 NSW Government pages; multi-region operators also contribute to the count | Credible alternative; several official pages concern the same MVP program/round, so URL count overstates program breadth |
| Federal only | 54 records, many about regulation, statistics or specialist sectors | Broad authority but weaker local founder routing; federal eligibility does not imply all founders qualify |
| All states immediately | ACT and NT each have only one operator record; other jurisdictions also vary | Premature: national discovery does not establish balanced, licensed or current coverage |

The [coverage table](audits/2026-11-06-inventory.md#provisional-jurisdiction-coverage) gives every state/territory, federal and other scope counts. Multi-jurisdiction rows overlap. All approved/live coverage counts are **zero**. There are 84 `.au` hosts, but **112 records have at least one provisional Australian scope** and 23 are foreign/global/unknown-only. The earlier estimate that roughly 50 links were non-Australian confused domain suffix with content scope; this audit replaces that estimate. These classifications still require content confirmation before ingestion.

## What was actually inspected

All 135 original URL identities received a manual publisher/class/scope/disposition triage and a provider-mediated open attempt. Results: **124 non-empty representations, 9 tool errors, 2 empty representations**. Non-empty does not mean readable article content: some visa, government and operator pages are sparse/interactive or may be challenge shells. No credentials or access workarounds were used. Errors include 403s, provider size limits, a reported 404 and Treasury 503s; preserve their reasons rather than calling every source permanently unavailable.

The reproducible direct-fetch probe attempted all 135 URLs but local public-DNS preflight failed for all (`gaierror`), so **no direct HTTP source bodies were obtained by that run**. The browsing provider may use cached extracts; relative crawl labels are stored verbatim and never converted into fabricated publication/verification timestamps. There are **zero retained raw snapshots, zero ingestion approvals and zero human fact-verification records**. Completing fresh raw fetches with hashes/snapshots is an outstanding Stage 1 release gate, not a claimed result of this metadata PR.

Original research snapshots are not being pursued (accepted decision 9). Discovery IDs, original cited titles and the original article hash remain intact. The historical article verification date does not verify any linked page. Every later successful raw fetch receives a new version identity; none may be labelled the snapshot used to write the paper.

## Rights decisions and storage

The [rights evidence register](rights-evidence.json) has dated primary-policy URLs, trace references, conditions, attribution and per-source applicability notes. Across the full inventory: **14 conditional licence identifications, 3 permission-required records, 118 unknown**. Across the shortlist, 11 have conditional licence evidence; the rest are permission-dependent or unresolved. These are triage decisions, not legal clearance. This repository stores metadata and original fictional fixtures only.

| Publisher policy | Finding for this audit | Action |
| --- | --- | --- |
| [Queensland DETSI](https://www.detsi.qld.gov.au/help/legal/copyright), linked by the observed Innovation pages | CC BY 4.0 for covered department material; exceptions include images, marks and third-party material | Review only eligible text; retain notice, State attribution, source/licence links and change notice |
| [business.gov.au](https://business.gov.au/legal-notices/copyright) | CC BY 3.0 AU for covered department content; exclude images, marks and third-party material | Use its prescribed attribution; inspect page/section exceptions, particularly customer stories |
| [Austrade](https://www.austrade.gov.au/en/site-information/site-disclaimer.html) | CC BY 4.0 with third-party, image and branding exclusions | Reserve candidates; inspect page-specific exceptions and current round details |
| [CSIRO](https://www.csiro.au/about/policies/legal/copyright) | General unchanged personal/research-copy permission does not establish public RAG reuse | Kick-Start remains metadata/link-only pending permission |
| [Export Finance Australia](https://www.exportfinance.gov.au/admin-pages/terms-and-conditions/) | Storage/adaptation/distribution restrictions; personal printing is not public RAG permission | Seek permission or substitute a licensed source |
| [NRFC](https://www.nrf.gov.au/copyright) | Restricted unchanged/internal-use language and approval requirements | Seek permission; do not treat government ownership as an open licence |
| [National AI Centre](https://www.ai.gov.au/about/about-national-ai-centre/copyright-and-disclaimer) | No blanket HTML reuse licence established by the reviewed notice | Individual PDF licences cannot be transferred to HTML pages; keep unknown |

Private operators and community pages remain unknown-rights metadata records. Do not infer permission from successful browsing, a copyright footer, government funding, a `.gov.au` suffix or being named in the paper. No reuse request was sent. Retain reviewed metadata; response bodies were not committed. A future licensed corpus needs an explicit storage/retention plan with revocation/correction handling and source-specific attribution. No claim is made that embedding or paraphrasing avoids these requirements.

## Temporal and identity checks that affect the first build

- The three [Advance Queensland links](https://advance.qld.gov.au/grants-and-programs/ignite-ideas-fund) were reported as redirects to `innovation.qld.gov.au`. Preserve original discovery identity and record destination separately; do not assume the old and new bytes are identical.
- The observed [Ignite Ideas](https://innovation.qld.gov.au/grants-and-programs/ignite-ideas-fund) and [Ignite Spark](https://innovation.qld.gov.au/grants-and-programs/ignite-spark-program) pages state applications are closed. These are dated research observations, not promoted live status claims. Recheck the actual round before any answer recommends applying.
- The [Industry Growth Program](https://business.gov.au/grants-and-programs/industry-growth-program) extract has a paused-applications banner alongside generic application instructions. Extraction must preserve the banner and its precedence, rather than return an affirmative application route with a caveat appended.
- [Ignite+](https://innovation.qld.gov.au/grants-and-programs/ignite-program/ignite-plus) states an update date of 17 August 2026. This is stored as `source_updated_at`, not `published_at` or `last_verified_at`. Other unknown dates remain null; dates in a title/URL alone are not verified dates.
- The AI adoption guidance link redirects from industry.gov.au to ai.gov.au; licence review follows the destination. A similarly named National AI Centre homepage is not automatically a duplicate of that guidance.
- Effective dates, deadlines, program-round status and requirements need passage-level checks and human review before promotion. This audit does not extract eligibility claims, tax advice or ontology edges.

## Reproducibility and next gates

[Tooling instructions](README.md) describe deterministic validation/report generation, a bounded metadata fetch probe, and an authored `.invalid` HTML fixture. Its extraction checks preserve section paths, table captions/headers, conditional contributions, exclusions and footnotes; script/navigation text is excluded. It demonstrates extraction boundaries only. It is neither the production ingestion pipeline nor a user/Ragas evaluation fixture.

Before completing Stage 1 and enabling a live corpus:

1. Independent reviewer checks the 135-record dispositions, provisional jurisdictions and policy applicability; resolve any mistaken identities. Review the exact PR head.
2. Nissan chooses the initial jurisdiction and accepts or revises the shortlist. No confirmation is needed merely to review this metadata PR.
3. Re-run direct fetches from a permitted environment, retain only approved snapshots with raw hashes/version IDs, and inspect empty/challenge/error responses. Treat replacements as new versions; keep prior failures.
4. Check page/passage rights exceptions and attribution; obtain permission or drop restricted sources. Set approved use and retention explicitly. A general site licence is not a release approval for every asset.
5. Human-review grant/tax/regulatory claims, effective intervals, round state and contradictions; publish a corpus release with actual coverage. Keep fixture/test material out of retrieval and held-out evaluation data.

The local fixture UI #25 does not depend on this live-corpus gate. API, lockfile, contracts, persona files, hosting and paid services are unchanged. #28 remains open for review and the owner's jurisdiction decision; this report does not claim the release gates above are complete.
