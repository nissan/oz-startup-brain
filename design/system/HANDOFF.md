# Design system handoff

This folder is a versioned export of the "Oz Startup Brain" design system kept as a Claude Design System artifact. It is the reviewable copy; the artifact is the editable original and is owner-private until shared.

| Item | Value |
| --- | --- |
| Artifact | https://claude.ai/artifact/S3Nuo9DbM5XgTDkHdi5y9a |
| Artifact version exported | `1793913295-8883` (version 12) |
| Export date | 6 November 2026 |
| Exported by | Claude, on the owner's instruction (owner decision 10) |
| Owner approval | **Approved — Nissan Dookeran, 6 November 2026 (Australia/Sydney)**. [Explicit decision on #8](https://github.com/nissan/oz-startup-brain/issues/8#issuecomment-6679674992); applies to the committed design system, mock-ups and brand kit, including intended-font exports at `1a38f4aabe9741b2df03cf6288bf00dd68864d5f`. No additional changes requested. |

## What is here

- `README.md` — the brand book: principles, voice, colour, type, spacing, layout, iconography, accessibility, component list.
- `tokens.json` — the token source (colours in light and dark themes, type scale, spacing, radius). `tokens.css` is the compiled form used by the previews and the mock-ups.
- `components/bundle.js`, `components/bundle.css`, `components/index.d.ts` — the fifteen React components as one classic script assigning `window.OzStartupBrain`, their stylesheet, and their prop types as documentation. `StatusNotice` carries the planner's operational conditions and is deliberately separate from `EvidenceLabel`.
- `components/<Name>/README.md` and `preview.html` — guidelines and a live preview per component; `components/Cover/preview.html` is the artifact's cover.
- `assets/Logos/` and `assets/Icons and social/` — the asset-group READMEs (usage rules, including which ground each lockup file is permitted on). The files themselves are uploads in the artifact's asset store; their committed copies are in `../brand/` (see `../brand/HANDOFF.md`).
- `../exports/components/<Name>-light.png` and `-dark.png` — every preview rendered in both themes with `../tools/render.py` (verified pinned local fonts; see `../tools/FONTS.md`).

## Status of what this establishes

- **Design contract, not implemented behaviour.** `EvidenceLabel` (the five evidence-state words) and `StatusNotice` (the service conditions) and the other components are the proposed implementation contract. No application code consumes them yet; website/API-export label parity is a Stage 4 acceptance check, not a property this export proves.
- **Contrast** was computed from the token values (every text token at 4.5:1 or better on the grounds its usage note names, in both themes) and the previews were rendered in both themes without errors. This is a calculation and a render, not a WCAG conformance assessment; real assistive-technology sessions remain required.
- **Keyboard and computed semantics** were checked by an automated pass (`../tools/a11y_check.py`, report in [`../accessibility/automated-pass.md`](../accessibility/automated-pass.md)). Keyboard: real Tab and Shift+Tab input on every preview and artboard; every intended control is reached in document order, nothing meant to be skipped is reached, the sequence returns to the document (no trap) and Shift+Tab retraces it; the ochre ring is read at each real stop (the pass found it missing on components' own elements and plain controls, fixed in `bundle.css`). Semantics: roles and accessible names come from the browser's accessibility representation (Playwright ARIA snapshot), not DOM text; every interactive role has a computed name; `status`/`alert` regions are listed (the pass found the service `LimitPanel` nesting a second `role=status` inside its own, fixed with `StatusNotice`'s `live` prop). Structural DOM checks (captions, row headers, the map's list equivalent, alt/SVG labelling, `aria-pressed`, `lang`, phone target size — chips were 34px, now 44px) are reported separately. The checker has its own negative tests (`../tools/test_a11y_check.py`: tabindex=-1 exclusion, keyboard trap, unreachable control, missing ring, hidden-only text, label/aria-labelledby naming). **Not established:** what any screen reader announces (no screen reader was run), real assistive-technology use (#9's session and Stage 4 participants remain pending), and 200 % reflow, which can only be checked on the implemented fluid page since every artboard is a fixed-size picture.
- Fonts in the repository exports are pinned local OFL faces with painted-glyph verification; see [font provenance](../tools/FONTS.md) and [the #22 visual review](../reviews/issue-22-fonts.md). The published artifact still has its own font delivery.

## Repository refinement after export

Issue #22 adds offline intended-font rendering and refines the shared component bundle: SVG completion ticks with accessible text, readable placeholder colour, and stacked dates in comparison-table evidence labels. These are repository changes on top of the artifact version above, not a republished artifact. Preserve them when reconciling the next artifact export. No new tokens or evidence-state words were introduced. The artifact version remains an honest baseline; owner approval of the repository baseline is recorded above.

## Updating

Edit the artifact or these files, not both: when the artifact changes, re-export (copy its `project/` files here, regenerate `tokens.css`, rerun `../tools/render.py`) and update the version and date above.

## Visual quality requirement for future changes

Apply the [standing visual quality standard](../../docs/ux/visual-quality.md) before completing any revision or frontend implementation based on this handoff. Identify the largest visual weaknesses, fix material issues, and inspect the revised render; include before/after evidence and the reviewed version. Check intended fonts, relevant themes and actual placements, not only fallback-font geometry. This requirement does not change the artifact version; the explicit owner approval above is separate from implementation polish, accessibility evidence and user research.
