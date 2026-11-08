# Prompts for current sessions

These prompts add a pilot to the current work; they do not reset branches, override live assignments, transfer ownership or start other sessions. Read this pack from its reviewed commit/branch until merged. Fetch it into a separate worktree if needed; do not overwrite in-progress product work. The tools accept paths in the target product diff even when run from the separate pack worktree, provided the referenced commits exist there.

## Codex — continue implementation with the pilot

```text
Continue our existing nissan/oz-startup-brain work and trial the Attio-inspired
pack at docs/delivery/attio-pilot/README.md. Preserve the current branch and
uncommitted work. Read current AGENTS/HANDOVER, the delivery workflow, live #23,
your assigned issue and every comment/linked PR before deciding the next action.
If this pack is only on its proposal branch, inspect it in a separate worktree;
do not cherry-pick it into an active product PR without coordinating ownership.

Keep our current roles: Codex implements and fixes, Claude reviews PRs only,
OpenClaw performs checks that specifically require the local Mac. Keep the WIP
limit, unique path ownership and any merge authority already granted to this
session. This prompt adds no merge, source-release, paid-provider or deployment
permission and does not ask you to request already-granted permission again.

First reconcile #76/#55. At the pilot snapshot, Claude review and CI were done,
with Mac zoom/durable evidence pending; re-read live records before doing more.
Do not repeat completed work just for this experiment. Once the existing
dependency/assignment gates permit, use #10's existing-surface vocabulary slice
as the first prospective build. If it is already underway, mark the pilot start
point honestly; do not claim a retrospective baseline or restart the feature.

Use the Scope context and Build with evidence playbooks. Run pilot.py context
for planned paths, then for actual base/head changes. Record lesson IDs and
catalog hash. Map acceptance to tests before editing. For #10 preserve approved
words, coordinate contracts/design/generated consumers, test missing-word and
surface-drift failures, and leave export acceptance open until an export exists.

Run applicable clean checks and required visual inspection. Preserve actual
failures/substitutions, before/after evidence and builder-context disclosure.
Fill a copy of handoff.template.json with the exact head, checks, evidence,
remaining acceptance and next role; run pilot.py validate with that head.
Its structural success is not acceptance or independent verification.

Give Claude the exact PR/head and actionable review scope. Give OpenClaw only
the outstanding Mac-required checks, with pinned checkout, exact commands/manual
steps, evidence paths, cleanup and stop conditions. Keep existing evidence
formats; link the pilot record rather than duplicating large artifacts.
Record the measurements in trial.md, using unknown where unavailable. Propose
at most one reusable lesson from confirmed findings. Report what actually ran,
remaining gates and the next concrete handoff; do not claim other sessions ran.
```

## Claude — review and calibrate lessons

```text
Continue as PR reviewer only for nissan/oz-startup-brain. Use the opt-in pack at
docs/delivery/attio-pilot/README.md alongside current AGENTS/HANDOVER, the live
#23 roles and the assigned PR/issue. Preserve current work. No implementation
commits, build-task takeover or merge action is requested.

First review the pilot pack itself if it has not been reviewed. Check whether
the lessons preserve canonical policy, the selector handles changed/deleted/
renamed paths, the validator's limits are stated truthfully and the session
prompts preserve our current roles. Run its Python tests. Return concrete
findings to Codex; do not repair the pack yourself.

For the assigned product PR, record its exact current head and disclose whether
this context contributed to or has prior knowledge of the work. Use a fresh
context when available for independent review; a model change alone is not
independence. Read the full diff and relevant callers, not just selected lessons.
Run pilot.py context for the base/head and read the relevant canonical sources.
Reproduce applicable checks in a clean isolated checkout. Investigate temporal
contradictions, real contract breaks, generated drift, BFF/key boundaries,
visual/focus regressions and unsupported evidence claims when relevant.

For each confirmed finding, give severity, file/location, reproduction,
expected/observed behavior, suggested change and lesson ID if one applies.
Separate defects, questions and optional preferences. Post a COMMENT review
under the existing task's publication authority, scoped to the exact head;
never imply that a scoped GO supplies merge authority or completes unrun checks.
For #10, do not approve changed owner-approved words or close deferred export
parity. For #76, preserve an existing GO if nothing material changed; assess
new Mac evidence when it arrives rather than restarting the entire review.

Validate the supplied handoff structurally, then inspect the real evidence.
Record accepted/duplicate/rejected/unresolved finding dispositions for the
pilot and any misleading or irrelevant lesson. Re-review affected scope on
new heads. End with checked claims, remaining verification and the precise
Codex/OpenClaw handoff. Keep lesson changes as proposals for Codex.
```

## OpenClaw — execute the scoped Mac verification

```text
Continue only the authorized local-Mac verification for nissan/oz-startup-brain.
Use docs/delivery/attio-pilot/README.md and the Verify on the Mac playbook as an
evidence wrapper around the current task. Re-read the live issue/PR and current
#23 roles. Do not change product code, take a general build task or repeat
checks already completed elsewhere without a specific reason.

At the pilot snapshot the outstanding #76 work was actual 200% browser zoom
and durable final-render/LFS evidence. Verify that this is still current.
Use Codex's exact head and docs/delivery/evidence-dismissal-55.md from that head
for commands, journey coverage, artifacts and cleanup. If identity or necessary
steps are absent, obtain that precise handoff before dependent execution;
do not guess the target or ask for permission already given in the session.

Record the actual configured model, macOS/browser/runtime versions and available
capabilities. Use a fresh isolated checkout. Perform the specific manual and
command checks, recording actual browser zoom separately from viewport size.
Observe dismissal and focus return in the required states. Claim VoiceOver or
screen-reader coverage only if actually executed and observed; unavailable
capabilities remain open. These are primed verification checks, not fresh UX
actors or human research. A fresh actor must use a separate isolated context
with only its actor packet and starting URL, never this development pack.

Preserve logs, final captures and hashes with existing LFS/evidence tooling;
do not commit raw raster images or secret-bearing output. Confirm artifact
readback. Restore zoom/settings and stop only the services started for this run.
Record cleanup and remaining failures. Product fixes go back to Codex.

Complete a copy of handoff.template.json as role verifier, validate it against
the tested head, and provide it with the existing evidence handoff/PR under
the current publication authority. A valid record is not a passing task.
Give Claude the evidence for review and Codex the exact remaining actions.
Capture handoff clarification count and active effort if actually observed;
leave unknown costs/times unknown. Do not mark the whole issue Done or claim
any owner decision or merge not actually performed by the authorized role.
```

## Optional end-of-trial prompt for the coordinator

```text
Evaluate the Attio pilot after three prospective tasks using trial.md. Read
actual PR/head records and finding dispositions. Separate the #76 rehearsal
from prospective builds and unknown baseline values from zeros. Report raw
counts, repeated mistakes, review noise, evidence gaps, effort and concrete
examples of usefulness. Recommend keep/revise/stop for each tool or lesson.
Propose one bounded improvement; do not install an MCP service, add paid model
calls, change required CI or weaken release/independence gates without the
normal task, review and applicable authorization process.
```
