# Mock-ups handoff

Versioned export of the "Oz Startup Brain Mock-ups" Claude Design canvas: the artboard sources and PNG renders of each, so a reviewer can inspect the delivered mock-ups without the owner's Claude session.

| Item | Value |
| --- | --- |
| Artifact | https://claude.ai/artifact/Dh4MHqWBNHXCYJRzAudKfc |
| Artifact version exported | `1793909145-03de` (version 14) |
| Design system used | `../system/` at artifact version `1793909088-3a56` (version 9); `canvas.json` → `designSystems[0].version` carries the same identifier |
| Export date | 6 November 2026 |
| Owner approval | **Pending** — one review with the design system and brand kit (#8) |

| Artboard | File | Renders (light, dark) | Covers |
| --- | --- | --- | --- |
| Journey workspace (desktop page, 1280×1800) | `Main.dc.html` | [`../exports/mockups/Main-light.png`](../exports/mockups/Main-light.png), [`Main-dark.png`](../exports/mockups/Main-dark.png) | Coverage banner, starter tasks, context chips with Unknown, three next-step cards (checked / needs a current check / suggested), source panel with rights-cleared excerpt, prerequisite map with sourced and editorial edges |
| SB5a Evidence limits (1440×1080) | `SB5a-Evidence.dc.html` | [`SB5a-Evidence-light.png`](../exports/mockups/SB5a-Evidence-light.png), [`SB5a-Evidence-dark.png`](../exports/mockups/SB5a-Evidence-dark.png) | SC06 historical-only, SC07 sources disagree (both dated claims), outside current coverage, SC02 context changed |
| SB5b Service limits (1440×1320) | `SB5b-Service.dc.html` | [`SB5b-Service-light.png`](../exports/mockups/SB5b-Service-light.png), [`SB5b-Service-dark.png`](../exports/mockups/SB5b-Service-dark.png) | SC17 graph unavailable with a usable passage-only answer, SC18 retrieval outage with preserved draft, SC18 budget reached; all with a service-status notice, none with an evidence label |
| SB3 Ask (390×844) | `SB3-Ask.dc.html` | [`SB3-Ask-light.png`](../exports/mockups/SB3-Ask-light.png), [`SB3-Ask-dark.png`](../exports/mockups/SB3-Ask-dark.png) | Type or record deliberately; provider disclosure placeholder |
| SB3 Review transcript (390×844) | `SB3-Transcript.dc.html` | [`SB3-Transcript-light.png`](../exports/mockups/SB3-Transcript-light.png), [`SB3-Transcript-dark.png`](../exports/mockups/SB3-Transcript-dark.png) | Editable transcript with a flagged place name (SC10) |
| SB3 Route and coverage (390×844) | `SB3-Route.dc.html` | [`SB3-Route-light.png`](../exports/mockups/SB3-Route-light.png), [`SB3-Route-dark.png`](../exports/mockups/SB3-Route-dark.png) | One next step with dated evidence and an honest outside-coverage gap |
| Brand sheet (1440×1480) | `Brand-Sheet.dc.html` | [`Brand-Sheet-light.png`](../exports/mockups/Brand-Sheet-light.png), [`Brand-Sheet-dark.png`](../exports/mockups/Brand-Sheet-dark.png) | Mark and the three lockups in their light and dark files, each on a fixed specimen ground of the kind it is permitted on (so the sheet reads in both themes), favicon sizes, OG preview, icons and usage rules (see `../brand/HANDOFF.md`) |
| SB3 Listen or read (390×844) | `SB3-Summary.dc.html` | [`SB3-Summary-light.png`](../exports/mockups/SB3-Summary-light.png), [`SB3-Summary-dark.png`](../exports/mockups/SB3-Summary-dark.png) | Spoken summary on request with sources visible (SC11 variant) |

`../tools/render.py` performs a geometric bounds check as part of every render: in both themes, every button, link, input, select, textarea, paragraph and heading on every artboard must lie inside its artboard's frame from `canvas.json`, or the script prints `BOUNDS <artboard> <theme>: <element>` and exits nonzero. The committed exports were produced by a passing run on 6 November 2026. This is a check of the fallback-font render, not of the hosted artifact's exact glyph widths.

**Embedded design-system version.** The canvas copies the design system's `README.md`, `tokens.json`, `components/bundle.js` and `components/bundle.css` into `ds/oz-startup-brain/` at publish time; `canvas.json` records which artifact version they came from. Before version 14 that stamp still read `1793907664-c590` (the first copy) although the copied files had been refreshed on each republish: the files embedded in canvas version 12 were compared byte for byte with the committed version-8 export of `../system/` and were identical, so the stamp was stale metadata, not a divergent system. The stamp is now set from the version actually copied and must be updated on every re-export; the same comparison (`cmp` of the four files against `../system/`) is the check.

Every program, round, source and person on these boards is a labelled fictional fixture. The `.dc.html` files mount the design system's components with `<x-import>`; `../tools/render.py` reproduces the PNGs with a minimal stand-in for the canvas runtime (fallback fonts) and resolves uploaded canvas assets through `assets.json`, failing on any unmapped image.

The low-fidelity paper SVGs in `docs/ux/` remain the printed-session versions; these are the higher-fidelity source. Observations in the review report about these boards are simulated design critiques, not user research.
