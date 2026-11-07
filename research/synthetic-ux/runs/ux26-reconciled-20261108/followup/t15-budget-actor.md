# T15 budget — Morgan, fresh UX actor

Task: “My earlier question was for an idea. I now have a working prototype. Update my route without losing sight of what changed.”

Follow-up: “Try the visible recovery option if the answer cannot be produced, then explain what happened to the draft.”

Session: `t15-budget`, prepared local app at http://127.0.0.1:3130. Used browser-driver snapshots and UI actions only; no app source or other reports inspected. Fictional data only.

## Exact actions and observations

1. `snapshot`. Existing question textarea contained `What should I do next for support?`; situation Queensland / Idea. Existing answer context explicitly Idea / Queensland. Recommendation: exploratory customer-discovery conversation, plus university commercialisation office for IP ownership. Evidence 01.
2. `click(role="button", name="Stage: Idea. Edit")`. Opened “How far along is it?” editor, with Working prototype among options. Existing answer remained visible. Evidence 02.
3. `click(role="radio", name="Working prototype")`. Focus moved to prototype input; no action error. Stage editor remained open pending save. Evidence 03.
4. `click(role="button", name="Save stage")`. Situation became Working prototype / Queensland. Automatic answer attempt returned HTTP 429 (driver metadata). Heading: “The planner could not answer”; “Daily budget reached”; “Today’s query allowance is used up”. Service-limit explanation said it was not a statement about any source and suggested waiting about 3600 seconds. Explicit “Your draft, kept: What should I do next for support?” appeared, along with Try again later and Change my context. Old answer remained under a prominent Stale banner identifying earlier Idea answer, its question and time, and current Working prototype / Queensland context. Evidence 04.
5. `click(role="button", name="Try again later")` once, as requested recovery. Returned HTTP 200 (driver metadata), new request `req_3647ca3484c8ff24`. New answer context Working prototype / Queensland. Recommendation changed to “Prepare prototype and customer-interest evidence”, with Program A overview source; university ownership check remained. Summary: “At prototype stage, prepare customer-interest evidence and check ownership before a program application.” Eligibility explicitly not established. Error and stale banner no longer appeared in snapshot. Textarea still contained original question. Evidence 05.

No repeated failures or loops. Four meaningful UI actions after initial observation, one recovery.

## Outcome and draft explanation

Route updated successfully after one visible retry. I did not need to start over or retype the question. The draft was explicitly retained during the service-limit failure and the same text remained in the textarea after successful recovery. Stage change also survived the failure and retry; jurisdiction stayed Queensland.

What changed was legible during failure: current Working prototype context versus stale Idea answer. After success the route visibly changed from exploratory discovery to prototype/customer-interest preparation. The successful view did not provide an explicit before/after history or change summary; this comparison relies on the previous screen I had just seen.

Uncertainty: despite recommending about 3600 seconds of waiting, the button succeeded within seconds in this local fixture. I cannot establish actual budget-reset behavior or persistence across reload/session reset. No eligibility, funding, IP rights or live-source validity established.

## Screenshot evidence

All paths relative to this report directory:

- `evidence/t15-budget-01.png`, `evidence/t15-budget-01-viewport.png` — initial Idea route.
- `evidence/t15-budget-02.png`, `evidence/t15-budget-02-viewport.png` — editor.
- `evidence/t15-budget-03.png`, `evidence/t15-budget-03-viewport.png` — selected prototype input.
- `evidence/t15-budget-04.png`, `evidence/t15-budget-04-viewport.png` — budget error, kept draft, stale context.
- `evidence/t15-budget-05.png`, `evidence/t15-budget-05-viewport.png` — successful recovery and updated route.

Inspected viewport images 04 and 05 directly. Image 04 visually confirms kept-draft box, both recovery buttons and full stale banner. Image 05 visually confirms prototype context and evidence-backed revised first step.
