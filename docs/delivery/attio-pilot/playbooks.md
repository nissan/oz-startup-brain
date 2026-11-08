# Reusable task skills

These are portable, manually invoked skill recipes for existing sessions. They are not installed ChatGPT skills, Claude commands or OpenClaw plugins. Load only the recipe needed for the role. The current repository workflow and owner's instructions prevail.

## 1. Scope context

**Trigger:** starting an authorized task, changing scope, or reviewing a new head.

**Inputs:** current issue and all comments; PR if present; role/run/model; confirmed path ownership; planned or changed paths.

**Procedure:** reconcile live status; identify capabilities actually available; run `pilot.py context`; read selected sources as needed; add any missing cross-cutting context explicitly; record catalog hash and selected lesson IDs. Preserve the mandatory startup reads. Do not give the output to synthetic UX actors.

**Output:** a bounded task brief with acceptance, exclusions, dependencies, lessons, base/head and next role. **Stop:** conflicting claims, missing decision that controls implementation, or no permission to access the required environment. Continue independent work that is still in scope.

## 2. Build with evidence

**Trigger:** Codex's confirmed implementation task.

**Procedure:** state the smallest intended behavior change; map acceptance to tests; implement only owned paths; regenerate outputs through their existing source; run the applicable clean checks; preserve failing-before evidence for defect fixes; perform the required visual critique for UI changes. Record literal failures and substitutions separately. Retain review-fix history.

**Output:** exact-head PR evidence and a handoff for Claude. List remaining acceptance and environment gaps. **Stop:** no test or screenshot is proof of human comprehension, independent review or release readiness.

## 3. Review with lessons

**Trigger:** Claude receives a specific PR/head for review.

**Procedure:** disclose prior context; inspect the complete diff and relevant unchanged callers; select lessons for all affected paths; reproduce applicable checks from an isolated clean checkout; test the most plausible failure boundaries. Do not accept the builder's narrative as evidence. Report findings with severity, file/location, reproduction, expected/observed behavior, lesson ID if applicable and required change. Separate confirmed defects from questions and optional preferences.

**Output:** COMMENT review scoped to a head, plus performed/unrun checks. Do not create implementation commits. A scoped GO is not a merge instruction. On a new head, inspect the delta and rerun affected checks; do not simply carry an old GO forward. For the pilot, record each finding's final disposition as accepted, duplicate, rejected-with-reason or unresolved.

## 4. Verify on the Mac

**Trigger:** a confirmed task explicitly requires Nissan's local Mac.

**Inputs:** exact tested commit, task-specific commands/manual steps, expected evidence, cleanup and stop conditions supplied by Codex.

**Procedure:** record macOS, runtime, browser and actual model versions; use a fresh isolated checkout; inspect commands before execution; keep fixture services on loopback and credentials out of logs. Perform only the required checks. For actual zoom record the browser's zoom setting; a smaller viewport is not equivalent. For VoiceOver record what was actually announced or leave unavailable coverage open. Preserve evidence using existing LFS conventions and verify readback hashes. Stop services and reset changed settings.

**Output:** observations, artifacts, hashes, limitations and cleanup record. Product failures return to Codex. Claude reviews evidence interpretation. Never convert an environmental limitation into a pass or repair product code in this role.

## 5. Harvest one lesson

**Trigger:** a confirmed review or verification finding was fixed, or the trial ends.

**Procedure:** identify the generalizable mistake; locate its canonical source; deduplicate existing lessons; propose one scoped rule with counterexample and check; get a review; log false positives and later recurrence. If deterministic enforcement is cheap, propose a separate focused test instead of accumulating prose.

**Output:** a reviewed lesson addition/change or a reason no lesson is useful. Do not make an agent's proposed policy authoritative merely by writing it into the catalog.

## Role capability table

| Role | Permitted by this pilot | Evidence required | Not granted by this pilot |
| --- | --- | --- | --- |
| Codex builder | Assigned implementation and ordinary checks | Commands, exact SHA, applicable visual evidence | Independent approval of its own work |
| Claude reviewer | Read, reproduce, inspect, COMMENT review | Context disclosure, exact head, findings | Build ownership or fixes |
| OpenClaw verifier | Scoped local-Mac checks and evidence publication under existing task authority | Environment, observations, durable evidence, cleanup | General implementation work |
| Coordinator | Reconcile assignments and handoffs within existing authority | Live issue status and explicit next task | Unstated owner decisions |

This is a procedural table. Actual enforcement belongs to host permissions and repository controls; the Python tool does not implement it. Synthetic UX actors are excluded and use their separate isolated actor packets.
