# #45 runtime handoff — bounded follow-ups

Builder: Codex, run `codex-45-runtime-20261108`, 8 November 2026.
Base: `c4f54ac8902a353d9497607b6736b591a95f97c6`.
Design: ADR 003, approved in Claude review 5815788420 / merged PR #51.
This is primed builder verification, not independent review or fresh actor evidence.

## Implementation

The optional `previous_question` field crosses the generated contract/client and thin BFF. The API resolves authored A2/Gympie phrases against one preceding question, recomputes evidence/currency, and names the continued subject using authored text. Unsupported/ambiguous named rounds and missing/incompatible antecedents abstain. Generic paraphrases after a supported subject or registered follow-up ask for a named subject before any jurisdiction clarification.

Only an accepted latest answer supplies browser eligibility. Dispatch consumes it; failures, clarification and insufficient evidence do not revive an older answer. Context edits and retries use the dispatched snapshot while preserving an edited draft. Reset invalidates query responses, queued focus and source callbacks, clears answer-derived state, retains explicit situation choices and focuses the textarea. No question history is persisted or logged by this change. The frozen baseline, response schemas, dependencies and source-policy files are unchanged. #55 dismissal remains separate.

## Checks

Runtime: Node **22.23.4**, npm **10.9.9**. Clean locked installation with `npm ci`. The initial Node 24 install/generator attempt is not the declared-runtime evidence; installation and checks were repeated on Node 22. No lockfile change.

- `npm run check:generated`: literal command blocked by the known `tsx` IPC `EPERM`. Its documented substitute runs `node --import tsx scripts/generate-openapi.ts` from `apps/api`, together with the normal contracts/client/web generators. A second generation produced no diff against staged candidate generated files.
- `npm run check:compat`: pass against the frozen v1 baseline. The same comparator passes against `docs/api/openapi.json` from base `c4f54ac`. The frozen baseline was not edited.
- `npm run typecheck`: pass, including production Next.js build, Jest and browser test types.
- Workspace Jest suites: **181 passing** (contracts 24, client 4, API 133, BFF 20). The API suite includes **41 new continuity cases**. An old corpus-version expectation was updated for the authored fixture bump.
- Before/after regression: temporarily restoring only the base responder and retriever yields **34 failed / 7 passed** in the new continuity suite. Restoring the candidate yields **41/41**. This is a differential responder check, not a claim that the original base accepted the new request contract.
- `npm run demo:fixture`: **9/9**.
- Browser: real built Next.js/BFF/fixture API, desktop 1280 and phone 390, with visual probes also at 1440. **66/66** in the complete suite after refinement, plus **4/4** additional desktop/phone Unicode and delayed-source reset cases (**70 passing browser cases** in total).
- Persona pack validator and **13 tooling tests** pass; no scenario-review checkpoint was rewritten. Token consistency and **22 design/font/accessibility tooling regression tests** pass. These tooling tests do not replace user accessibility research.

Browser substitute: Playwright 1.63.0 with Chromium **153.0.8010.0** from temporary `@sparticuz/chromium` 153.0.0 outside the repository. Standard Playwright Chromium download returned an invalid archive. The first alternative launch used a single-process flag that crashed between browser contexts; reruns removed that flag. One earlier full run overlapped a build and failed its last page load; the stable post-build full run passed all 66 cases. No dependency or launcher/config change was committed. Python design-tool tests used Playwright 1.51.0 with the same explicit `CHROME` binary. CI/verifier should use the normal pinned browser installation.

The fault/reordering browser cases deliberately intercept transport responses/delay delivery; ordinary T03/T05 and visual probes use the real fixture API. They are deterministic developer regressions, not synthetic actor attempts.

## Visual review

Target: candidate product files in this PR; corpus `fixture-2026-11-08.1`. Baseline renders were separately built from `c4f54ac`. Conditions: 100% zoom, 390×844, 1280×900 and 1440×900, light/dark, local shipped fonts. Existing browser checks verify painted Fraunces, Atkinson Hyperlegible and JetBrains Mono. Captures cover A2, Gympie, subject abstention, reset and edited-draft reask; adjacent keyboard/evidence/layout checks remain in the suite.

| Rank | Observation | Change and inspected result |
| --- | --- | --- |
| 1 | Baseline A2/Gympie follow-ups replace the subject with a jurisdiction prompt; the screen stops identifying the round/locality. | Candidate summaries visibly begin “Continuing with Round A2” / “Continuing with Gympie”. A2 dates/requirements/editorial suggestions remain distinct; Gympie's locality limitation remains above the directory. |
| 2 | The first candidate's empty reset announcement added an unnecessary grid gap below the question controls. | Keep the live region mounted but visually hidden while empty. Revised captures retain the compact form spacing; reset shows its confirmation and a visible textarea focus ring. |
| 3 | An edited draft could be mistaken for the question answered after a context edit. | The active submitted question is stated separately, with an explicit unsent-draft message; the draft remains editable and unchanged. |

Actual inspected examples: baseline phone/light Gympie; candidate desktop/light A2, desktop/dark Gympie, 1280/dark A2, phone/light A2/reset, phone/dark Gympie/subject abstention, and the post-refinement form/edited-draft captures. No clipping or horizontal overflow appeared in the affected states. The phone counter wraps below the two usable action buttons; it does not squeeze either button. Existing long evidence makes these pages tall; no new collapse/dismissal behavior was added.

Builder visual judgement: implementation is suitable for independent review. Remote raster preservation and independent visual sign-off remain open. Screenshots were captured and inspected locally; they have **not been uploaded to Git LFS**, and this PR does not introduce dangling image pointers or raw raster blobs. The verifier must commit final renders through LFS or attach durable review evidence before completion. The manifest identifies the captured files and hashes without claiming they are already in GitHub. Owner design approval remains separate.

## Claude handoff

Review the exact head of this PR against #45 and ADR 003, including the lifecycle table and prior review 5815788420. Inspect contract compatibility, subject resolution before clarification, ambiguity/three-turn abstention, currency, browser request snapshots, reset/late responses and preservation of explicit Unknown. Independently rerun relevant checks. Record findings/sign-off against the head SHA as Claude; do not count this builder report as independent evidence. No product edits in the separate #42 lane.

## OpenClaw handoff

After Claude's code review, verify the pinned candidate, then the eventual merge SHA. Read the repository workflow as verifier/facilitator. Keep primed regression and fresh actor reports distinct. Fresh T03/T05 actors must receive only their assigned briefs, URL and constraints; do not expose this report, expected outcomes or ADR to those actors. Include adjacent T01. Preserve historical partial results.

On the local machine, with Node 22 / npm 10.9.9 and Chromium available:

```sh
git fetch origin feat/45-continuity-runtime
git worktree add ../ozsb-45-verify origin/feat/45-continuity-runtime
cd ../ozsb-45-verify
git rev-parse HEAD
npm ci
npm run check:generated
npm run check:compat
npm run typecheck
npm test
npm run demo:fixture
npx playwright install chromium
# Run from apps/web so the absolute evidence directory is unambiguous.
cd apps/web
OSB_EVIDENCE_DIR="$PWD/../../design/exports/continuity-45" npm run e2e
```

Inspect actual renders and fonts in both themes at all recorded widths. Persist final PNGs through Git LFS on the evidence branch (never raw images); link pinned image hashes/commit in the verification report. Do not label browser automation as fresh actor evidence. Report candidate/merged SHA, runtime/browser versions, test results, visual findings and remaining gates on #45. Do not close #45 until independent review, verification and fresh actor acceptance are recorded.
