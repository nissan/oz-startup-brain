# Source inventory and audit tools

Start with [the Stage 1 decision report](audit-report.md), then the [generated inventory and coverage table](audits/2026-11-06-inventory.md). This directory contains metadata and an invented extraction fixture, **not an ingested corpus**.

| File | Purpose |
| --- | --- |
| `article-bibliography.json` | Version 0.3: all 135 original discovery IDs, URLs and titles preserved, with provisional publisher/class/jurisdiction and explicit pilot dispositions. It records the owner's Queensland decision and any reviewed retrieved versions. |
| `rights-evidence.json` | Dated publisher-policy triage, exclusions and attribution requirements; not blanket legal clearance |
| `audits/2026-11-06-web-observations.json` | One provider-mediated open observation per URL, including failures, reported redirects and crawl labels |
| `audits/retrieval-*.json` | Format-2 retrieval logs for selected sources (hashes, version IDs and snapshot references; never bodies), listed in `audit.retrievals` |
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

After an intentional metadata edit, run `report` without `--check`, inspect the diff, and validate again. These source-specific checks run in CI (`source-audit` job) from version 0.3. The extraction test checks the committed expected JSON, so regenerating it is a deliberate reviewed change. Tables retain captions, ordered cells and header flags; qualifiers/footnotes remain in order under the same heading. No chunking, embeddings or claim promotion occurs. The extractor intentionally rejects real URLs and unsupported nested blocks/tables; it is not a production extractor.

## Retrieval for rights review (version 0.3)

Stage 1 needs fresh raw versions of the shortlisted pages. In a runtime whose egress goes through an HTTPS proxy and has no local DNS, use the configured-proxy transport. It applies the same URL-shape checks and delegates name resolution to the proxy; the log records that delegation. Keep the snapshots in the git-ignored `data/snapshots/`:

```sh
python data/sources/tools/fetch_metadata.py --network --transport configured-proxy \
  --run-id <run> --snapshot-dir data/snapshots/<run> \
  --source-id src_8db3776594ab --source-id ... \
  --output data/sources/audits/<run>.json
```

- The tool refuses a snapshot folder that is inside the repository and not git-ignored.
- Each body is written to a temporary file and published as `<version>.body` only when it is complete. An existing version is never replaced, and a partial file is removed.
- A storage failure is recorded as `snapshot_write_failed`, with no version, hash or time.
- The configured-proxy transport sends every request, including redirects, through `HTTPS_PROXY` and ignores `NO_PROXY`, because it has delegated the address check to that proxy. It refuses a credentialed proxy URL.
- The User-Agent is chosen once per run, and the same value is sent and recorded.
- The log references a snapshot as `snapshot:<version>.body` and never contains source text. The owner archives the snapshot folder privately; the public repository holds hashes only. Re-hashing an archived snapshot must reproduce the logged `raw_content_sha256`.
- After inspection, list the log in `audit.retrievals` and copy a version into its manifest record (`fetched_at`, `content_hash`, `source_version_id`). Add a `version_review` saying the representation is the source page, not a challenge, shell, error or unrelated page.
- For a received body, the validator requires:
  - a known outcome;
  - a run whose `started_at` and `finished_at` are present, timezone-aware and ordered (otherwise the whole log is rejected);
  - timezone-aware `attempted_at` and `fetched_at`, in order and within that start and finish;
  - a 2xx status;
  - a non-empty body within 2 MiB;
  - a version ID derived from the source ID, fetch time and hash.
- `audit.retrieval_corrections` records provenance errors in committed logs without rewriting them. The validator checks that each log still holds the recorded value.
- The validator refuses:
  - a version without a matching log record;
  - a version without that review;
  - any non-shortlisted source;
  - any log that carries text.
- A reviewed version is still not rights clearance, ingestion approval or factual verification. `rights_status: cleared`, `approved_for_ingestion` and `last_verified_at` remain rejected until a separately reviewed release.

### Running a retrieval on GitHub Actions

