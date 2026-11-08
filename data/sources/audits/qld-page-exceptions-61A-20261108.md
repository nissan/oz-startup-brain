# Queensland page-level exception inventory — #61 Part A

Refs #61, #28, #59 and #60. Listed on 8 November 2026 by **Locutus (Loki), OpenAI/OpenClaw**, run `openclaw-61A-20261108`, on Nissan's instruction (conversation20398). **The listing operator held and inspected all three private snapshot bodies.** This is the retrieval operator's own inspection, not independent review, human factual verification, legal clearance or owner approval. Claude retains source coordination/review; Codex is requested to check provenance.

## Bound identity and method

- Clean isolated branch `audit/61-qld-exceptions` from `main` at `c4f54ac8902a353d9497607b6736b591a95f97c6`. Python 3.15.2. Exact published audit head/tree belong in the PR handoff (avoids a self-referential hash).
- Existing retrieval log: [`retrieval-28-local-20261108T005941Z.json`](retrieval-28-local-20261108T005941Z.json). No new requests were made.
- **Before inspection**, read each private body, recomputed SHA-256 and byte length, and matched both against that source's log entry. All three passed. The version IDs below join the inspected bytes to the log and the manifest; no version is changed by this note.
- Inspected the decoded HTML text, image references, SVG symbol references, story cards, resource links and footer/legal links. This is source-HTML inspection, not a browser render or an inspection of remotely referenced image/media bytes. Referenced assets, linked story pages, PDFs, external guidance, CSS and scripts were not fetched.
- No source passages, HTML, screenshots, image bytes or private filesystem paths are reproduced. Element descriptions and identifiers below are original audit metadata, not copied card/paragraph text.

| Page / source | Version | Bytes | Recomputed SHA-256 |
| --- | --- | ---: | --- |
| Ignite Ideas Fund / `src_8db3776594ab` | `sv_57886ef3d5c8149e1493` | 39940 | `943bf5dac60a378f7bd66e1c5b2f408ea24b6743bb325be1e46666f0fcdb94d3` |
| Ignite+ / `src_5dcbf23541e6` | `sv_e178e12679fad4e7c0a9` | 36855 | `c1aeafebaae50a27b0dfe677132e47239fc7a90f31cf640164e4e55fde6e5d2c` |
| Ignite Spark / `src_d1313206eafa` | `sv_90b431e7f3c73c826661` | 36194 | `b94a8bee25b88383993288d4568bacfc92f7e02a5ec0f7f99f4c7b968f51d226` |

## Policy boundary shared by the three pages

All three saved HTML pages link to the DETSI copyright notice, `https://www.detsi.qld.gov.au/help/legal/copyright`. The existing [`qld_detsi` policy record](../rights-evidence.json) identifies conditional CC BY 4.0 for covered department material and exclusions for images, logos, trademarks and third-party material. That is a previously recorded policy observation, **not a fresh review of the notice**. This inventory identifies elements to exclude or hold for a separate rights/authorship decision; it does not assert that every named item is legally third-party-owned. Hosting on a government domain is not ownership evidence.

Shared elements to exclude from any text-only source extract or clear separately:

- Two Queensland Government logo symbol references per page, using the inline and stacked logo SVG assets. Government marks are not licensed merely because nearby text has a CC notice.
- Header/banner imagery and any story/initiative-card imagery identified below. Empty alternative text is not a licence or photographer credit.
- Site-interface icons, social/service marks, external font references, styles/scripts and surrounding navigation/footer chrome. These are not program evidence; do not bundle site assets with a text extract. Font/software/asset terms were not examined.
- Footer copyright/attribution and disclaimer links are provenance, not an authorisation to drop notices. Exact attribution wording and required contextual notices remain for the separate rights/release review.

## Ignite Ideas Fund — page-specific elements

