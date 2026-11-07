# T15 graph — Morgan fresh UX actor

Frozen 2026-11-07. UI-only driver session `t15-graph`; no source, repository implementation or other reports inspected. Browser left open. Fictional QLD founder progressed from idea to working prototype.

## Exact actions in order
1. POST `{session:"t15-graph",op:"snapshot"}`.
2. Click button `Stage: Idea. Edit`.
3. Click radio `Working prototype`.
4. Click button `Save stage`.
5. Fill label `What should I do next for support?` with `My earlier question was for an idea. I now have a working prototype. Update my route without losing sight of what changed.` — driver timeout (getByLabel exact, 7000ms). This was a label-targeting failure, not an app answer error.
6. Fill label `Your question` with that exact text — successful.
7. Click button `Ask the planner` — successful.

Initial screenshot relative path was unresolved at workspace/evidence; parent supplied artifact base. Subsequently inspected viewport images 03, 04, 06 using view_image. No browser interaction outside driver POST.

## Observed context and answer
Initial page already showed question `What should I do next for support?`, Stage Idea, Queensland and an idea-stage answer: explore customer problem through a discovery contact, plus university commercialisation/IP conversation. Existing answer context explicitly identified Idea and Queensland.

Stage editor explained supported fictional Idea and Prototype routes can differ. Saving Working prototype automatically produced a different answer without needing a separate Ask click. It changed context to `Stage: Working prototype · Jurisdiction: Queensland` and answer to `At prototype stage, prepare customer-interest evidence and check ownership before a program application.` First route changed to `Prepare prototype and customer-interest evidence`, with Program A fictional overview source checked 28 October. IP ownership conversation remained. Matched contribution uncertainty remained explicit; eligibility not established.

This automatic answer displayed `Graph unavailable: passage evidence only · passages only`. Under What comes first: `The prerequisite sequence is left out rather than guessed while the graph is unavailable.` Passage evidence and source link were available; no dedicated Retry, recovery button, or answer-failure draft notice appeared in controls or snapshot.

After entering exact task and clicking existing `Ask the planner` (one sensible resubmission of the current question), answer was produced with same prototype route and context, now without graph-unavailable warning. What comes first now listed (1) Prepare prototype and customer-interest evidence (2) Suggested next step: check IP ownership. Editorial sequencing disclaimer remained. Request IDs changed from initial req_3ab9136e61671d3e to stage-save req_7e38ffeaa310e2b9 to final req_156e14dddf9bb80c. Both observed queries reported HTTP 200.

## Draft / recovery follow-up
Exact follow-up requirement was to try a visible recovery if answer cannot be produced and explain draft outcome. An answer was produced despite graph degradation, so no full answer-failure recovery state occurred. No dedicated visible recovery option was shown. Existing Ask the planner was used once after entering the exact request; this restored the displayed sequence. The exact 122-character task draft remained in the textarea after final submission, and saved Working prototype + Queensland context remained. No text was lost during observed interactions. Persistence across reload/navigation is untested.

## Outcome and uncertainties
Route updated from discovery to prototype/customer-interest evidence while keeping QLD and shared IP uncertainty. There was no visible side-by-side history, explicit “what changed” comparison, or retained old idea answer in final snapshot; actor must compare from memory. I cannot infer whether conversational history or original stage was stored internally. The brief graph degradation did not block passage-based answer, but visible sequence was omitted until resubmission. No dedicated recovery CTA tested because none appeared.

## Screenshots
Base: `<workspace>/ux27-20261107/`
- evidence/t15-graph-01.png and -01-viewport.png: initial idea context.
- evidence/t15-graph-02.png and -02-viewport.png: stage editor.
- evidence/t15-graph-03.png and -03-viewport.png: working prototype selected (viewport inspected).
- evidence/t15-graph-04.png and -04-viewport.png: automatic prototype answer, graph unavailable (viewport inspected).
- evidence/t15-graph-05.png and -05-viewport.png: exact task draft entered.
- evidence/t15-graph-06.png and -06-viewport.png: final submitted answer and retained draft (viewport inspected; viewport shows composer/context and answer heading, full snapshot supplies below-fold answer).