If no runtime you control can reach the publishers (this workspace's egress proxy refuses them, and its allowlist can't be changed from the mobile app), run the retrieval through the `source-retrieval` workflow:

1. Commit a request to `retrieval-requests/<run_id>.json`. It names shortlisted source IDs, the transport and a **single-use public key** (`snapshot_recipient.public_key_pem`).
2. `tools/retrieval_request.py` checks the request:
   - sources must be shortlisted manifest IDs;
   - the key must be a PEM public key;
   - a private key is refused.
3. A push that adds the request runs the workflow while the request is still pending, meaning no `audits/<run_id>.json` exists yet.
4. The runner fetches with `fetch_metadata.py` into `$RUNNER_TEMP`, outside the checkout. It then encrypts the snapshot archive: AES-256 with a random key, and that key wrapped by RSA-OAEP-SHA256 to the request's public key.
5. It uploads three files as a one-day artifact, and prints the same three files base64-encoded between `=====BEGIN-RETRIEVAL-FILE` markers in the job log (this workspace can read job logs but not the artifact store):
   - the plain retrieval log (hashes only);
   - the ciphertext;
   - the wrapped key.
6. The holder of the private key downloads and decrypts the artifact, checks every snapshot against its logged hash, and hands the snapshots to the owner to archive privately. Then they commit the log as `audits/<run_id>.json`, which marks the request done, and discard the private key.

The repository is public, so the artifact is readable by any signed-in GitHub user. The job log is public too. That's why the snapshots are only uploaded or printed encrypted. The plain log contains no source text.

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

Version 0.3 (Refs #28):
- `audit.owner_decision` is a dated record of Nissan's decision of 6 November 2026: pilot jurisdiction `AU-QLD`, with `AU-FED` supporting sources. It links the decision comment and replaces 0.2's `pending`.
- `audit.retrievals` lists retrieval logs.
- Every record has a `version_review`, which stays null until a retrieved version is reviewed.

Everything else below is unchanged from 0.2.


- Discovery identity (`source_id`, `url`, `title_as_cited`, `discovered_via`, `discovered_on`) is immutable in this audit. The identity digest catches accidental removal, replacement or reordering. Keep cited titles even if their embedded factual claims/dates have not been checked.
- `publisher`, `source_class`, `jurisdiction` describe the cited source/subject/operator provisionally. They do not prove eligibility, legal authority for every claim, or covered states. `AU-FED` means federal material; `AU-NATIONAL` means Australian ecosystem/operator context. Multi-region lists are not additive counts.
- `canonical_url` stays null pending identity review. `observed_redirect_url` records only the provider-reported destination. A redirect is not proof of identical content or permission to merge two sources.
- `fetch_status` in 0.2 describes the **web-provider observation** only. Raw transport attempts are a separate log; a cached observation never supplies `fetched_at`, `content_hash` or `source_version_id`.
- Publication, source-update, effective and fact-verification dates are separate. Dates inferred only from titles, filenames, crawl labels or fetch times stay null. The single `source_updated_at` value for Ignite+ is explicitly stated on the observed page, not a publication or verification date.
- `rights_status` is `unknown`, `conditional_licence_identified` or `permission_required`. The policy ID links the review rationale, scope and attribution. Conditional permission does not mean all page assets are licensed. This audit contains no `cleared` records.
- `disposition` is `awaiting_rights_review` for the 22 candidates or `out_of_initial_scope` for 113 others, relative to the **proposed** pilot. Retrieval problems remain orthogonal; a 403 does not become a permanent `unavailable` disposition.
- `shortlist_tier` is `core` (8), `reserve` (14) or null. It never means approved ingestion. No human factual verification or original snapshots are claimed.

Version 0.2 validation deliberately rejects ingestion approval, populated factual-verification dates and invented raw versions. A future ingestion increment needs a separately reviewed manifest/schema transition, actual licensed snapshots, source/passage exceptions checked, attribution/retention decisions, and the owner's jurisdiction decision. Do not weaken validation to make a release appear ready. The API's capabilities and fictional corpus are unchanged.
