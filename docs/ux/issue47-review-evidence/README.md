# PR47 review corrections — durable rendered evidence

Refs #26, #43, #46; addresses reviews5814777565/5815104382 and inline4503607719/4503821707/4503821713/4503821717. Builder-run **primed inspection**, not independent review, fresh synthetic actors, human research or owner approval. No merge, deployment or #45 work.

## Identities and conditions

- Before: published PR47 head `743d9f0923088de6725127d11b597368210e87e0`, tree `feea30859f2a3bfccae9e59624ffe58d198a7018`, upstream base `409d327eb89c4a7ae09650916621705adcf716c7`.
- Revised candidate: this document's containing Git commit. [Manifest](manifest.json) pins exact tested source bytes and every actual PNG; images are committed here, not just hashes or expiring hosting.
- Original #46 before: `8c3eaee88c1f009675417c7ace87244e4fccb30b`. Original #46 after: product bytes later committed as `978ed165f636b49666dfcc573717053d24e48702`; final test-only continuation does not change them. Original capture records: [before](original46/before/observations.json), [after](original46/after/observations.json). Their API clock/corpus are November7 / `fixture-2026-11-07.1`, Chrome156.0.8078.80, 100% zoom, scale1.
- Revised render/browser tests: Chromium153.0.8010.12 / Playwright JS1.63.0; CSS widths390/768/1280 for A2/idea/prototype bounds, both themes. Original-journey comparison uses390/1440×900, both themes, same questions/context and open glossary as the original #46 after set; [capture script](capture.mjs), [painted-font/overflow records](final/observations.json). Clock November7, same fictional corpus; Fraunces and Atkinson are actual painted custom fonts. Cross-browser glyph differences are disclosed, not a pixel-perfect difference claim.
- T01 comparison question: “I am building a software startup in Toowoomba. Where should I begin?”, then explicit Queensland; stage unset. T03 comparison: “What does round A2 require today?” with explicitly selected Working prototype. These match the original #46 matrix, not exact actor task sessions. Exact initial actor T01/T03/T05 briefs are separately regression-tested via API; stage is never inferred from prose.

## Visual critique → fix → revised inspection

| Rank | Before observation | Fix | Actual revised inspection |
| --- | --- | --- | --- |
| 1, blocking | A2 map's second lines visibly clip at right drawing boundary; main's A2 sequence was empty, so this is introduced by integrated PR47, even though it precedes the #46-only increment. | Concise equivalent labels preserve working prototype/customer-interest evidence and checking IP ownership/gathering customer evidence. No API claims, claim IDs, dates, applicability or evidence gates change. | Actual revised phone light/dark, tablet and desktop images inspected: both labels readable in drawing and equivalent list; editorial preparation retains `Suggested next step` badge and explicit Requirement / Preparation prose. All18 route/width/theme combinations pass actual SVG getBBox bounds. |
| 2 | Glossary/wording before/after existed only in local evidence. | Commit original16 full before/after matrix images, useful sequence crops and revised final renders with relative links below. | Open/closed distinction and editorial caveats are visible; committed PNGs are available to an independent reviewer without workstation access or temporary URLs. |
| 3 | Pending follow-up announced “Showing” earlier answer while results were hidden; generic paragraph had prohibited ARIA naming. | Stale banner requires result, !pending, and failure/context mismatch. Remove paragraph aria-label; retain visible context text. Unset-stage banner reads “answer with no stage selected”. | Held-request browser regression verifies no stale banner/context paragraph while waiting; after release visible context text remains and has no aria-label. Existing failed-follow-up regression still proves prior answer is visible and stale. |

Representative actual views inspected include original before/after T01/T03 desktop light, original phone T03 dark/T01 light, revised A2 phone both themes/tablet light/desktop dark, idea phone light/tablet dark, prototype phone dark/desktop light, and revised original-journey phone dark/desktop light. Automated bounds cover every linked route condition. Remaining long phone pages intentionally preserve inline evidence. No new design system, tokens, truncation or hidden claims. Visual judgement: corrected bounded surfaces are suitable for independent review; not an owner design approval, screen-reader conformance or full UX acceptance.

## Original #46 full before/after and current final matrix

| Task / CSS width / theme | Original before | Original after | Revised final |
| --- | --- | --- | --- |
| T01 / 390 / light | [Before](original46/before/t01-390-light.png) | [After](original46/after/t01-390-light.png) | [Final](final/t01-390-light.png) |
| T01 / 390 / dark | [Before](original46/before/t01-390-dark.png) | [After](original46/after/t01-390-dark.png) | [Final](final/t01-390-dark.png) |
| T01 / 1440 / light | [Before](original46/before/t01-1440-light.png) | [After](original46/after/t01-1440-light.png) | [Final](final/t01-1440-light.png) |
| T01 / 1440 / dark | [Before](original46/before/t01-1440-dark.png) | [After](original46/after/t01-1440-dark.png) | [Final](final/t01-1440-dark.png) |
| T03 / 390 / light | [Before](original46/before/t03-390-light.png) | [After](original46/after/t03-390-light.png) | [Final](final/t03-390-light.png) |
| T03 / 390 / dark | [Before](original46/before/t03-390-dark.png) | [After](original46/after/t03-390-dark.png) | [Final](final/t03-390-dark.png) |
| T03 / 1440 / light | [Before](original46/before/t03-1440-light.png) | [After](original46/after/t03-1440-light.png) | [Final](final/t03-1440-light.png) |
| T03 / 1440 / dark | [Before](original46/before/t03-1440-dark.png) | [After](original46/after/t03-1440-dark.png) | [Final](final/t03-1440-dark.png) |

