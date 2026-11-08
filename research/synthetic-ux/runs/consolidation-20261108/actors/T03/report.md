# T03 — Arun, synthetic emulation

This is a synthetic UX emulation, not human research. I acted as Arun, a Queensland research founder with a working laboratory prototype, early customer discussions and unconfirmed IP access, preparing for a commercialisation adviser meeting. I read only the assigned packet and used the visible local UI. I did not inspect product source, tests, repository instructions, other actor reports or facilitator materials. I made no eligibility or permission determination.

## What I did

1. Opened the local app in a fresh desktop context. The first browser attempt failed because the endpoint refused the connection. After the facilitator supplied the environment-only launcher instruction, I started that launcher and the browser within one persistent exec session.
2. Read the introductory screen, including its fictional-data disclaimer. Entered the exact brief in **Your question**, then clicked **Ask the planner**: “I have a prototype and early customer discussions. Help me work out what needs attention before I apply for Round A2 today.”
3. Read the answer and its two-step “What comes first” sequence. The answer said Round A2 opens on 1 December 2026 and applications cannot be lodged before then.
4. Opened **Evidence for step 1**. The visible Program A overview said applicants need a working prototype and customer-interest evidence, such as interviews or letters of intent, before applying to a round. Its supporting statement was marked “In effect now” from 1 February 2026 and “stated by the source.”
5. Opened **Evidence for step 2**. It showed “Suggested next step,” an article source, and two supporting statements about confirming IP ownership and gathering customer evidence. These were labelled “editorial sequencing,” but also “In effect now” from 12 May 2026. The article excerpt was withheld because it was not cleared for redistribution. I did not follow the external publisher link.
6. Replaced the question field with the exact separate follow-up and clicked **Ask the planner**: “Which step is required now, which is a suggestion, and what is still unknown?” I did not click **Start a new question** between turns.
7. The response began “Continuing with Round A2.” It restored the default Round A2 evidence view and largely repeated the previous answer and sequence.
8. Opened **Terms in plain language**. This explained commercialisation and matched contribution, said a university commercialisation office could help with route and IP questions, and explicitly said this did not establish IP ownership or eligibility.

## My interpretation as Arun

I would leave with a useful distinction for my adviser meeting, but not an application-ready conclusion:

- The displayed current source conditions include a Queensland-registered company with a working prototype. The Program A step-one evidence also says customer-interest evidence is needed before applying. I would take these as conditions to check against our situation, not a finding that we meet them. Being in Queensland does not establish company registration.
- The numbered second step, checking IP ownership and gathering customer evidence, is suggested preparation. The page explicitly says its position does not create an extra eligibility rule. I would bring my unconfirmed IP access to the adviser as a question.
- The security assessment is a known future condition, taking effect on 1 December 2026. The page repeatedly says it is not required today. The round is also scheduled to open then, so my original idea of applying today does not fit what the page says.
- Matched contribution remains unknown: whether it applies, its amount, and ability to contribute. I also still do not know whether my early customer discussions count as adequate evidence, whether the company-registration condition is met, or who can grant the necessary IP access. The UI has not established these things.

## Where I hesitated

The explanatory paragraph was helpful: it explicitly distinguishes having customer-interest evidence from gathering it, so I did not read the overlapping words as a conflict. However, the sequence itself shows “working prototype + customer-interest evidence” before “gather customer evidence.” At first glance that feels backwards as a to-do list. I needed the smaller explanation and the two evidence views to understand the difference between a condition and preparation.

“In effect now” appears underneath the editorial IP and customer-evidence suggestions too. Even with “Suggested next step” and “editorial sequencing,” that phrase initially sounds like a rule coming into force. I ultimately read those items as suggestions because of the stronger explanatory text, but I would ask the adviser before treating them as formal requirements.

The follow-up visibly remembered Round A2, which was reassuring. It did not give a concise answer organised into required / suggested / unknown; it mostly repeated what I had just seen. I had to assemble that distinction myself from several parts of the page. The default evidence view also replaced the step-two evidence I had been looking at.

The security assessment appeared twice under “What the planner could not resolve,” once saying it was not an action today and once saying it was not a prerequisite today. I could not tell whether these were two different issues. They looked like repeated versions of the same future condition; putting a dated, known future condition beneath unresolved items was a little confusing.

“Stage: Not set” persisted even though I had explicitly mentioned a prototype. I did not edit the situation chips during this attempt. I could tell the answer had the Round A2 topic, but was less sure it had retained my personal starting facts.

For a portable adviser meeting document, I did not see an export or checklist control on the page I explored. I would need to copy notes or save the page. I did not attempt to mark a personal task or change shared requirements.

## Outcome

Partially met my goal: I could explain the displayed difference between current source conditions, suggested preparation, a future security condition, and unknown matched-contribution details. I could not establish our eligibility or evidence sufficiency. The follow-up preserved the named-round context but required me to synthesise the answer rather than providing the requested classification directly.

## Evidence and runner

- URL: http://127.0.0.1:3187/
- Runner: Python 3.12.14, Playwright 1.51.0, Chromium 153.0.8010.0 at /tmp/chromium; fresh isolated context, headless browser emulation.
- Viewport: 1440 × 900 CSS pixels, device scale factor 1, default 100% zoom; no zoom changes. Full-page screenshots are taller than the viewport; 07 is a viewport screenshot.
- Shell: /bin/bash, login:false.
- Only pointer/keyboard-style visible UI interactions and rendered body text were used. Routing restricted browser requests to the starting origin; no external source links were opened. No API inspection, DOM mutation or product changes.
- Visible fixture identifier: fixture-2026-11-08.1, as of 5 November 2026; responder fixture.
- First answer request displayed: req_6224018db34d8e93. Follow-up request displayed: req_845050c93b093b13.
- Screenshots: 01-start.png; 02-brief-submitted.png; 03-step-one.png; 04-step-two.png; 05-follow-up.png; 06-terms.png; 07-sequence-viewport.png.
- Corresponding visible text captures: 02-brief-submitted.txt through 06-terms.txt.

## All observed failures / limitations

1. Initial navigation failed with net::ERR_CONNECTION_REFUSED before any task submission or screenshot. Facilitator diagnosed isolated loopback sessions and supplied the launcher. The successful attempt used a new fresh context in the same persistent session as the launcher. This was an environment failure, not a finding about the UI.
2. The runner initially targeted “Evidence for step 1” as a button, which timed out after 30 seconds. The label was visible in the screenshot. Retrying by its exact visible text clicked it successfully. This is a runner locator failure, not evidence that a human could not use the control.
3. Step-two source text could not be fully read in the app because the UI said its excerpt was not cleared for redistribution. I stayed within the permitted origin and did not open the publisher URL; I could read the app's supporting statements.
4. Initial startup screenshot caught “Loading coverage…”; coverage and the fixture disclaimer were present when the submitted result was captured. No ongoing load failure was observed.
