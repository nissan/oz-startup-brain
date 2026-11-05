# Mock-ups handoff

Versioned export of the "Oz Startup Brain Mock-ups" Claude Design canvas: the artboard sources and PNG renders of each, so a reviewer can inspect the delivered mock-ups without the owner's Claude session.

| Item | Value |
| --- | --- |
| Artifact | https://claude.ai/artifact/Dh4MHqWBNHXCYJRzAudKfc |
| Artifact version exported | `1793905345-faf9` (version 9) |
| Design system used | `../system/` at artifact version `1793905318-938d` |
| Export date | 6 November 2026 |
| Owner approval | **Pending** |

| Artboard | File | Renders (light, dark) | Covers |
| --- | --- | --- | --- |
| Journey workspace (desktop page, 1280×1800) | `Main.dc.html` | [`../exports/mockups/Main-light.png`](../exports/mockups/Main-light.png), [`Main-dark.png`](../exports/mockups/Main-dark.png) | Coverage banner, starter tasks, context chips with Unknown, three next-step cards (checked / needs a current check / suggested), source panel with rights-cleared excerpt, prerequisite map with sourced and editorial edges |
| SB5a Evidence limits (1440×1080) | `SB5a-Evidence.dc.html` | [`SB5a-Evidence-light.png`](../exports/mockups/SB5a-Evidence-light.png), [`SB5a-Evidence-dark.png`](../exports/mockups/SB5a-Evidence-dark.png) | SC06 historical-only, SC07 sources disagree (both dated claims), outside current coverage, SC02 context changed |
| SB5b Service limits (1440×1320) | `SB5b-Service.dc.html` | [`SB5b-Service-light.png`](../exports/mockups/SB5b-Service-light.png), [`SB5b-Service-dark.png`](../exports/mockups/SB5b-Service-dark.png) | SC17 graph unavailable with a usable passage-only answer, SC18 retrieval outage with preserved draft, SC18 budget reached; all with a service-status notice, none with an evidence label |
| SB3 Ask (390×844) | `SB3-Ask.dc.html` | [`SB3-Ask-light.png`](../exports/mockups/SB3-Ask-light.png), [`SB3-Ask-dark.png`](../exports/mockups/SB3-Ask-dark.png) | Type or record deliberately; provider disclosure placeholder |
| SB3 Review transcript (390×844) | `SB3-Transcript.dc.html` | [`SB3-Transcript-light.png`](../exports/mockups/SB3-Transcript-light.png), [`SB3-Transcript-dark.png`](../exports/mockups/SB3-Transcript-dark.png) | Editable transcript with a flagged place name (SC10) |
| SB3 Route and coverage (390×844) | `SB3-Route.dc.html` | [`SB3-Route-light.png`](../exports/mockups/SB3-Route-light.png), [`SB3-Route-dark.png`](../exports/mockups/SB3-Route-dark.png) | One next step with dated evidence and an honest outside-coverage gap |
| SB3 Listen or read (390×844) | `SB3-Summary.dc.html` | [`SB3-Summary-light.png`](../exports/mockups/SB3-Summary-light.png), [`SB3-Summary-dark.png`](../exports/mockups/SB3-Summary-dark.png) | Spoken summary on request with sources visible (SC11 variant) |

Bounds check run on 6 November 2026 with the committed renderer: in both themes, every button, link, input, paragraph and heading on every artboard lies inside its artboard's frame (no clipped recovery controls or footers). This is a geometric check of the fallback-font render, not a review of the hosted artifact's exact glyph widths.

Every program, round, source and person on these boards is a labelled fictional fixture. The `.dc.html` files mount the design system's components with `<x-import>`; `../tools/render.py` reproduces the PNGs with a minimal stand-in for the canvas runtime (fallback fonts).

The low-fidelity paper SVGs in `docs/ux/` remain the printed-session versions; these are the higher-fidelity source. Observations in the review report about these boards are simulated design critiques, not user research.
