# Persona storyboards and paper prototypes

These are low-fidelity design proposals, not screenshots of an implemented product. Names and examples are fictional. The sketches contain no verified program recommendations. Print each SVG landscape or open it in a browser; use sticky notes to alter cards during testing.

| Board | Persona | Moment → action → feedback → outcome | Links |
| --- | --- | --- | --- |
| SB1 | Mei, student founder | Has an AI prototype → enters a goal → corrects context and inspects an IP prerequisite → leaves with questions for the university | US01–03; SC01–07; [paper sketch](sb1-student.svg) |
| SB2 | Arun, research founder | Wants commercialisation support → chooses a milestone → checks dependencies and compares options → exports a checklist | US01–04/06; SC03–09/12; [paper sketch](sb2-research.svg) |
| SB3 | Jess, regional founder | Needs a local support route → dictates on mobile → corrects a place name → opens a dated local/remote option | US01/03–05; SC01/02/05/10/11; [paper sketch](sb3-regional.svg) |
| SB4 | Sam, payments founder | Unsure about product classification → describes money flow → sees missing facts and dated source distinctions → prepares questions for a specialist | US03/07; SC05–07/13; [paper sketch](sb4-payments.svg) |

## SB1: Mei

Trigger: "I have a university AI prototype. What should I check before applying for support?" She sees editable context instead of being assigned a visa or citizenship. The app asks whether IP ownership is clear. She selects Unknown. The route surfaces a university contact and questions to ask before chasing a named program. She opens the evidence and notices the date. Success is her ability to name the next conversation and explain why it precedes an application.

Failure variant: the app has only historical policy material. It labels that limitation and provides the official source door; it must not turn old text into current permission.

## SB2: Arun

Trigger: a lab prototype is ready for customer discussions. Arun selects "Plan my next milestone" and confirms stage and jurisdiction. A small prerequisite map distinguishes IP access, customer evidence and program conditions. He chooses two options; the comparison shows source dates and Unknown where evidence is missing. Export preserves citations and unresolved tasks.

Visual-input extension: Arun attaches a product workflow drawing. Before using it, the app asks him to confirm extracted labels and relationships. It does not infer a funding category from a rough diagram without confirmation.

## SB3: Jess

Trigger: Jess wants relevant support near a regional Queensland town and is tired of generic national lists. She starts recording intentionally. The transcript gets the town wrong; she edits it before Send. The route offers local/remote search paths with coverage limits. A "Read summary" button gives a brief spoken next step; sources remain visible. Denied microphone permission leads to typing, with the same task available.

## SB4: Sam

Trigger: Sam describes a proposed payments workflow. The app asks which party holds funds and which product details are confirmed. It displays questions to resolve and separate source tracks. It does not collapse registration, licensing and participation in a pilot into one approval. Sam leaves with an adviser-question checklist, not a launch authorisation.

## SB5: Limits and failure states (drawn 5 November 2026 as two Claude Design sheets, SB5a and SB5b)

The four boards above are happy paths. None shows the evidence-state labels that the design treats as its main safety feature, and the feedback protocol below requires a stale-source or service-failure task, so a fifth board is required before paper sessions. It must use the exact labels from the [interaction design](research-and-design.md): **Source checked [date]**, **Needs a current check**, **Sources disagree**, **Suggested next step** and **Outside current coverage**. Panels:

1. Historical-only evidence: Round A1 was "open" in a July snapshot; the card shows "Needs a current check", the official source door, and no current status (SC06; SB1 failure variant).
2. Sources disagree: two dated claims about one deadline shown side by side with no averaged verdict (SC07).
3. Outside current coverage: Jess's jurisdiction is not covered; the app says so and offers the maintained source directory, not a generic national list.
4. Graph unavailable, passages fine (SC17): a usable answer from passage evidence with its normal dated labels, the prerequisite sequence omitted, and a service notice saying why.
5. Retrieval outage (SC18): no answer is shown; the draft is preserved; a retry and a labelled static directory are offered.
6. Daily budget reached (SC18): paid work stopped; the draft is preserved; the notice says this is a service limit, not a statement about any source.
7. Context changed: after a chip edit, the previous answer is visibly marked as based on the earlier context (SC02), and a comparison cell shows its per-cell evidence affordance (SC08).

Panels 1–3 and 7 are evidence and coverage limits and carry evidence-state labels; panels 4–6 are service limits and carry a separate service-status notice (the `StatusNotice` design component), never an evidence label, so an outage is never shown as "Outside current coverage" and an exhausted budget is never shown as "Needs a current check". SB5a holds the evidence panels and SB5b the service panels so that every recovery control and the feedback footer fit on a printed sheet.

Also required before testing dictation: a phone-width variant of SB3, because the board as drawn uses desktop proportions while the persona's task is mobile. In SB3 panel 2, "Stage: working prototype" is a chip the founder set earlier, not an inference from speech.

### Design system and higher-fidelity mock-ups

Both SB5 and the phone-width SB3 now exist as Claude Design artifacts built from the project's design system, alongside a desktop journey-workspace mock-up. The editable originals are owner-private; versioned exports that any reviewer can inspect are committed under [`design/`](../../design/system/HANDOFF.md): the design-system sources and PNG renders ([system](../../design/system/HANDOFF.md)) and the artboard sources and renders ([mock-ups](../../design/mockups/HANDOFF.md)), each stamped with the artifact version and export date. Owner approval of both is pending.

The five evidence-state words are defined once, in the `EvidenceLabel` design component, and the planner's own operational conditions once, in `StatusNotice`; together they are the proposed implementation contract for the website, the API's export and these boards; no application code consumes them yet, so label parity across surfaces is a Stage 4 acceptance check rather than an established property. Contrast was computed from the tokens and the boards were rendered in both themes; keyboard operation and WCAG conformance remain pending validation with real users. The paper SVGs in this folder remain the low-fidelity versions for printed sessions.

## Curator and developer journeys

P5: review candidate claim → inspect excerpt and effective date → reject unsupported inference or approve with attribution → inspect the release diff. Test whether the curator can explain why an edge was accepted.

P6: run fixture examples → inspect LangGraph trace → compare B1/B2/B3 reports → reproduce a failed case. Test whether the developer understands the difference between workflow graph and knowledge graph, and between fixture scores and live results.

## Feedback protocol

Recruit an initial 5 participants per priority pathway where practical, plus a small navigator review. Start with P2 and P3 if recruitment is constrained; report untested pathways. Do not substitute AI persona roleplay for participant evidence.

Give the task without explaining the layout. Ask: "Show me what you would do next", "What would you check before acting?", "Change this assumption", and "Where did this claim come from?" Include one stale-source or service-failure task. Record completion, time, wrong turns, source/date discovery, misunderstood labels and exact voluntary feedback. Collect only needed participant information with consent.

| Observation | Severity | Evidence | Proposed change | Retest |
| --- | --- | --- | --- | --- |
| To be filled after a session | Blocker / major / minor | Participant ID, task and observed behaviour | Specific UI change | Same task with revised prototype |

Aesthetic feedback is welcome, but prioritise misleading certainty, inaccessible controls and failure to find a next action. No feedback has been fabricated or collected for these boards yet.
