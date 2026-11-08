# PR67 pinned candidate verification

## Identity and scope
Run `openclaw-verify67-20420`, source Telegram20420, 8 November2026. Tested candidate `013e5df6e43ebd8c3d68f8b1fbfd4afb7a9dc1da`, tree `6512d593a156aa69d4cb5fbdf3ca38f63a462b63`; main at start `ab6c768075d419f5346edf1f6529d2a81a867ea9`. Evidence branch `verify/67-openclaw-20420` is replayed onto current main for publication; candidate and evidence identities are deliberately separate. Only this new run directory changes. No product/source/previous-archive edits. Verifier coordinated earlier foundations but did not author continuity implementation.

## Result and boundary
Candidate technical verification PASS for the scoped primed cohort. Fresh synthetic actor observations received separately; not three automated acceptance passes, human research or full UX/accessibility completion. The eventual #67 merged-build check is NOT RUN because #67 is unmerged. Claude report review and Codex evidence-integrity review remain required. No self-approval, merge, deployment or issue closure.

## Commands and runtime
Clean locked npm install in a new worktree. Node22.23.0/npm10.9.8 (declared Node22 supported; npm advertised10.9.9). Normal JS Playwright1.63.0 / installed Chromium153.0.8010.12 revision1243; no browser substitute or candidate config edit. Python3.14.3 for pack validator. Commands from root unless noted; Node22 bin was first on PATH.
- `npm ci`: PASS (`reports/install.log`).
- `npm run typecheck`: PASS including production build (`typecheck.log`).
- `npm run check:generated`: literal command PASS, no generated/product diff (`generated.log`).
- `npm run check:compat`: PASS (`compat.log`).
- `npm test`:190/190 (24contracts,4client,142API,20BFF) PASS (`unit.log`).
- `node apps/api/scripts/demo-fixture.mjs`:9/9 PASS against the existing built outputs (`demo.log`); not an extra rebuild.
- From `apps/web`, `OSB_EVIDENCE_DIR=<candidate>/research/synthetic-ux/runs/verify67-openclaw-20420/primed-renders npm run e2e`:76/76 PASS, retries0 (`e2e.log`).
- `python research/synthetic-ux/tools/validate_pack.py`:PASS (`pack.log`). No scenario review fabricated.

## Primed evidence
Independent execution of builder-authored assertions, not independently authored tests. `continuity.spec.ts` covers A2/T03 and Gympie/T05 follow-ups, bounded prior, ambiguous/uncovered/unknown subjects, explicit Unknown, reset, unrelated switches, context-edited unsent drafts, retries and newer-generation/late query/source delivery. Error/413/reordering cases intercept transport deliberately; ordinary subject/visual cases use real local BFF/fixture API. `journey.spec.ts` supplies adjacent T01, keyboard, painted-font, layout and dated-evidence regressions. Candidate tests remain unchanged. 122 primed PNG captures are separate from actor images.

## Actual render inspection
Parent inspected `1280-light-a2.png`, `1280-dark-gympie.png`, `390-light-a2.png`, `390-dark-gympie.png`, `390-light-uncovered.png`, `390-dark-reset.png`, `desktop-edited-draft.png`, `phone-edited-draft.png`.
- Continued subject is explicitly named; Gympie coverage limitation remains above directory.
- A2 opening/security dates remain distinct from current requirements; suggested step remains editorial.
- Phone action buttons remain legible, counter wraps underneath; no clipped subject/limit copy in inspected states. Dark/light hierarchy and reset focus indicator are visible. Uncovered A1 describes missing evidence, not a request to name an already named round.
- Edited B1 draft stays in textarea while the report explicitly names the last submitted A2 follow-up as the answered question.
- Remaining weaknesses: long mobile evidence and duplicated future security-assessment caveats. No visual changes were made by verifier. Suitable for review within these states, not a blanket visual approval. Browser assertions also verify painted fonts in both viewport projects.

## Fresh actor observations, not primed regression results
Three children launched with `fork_turns=none`, receiving only their packet path, URL and input constraints plus execution/artifact instructions. Each packet is retained. No acceptance/ADR/builder/facilitator material supplied. Actor choices were not coached with desired outcomes. Their scripts, text observations, screenshots and reports are separate under `actors/`. Browser viewport emulation100%, not actual devices or zoom.
- T03 / `/root/fresh_t03_20420`: identified Round A2 opening constraint, required versus editorial steps, future security assessment and unresolved IP/contribution/evidence questions after inspecting both step panels. Did not submit registered follow-up as a second query: explained it from visible evidence. One failed locator is disclosed as harness friction.
- T05 / `/root/fresh_t05_20420`: found absent Gympie coverage and a useful next availability check, not a verified local/remote service. Combined brief+follow-up into one query; therefore this actor is NOT independent evidence of the follow-up dispatch mechanism. That mechanism is covered by the separate primed suite.
- T01 / `/root/fresh_t01_20420`: found university IP-ownership first check; explicit jurisdiction Unknown retained after choosing it. Stage-editor locator failed; no UI defect inferred. Five fresh-context launches/21 attempted interactions are disclosed; this is one evolving actor attempt, not five fresh participants. Unchanged answer screenshot04 is not a successful editor-open capture.
Parent also inspected T01 `03-unknown.png`, T03 `05-screen.png`, T05 `03-passage.png`. Synthetic observations suggest task-understanding within fixtures, not real eligibility or human comprehension. Context chips remaining Not set caused confusion, but avoiding inferred personal context is intentional; builder should assess explanatory copy, not silently auto-populate it. Duplicate future caveat and mobile length are reported for triage rather than changed here.

## Other handoffs and remaining gates
#65 merge3b0a6f9 and #68 mergeab6c768 preserve their reviewed scopes byte-for-byte; both merge commits have6/6CIgreen (`reports/merged65-68.json`). This is scope/CI verification, not a new full browser run on merged #65.
#67 requires its own actual merged-build verification later. #53 dismissal waits#55. Actual screen reader not operated; #9 outstanding AT/zoom and human/real-source gates remain. Unregistered non-generic follow-ups remain a documented fixture limitation, not continuity passes. No cloud hosting, paid providers or production service.

## Evidence contract
135 PNGs (122primed/13actor) go through Git LFS. `manifest.json` records original-byte SHA256/size for every artifact except itself; `tools/verify-artifacts.py` verifies tracked text bytes or canonical LFS pointer joins. Text paths are sanitized to `<candidate>`/`<home>`; retained historical scripts may need the local module path restored for replay. No private raw source data or credentials included.
