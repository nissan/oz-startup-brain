# T15 — Morgan synthetic actor

Synthetic interaction, not real usability research. Fictional founder and fixture sources only. No repository/source/runbook/oracle/earlier-result material read. Dedicated session `t15-vector`; native 1280×800 viewport, DPR 1, actual zoom 1 throughout.

## Task
“My earlier question was for an idea. I now have a working prototype. Update my route without losing sight of what changed.”
Follow-up: “Try the visible recovery option if the answer cannot be produced, then explain what happened to the draft.”

## Observed interaction
1. Initial snapshot showed an existing response to `What should I do next for support?`, Stage Idea, Queensland. The prior route started with exploratory customer discovery. Viewed actual viewport screenshot 01.
2. Clicked `Stage: Idea. Edit`. The editor offered Working prototype and said stage is recorded with the question, with Idea and Prototype routes potentially differing.
3. Selected `Working prototype` radio. Screenshot 03 visibly showed its selected treatment; editor continued below the viewport.
4. Clicked `Save stage` through the returned accessible control. This was below the viewport in screenshot 03; no manual scroll was performed. Save immediately attempted a new answer.
5. Failure view: `The planner could not answer`, `Source retrieval unavailable`, `Source retrieval did not finish`. Text explicitly said the planner stopped rather than answer from an incomplete search. `Your draft, kept: What should I do next for support?` appeared above `Try again` and `Change my context`. Current context was Working prototype / Queensland. The earlier Idea answer remained with a visible `Stale` banner explicitly saying it was not an updated answer for current context. Viewed screenshot 04.
6. Following the exact recovery instruction, clicked visible `Try again` once. A new answer appeared successfully: `Answer context — Stage: Working prototype · Jurisdiction: Queensland`. Main route became `Prepare prototype and customer-interest evidence`, with Program A overview evidence. University commercialisation/IP-check advice remained. Viewed screenshot 05. Stopped after this sensible recovery.

Four meaningful UI actions: edit stage, select prototype, save, retry. No question re-entry, navigation reset, account, submission, or external contact.

## Draft and context explanation
The question was not lost or replaced. During failure, its exact text was explicitly displayed as a kept draft and remained the textarea value in returned controls. Stage changed to Working prototype while Queensland stayed unchanged. The old answer remained usable as historical material but was clearly marked stale, including its original Idea context and question. Retry reused the retained question/current context and produced a prototype-specific answer. The stale banner and older response were replaced by the new response after recovery.

What changed: first route moved from exploratory customer discovery to preparing prototype/customer-interest evidence and checking Program A prerequisites. What stayed: Queensland, original question, IP-ownership follow-up, and unresolved matched-contribution caveat. Eligibility was not established.

## Evidence
- `evidence/t15-vector-01-viewport.png`: original Idea response/context and question.
- `evidence/t15-vector-03-viewport.png`: selected Working prototype, editor extending below screen.
- `evidence/t15-vector-04-viewport.png`: visible failure, kept draft, retry, stale earlier answer and contrasting contexts.
- `evidence/t15-vector-05-viewport.png`: successful updated prototype route.
- Driver returned HTTP 504 after save and HTTP 200 after retry; these technical statuses were driver evidence, not user-visible explanations.

## Interpretation and uncertainty
For this synthetic actor, explicit kept-draft and stale-context wording made the failure understandable without assuming persistent memory. The updated response did not retain a side-by-side change summary after success; the comparison above relies on the observed earlier state, not an app-provided permanent history. No reload or cross-session persistence was tested. Save was accessed by its exposed role/name below the current viewport, so strict in-viewport action compliance is not claimed for that action. Actual viewport images were inspected for initial, selected-stage, failure and recovery states.
