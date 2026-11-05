# Design system handoff

This folder is a versioned export of the "Oz Startup Brain" design system kept as a Claude Design System artifact. It is the reviewable copy; the artifact is the editable original and is owner-private until shared.

| Item | Value |
| --- | --- |
| Artifact | https://claude.ai/artifact/S3Nuo9DbM5XgTDkHdi5y9a |
| Artifact version exported | `1793907871-f437` (version 8) |
| Export date | 6 November 2026 |
| Exported by | Claude, on the owner's instruction (owner decision 10) |
| Owner approval | **Pending** — one review covers the design system, the mock-ups and the brand kit (#8); nothing here is approved for implementation until that review is recorded in this file |

## What is here

- `README.md` — the brand book: principles, voice, colour, type, spacing, layout, iconography, accessibility, component list.
- `tokens.json` — the token source (colours in light and dark themes, type scale, spacing, radius). `tokens.css` is the compiled form used by the previews and the mock-ups.
- `components/bundle.js`, `components/bundle.css`, `components/index.d.ts` — the fifteen React components as one classic script assigning `window.OzStartupBrain`, their stylesheet, and their prop types as documentation. `StatusNotice` carries the planner's operational conditions and is deliberately separate from `EvidenceLabel`.
- `components/<Name>/README.md` and `preview.html` — guidelines and a live preview per component; `components/Cover/preview.html` is the artifact's cover.
- `assets/Logos/` and `assets/Icons and social/` — the asset-group READMEs (usage rules). The files themselves are uploads in the artifact's asset store; their committed copies are in `../brand/` (see `../brand/HANDOFF.md`).
- `../exports/components/<Name>-light.png` and `-dark.png` — every preview rendered in both themes with `../tools/render.py` (fallback fonts; see that script's notes).

## Status of what this establishes

- **Design contract, not implemented behaviour.** `EvidenceLabel` (the five evidence-state words) and `StatusNotice` (the service conditions) and the other components are the proposed implementation contract. No application code consumes them yet; website/API-export label parity is a Stage 4 acceptance check, not a property this export proves.
- **Contrast** was computed from the token values (every text token at 4.5:1 or better on the grounds its usage note names, in both themes) and the previews were rendered in both themes without errors. This is a calculation and a render, not a WCAG conformance assessment; real assistive-technology sessions remain required.
- **Keyboard behaviour** is designed in (real buttons, links and inputs; visible focus ring; textual equivalent beside the prerequisite map) but has not been operated by a keyboard-only tester.
- Fonts (Fraunces, Atkinson Hyperlegible, JetBrains Mono) are hosted on Google Fonts; the PNG exports use fallback faces.

## Updating

Edit the artifact or these files, not both: when the artifact changes, re-export (copy its `project/` files here, regenerate `tokens.css`, rerun `../tools/render.py`) and update the version and date above.
