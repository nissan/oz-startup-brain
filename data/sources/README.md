# Source inventory and audit tools

Start with [the Stage 1 decision report](audit-report.md), then the [generated inventory and coverage table](audits/2026-11-06-inventory.md). This directory contains metadata and an invented extraction fixture, **not an ingested corpus**.

| File | Purpose |
| --- | --- |
| `article-bibliography.json` | Version 0.2: all 135 original discovery IDs/URLs/titles preserved, with provisional publisher/class/jurisdiction and explicit pilot dispositions |
| `rights-evidence.json` | Dated publisher-policy triage, exclusions and attribution requirements; not blanket legal clearance |
| `audits/2026-11-06-web-observations.json` | One provider-mediated open observation per URL, including failures, reported redirects and crawl labels |
| `audits/2026-11-06-direct-attempts.json` | One raw-fetch attempt per URL; all stopped at DNS preflight in this runtime, before an HTTP request |
| `audits/2026-11-06-inventory.md` | Deterministic counts, coverage, shortlist and complete disposition table |
| `fixtures/fictional-program.*` | Authored `.invalid` HTML and expected extraction; no copied source text |
| `tools/` | Python standard-library validator, metadata-only transport probe and bounded fixture extractor |

## Reproduce the offline evidence

Python 3.10+; no package installation, credentials or network required:

```sh
python data/sources/tools/source_audit.py validate
python data/sources/tools/source_audit.py summary
python data/sources/tools/source_audit.py report --check
python -m unittest discover -s data/sources/tools -p 'test_*.py' -v
python data/sources/tools/extract_fixture.py data/sources/fixtures/fictional-program.html --source-url https://fixture.invalid/harbour
```

After an intentional metadata edit, run `report` without `--check`, inspect the diff, and validate again. These source-specific checks are manual PR checks in this increment; the existing CI workflow is unchanged. The extraction test checks the committed expected JSON, so regenerating it is a deliberate reviewed change. Tables retain captions, ordered cells and header flags; qualifiers/footnotes remain in order under the same heading. No chunking, embeddings or claim promotion occurs. The extractor intentionally rejects real URLs and unsupported nested blocks/tables; it is not a production extractor.

## Fresh transport observations

Only run after reviewing target URLs and intended use. This is a local CLI for a trusted manifest, not a server endpoint accepting arbitrary URLs:

```sh
python data/sources/tools/fetch_metadata.py --network --output /tmp/ozsb-source-attempts-new.json
# Or probe one source by adding:
# --source-id src_8db3776594ab
```

The probe accepts HTTPS/public DNS destinations only, checks redirects, limits bodies to 2 MiB and sockets to 8 seconds, uses at most six workers and one active request per initial hostname, and does not retry or bypass access restrictions. Network use is opt-in. Output is exclusively created so an earlier run is never overwritten. Preserve earlier attempts; review a new file before adding it as evidence. DNS validation is a guard for this local trusted-input tool, not a complete DNS-rebinding defence for a hosted service. A shared proxy can deny access independently of the publisher. No credentials/cookies are supplied and response bodies are not logged or retained.

A complete non-empty body produces a SHA-256 and a new timestamp-derived version ID, even if its bytes match an earlier observation. This records a fetched representation, **not** a usable document: a challenge page can return HTTP 200. Failed, empty and size-limited responses never create versions. A hash without a retained approved snapshot is insufficient to reproduce a future corpus. Do not merge probe results automatically into the reviewed manifest or change `last_verified_at`.

The committed raw probe failed all 135 DNS preflights (`gaierror`). An earlier one-URL urllib request through the configured transport returned 403. Neither result establishes that publishers are offline. The separate browsing provider opened all 135 URLs and supplied 124 non-empty representations, 9 errors and 2 empty representations. That provider may use cached material and does not expose raw HTTP status/body hashes here. Its `provider_reference` is a session trace identifier; stable requested/destination URLs and dates are also retained so review does not depend on the identifier.

## Metadata contract and promotion boundary

- Discovery identity (`source_id`, `url`, `title_as_cited`, `discovered_via`, `discovered_on`) is immutable in this audit. The identity digest catches accidental removal, replacement or reordering. Keep cited titles even if their embedded factual claims/dates have not been checked.
- `publisher`, `source_class`, `jurisdiction` describe the cited source/subject/operator provisionally. They do not prove eligibility, legal authority for every claim, or covered states. `AU-FED` means federal material; `AU-NATIONAL` means Australian ecosystem/operator context. Multi-region lists are not additive counts.
- `canonical_url` stays null pending identity review. `observed_redirect_url` records only the provider-reported destination. A redirect is not proof of identical content or permission to merge two sources.
- `fetch_status` in 0.2 describes the **web-provider observation** only. Raw transport attempts are a separate log; a cached observation never supplies `fetched_at`, `content_hash` or `source_version_id`.
- Publication, source-update, effective and fact-verification dates are separate. Dates inferred only from titles, filenames, crawl labels or fetch times stay null. The single `source_updated_at` value for Ignite+ is explicitly stated on the observed page, not a publication or verification date.
- `rights_status` is `unknown`, `conditional_licence_identified` or `permission_required`. The policy ID links the review rationale, scope and attribution. Conditional permission does not mean all page assets are licensed. This audit contains no `cleared` records.
- `disposition` is `awaiting_rights_review` for the 22 candidates or `out_of_initial_scope` for 113 others, relative to the **proposed** pilot. Retrieval problems remain orthogonal; a 403 does not become a permanent `unavailable` disposition.
- `shortlist_tier` is `core` (8), `reserve` (14) or null. It never means approved ingestion. No human factual verification or original snapshots are claimed.

Version 0.2 validation deliberately rejects ingestion approval, populated factual-verification dates and invented raw versions. A future ingestion increment needs a separately reviewed manifest/schema transition, actual licensed snapshots, source/passage exceptions checked, attribution/retention decisions, and the owner's jurisdiction decision. Do not weaken validation to make a release appear ready. The API's capabilities and fictional corpus are unchanged.
