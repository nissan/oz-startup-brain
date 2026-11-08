# #28 release decision package

Refs [#28](https://github.com/nissan/oz-startup-brain/issues/28). Prepared 8 November 2026 by Claude, run `claude-28-20261108`. Originally builder preparation. Owner policy selections were approved on 8 November 2026 and transcribed by Codex; this is not rights clearance or an independent review.

Stage 1 cannot release a corpus until page-level rights review and human checks are complete. The machine-readable record is [`decisions.json`](decisions.json).

## Owner selections — 8 November 2026

[Owner authorization, transcribed by Codex](https://github.com/nissan/oz-startup-brain/issues/28#issuecomment-6715324855).

- Keep Queensland as the pilot. Select `owner_computer`; OpenClaw may execute the existing local fetch on Nissan's behalf. If blocked, stop and prepare a department access/copy request.
- Select `federal_interim`, explicitly labelled limited federal coverage.
- For the four retrieved federal pages: `paraphrase`, `private_snapshot_until_recheck`, `policy_prescribed`. Verify the exact attribution wording and page-specific exceptions before release; paraphrasing does not waive rights review.
- Set the seven substantive pages' inclusion to `defer` and the grants-finder shell to `exclude`.
- Prioritize the 15 human checks on the federal pages. No named human checker or completion date has been assigned. All 26 check results remain null.

This records 22 of 34 selections. The 12 remaining use/retention/attribution fields concern the three unretrieved Queensland pages and excluded finder; leave them pending. No manifest gate or source version changes. The original options and rationale below remain for reference; the selection record above supersedes their proposal labels.

`tools/release_decisions.py` runs inside `source_audit.py validate`. Its checks are **structural**:
- every required decision and the reviewed fact-check inventory are present (the inventory is pinned by a SHA-256 in code);
- decision values come from a fixed list in code;
- a recorded decision carries `decided_by: "Nissan (owner)"`, a valid date and a GitHub comment URL;
- a recorded fact check carries a non-agent name, a date and a target;
- inclusion requires a reviewed version, every decision and confirmed checks;
- each page's licence policy follows its publisher, and its retrieval state follows the retrieval logs;
- long passages and source-text keys are rejected.

It **cannot** check whether the linked comment really authorises the decision, whether the named person checked anything, or whether a short string was copied from a source. Independent and human review remain the semantic gate.

## Where things stand (8 November 2026)

| Page | Publisher licence (triage, not clearance) | Retrieved version | Blocking item |
| --- | --- | --- | --- |
| Ignite Ideas Fund `src_8db3776594ab` | DETSI, CC BY 4.0 | `sv_57886ef3d5c8149e1493` (#59, local run; operator-reviewed) | Page-level rights exceptions; fact checks; release inclusion `defer` |
| Ignite+ `src_5dcbf23541e6` | DETSI, CC BY 4.0 | `sv_e178e12679fad4e7c0a9` (#59, local run; operator-reviewed) | Page-level rights exceptions; fact checks; release inclusion `defer` |
| Ignite Spark `src_d1313206eafa` | DETSI, CC BY 4.0 | `sv_90b431e7f3c73c826661` (#59, local run; operator-reviewed) | Page-level rights exceptions; fact checks; release inclusion `defer` |
| AI Adopt Centres `src_7d73188025be` | business.gov.au, CC BY 3.0 AU | `sv_5c4b6a8ffd94aa780022` | Use, retention, attribution; 4 fact checks |
| Grants and programs finder `src_f164f71e6364` | business.gov.au | none: interactive shell | Drop or replace (decision 4) |
| Industry Growth Program `src_03aaa6584d27` | business.gov.au, CC BY 3.0 AU | `sv_bd9ea252a09e4ff8262a` | Use, retention, attribution; 3 fact checks |
| R&D Tax Incentive overview `src_96ad709aa550` | business.gov.au, CC BY 3.0 AU | `sv_87c9b944493e4b99b654` | Use, retention, attribution; 4 fact checks |
| R&DTI software guide `src_9ba1bc6b991a` | business.gov.au, CC BY 3.0 AU | `sv_b1322863d404e0fb62fc` | Use, retention, attribution; 4 fact checks |

Evidence:
- [retrieval review](../audits/retrieval-28-20261106-review.md): runs a and b, the 403s, page-level rights exceptions and corrections;
- [rights register](../rights-evidence.json);
- [inventory](../audits/2026-11-06-inventory.md).

The four snapshots are held privately by Nissan; the repository holds hashes only.

## Update, 8 November 2026: Queensland pages retrieved

Nissan chose `owner_computer` (#28 owner record). OpenClaw ran the fetch on his computer (run `retrieval-28-local-20261108T005941Z`, #59, merged as `269fc8c`). All three discovery URLs returned HTTP 200 after normal redirects to their reviewed `innovation.qld.gov.au` destinations.

The versions are now promoted in the manifest. Their representation review is **OpenClaw's operator inspection** of the private snapshots, by Nissan's choice (b) ([record](https://github.com/nissan/oz-startup-brain/issues/28#issuecomment-6715605146)). Claude has not seen these bytes.

**Page-level rights exceptions for the Queensland pages are not yet listed.** The DETSI notice excludes images, marks and third-party material. Listing what that means on each page needs someone with the snapshots. Until it is done, `licensed_excerpts` is not available for these pages; `paraphrase` still needs the same check before release.

The decision below is kept for the record.

## Decision 1: Queensland retrieval route

The three Queensland pages returned 403 on the tested GitHub-hosted runner, from both `advance.qld.gov.au` and the reviewed `innovation.qld.gov.au` destinations. The cause is not established.

| Option (`queensland_retrieval_route`) | What it involves |
| --- | --- |
| `owner_computer` | Nissan runs the repository's own fetch tool from his computer. It sends the same honest User-Agent and solves no challenges. If it gets a 403 or a challenge page, stop: that is the publisher's answer. |
| `permission_request` | Ask the department for an access route or a supplied copy. A draft is below. |
| `federal_only_interim` | Go ahead with federal pages only, labelled as not Queensland coverage. |
| `change_pilot` | Revisit the 6 November jurisdiction decision. |

**Approved direction:** try `owner_computer` first, because it takes minutes. If it is refused, prepare `permission_request` as the fallback. Meanwhile, `federal_only_interim` unblocks the release work (decision 4).

**Commands for `owner_computer`**, from an up-to-date clone of `main`. Snapshots go *outside* the repository, and the tool refuses a folder that isn't git-ignored:

```sh
python3 data/sources/tools/fetch_metadata.py --network --transport direct \
  --run-id retrieval-28-20261108c \
  --snapshot-dir "$HOME/ozsb-private-snapshots/retrieval-28-20261108c" \
  --source-id src_8db3776594ab --source-id src_5dcbf23541e6 --source-id src_d1313206eafa \
  --output data/sources/audits/retrieval-28-20261108c.json
```

If the discovery host still answers 403, try each record's reviewed destination once. Run `d` adds `--via-observed-redirect src_8db3776594ab --via-observed-redirect src_5dcbf23541e6 --via-observed-redirect src_d1313206eafa`. Then hand the log, not the snapshots, back for a representation review, as in runs a and b.

I checked the command here: it parses, records the 0.3 agent, and writes a log that passes `validate_retrieval_log`. This workspace has no route to the publishers, so it fetched nothing.

**Draft permission request**, to send through the department's website contact channel; no address is assumed:

> Subject: Request for an access route to Advance Queensland program pages for a founder-support research prototype
>
> We are building a non-commercial research prototype that helps early-stage founders find the right support programs and cite official sources. Your copyright notice licenses department material under CC BY 4.0, and we would attribute it as it prescribes. Automated, identified requests to the Ignite Ideas Fund, Ignite+ and Ignite Spark pages from our test environment receive HTTP 403. Could you advise an approved way to obtain current copies of these pages (for example an access route, a feed, or supplied copies), or confirm you would prefer we link to them only? We do not bypass access controls.

## Decision 2: use, retention and attribution, per page

Options for each page are in `decisions.json` → `options`:
- **use:** `link_only`, `paraphrase` or `licensed_excerpts`;
- **retention:** `hashes_only`, `private_snapshot_until_recheck` or `private_store_for_pipeline`;
- **attribution:** `policy_prescribed`.

**Approved policies for the four business.gov.au versions (release checks remain pending):**
- **Use: `paraphrase`** for the first release. Short cited statements carry less rights risk than excerpts. They also avoid the per-page exceptions the retrieval review lists: operator-supplied centre descriptions, customer stories and images, an embedded video, and a disclaimer and "hypothetical" labels that must travel with any extract. Move to `licensed_excerpts` later, once extraction can enforce those exceptions.
- **Retention: `private_snapshot_until_recheck`**, so each fact check and re-hash stays auditable.
- **Attribution: `policy_prescribed`.** Verify and apply the business.gov.au notice's exact wording before release. I couldn't open the notice from this workspace, so the selection records the attribution policy, not verified attribution text. The register summarises it as the Commonwealth of Australia attribution under CC BY 3.0 AU, with source URL, licence link and change note.

## Decision 3: human fact checks

`decisions.json` lists **26 fact checks**. Each is a question about the page, for example: is the Industry Growth Program still paused, and is a reopening date stated? Answering them needs nothing beyond the page itself. For each check, a named person records:
- `result`: `confirmed`, `differs`, `not_stated` or `unclear`;
- `checked_by`: a person, never an agent;
- `checked_on`;
- `checked_against`: `live_page` or that page's version ID.

A page can be included only when all its checks are `confirmed`. Status and date checks age quickly, so redo them close to release.

## Decision 4: release scope and the grants finder

| Option (`release_scope`) | Trade-off |
| --- | --- |
| `federal_interim` | A first release of the reviewed federal pages, labelled federal and not Queensland coverage. It gives #29 a real, small corpus to integrate against. |
| `wait_for_queensland` | No release until the Queensland pages are retrieved and reviewed. Truer to the pilot, but it depends on decision 1. |

**Approved scope:** `federal_interim`, with the finder `src_f164f71e6364` set to `exclude`. Its HTML holds no results, so it can't serve as a source. Replace it later with specific program pages from the reserves, after their own rights review.

## How a decision gets recorded

1. Nissan comments the decision on #28 (or on the PR that records it).
2. An agent sets the field in `decisions.json`. It uses `decided_by: "Nissan (owner)"`, the date and that comment's URL, then opens a PR. The validator checks that metadata is present and well formed; the reviewer checks that the comment actually says it.
3. When the release itself is prepared, the manifest's gates move in a separate reviewed PR: `ingestion_approved`, `human_fact_verified` and each record's `rights_status` and `disposition`. Until then `source_audit.py` keeps rejecting `cleared`, `approved_for_ingestion` and `last_verified_at`.

Nothing here makes a paid call, ingests anything or stores third-party text.
