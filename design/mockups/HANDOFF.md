# Mock-ups handoff

Versioned export of the "Oz Startup Brain Mock-ups" Claude Design canvas: the artboard sources and PNG renders of each, so a reviewer can inspect the delivered mock-ups without the owner's Claude session.

| Item | Value |
| --- | --- |
| Artifact | https://claude.ai/artifact/Dh4MHqWBNHXCYJRzAudKfc |
| Artifact version exported | `1793880921-08df` (version 8) |
| Design system used | `../system/` at artifact version `1793880887-5000` |
| Export date | 5 November 2026 |
| Owner approval | **Pending** |

| Artboard | File | Render | Covers |
| --- | --- | --- | --- |
| Journey workspace (desktop page, 1280 wide) | `Main.dc.html` | `../exports/mockups/Main-light.png`, `-dark` | Coverage banner, starter tasks, context chips with Unknown, three next-step cards (checked / needs a current check / suggested), source panel with rights-cleared excerpt, prerequisite map with sourced and editorial edges |
| SB5 Limits and failure states (1440×1080) | `SB5-Limits.dc.html` | `../exports/mockups/SB5-Limits-*.png` | SC06 historical-only, SC07 sources disagree (with both dated claims), outside current coverage, SC17/SC18 retrieval outage with preserved draft, SC18 budget reached, SC02 context changed |
| SB3 at phone width (390×844), four screens | `SB3-Ask`, `SB3-Transcript`, `SB3-Route`, `SB3-Summary` | `../exports/mockups/SB3-*.png` | Ask (type or record deliberately; provider disclosure placeholder), transcript review with a flagged place name (SC10), route with an honest outside-coverage gap, spoken summary on request with sources visible (SC11 variant) |

Every program, round, source and person on these boards is a labelled fictional fixture. The `.dc.html` files mount the design system's components with `<x-import>`; `../tools/render.py` reproduces the PNGs with a minimal stand-in for the canvas runtime (fallback fonts).

The low-fidelity paper SVGs in `docs/ux/` remain the printed-session versions; these are the higher-fidelity source. Observations in the review report about these boards are simulated design critiques, not user research.
