# Independent readiness review — ux26-loki-20261107

Reviewer role: source/trace verifier, not actor or product builder. No actor report reviewed at this stage; no browser observations asserted. Product and fixtures unchanged; no network or GitHub writes performed.

## Pin and scope

Read HANDOVER.md, AGENTS.md, synthetic-UX runbook and facilitator evaluator guide. Local `git rev-parse HEAD HEAD^{tree}` returned the requested commit `d3f54e887fb946bccf399f142791ed87e6be1b76` and tree `8bc14aef68ca54c8b0b79db7f8badfb703be8ae5`. This verifies checkout identity, not independently the running HTTP build identity.

Selected T01/T03/T05 full variants remain preflight blocked under coordinator-provided #41 disposition; T14/T15 under #42, and actual zoom/real assistive technology remain #9. This review does not reclassify those as attempted or passed. Deterministic regression artifacts are not fresh actor sessions.

## T13 source readiness (source_inspected)

- `apps/web/src/components/Journey.tsx` renders actionable next-step cards, the prerequisite map, textual sequence and native evidence buttons for each step. Step evidence buttons toggle Show/Hide; opening requests focus on the Evidence heading through React refs. Source code supports a keyboard attempt, but is not proof of reachability or visible focus in a running browser.
- `EvidencePanel.tsx` shows citation title, publisher, dates, applicability and rights-gated excerpt from the BFF. A visible source panel is available without navigating off-site; selecting a different action is not the same as explicit panel closure. Step evidence has an explicit toggle. The actor must report the actual route taken.
- Generated `bundle.js` SourcePanel links use `href: p.url, target: '_blank'`. `apps/api/fixtures/corpus.json` canonical links use reserved `.invalid` domains. The reviewed driver supplies neither local interception nor local linked-source fixture pages. A claim that the actor opened/read a resolving publisher source and returned would therefore be unsupported. Opening the local Evidence panel can be observed separately and must not be described as successful publisher navigation.
- F13's supported map/text plus panel opening/closing is a meaningful narrow subset. If the registered “open citation and return” criterion is interpreted as activating its publisher link, that criterion remains unverified/environment-limited; do not award full completion by silently redefining it. If only panel opening is intended, explicitly record that narrower interpretation and keep link destination/return unverified.

## Driver adequacy and limits (source_inspected)

Reviewed `browser-driver.cjs` in the run directory.

Useful: one fresh Playwright context per valid session ID; initial ordinary landing page; only real keyboard press/type operations plus snapshots; before/after body text; timestamp and ordered step number; active element tag/text/aria-label/id/value and computed outline; full-page screenshot for each successful operation; browser version returned. No DOM-click rescue is available. This can support an actual keyboard sequence when paired with actor rationale and image inspection.

Limits:

1. Driver retains and observes only original page `p`. No popup event capture, page enumeration/switch, destination URL/status or close/return operation exists. A target=_blank activation can leave original-page text unchanged while an unobserved tab fails. Original-page traces cannot establish the new tab's outcome or return behavior.
2. Full-page screenshots and computed outline do not alone prove focused controls were inside the actual 1280×800 viewport. No scroll coordinates, viewport screenshot, focus rectangle, clipping, occlusion or `:focus-visible` state is recorded. Inspect screenshots carefully and qualify any actual-viewport visibility claim. Programmatic app focus on Evidence heading is not a keyboard action by the actor, although it may validly result from one.
3. Raw traces omit run_id, persona_id, task_id, variant_id, url_redacted, assistance and rationale; session mapping and report metadata must supply these explicitly without altering the original trace. Actual key sequence is captured in action objects, but missing/failed calls are not persisted because logging happens only after successful operation/capture.
4. A fixed 300ms settle may capture pending state. A snapshot can observe a later settled state, but neither 300ms nor unchanged text proves all requests finished.
5. Browser version is returned, not persisted per trace; launch is headless Chrome. CSS viewport is fixed by driver source, not written in trace. Actual browser zoom is neither set nor measured. No screen reader is exercised. Do not claim zoom, AT or WCAG conformance.
6. Before-state text has no before-focus record except by linking the preceding successful snapshot. Initial page capture exists only if actor starts with snapshot. Snapshots are evidence capture, not meaningful UI actions; key/type calls can contain multiple characters or navigation keystrokes, so raw row count is not a meaningful-action count.
7. Source code's reading of body/active element is instrumentation, not user action. Actor should receive visible evidence, not evaluator expectations. Isolation must be evidenced by separate actor context and only permitted packet exposure; a fresh browser context alone does not establish cognitive isolation.

## Review judgement pending actor evidence

Readiness supports a bounded T13 keyboard/evidence-panel attempt with explicit source-link and trace limitations. It does not establish a completed variant, visibility pass or fresh usability result. At preparation time there was no actor report in the run directory; trace contents were deliberately not read to avoid interfering with a live attempt. Await frozen actor report, screenshots and manifest for evidence review. No instructions were sent to the actor.

## Frozen actor evidence review — final verdict

Reviewed frozen `t13-actor.md`, all 24 raw trace rows, `manifest.json`, `validation.md`, and visually inspected screenshots `t13-13.png`, `t13-21.png`, `t13-24.png`. No actor contact or actor/source changes. The trace supports one fresh synthetic T13 attempt: initial snapshot plus 23 recorded UI action calls. Counts are operation-based (typing is one operation), not human time or participant counts.

