Oz Startup Brain is an educational, evidence-backed journey planner for Australian founders. The interface is a research notebook, not a chatbot: a founder states a goal, corrects the context the app proposes, gets at most three next actions, and can open the evidence and its date beside every claim. This system exists so that every surface — the Next.js website, the standalone API client's exports, the paper storyboards and a future agent interface — shows the same limits with the same words.

## Principles

1. **Visible limits.** Stale, disputed, unknown, outside coverage and unavailable are five distinct states with five distinct words. Never collapse them, never hide them behind a numeric confidence gauge, and never render an eligibility badge.
2. **Evidence beside the action.** Every factual claim sits next to the source that supports it and the date it was checked. If a date is unknown, say "unknown" rather than leave it blank.
3. **Unknown is a valid answer.** A founder may leave any context field as Unknown. The interface treats that as a deliberate choice, never as missing data to nag about.
4. **Stable layout, adaptable content.** Components are chosen from this registry; the model supplies validated data and a permitted component type. No generated layouts, no executable content.
5. **Paper first.** The look descends from the printed storyboards: cream paper, a hairline rule under every title, one sage primary action per view, no shadows.

## Voice

- Address the founder as **you**; the app refers to itself as **the planner** or **we**, never "I".
- Plain Australian English, sentence case, no exclamation marks, no emoji.
- Say what the founder should do next and what still needs checking: "Ask your university contact before chasing a named program." "Current status is unverified; check the official source."
- Never imply permission or approval: no "you're eligible", "approved", "you can launch". Use "this condition is unresolved" and "a specialist can interpret this".
- Dates are written in full (22 July 2026) in copy; ISO (2026-07-22) in the mono data line.
- Programs and rounds in examples are fictional ("Program A", "Round A1") until the corpus is reviewed.

## Colour

Build on `paper` with `paper-raised` for anything that sits on it; separate them with `hairline`, never with shadow. Set text in `ink`, secondary text in `ink-muted`. Use `ironbark` for links, evidence references and the one brand accent; put `on-ironbark` on an ironbark fill. The five evidence states each have one colour and one tint, and the colour is never reused for another meaning:

| State | Word | Text | Ground |
| --- | --- | --- | --- |
| Checked | Source checked [date] | `ink` | `paper-raised` with `border-strong` |
| Stale | Needs a current check | `ochre` | `ochre-tint` |
| Disputed | Sources disagree | `plum` | `plum-tint` |
| Editorial | Suggested next step | `ironbark` | `ironbark-tint` |
| Uncovered | Outside current coverage | `ink-muted` | `grey-tint` |

`sage` is the fill of the one primary action per view and nothing else; it is deliberately a tint, not a green signal, so that nothing in the interface reads as "approved". States are told apart by their word and icon as well as colour: ochre and plum differ in lightness, and no state uses red or green.

Operational conditions of the planner (graph unavailable, retrieval unavailable, daily budget reached, graph paused) are never shown with an evidence label. They use `StatusNotice`: ink on `paper` with a dashed `border-strong` edge, so they read as machinery rather than as a judgment about a source or a jurisdiction. A `graph-degraded` answer still carries its normal evidence labels on each passage.

Every text colour above reads at 4.5:1 or better on the grounds named in its usage note in both themes; `hairline` is decorative, so meaningful borders use `border-strong` (3:1 or better). The focus ring is `ochre`, solid, 2px, offset 2px, on every control.

## Type

Set titles in `display-xl` and card titles in `display-md` (Fraunces). Set everything else in Atkinson Hyperlegible: `heading`, `body` (17px, never smaller for running text), `body-strong`, `label` for evidence-state words, chips and buttons, `caption` for dates and publishers in `ink-muted`. Corpus versions, request IDs and as-of dates go in `mono`. All three families are hosted on Google Fonts; consumers load them with one `<link>` (see Consuming).

## Spacing, radius, borders

A 4px scale: `space-2` between chips and inside labels, `space-3` inside buttons, `space-4` card padding and the phone gutter, `space-6` card padding on wider screens and between cards, `space-8` between sections. Cards use `radius-lg`, buttons and chips `radius-md`, labels `radius-sm`, context chips and map nodes `radius-pill`. There are no shadow tokens: depth comes from `hairline` and `paper-raised`.

## Layout

The journey workspace is one column on phones (16px gutter) and two columns from 880px: editable context at the top, next actions in the main area, evidence in a panel beside each claim. Chat is one input mechanism among several; starter tasks, chip edits and card actions update typed context directly. Waiting is shown as three discrete states, never a percentage.

## Iconography

Glyphs are small inline SVG strokes drawn in the current text colour, 16px on a 24px box, 1.75px stroke: tick (checked), clock (needs a check), two opposed arrows (disagree), arrow (suggested), dashed circle (outside coverage), pencil (edit), plug (service status). No emoji, no icon font, no decorative illustration.

## Logo and wordmark

The mark is an `ironbark` tile carrying a paper-coloured route with a `sage` destination node: the journey, drawn from the system's own tokens. Use `Logos/mark.svg` on light grounds and `Logos/mark-dark.svg` on dark ones; the horizontal lockup (`Logos/wordmark-horizontal.svg`) in page headers and the OG image, the stacked lockup where the space is square, and the tagline lockup only on the landing page and social previews. The wordmark text is outlined, so lockups need no font; in live UI the name beside the mark is set in `display-xl` or `display-md` in `ink`. Clear space is four route-stroke widths; the mark is never smaller than 16px and never recoloured, rotated, shadowed or placed on `ochre`, `plum` or `sage`. Favicon, app icons, avatar and the Open Graph image are in `Icons and social/`. No generated imagery, photography or illustration is part of the brand.

## Accessibility

Every interactive element is keyboard reachable with the ochre focus ring; the prerequisite map always has a textual sequence beside it; every table has a caption; voice controls are explicit start/stop with an editable transcript; charts appear only with units, date, source and an accessible table. Test with the labels, not the colours.

## Components

`StarterTask`, `ContextChip`, `ClarificationPrompt`, `NextStepCard`, `EvidenceLabel`, `StatusNotice`, `SourcePanel`, `ComparisonTable`, `PrerequisiteMap`, `Checklist`, `CoverageBanner`, `WaitingState`, `LimitPanel`, `TranscriptReview` and `Button`. Each README says what the consumer provides and when to use it. Intentional additions beyond the design documents: `Button` (the registry needs one), `CoverageBanner` (the capabilities response had no visual home) and `StatusNotice` (so service conditions are never dressed as evidence states).
