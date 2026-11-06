# Issue #22 — intended-font export and visual refinement

Builder review by Codex, run `fonts22-20261106`, 6 November 2026. This is a primed engineering/art-direction inspection, not independent review or a synthetic/human UX session.

## Version and conditions

Baseline: merged PR #20, commit `b1767215899b15cfe950d4b4ce35d6c847134dd9`. Reviewed result: the final exports and source in the commit containing this record; the implementation PR pins the exact head and before/after links. The published artifact baselines remain design system `1793913295-8883` (v12) and mock-ups `1793913319-21a3` (v18). This work does not invent a new published artifact version.

Local rendering: Chromium **134.0.6998.35**, Playwright **1.51.0**, 100% scale, authored CSS artboard sizes: Main 1280×1800; SB5a 1440×1080; SB5b 1440×1320; Brand sheet 1440×1480; four phone boards 390×844. Component previews are 720px wide, full-page. Both light and dark themes were regenerated. HTTP(S) resource requests are blocked during rendering; dependencies are installed separately with the lockfile.

Fonts: Fraunces variable 5.3.0 at normal 600, Atkinson Hyperlegible 5.3.0 at normal 400/700 and italic 400, JetBrains Mono 5.3.0 at normal 400. See [the contract and licences](../tools/FONTS.md). [The generated font report](../exports/font-verification.json) records actual painted font names, required-face checks and page text counts. SVG brand paths are unchanged and remain independent of live fonts.

## Critique, fixes and reinspection

The intended hierarchy is the existing editorial founder workspace: display headings, readable body/evidence text, one deliberate primary action per screen, truthful dates and limitations. No new design direction or tokens were introduced.

| Rank | Observed weakness | Change | Revised inspection |
| --- | --- | --- | --- |
| 1 | Previous exports used fallback fonts, making heading/body wrapping an unreliable guide to the intended design. | Pin and inline the intended faces; verify FontFace descriptors and painted glyph fonts before screenshots or geometry checks. | Fraunces headings and Atkinson body text restore the published design's type character. The Main evidence rail remains balanced; the long second-card heading fits two lines; phone titles, transcript edits, evidence dates and recovery controls fit their authored frames. |
| 2 | SB5a's narrow comparison cells squeezed the checked date beside the label into three short lines. | Use a two-column label grid within comparison tables and place the date on its own row. | Dates scan as complete lines below their label; evidence links remain directly below each badge. The wider ComparisonTable preview retains consistent alignment. |
| 3 | SB3 Ask's native placeholder was too faint on the dark input surface. | Apply the existing `ink-muted` token and full opacity to input/textarea placeholders. | The example question is readable in dark mode and remains secondary to the prompt. Light mode preserves its quieter hierarchy. |
| 4 | The waiting-state text checkmark used a system fallback (reported by the new glyph check). | Use the existing SVG tick with an accessible “Completed:” text alternative and deliberate icon spacing. | Completed steps have the same crisp icon language as evidence labels; the current step remains the stronger, bold anchor in both themes. |

Before evidence is preserved in the [baseline exports](https://github.com/nissan/oz-startup-brain/tree/b1767215899b15cfe950d4b4ce35d6c847134dd9/design/exports). First intended-font diagnostic renders also exposed the table/date and placeholder issues and the checkmark fallback; those temporary images are not an extra committed export set. Final evidence is under [the exports directory](../exports/), especially Main, SB3 Ask/Transcript/Route, SB5a/SB5b, Brand sheet, ComparisonTable and WaitingState in both themes. The PR links representative before/after files at immutable commits.

Visual reinspection covered the refined controls and adjacent mock-ups: hierarchy, wrapping, legibility, table dates, evidence/service-state differentiation, source rail balance and logo-ground selection. The SVG lockups stay crisp on their specified specimen grounds. The fixed research sheets intentionally retain scenario annotations and unused canvas space; these are not responsive production pages.

## Published artifact comparison

The [public mock-ups artifact](https://claude.ai/artifact/Dh4MHqWBNHXCYJRzAudKfc#page-dcb81aee8d83) loaded without sign-in. Inspected its canvas and opened the Journey workspace full-window in the browser. Compared the visible desktop heading, task buttons, context chips, first card and evidence rail with the intended-font local export: the type character, hierarchy and wrapping were consistent in the inspected area. The hosted viewer adds chrome, scrolling and a sign-in overlay and was not a pixel-identical capture at the authored viewport.

No hosted font-version or whole-artifact pixel-parity claim is made. Painted-font proof is from the controlled local build. The local SVG ticks, placeholder colour and table-date refinement are not yet republished to Claude; the handoffs explicitly record that discrepancy. Reconcile the local component bundle into the artifact before the next export, retaining its real version stamp.

## Validation and judgement

- All 48 final pages rendered with verified intended fonts; no page errors, bounds overflow or canvas-layout overlap.
- 21 design regression tests: font failures and fixed wrapping, renderer negatives and keyboard-checker regressions.
- Automated accessibility pass: all 48 pages, zero failures/notes; real Tab and Shift+Tab, computed names/roles and structural checks. Report: [automated-pass.md](../accessibility/automated-pass.md).
- Token consistency check, persona-pack validator and its 13 regression tests passed. No persona sessions were run or scenario-review checkpoint changed.

**Builder visual judgement: complete for the #22 export/refinement scope.** The material typography, date wrapping, placeholder and icon weaknesses above were addressed and the revised renders inspected. Independent PR review and verification remain outstanding; this builder record does not supply either.

Owner design approval remains pending under #8. Screen-reader/user sessions remain under #9. The checker uses half-width CSS viewports at device scale 2 as a zoom diagnostic, not actual browser zoom or proof of responsive reflow. Stateful frontend behaviour, every runtime language/glyph, hosted font equivalence and accessibility conformance are not established by these static exports. The full accessibility checker is still a manually run report, not a newly introduced CI gate.

## Reviewer follow-up — 6 November 2026

Claude's [review of `45b75d2`](https://github.com/nissan/oz-startup-brain/pull/32#pullrequestreview-5796500231) found no blocking findings. This builder follow-up addresses the optional reporting and scope notes: aggregate painted fonts from every selector, preserve computed text-transform/font-variant/font-feature-settings in mixed-text probes, explain the Fraunces PostScript resource name, and explicitly exclude generated pseudo-element text from current verification. A real-browser regression observes the mixed-text probe's computed settings at glyph inspection and checks cleanup. The reviewer’s verdict applies to the previous head; this delta still needs review.

Validation on Chromium 134.0.6998.35 / Playwright 1.51.0: 22 design tests passed; all 48 pages rendered without errors, overflow or overlaps; all 48 automated accessibility checks passed with zero failures/notes. Token consistency, persona-pack validation and its 13 tests passed. All 48 regenerated PNGs are byte-for-byte identical to the committed exports, and the font report is unchanged. Exports therefore require no replacement. Reinspected Main light and SB3 Ask dark: hierarchy, evidence alignment, heading wrapping and placeholder legibility remain intact. This change affects verification and documentation, not the frontend design.

The reviewer's optional preferences concerning slashed zeros and smaller secondary text are recorded in [#8](https://github.com/nissan/oz-startup-brain/issues/8#issuecomment-6678679327) for owner art-direction review; no user research or owner decision is inferred. No additional visual change is justified by this verifier-only delta. The existing hosted-artifact and accessibility limitations above remain.