### Supported observed subset

- Keyboard Tab/Enter route from ordinary landing page to task shortcut, question input, clarification and Queensland selection is recorded. All three action-card supporting-passage buttons were keyboard focused in order (rows14–16); only step1 evidence was activated.
- Screenshot13 shows the prerequisite map plus ordered textual equivalent. It also visibly says Stage Not set, and preserves the starter question appended after the actor's intended replacement. This is not evidence of confirmed prototype context or fully verified prototype prerequisites.
- Rows20–21 show focus on the explicitly labelled step1 evidence toggle followed by Enter and Evidence heading focus. Screenshot21 confirms an ochre focus ring, selected step1 evidence, publisher/date metadata, explicit editorial sequencing and a rights-restricted excerpt notice.
- Row24/screenshot24 shows a clear focus ring on Evidence for step3. Step1 remains selected/open. Context remained in the original document.

### Required criteria not completed

1. No source panel closure was exercised. Shift+Tab moved focus to step3; it did not close step1. Therefore even a panel-only “open/close” criterion cannot be awarded complete. Closure is **unverified**, not a demonstrated product failure.
2. Enter on publisher links (rows18/23) and Control+Tab (row19) did not produce destination-page evidence. The runner does not observe/switch popups and fixture destinations are reserved `.invalid` URLs; external citation navigation and genuine away-and-back remain **blocked_environment/unverified**, not a reproduced product navigation defect.
3. All actionable controls were not activated and each step's source was not inspected. The three supporting buttons were focused and step1 panel opened; do not generalize beyond those recorded operations.
4. Focus rings are visually evidenced in selected full-page renders and outline metadata. Actual viewport clipping/scroll visibility across the entire sequence remains unverified. Actor's “assigned100%” is a requested setting, not a measured zoom result; manifest correctly leaves zoom null.

### Product versus runner findings

No demonstrated product keyboard obstruction or focus trap is established by this attempt. Repeated generic Show supporting passage labels are observed, but resulting human comprehension friction is only a hypothesis. Queensland clarification despite prose location, Stage Not set despite prose prototype, and retained starter text are observations, not independently established violations of declared product behavior. Control+A replacement failure is consistent with macOS shortcut/runner mismatch; do not classify it as a product defect without reproduction using the supported platform shortcut. The source-page failure is runner/fixture constrained. The report appropriately does not claim that its editorial sequence establishes eligibility or full documented prerequisites.

### Coverage/outcome judgement

**T13-base: attempted, partial; use canonical `blocked_environment` with explicit successful keyboard/map/panel-opening subset and panel closure unverified. Not completed, not passed, not a whole SC03/SC05/SC19 pass.** The actor report's conservative partial outcome is supported. No assisted attempt is recorded. Seven other selected variants remain preflight-blocked and unattempted: attempted1/8; completed0/8; preflight-blocked7/8. Do not include blocked variants as attempted or pool the 36 deterministic checks into actor counts.

The manifest observed at review time still lists T13 as `in_progress`; finalize it to the bounded outcome above. It also needs actual started_at/pack_commit/network-profile metadata if known, otherwise explicit unknowns. The raw traces do not contain the proposed joined metadata fields, and no joined trace artifact was present at inspection time; therefore their exact final joined values are **not independently reviewed yet**. A derived sidecar mapping should preserve original bytes and distinguish actor keys/text from verifier metadata, identify run/persona UX7/task T13/variant T13-base/session t13, URL and assistance, and reference original step/evidence IDs. Do not imply actor screenshot inspection of every frame or assign unmeasured zoom. Missing automation rationale can be linked from the frozen actor report rather than invented.

`validation.md` reports parent-run127/127 unit tests and36/36 deterministic browser tests; reviewer did not rerun them. They are separate facilitator verification, not independent actor sessions, not full CI reproduction and not resolution of #41/#42/#9.

## Final packaging review — ACCEPT (bounded evidence record)

Reviewed final summary, manifest, trace-index, header-only findings and validation record. Verified every one of24 sidecar joins against its raw step and evidence reference, run/persona/task/variant identity and snapshot/action designation:24/24 consistent,23 action entries. Review performed no browser rerun and no modification of actor report, raw traces or images. This supersedes the earlier packaging-pending notes: T13 now correctly `blocked_environment`, zoom remains null and coverage is8 planned/7 preflight-blocked/1 attempted/0 completed.

**ACCEPT** for the bounded partial-run record. No material pass inflation: successful map/keyboard/panel-opening subset is preserved; panel close, all-controls completion, external destination/return, real zoom and AT remain unverified. Empty findings CSV is consistent with no established new product defect. Scripted36/36 and unit127/127 remain attributed to parent execution, not independent reviewer reruns or actor sessions.

Minor precision note, not a blocking packaging change: summary item3's OS/runner keyboard-mapping explanation is plausible rather than independently reproduced; strongest supported wording is “consistent with platform/runner shortcut mapping; not established as a product bug.” The observed fact is only unchanged selection attempt followed by retained starter text. The sidecar's URL denotes the original controlled document; it is not a measured popup destination. Manifest's absent started_at/pack_commit/network-profile remain metadata omissions, not grounds to invent values or claim complete runbook metadata. No further browser activity or product changes requested by this review.
