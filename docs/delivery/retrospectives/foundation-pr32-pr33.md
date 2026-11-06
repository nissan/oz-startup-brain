# Retrospective: the fixture API and visual foundation

Recorded after PRs #32 and #33 merged; planning checkpoint 6 November 2026, Australia/Sydney. This is an evidence-based process retrospective by Codex, which built #32 and reviewed #33. It is not an independent incident investigation or a user study. The iteration remains open.

## What actually shipped

| Outcome | Exact result | Evidence |
| --- | --- | --- |
| Offline fonts and typography verification (#22) | #32 merged as `1a38f4aabe9741b2df03cf6288bf00dd68864d5f`; 22 design tests, 13 persona-validator tests, 48 renders and 48 automated accessibility checks passed | [Completion](https://github.com/nissan/oz-startup-brain/pull/32#issuecomment-6679093166), [verification](https://github.com/nissan/oz-startup-brain/pull/32#issuecomment-6679057930) |
| Fixture NestJS API, contracts and standalone client (#24) | #33 merged as `8e034479414ba84639233ce8ed564e05e6378a2c`; 108 tests and 9 HTTP demo checks passed | [Review sign-off](https://github.com/nissan/oz-startup-brain/pull/33#issuecomment-6679006953), [merged-build verification](https://github.com/nissan/oz-startup-brain/issues/24#issuecomment-6679180899) |
| Integration | #33 landed while #32 was being verified. The combined tree `1c4accb16d22623f14c9d6fbaeebae7ee011f34b` passed API build/typecheck, 108 tests, compatibility, 9 demo checks and 7 font smoke tests. The actual #32 merge had that exact tree; post-merge smoke checks passed | [Combined-tree check](https://github.com/nissan/oz-startup-brain/pull/32#issuecomment-6679079640) |

Both merged cleanly; no merge regression was observed in these checks. That does not mean issue-free or production-ready. #34 records dependency advisories; #8 remains the owner's design decision; #9 retains actual screen-reader/zoom work. No synthetic browser sessions or human studies ran. Persona-pack validation is preparation evidence only. No live RAG, graph, hosted deployment or decision-model quality was evaluated.

## What worked, what escaped, and what changes

| Observation | Lesson and next practice | Where applied |
| --- | --- | --- |
| Cross-model review found defects despite 72 passing initial API tests; the final suite has 108 tests | For each changed invariant, give one counterexample and prove the regression catches the old behaviour. Test the negative claim as well as the expected label | PR template; #25 review brief |
| Freshness masked future applicability; the first fix still left a contradictory summary | Exercise freshness × effective-date boundaries and read the whole response: claims, actions, prerequisites, summary and warnings must agree. Check absence of prohibited recommendations/current-state assertions | #25 fixture boundary and visual-state tests; existing #33 regressions |
| Compatibility tests initially missed operation schemas, conditional keywords, security definitions and later `$ref` siblings | Mutate documents at both component and operation use sites. Use the real validator to prove old clients actually break. Keep the pre-change baseline for comparison; do not regenerate away a failure | Agent review workflow; contracts tests |
| A regex accepted impossible calendar dates; source IDs violated their published path pattern | Test boundary values and the actual HTTP contract, including IDs returned by one endpoint and consumed by another. Validate before mutating state | #25 BFF/API acceptance |
| The API first passed locally with existing build output but failed clean CI | Start from the lockfile and build workspace dependencies before typecheck. Record exact runtime, commit and any command substitution; do not equate a workaround with the literal CI command | PR template; #34 acceptance |
| Intended fonts changed wrapping, exposed a fallback glyph, and made weak secondary text visible | Verify painted fonts, then perform an art-direction pass. Passing geometry does not establish polish. Preserve before/after evidence and separate owner taste decisions from functional defects | #25 visual gate and #8 review |
| Review comments, issue status and roadmap instructions drifted; main advanced during verification | One canonical Delivery block per issue, exact-head review, recheck base before merge, test the combined tree when needed, and identify the resulting merge build | Iteration #23 and delivery workflow |
| Dependency advisories appeared in post-merge verification | A lockfile is reproducibility evidence, not a permanent security verdict. Record audit time, dependency paths, reachability and tracked disposition; avoid forced major upgrades as a shortcut | #34, before hosting/uploads |

Independent review came from the other model, but reviewer sessions were not fresh contexts. Final verification was performed in builder sessions with that limitation disclosed. Keep that disclosure; use a separate fresh verifier when practical, particularly for the browser journey. These reviews do not justify claims that model diversity alone guarantees correctness.

## Audit observation and bounded follow-up

A read-only `npm audit --json` against the unchanged combined main lockfile returned **11 affected-package entries: 2 high, 2 moderate and 7 low**, no critical entries. These are not eleven distinct underlying advisories: Nest packages inherit multer/js-yaml findings; the low chain runs through deepmerge/Jest. The command exited 1, as expected for reported findings. This adds a low-severity development-tool finding to the two underlying advisories already recorded in #34; it does not show that the abandoned override attempt was merged. Its seven low entries also occur on the current main lockfile.

The #24 verifier assessed the multer and YAML paths as unreachable in this fixture surface (no multipart upload route or served Swagger YAML). #34 must recheck that assessment and the current audit, choose a bounded fix, and record any low-severity disposition. No dependency changes were made in this retrospective. No hosted/preview deployment or upload route should proceed before that ticket's release gate is met.

## Revised next work

The architecture remains appropriate: NestJS owns domain rules; Next.js uses a server-only BFF/client; fixtures precede live retrieval; graph and decision-model experiments follow measured baselines. No new framework or orchestration layer is justified by this retrospective.

| Lane | Next ticket | File ownership and boundary | Exit / reviewer |
| --- | --- | --- | --- |
| Claude, proposed builder | #34 dependency remediation | Root package manifests/lockfile, necessary API dependency metadata and focused compatibility evidence. No corpus audit, UI or schema expansion | Clean install, audit disposition, unchanged OpenAPI, generated checks, compatibility, build/typecheck, 108-test baseline and HTTP demo; Codex reviews |
| Codex, proposed researcher/planner | #28 bibliography dispositions | `data/sources/`, corpus metadata tooling and scoped source/coverage documentation. No root dependency/lockfile edits, API/contracts, runtime source ingestion or persona-fixture changes | All 135 URLs have an evidence-backed disposition; unknown rights remain unknown; proposed first corpus and jurisdiction for owner decision; Claude reviews |
| Nissan, owner decision | #8 | Review current intended-font exports, secondary-text comfort and slashed-zero preference; approve the three handoffs or name concrete changes | Unlocks #25; never inferred from PR merges |

These are recommendations, not started sessions or confirmed builder claims. Keep at most two active implementation issues, including review fixes; research consumes a lane in this pairing. Each agent starts from current main, records a unique run/branch, and follows the issue's current acceptance. If either needs the other's files, coordinate before editing.

Once #8 is approved and #34's package edits have landed (or its claim is explicitly released), Claude can take #25. Codex can continue #28 independently; do not interrupt and relabel unfinished work without a handoff. Sequence shared vocabulary work (#10) inside/coordinated with the UI increment, not as a competing writer of `packages/contracts`. After #25 has a pinned working URL, reset instructions and demonstrated task capabilities, dispatch #26 with fresh isolated actors; actors must not receive this retrospective, implementation tests or expected outcomes. #27 follows observed friction. #9's available checks may run separately; unavailable assistive technology is blocked, not passed.

Do not accelerate into graph, live providers, public hosting or decision-model routing while the first browser feedback loop remains untested. #28 progresses source readiness without delaying that loop. #30's native Project remains access-blocked; the linked issue index is still the coordination authority.

## Check at the next retrospective

For the next PRs, record whether clean install/build succeeded first time, whether every review finding has a failing-before regression, whether stale/current prose agrees across surfaces, whether status/head/merge evidence stayed synchronized, and whether visual weaknesses were fixed before sign-off. Record actual persona attempts and blockers only after #26 runs. These are prospective measures, not claimed improvements or velocity estimates.
