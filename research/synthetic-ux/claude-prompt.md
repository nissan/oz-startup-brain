# Actor-first Claude handoff

The facilitator prepares fixtures and readiness separately using [runbook.md](runbook.md). Do not paste the facilitator guide, mappings, old findings or a conversation containing them into the actor session. Use an existing separate context or explicitly authorise a separate runner; this prompt does not authorise spawning agents.

Give the following prompt to a fresh actor context. Supply only the selected profile/task records, not all profiles and future tasks. If reading from files, use only `actor/` before the first attempt. Hold the follow-up until the initial attempt ends; file readers that see it early must record that exposure.

```text
Perform one fictional persona browser walkthrough of nissan/oz-startup-brain.
For your first attempt, the only pack files you may read are the assigned
records in research/synthetic-ux/actor/personas.json and actor/tasks.json.
Do not read the root pack README, runbook, facilitator folder, source code,
prior reports or expected results before completing the first attempt.

Run inputs, prepared by the facilitator:
- Persona ID and selected actor profile: [record]
- Task ID and initial brief only: [brief]
- Verified starting URL/build and input constraints: [values]
- Isolated local/preview environment with paid calls disabled: [values]
- Output destination for observed trace: [path]

If these inputs or an operable browser are missing, report preparation only.
Do not invent observations or visit an assumed deployment.
Use the installed browser integration and its documented APIs. Do not guess
selectors, use hidden deep links, inspect source code or bypass controls.
Follow the profile's knowledge and preferences; do not act out a predetermined
success or failure. Record actual actions, visible results and redacted evidence.
Do not provision, deploy, merge, spend on models, grant a real microphone,
submit external forms or publish anything as part of this walkthrough.

Allow one sensible visible recovery attempt. Stop after two failed attempts
at the same action, three unproductive navigation loops or 25 meaningful
UI actions; record the limit, not an invented human abandonment rate.
Keyboard-only means operate keys, with no pointer rescue. Never claim to hear
audio or inspect a downloaded file if the tool did not provide it.

After the first attempt, explain your next action and uncertainty using only
what you saw. This is a hypothetical interpretation, not a human quotation.
Stop and return your trace. The facilitator may then give you the follow-up
brief as a separate attempt and evaluate the observations afterwards.
If you previously saw fixtures, expected results or the follow-up, disclose
that exposure; the evaluator must label the relevant attempt primed inspection.
```

After freezing the trace, the facilitator uses [facilitator/tasks.json](facilitator/tasks.json), [facilitator/evaluator-guide.md](facilitator/evaluator-guide.md) and [templates/session.md](templates/session.md). Record reproducible findings and proposed fixes; never retroactively change a trace to match the oracle. A context that read the oracle beforehand remains valid only as a labelled primed inspection. No result satisfies human-research or live-model gates.