## PR47 regression baseline and revised route matrix

Baseline failure captures: [390px A2 light](before/pr47-desktop-a2-390-light.png), [768px A2 light](before/pr47-desktop-a2-768-light.png), [1280px A2 light](before/pr47-desktop-a2-1280-light.png). Original #46 matrix above also preserves A2 clipping in both themes.

| Route / CSS width | Light final | Dark final |
| --- | --- | --- |
| a2 / 390 | [Render](final/pr47-desktop-a2-390-light.png) | [Render](final/pr47-desktop-a2-390-dark.png) |
| a2 / 768 | [Render](final/pr47-desktop-a2-768-light.png) | [Render](final/pr47-desktop-a2-768-dark.png) |
| a2 / 1280 | [Render](final/pr47-desktop-a2-1280-light.png) | [Render](final/pr47-desktop-a2-1280-dark.png) |
| idea / 390 | [Render](final/pr47-desktop-idea-390-light.png) | [Render](final/pr47-desktop-idea-390-dark.png) |
| idea / 768 | [Render](final/pr47-desktop-idea-768-light.png) | [Render](final/pr47-desktop-idea-768-dark.png) |
| idea / 1280 | [Render](final/pr47-desktop-idea-1280-light.png) | [Render](final/pr47-desktop-idea-1280-dark.png) |
| prototype / 390 | [Render](final/pr47-desktop-prototype-390-light.png) | [Render](final/pr47-desktop-prototype-390-dark.png) |
| prototype / 768 | [Render](final/pr47-desktop-prototype-768-light.png) | [Render](final/pr47-desktop-prototype-768-dark.png) |
| prototype / 1280 | [Render](final/pr47-desktop-prototype-1280-light.png) | [Render](final/pr47-desktop-prototype-1280-dark.png) |

## Fresh validation and exact commands

Clean locked install after removing node_modules and all workspace dist directories. Node22.23.0 / npm10.9.8 (declared npm10.9.9; no manifest/lock changes), Python3.14.3. Local Python Playwright1.58.0 + installed Chrome156 replaces documented Python Playwright1.51/Chromium134 for design-tool regression tests; JS suite uses its matching cached Chromium153. All local substitutes are disclosed, not claimed literal CI runtime parity.

Commands from repository root unless stated:

```sh
npm ci
npm run check:generated
npm run check:compat
npm run typecheck
npm test
npm run demo:fixture
# From apps/web; direct CLI preserves flags, same configured suite as npm run e2e
OSB_EVIDENCE_DIR=../../docs/ux/issue47-review-evidence/final node ../../node_modules/@playwright/test/cli.js test
python3 research/synthetic-ux/tools/validate_pack.py
python3 -m unittest discover -s research/synthetic-ux/tools -p 'test_*.py' -v
python3 design/tools/tokens_css.py --check
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' OSB_RENDER_NODE_MODULES=design/tools/node_modules python3 -m unittest discover -s design/tools -p 'test_*.py' -v
python3 data/sources/tools/source_audit.py validate
python3 data/sources/tools/source_audit.py report --check
python3 -m unittest discover -s data/sources/tools -p 'test_*.py' -v
```

[Check logs](checks/) redact workstation prefixes and normalize trailing whitespace only; no credentials are included.

- Fail-before API: four quoted off-topic negatives fail on old corpus (17 other scenarios pass). Browser: held request and A2 SVG bounds at390/768/1280 all fail on unchanged built product. [API reproduction](checks/before-api.log), [browser reproduction](checks/before-browser.log).
- First correction: focused API22/22 and focused browser4/4 pass, including all18 route conditions. [API](checks/after-api.log), [browser](checks/after-browser.log).
- Final clean generated/compatibility/typecheck/build pass. Unit139/139 (24contracts,4client,92API,19BFF); demo9/9; full browser52/52, retries0; persona validator+13tests; design token consistency+22renderer/a11y-tool tests; source validator/report drift+55tests pass. No scenario-review checkpoint regenerated. Dependency install reports7low advisories; no unrelated dependency upgrade.
- Harness correction, not a second product defect: a newly added off-topic browser assertion initially used the wrong heading (“Not enough evidence” instead of existing “No answer from the evidence”); corrected against source before final full52/52. One local helper invocation used the wrong cwd and was rerun correctly. Neither changed product behavior or weakened a semantic assertion.

Remaining gates: hosted fork CI approval/execution, independent exact-head review, maintainer merge and resulting-main verification. Keep #45 continuity, T13/source-return/panel-close, actual screen-reader and human/real-source acceptance open. Local regression counts do not close #26/#43 or certify production.
