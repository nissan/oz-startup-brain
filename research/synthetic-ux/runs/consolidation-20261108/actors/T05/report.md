# T05 — Jess: find relevant regional support

**Synthetic UX emulation, not human research.** I adopted the packet's fictional persona of a software founder in Gympie, using a phone during a short break. I used only the live app's visible interface. This report describes my interpretation; it does not establish actual availability, eligibility, or permissions.

## My experience

I typed the full brief into “Your question” and selected “Ask the planner.” I understood the response to say that it could not verify a Gympie support match. That was clear: the opening explicitly said Queensland and national coverage do not establish a Gympie match. I did not read the result as an offer of funding or confirmed access.

The answer gave me one next step, “Read the STATIC FICTIONAL SOURCE DIRECTORY,” rather than a long national list. I opened “Show supporting passage” and scrolled to read the evidence. I found two possible starting points inside the passage. The first, the Fictional Regional Innovation Hub Network, was the one I would try first because it explicitly said to ask whether remote sessions were available and whether Gympie was served. The university commercialisation office was less obviously relevant to my software prototype; I did not know whether I needed an institution connection or what “IP conversation” meant for my situation.

The instruction “Next door” did not immediately mean a contact or action to me. It told me to open the evidence below. The actual useful question—whether remote sessions were available and whether Gympie was served—was buried in the evidence rather than in the prominent next-step card. The source excerpt repeated some of the complete passage. On a phone this made a small answer feel long, especially after the task buttons and input form. The first organisation's URL extended to the edge of its excerpt box in the viewport screenshot.

I then replaced the question with the exact separate follow-up: “If there is no evidence for my area, show the next useful place to check.” I did not press “Start a new question.” The response began “Continuing with Gympie,” so I understood it had retained my town even though my second message did not name it. It again gave the same directory and the same two starting points. This answered where to check in principle, but did not give a more direct contact action than the first response.

“Stage: Not set” and “Jurisdiction: Not set” appeared throughout. I had said “software prototype,” and the answer knew Gympie, so those fields made me uncertain about how much of my situation had been understood. I did not edit them because the answer had already given a locality-specific explanation and I was trying to finish quickly.

## What I would do next

Within this demonstration, I would check the regional hub network first and ask: “Do you have remote sessions, and do you serve a software founder in Gympie?” I would not assume it served me. The app repeatedly labelled the information fictional and used example.invalid addresses. Consequently, I did not leave with a real organisation I could contact today. I had a sensible kind of question to ask, but my real-world support-finding goal remained unfulfilled in this fixture.

## Observed action record

1. Read only T05-packet.json before the attempt.
2. First browser navigation failed with `net::ERR_CONNECTION_REFUSED`; no app content was reached. The facilitator explained isolated loopback networking and supplied a launcher command.
3. Started that supplied launcher in the same runner process/session, without reading product or launcher source, and opened the app successfully in a fresh browser context.
4. Captured initial screen and visible text (`01-initial`).
5. Entered the exact brief and clicked “Ask the planner.” Captured result (`02-brief-result`).
6. Clicked “Show supporting passage.” Captured full-page text/image and viewport (`03-supporting-passage`). No different visible passage text appeared in the body capture; the passage was already present below.
7. Scrolled twice to inspect the evidence and complete passage (`04-directory-detail-viewport`, `05-directory-reading-viewport`).
8. Entered the exact follow-up as a separate submission in the existing question field and clicked “Ask the planner.” Captured result (`06-follow-up-result`).
9. Scrolled to inspect follow-up context (`07-follow-up-next-steps-viewport`, `08-follow-up-context-viewport`).
10. Stopped browser and launcher. No product files were edited, external links opened, recording or location permissions granted, external submissions made, or GitHub changes posted.

## Environment and failures

Environment details, including actual Playwright and Chromium versions, are in `environment.json`. Python Playwright used the installed `/tmp/chromium` browser, a fresh isolated context, 390 × 844 CSS-pixel viewport, device scale factor 1, mobile/touch emulation, and default 100% zoom. This was not a real phone. Screenshots are actual browser captures; full-page screenshots include material beyond one viewport, while files ending in `-viewport.png` capture the current viewport.

The initial connection refusal is recorded in `initial-navigation-failure.txt` and `failures.json`. No subsequent runner exceptions, browser page errors, or blocked out-of-origin requests were observed. Out-of-origin requests were configured to abort. The only navigated origin was `http://127.0.0.1:3187/`.
