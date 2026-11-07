# Review of retrievals `retrieval-28-20261106a` and `b`

Refs #28. Reviewed by Claude, builder run `claude-28-20261106-2200`, on 6 November 2026. This is the builder's own review, not an independent one, and it is not rights clearance, ingestion approval or fact verification. Those remain owner decisions. Codex is the proposed reviewer.

## How the retrieval ran

- **Where it ran:** this workspace's egress proxy refuses the publisher hosts, and the owner can't change the allowlist from the mobile app. The owner chose a GitHub Actions runner instead: workflow `source-retrieval`, run [42209663180](https://github.com/nissan/oz-startup-brain/actions/runs/42209663180), with the `direct` transport (the runner has public DNS).
- **First attempt:** run 42209519294 fetched the same sources, but its encrypted output was only in the artifact store, which this workspace can't reach. Those snapshots were never decrypted. The run that counts is the one with the committed log.
- **What was retained:** the runner encrypted the snapshots to a single-use key. They were decrypted outside the repository, and every snapshot re-hashed to its logged `raw_content_sha256`. The repository holds only the log.
- **Hashes change on every fetch:** the business.gov.au HTML differs byte-for-byte between the two runs (per-request tokens). A hash identifies one retrieved version. It is not a stable fingerprint of the page.

## Results

| Source | Outcome | Representation review | Promoted to manifest |
| --- | --- | --- | --- |
| `src_8db3776594ab` Ignite Ideas Fund | HTTP 403 from `advance.qld.gov.au` (the discovery host, before any redirect) | — | no |
| `src_5dcbf23541e6` Ignite+ | HTTP 403 from `advance.qld.gov.au` | — | no |
| `src_d1313206eafa` Ignite Spark | HTTP 403 from `advance.qld.gov.au` | — | no |
| `src_7d73188025be` AI Adopt Centres | 200, 349,924 bytes | source page | yes |
| `src_f164f71e6364` Grants and programs finder | 200, 461,361 bytes | **shell**: an interactive finder whose results load in the browser; the HTML holds only filter labels and empty-result templates | **no**; not a usable version of the source |
| `src_03aaa6584d27` Industry Growth Program | 200, 396,245 bytes | source page, with the "currently paused to new applications" banner | yes |
| `src_96ad709aa550` R&D Tax Incentive overview | 200, 365,255 bytes | source page | yes |
| `src_9ba1bc6b991a` R&DTI software sector guide | 200, 367,357 bytes | source page | yes |

Every page matched a naive challenge keyword, but on inspection this was a false positive: a reCAPTCHA script that business.gov.au loads for its feedback form. A check that searches for "captcha" would misclassify all of these pages.

The Queensland 403s are recorded and not worked around. Run `retrieval-28-20261106b` fetches each record's reviewed `observed_redirect_url` on `innovation.qld.gov.au`, which is the department's current home for these programs. It does not retry the host that refused.

## Run b: the Queensland pages through their reviewed redirect destinations

Run [42209973408](https://github.com/nissan/oz-startup-brain/actions/runs/42209973408) (`retrieval-28-20261106b`, log `retrieval-28-20261106b.json`) requested each record's reviewed `observed_redirect_url` on `innovation.qld.gov.au`. All three answered **HTTP 403 from `innovation.qld.gov.au` itself**, so no version or snapshot was created. Nothing further was attempted from the runner: no other user agent, retry or mirror.

**What this shows, and what it doesn't:**
- On the tested GitHub-hosted runner, these six requests returned 403: three discovery URLs (run a) and three reviewed destinations (run b).
- The logs don't establish why. The publisher, a network filter, or something about the runner or request could each explain it. They also don't guarantee that a fetch from another network, such as the owner's computer, would succeed.
- The browsing provider's cached views from the 6 November audit are not raw versions.
- Possible next steps, each recorded as a new retrieval run: a fetch from a network the owner chooses, or a permission request or a copy supplied by the publisher.
- Until one succeeds, the retrieved core is federal material only. That is not Queensland coverage.

## Page-level rights exceptions (input to gate 4; not clearance)

business.gov.au's [copyright notice](https://business.gov.au/legal-notices/copyright) licenses covered department content under CC BY 3.0 AU, but excludes images, marks and third-party material (policy `business_gov_au` in `rights-evidence.json`). Items on these pages that would need excluding or separate permission:

| Source | Exclude or check before any reuse |
| --- | --- |
| AI Adopt Centres | Descriptions of the four centres (SMEC AI, ARM Hub, SAAM, ARAIN) and their external links. These may be operator-supplied text; confirm authorship, or keep link-only. |
| Industry Growth Program | Two images (EMVision team; JEMTEC). Both "Customer stories" (EMVision, Engentus) are third-party material. Keep the paused-applications banner with any extracted application text, and give it precedence. |
| R&DTI overview | Embedded YouTube video (excluded). The program is jointly administered with the ATO, so ATO-owned guidance it links to falls under the ATO's own terms, not this licence. |
| R&DTI software sector guide | Two images (excluded). The page's own disclaimer section must travel with any extract. The "Hypothetical" case studies are department-authored examples, not real recipients, and must stay labelled as hypothetical. |

## Corrections after Codex review of PR #40 (7 November 2026)

- **User-Agent.** Both runs sent `OzStartupBrain-SourceAudit/0.2 (metadata review; no ingestion)` (direct transport), but their logs record the 0.3 agent in `run.user_agent`. The logs are kept as committed. The correction is recorded in `audit.retrieval_corrections` and shown in the inventory's "Provenance corrections" table. The tool now chooses the agent once, and the same value is sent and recorded.
- **Evidence boundary.** The byte re-hash of the decrypted snapshots, the page classifications and the rights-exception observations above are builder-reported. The reviewer had no access to the private snapshots. The same applies to the hand-over and key deletion.
- **Retention wording.** The four promoted records' `retention_policy` now says what happened: hashes in the repository, and the raw snapshot held privately by the owner (the owner's storage choice). That is not a rights or retention decision about the content.

## Still to do for these sources

- Owner's rights decision per page: intended use, retention and attribution text.
- Human checks of the program-status, eligibility and date claims. Factual verification is not inferred from a fetch.
- Codex review of this record.
