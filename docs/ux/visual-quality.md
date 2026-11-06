# Visual quality and art direction

## Standing owner requirement

Recorded 6 November 2026. Visual quality is a top priority: presentation is just as important as underlying functionality. Oz Startup Brain must look exceptionally polished and visually impressive from its first frontend delivery. Every contributor, including OpenAI, Claude and future agents, must approach the product as both a senior engineer and an experienced art director. Do not rush design or accept basic graphics merely because functionality is finished.

This is part of the definition of done for every frontend increment, not an optional enhancement or work deferred until launch. It applies to pages, components, responsive layouts, visible interaction states, diagrams, branded exports and design artifacts. Backend-only changes may record it as not applicable. Deliberately low-fidelity research prototypes may retain their fidelity, but must still be legible and intentionally composed; they are not evidence of production visual quality.

## What polished means here

Build a distinctive, coherent founder workspace using the [brand book](../../design/system/README.md), tokens and brand assets. A restrained interface can be visually impressive through excellent typography, composition and detail; extra illustration, gradients, animation or a large network graphic are not requirements. Current brand restrictions still apply. Polish within the recorded direction (existing tokens, type, components and brand rules) is autonomous and recorded in the handoff; changes to the direction itself, such as a new design token, evidence-state word or hierarchy rule, go through owner decision #8 or its successor. Existing mock-ups are not a ceiling on execution quality.

| Area | Review expectation |
| --- | --- |
| Composition and hierarchy | A clear reading order and intentional focal action on each actual screen; balanced density, alignment, spacing and whitespace; no generic stack of equally prominent cards |
| Typography | Deliberate scale, weights, line lengths and wrapping; intended fonts verified; headings, supporting text and citations remain readable at real viewing sizes |
| Colour and surfaces | Consistent semantic tokens and polished light/dark treatment; enough contrast without excessive borders, shadows or competing accent fills |
| Brand and graphics | Correct logo variant and clear space; crisp icons with consistent weight; meaningful, well-labelled visualisations; no placeholder assets or decorative claims of intelligence |
| Interaction and states | Considered hover, focus, selected, disabled, loading, empty, clarification, success and failure treatments where applicable; no layout jumps that obscure context |
| Responsive behaviour | Intentional desktop and phone composition, including long text and dense evidence; no squeezed desktop layout, clipped controls or accidental horizontal scrolling |
| Evidence and trust | Dates, citations, uncertainty and service notices remain visible and differentiated; beauty must not imply verified eligibility or hide limitations |
| Accessibility and performance | Keyboard focus, zoom, touch targets and non-colour cues survive the polish; motion respects reduced-motion preferences; visual effects do not make core tasks slow or inaccessible |

Review the experience as a whole, including entry, task selection, answer, evidence inspection, correction and recovery where the change affects them. Component previews alone cannot establish page composition or interaction quality.

## Mandatory visual review and refinement loop

1. **Set the direction.** Identify the founder task, the visual hierarchy and relevant design-system references. Reserve implementation time for polish within this increment. If scope or time is constrained, propose fewer well-finished surfaces rather than quietly lowering quality.
2. **Render and inspect.** Use the actual local build, preview or design artifact. Inspect screenshots and operate the relevant controls. For responsive frontend work, cover at least a phone viewport (390px wide) and a desktop viewport (1440px wide), plus any affected breakpoint and supported themes. For fixed artboards/assets, inspect their authored sizes and intended placements; do not claim responsive behaviour from them. Check actual font and asset loading. Fallback-font renders can support diagnostics but cannot alone sign off the intended typography. Offline renders using pinned local `@fontsource` packages are a sanctioned typography-verification route: use the [shared font contract](../../design/tools/FONTS.md) and inspect the generated painted-font report alongside the images. An actual browser/artifact/build with verified loading and use of intended faces is also valid. Fallback-font exports leave typography unverified. Network access or a CSS font-family declaration alone is not proof.
3. **Critique as an art director.** Record and rank the biggest visual weaknesses by impact on the journey. Name the affected screen/state and what makes it weak, such as competing focal actions, flat hierarchy, awkward spacing, poor wrapping or inconsistent graphics. Avoid vague claims such as "looks good" and arbitrary numerical beauty scores. If inspection genuinely finds no material weakness, record the areas inspected and why no change is needed; do not invent defects or make cosmetic churn to satisfy a quota.
4. **Refine as an engineer.** Fix the material weaknesses in the delivered scope, preferably at the shared token/component level when appropriate. Preserve truthful states, behaviour and accessibility. Record any necessary design-system or handoff update.
5. **Inspect again.** Capture and inspect the revised result under comparable conditions. Recheck affected states and adjacent layouts for regressions. Repeat the critique/fix/review loop while material weaknesses remain. A source edit or successful automated test is not a visual retest.
6. **Report evidence and limits.** Complete the PR visual-polish section using the record below. If a browser, font, asset or deployment limitation prevents review, mark that portion unverified and visual sign-off incomplete. Do not describe the frontend as complete while material visual defects or required review remain unresolved.

Automation supports this loop; it cannot supply an art-direction judgement. Run applicable render, bounds, image-loading and functional checks, then inspect the result. No-pixel-overflow is a minimum, not the aesthetic target. Reviewers must flag missing evidence or unresolved material weaknesses even when functional CI is green.

Minor non-blocking refinements may be logged with rationale and a follow-up. Do not classify a major visual weakness as minor simply to finish the PR. The direction/implementation boundary above preserves the existing [issue #8](https://github.com/nissan/oz-startup-brain/issues/8) owner decision without adding an approval step to routine polish.

## Review evidence record

Put this in the PR or a linked versioned review document; store before/after screenshots as durable GitHub PR attachments, or link existing final exports at their exact commit SHAs in the PR description. Commit only final renders under `design/exports/`; do not add duplicate before/after image sets to Git history. Record actual observations only. Keep private data and credentials out of evidence.

```markdown
Target commit / build or artifact version:
Changed journey and surfaces:
Design references and intended visual hierarchy:
Review conditions: browser, CSS viewport, zoom, theme, fonts/assets
States and interactions actually inspected:

| Rank | Weakness and location | Before evidence | Fix | After evidence and retest result |
| --- | --- | --- | --- | --- |

Functional/render checks actually run:
Accessibility and responsive checks actually performed:
Remaining issues and rationale (blocking / non-blocking):
Visual judgement: complete / incomplete, with reasons
Owner design approval: recorded separately / pending / not applicable
Limitations and unverified conditions:
```

For a new screen, capture its first implemented render before refinement; for an existing screen, compare before and after the change. Identify the revision associated with each image. Do not overwrite the only evidence of the original weakness. A final screenshot without critique or a post-fix inspection is insufficient.

Visual critique is not user research. Keep it separate from [synthetic persona sessions](../../research/synthetic-ux/runbook.md), keyboard/screen-reader testing and human founder feedback. Do not expose the critique to an unprimed synthetic actor before its first task attempt. Good aesthetics, accessibility and successful task completion need their own evidence.

## Relationship to delivery and design exports

The [delivery plan](../06-delivery.md) applies this gate to each frontend/design increment, including the first fixture UI. API-only slice 1A-0 remains independently deliverable. This policy does not authorise provisioning, paid calls or expansion into later voice/graph features.

The design system, mock-ups and brand kit remain proposed until the existing owner decision is recorded. Their current exports are not retrospectively certified by this policy. When changing an artifact, update the authoritative source, version stamps and exports together, and inspect the hosted/actual-font result as well as local diagnostic renders. Record any discrepancy explicitly.