- **Four image elements:** one program banner (asset `1879382`, responsive desktop/tablet variants) and three story-card images (assets `1879831`, `1881804`, `1881823`). Exclude all four image elements and their responsive derivatives; image authorship/licensing was not established.
- **Three business case-study cards:** Thermal Armour (wearable medical warming product), Huds & Toke (pet-treat business), and Cub Care (paediatric-care business). The cards include business/product descriptions and links to longer stories. Hold the snippets for authorship/third-party-material review, or keep link-only; do not assume operator-supplied text is department-owned. The Thermal Armour snippet also contains a registered product mark (Evertec); do not reproduce branding as a licensed asset or imply endorsement.
- **Separately linked grant-writing material:** a Tourism and Events Queensland guide PDF hosted in a QTIC Azure blob container, plus Business Queensland grant-writing guidance. These are linked resources, not bytes inspected here; no rights inherit from the parent page. Do not import the PDF or linked guidance under this page's licence without a separate review.
- **Recipient-list and related-program links:** references to award recipients, grant-finder and Ignite+ destinations are not an inspection/clearance of those destinations or their business names/material. Keep any later destination retrieval/version/rights checks separate.

## Ignite+ — page-specific elements

- **Five image elements:** one banner (asset `2061391`, responsive variants), two program-stream card images (`2061413`, `2061415`), and two story-card images (`1881823`, `1879859`). Exclude all five image elements and derivatives unless separately cleared.
- **Two business case-study cards:** Cub Care (paediatric-care service) and Voltin (building-inspection technology). Card snippets contain business/product narratives; their authorship and any business-supplied descriptions/claims are unestablished. Exclude the snippets or keep link-only pending authorship/rights review. The longer linked stories were not inspected.
- **Two initiative/stream cards:** commercialisation-and-growth and scale-up offerings, each with linked detail pages and an image. The linked program descriptions are not themselves evidence of a third-party exception; the images remain excluded, and detail-page/operator material needs its own review if later fetched. No partner/operator-logo strip or standalone attributed testimonial was identified in these saved HTML bytes. This is a bounded observation, not a claim about assets loaded dynamically.

## Ignite Spark — page-specific elements

- **One image element:** the program banner (asset `1883030`, responsive desktop/tablet variants). Exclude the image and derivatives; no image rights/credit were established.
- **External application-platform guidance:** a SmartyGrants applicant help-guide link. Treat SmartyGrants as a separately controlled service/brand; no licence to its guide, UI, marks or destination content is inferred from this program page. Destination bytes were not inspected.
- **Separately linked grant-writing material:** the Tourism and Events Queensland guide PDF in the QTIC-hosted blob container and Business Queensland guidance, as above. Link-only until separately reviewed; neither linked document was fetched here.
- **Recipient-list, related-program and grant-finder links:** destinations may contain business/third-party material not covered by the parent-page inspection. No business story-card excerpts, embedded video or standalone attributed quotation were identified in this saved HTML. Do not generalise that observation to unfetched resources or future page revisions.

## Boundaries and remaining work

- The saved HTML has no `blockquote`, `cite`, `iframe`, `video` or `audio` element on these three pages. That structural check does **not** prove an absence of all third-party prose, dynamic media or rights exceptions; the business snippets and linked resources above are the concrete cautions.
- No image files were downloaded or visually identified. Asset IDs and element/card associations allow a byte-holder to locate the exact references; descriptions do not guess what an unlabelled photograph depicts.
- Department-authored core program prose is only a candidate for the recorded licence. This inventory neither verifies current program facts nor selects permitted use, retention or attribution.
- **Part B remains for Nissan.** This change does not edit `decisions.json`, the manifest, source versions, fact-check results or release gates. Release inclusion remains `defer` until the separate rights/owner/factual gates pass. No ingestion, paid calls, deployment or merge.

## Validation / review handoff

At the pinned base plus this note: `source_audit.py validate` PASS (3 registered logs, 7 reviewed versions); `source_audit.py report --check` PASS; `python3 -m unittest discover -s data/sources/tools -p 'test_*.py'` **68/68 PASS**; `git diff --check` PASS. Private snapshot SHA-256/size/log/manifest version joins: **3/3 PASS**. Python 3.15.2 is a local substitute for CI Python 3.12; an existing non-failing HTTPError ResourceWarning occurred in a fixture test. Exact audit head is recorded in the PR. Visual gate N/A: an audit note only; no frontend or visual assets changed. Claude: review exception interpretation and the bounded HTML-only inspection. Codex: verify log/version/hash joins and that only this new note changes. Private byte access is required to reproduce the snapshot inspection; a reviewer without those bytes must label it operator-reported, not independently verified.
