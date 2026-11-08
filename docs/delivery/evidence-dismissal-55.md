# Action evidence dismissal — #55

Run: `codex-55-dismissal-20261108`. Builder: Codex; exact model version is not exposed.
Base: `f81b2d71c29bea725970e8988384d124d4f5ed57`. Branch: `feat/55-evidence-dismissal`.
The PR's current head, checks and reviewer response determine readiness. This document is a
builder handoff, not independent review, owner approval or issue closure.

## Behavior and boundary

Action evidence has a visible **Close evidence** button. Escape while focus is inside that
panel has the same effect. Both remove the selected panel and return keyboard focus to the
selected action's **Show supporting passage** button. Escape elsewhere does not dismiss it.
Initial first-action selection and re-opening via the existing trigger are preserved.
Prerequisite evidence retains its existing Show/Hide toggle. No API, vocabulary, source-rights
or context contract changes are included.

The implementation resolves the trigger within the current action card, including when its
evidence changes between aside and inline placement. This deliberately relies on the pinned
NextStepCard's first `.osb-card__actions button` being its inspect control. The regression
checks the selected trigger, a different action and both responsive directions.

## Builder visual review

Actual local build, fictional fixture corpus `fixture-2026-11-08.1`, desktop 1440×900 and
phone 390×844 CSS viewports, light and dark, default browser zoom. The local substitute is
Chromium 153.0.8010.0; CI uses the repository's pinned Playwright browser. Narrow viewport
coverage is not actual browser zoom, a physical-phone test or screen-reader verification.

| Rank | Observation before | Change and post-fix inspection |
| --- | --- | --- |
| 1 | The action panel has no visible exit; on phone the long evidence block remains between the selected card and following actions. | A labelled secondary button sits beside Evidence, with a minimum 44px height. It fits at 390px, keeps the title and evidence qualifiers legible, and uses the existing theme and focus styles. |
| 2 | Keyboard users can enter evidence but cannot deliberately collapse it and resume from its trigger. | Close/Enter and panel-local Escape restore the relevant trigger; the selected border clears. The closed desktop state brings the prerequisite column up; phone resumes the action-card list without an empty evidence shell. |

Inspected the actual open and closed renders at both sizes in both themes.
Before/after screenshots are captured by `R55 action evidence dismissal`; their
names are `{desktop,phone}-r55-{open,closed}-{light,dark}.png`. The PR records final test
results and any additional render review. There is no new brand direction or owner-design
approval claim. Scope judgement: the new control is readable and visually subordinate to
the founder's actions; no material defect was found in the inspected states. Final visual
sign-off remains pending the Mac zoom check and durable final-image archival below.

Historical before evidence is already preserved in
[the original verifier report](../../research/synthetic-ux/runs/verify23-openclaw-20261108/reports/t13-fresh-actor.md)
and its `t13-fresh-030.png` / `t13-fresh-045.png` captures. That report identifies its own
older commit and viewing conditions; it is not relabelled as this build. The builder also
captured the immediate base at both sizes/themes and reproduced four missing-close-control
failures before changing product code. Those local baseline renders are not committed.

CI retains final R55 captures as `evidence-dismissal-<checkout SHA>` for 90 days. These are
review artifacts, not permanent image archival. This session cannot upload Git LFS objects.
Archive only the selected final renders under `design/exports/` through Git LFS during the
local-Mac handoff; link the exact evidence commit and the CI artifact in the PR. Do not commit
duplicate before/after sets or raw PNG blobs. Keep #55 open until the resulting evidence and
Claude's exact-head review are accepted.

## Claude review prompt

Review the PR for #55 in nissan/oz-startup-brain, branch feat/55-evidence-dismissal.
Read AGENTS.md and current delivery instructions; record the exact PR head. Your role is
PR reviewer only. Check panel-local Escape, visible close naming, focus restoration to the
correct action after source return and responsive placement changes, prerequisite toggles,
rights gating and retained context. Inspect the linked captures and verification limits.
You may reproduce checks as a reviewer; do not make implementation commits. Post findings
with file/line and reproduction, or an explicit GO/no-blockers tied to the head. Do not
substitute builder checks for independent review or claim pending Mac verification passed.

## OpenClaw local-Mac verification prompt

Verify #55's current PR candidate on the user's Mac; do not implement product changes.
Read AGENTS.md and this handoff, resolve the PR's exact current head, and record it with
macOS/browser/Node/npm versions. Use a new disposable clone so other sessions are untouched:

```bash
verify_dir=$(mktemp -d "${TMPDIR:-/tmp}/ozsb-55.XXXXXX")
git clone --branch feat/55-evidence-dismissal --single-branch https://github.com/nissan/oz-startup-brain.git "$verify_dir/repo"
cd "$verify_dir/repo"
git rev-parse HEAD
# Use Node >=22.12 <23 and npm 10.9.9; stop and report if unavailable.
node --version
npm --version
npm ci
npm run build
npx playwright install chromium
npm run e2e -w @ozsb/web -- --grep 'R55 action evidence'
# Start the isolated fictional fixture pair for the manual checks below; Ctrl-C afterwards.
node apps/web/e2e/serve.mjs 3110 3910 none
```

At http://127.0.0.1:3110 use real browser zoom at 100% and 200% on a desktop window,
plus a 390px phone emulation, in both themes. Record browser zoom and measured CSS viewport
separately. Ask for prototype support, explicitly select Queensland and Working prototype.
Use Tab/Enter to open an action's evidence, reach a source, return, then close via both
Escape and the visible control. Verify focus on the same action's trigger, preserved
question/context/answer, ability to reopen and repeat for a different action, and no clipped
control or horizontal scrolling in the inline layout at 200%. Check Escape outside evidence
does nothing and prerequisite Show/Hide plus rights-gated text still work. Fictional
`.invalid` sources may not load: report that honestly; do not call it live-source validation.

Record exact observations, failures and screenshots as **primed regression verification**,
not fresh T13 or human research. Upload final selected renders via Git LFS and a verification
report in an evidence-only PR, linking it to #55 and the implementation PR. Verify LFS objects
are retrievable, record hashes and build identity, and do not change source decision records
or mark #55 closed. Codex checks evidence integrity; Claude reviews the PR.
