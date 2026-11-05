# AI interface research and design

## Evidence and its limits

Microsoft's Human–AI Interaction guidelines address capability communication, correction and behaviour over time. Google PAIR emphasises calibrated trust and understandable explanations. These are useful foundations, not evidence that our particular layout works. [R11–R12]

Recent Google generative-UI research reports user preference for richer interfaces in its evaluation, with generation speed excluded from that comparison. Its results do not establish correctness, accessibility or suitability for founder decisions. A2UI offers an example of declarative agent-driven interfaces, while current HCI work still explores how adaptive UI changes design practice. Treat these as design directions to test. [R13–R15]

Voice design guidance supports brief, relevant conversational turns. WCAG provides requirements for equivalent access, focus and audio control. [R16–R17]

## Visual quality as a product requirement

Visual presentation has equal priority with functionality. Apply the [visual quality standard](visual-quality.md) to every frontend/design increment: review the rendered experience as an art director, identify and fix its largest visual weaknesses, then inspect the revised result before declaring completion. Functional success is not sufficient. Keep this craft review separate from the usability evidence described below.

## Interaction model

Use a persistent **journey workspace**: editable context at the top; next actions in the main area; evidence accessible alongside each claim. Chat is one input mechanism. Users can also choose a starter task, change a context chip, compare cards or select a prerequisite. Those visual actions update typed context, rather than being translated through an unnecessary chat round-trip.

| Need | UI choice | Why / how to evaluate |
| --- | --- | --- |
| Know what to ask | Starter tasks: Find my next step; Compare options; Check a prerequisite | Measure successful starts without prompt coaching |
| Correct assumptions | Editable pathway, stage, location and product chips; explicit Unknown | Count overlooked corrections and wrong inferred fields |
| Understand a result | Action, why it fits, what to check, evidence/date, next human/source door | Ask users to explain the route in their own words |
| Compare choices | Stable table with common criteria and unknown cells | Test whether users notice missing evidence |
| Explore dependencies | Small step map with no more than 5 visible nodes, plus list equivalent | Compare prerequisite comprehension against prose |
| Explore ecosystem | Optional filtered relationship map, focused on one question | Hide the complete graph by default; measure task benefit before expanding |
| Understand waiting | Discrete states: Finding sources; Checking dates; Building your route | Do not show invented percentages or claim to reveal model thinking |
| Recover from mistakes | Edit context, undo selection, report source problem, retry | Verify users can recover without restarting |

Evidence state labels: **Source checked [date]**, **Needs a current check**, **Sources disagree**, **Suggested next step**, and **Outside current coverage**. Do not display an uncalibrated numeric confidence gauge. Avoid green eligibility badges or reassuring language that overstates the available evidence.

Evidence state labels describe claims and coverage only. The planner's own operational conditions (graph unavailable, retrieval unavailable, daily budget reached, graph paused) are shown with a separate service-status notice, never with an evidence label: an outage is not "Outside current coverage" and an exhausted budget is not "Needs a current check". A graph-only degradation still returns a usable passage-based answer with its normal evidence labels and says what was omitted (SC17); a retrieval outage or budget stop shows no answer (SC18).

## Voice input and response

Phase 1 text input must complete every core task. Phase 2 uses optional push-to-talk with visible recording, stop and cancel. Show an editable transcript before Send; highlight ambiguous names, locations, numbers and program acronyms. Ask a targeted clarification when a transcription uncertainty changes the route. Denied permissions or unsupported devices retain the full text path.

For voice output, offer a short spoken next-step summary on request, with pause/stop and a visible transcript. Keep full citations and comparisons on screen; do not read URLs or long tables aloud. Provide a way to open the sources from the spoken summary. No autoplay and no full-duplex interruption handling in the first voice experiment.

Audio is transient by default. Disclose the transcription provider before enabling voice, minimise retention and allow deletion of any optional saved draft. Test Australian place names, accents, code-switching, background noise and speech impairments with consenting participants. Do not present browser speech recognition as equally available or private across all devices.

## Visual inputs and outputs

First visual input: direct manipulation of context chips and action cards. Later experiment: upload a simple product/workflow diagram or program screenshot. Extract a typed preview, including uncertain text and relationships, for user correction. Uploaded material is untrusted context and never automatically enters the public knowledge base. Do not request sensitive identity documents for this demo.

Output formats are selected from an allowlisted component registry: next-step card, comparison table, checklist, source panel and prerequisite map. The model supplies validated data and a permitted component type. It cannot emit arbitrary JavaScript, remote image URLs or executable HTML. Stable navigation remains in place as answers change.

Prefer tables for exact criteria, small maps for prerequisites, and charts only when the source provides comparable quantitative data. Do not visualise inferred funding likelihood or unsupported scores. Every chart needs units, date, source and an accessible table. Every relationship map needs a textual route and keyboard selection. A decorative network is not evidence that graph retrieval helped.

## Evolving the UX

1. Print the paper-style storyboards and conduct think-aloud tasks before API implementation.
2. Compare a simple source list, chat-only answers and the proposed cards. Counterbalance order to reduce learning effects.
3. Use a Wizard-of-Oz prototype with manually curated answers; tell participants responses are simulated.
4. Build the smallest functional route, then study evidence comprehension and correction.
5. Add voice or visual input separately, so improvements and new errors can be attributed.
6. Use explicit feedback categories (wrong fact, outdated source, wrong fit, hard to understand). Review them; do not automatically train on votes.

Keep usability findings separate from model-quality reports. A five-person formative round is useful for identifying friction but cannot validate broad effectiveness. Include assistive-technology users and regional founders beyond the initial network. Version interface changes and rerun the critical route/error tasks after substantial changes.
