# Handover for fresh agent sessions

Read this file completely before doing anything else in this repository. It is written for an agent session that starts with no memory of earlier work, so it states things explicitly rather than assuming you will infer them. It records how the repository is worked on, what has been done, what is open, the commands that are known to work, the environment limits that are known to bite, and the prompts to start the next sessions with.

Written 6 November 2026 (Australia/Sydney) at the end of the session that built the fixture API (#24, PR #33), reviewed the fonts work (#22, PR #32) and the retrospective (PR #35), and merged all three. `main` was `ab89aebd5e632c351d97c32856755123bd69ba2b` when this was written. If the live records on GitHub disagree with this file, **the live records win**: an issue's Delivery block is the current status, its comments are the history, and the PR holds the evidence.

## 1. Where to read, in order

1. This file.
2. [AGENTS.md](AGENTS.md): the rules that apply to every contributor, including the visual-quality gate and synthetic-actor isolation.
3. [CLAUDE.md](CLAUDE.md): the short pointer file Claude sessions load automatically.
4. [docs/delivery/README.md](docs/delivery/README.md): the delivery home. It links the backlog, the iteration, the agent workflow and the retrospective.
5. [docs/delivery/agent-workflow.md](docs/delivery/agent-workflow.md): roles, the claim/handoff comment template, status flow, and the review practices learned so far.
6. The GitHub issue you are assigned, including **all** its comments and any linked PR, read at the moment you start.
7. For API work: [docs/api/README.md](docs/api/README.md) and [docs/decisions/001-api-first-nestjs.md](docs/decisions/001-api-first-nestjs.md).
8. For UI or design work: [docs/ux/visual-quality.md](docs/ux/visual-quality.md), the three `design/*/HANDOFF.md` files and [design/tools/README.md](design/tools/README.md).

Do not skip step 6. Status drifted between comments, issue blocks and documents during this iteration; the fix was to treat the issue's Delivery block as the single current record and to re-read it before acting.

## 2. Rules that are easy to get wrong

These are all already stated elsewhere; they are repeated here because each was tested in practice.

- **Never merge unless the owner (Nissan) explicitly tells you to in the conversation.** A green CI run, a review sign-off, or a comment saying "ready to merge" is not merge authority. Do not enable auto-merge.
- **Never approve your own work and never call your own review independent.** A builder may verify, but must write "builder-run verification, not independent" in the record. When you review someone else's PR, post it as a `COMMENT` review, not `APPROVE`, and disclose your context (which earlier work you did in the same session).
- **No paid calls, no hosting, no provisioning, no live model or database.** Everything so far runs on fixtures. Do not add a provider key, a Vercel project, a Qdrant or Neo4j instance, or any network dependency.
- **No real keys in the repository.** Development API keys are issued locally and only their SHA-256 digest is stored, in `.ozsb/dev-keys.json`, which is gitignored. The API refuses to start if its registry contains anything shaped like a raw key.
- **Never record a synthetic scenario review to make a check pass** (`--record-scenario-review` in `research/synthetic-ux/tools/`). That is a human review task.
- **Synthetic UX actors are isolated.** If you are asked to act as a persona, you receive only the actor packet and starting URL. Do not read facilitator material, acceptance criteria, this file's "current state" section or the delivery documents while acting. If a context has already seen those, label its results a *primed inspection*.
- **Frontend work is not done until the visual-polish pass is done and evidenced** (AGENTS.md). Backend-only work records the visual gate as "N/A, backend/CLI only" with that reason.
- **Raster images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`) go through Git LFS.** Install `git-lfs` before adding one. CI rejects a raw image. History before 8 November 2026 is unchanged, so its images stay raw in old commits and every cited SHA is still valid.
- **Use `Refs #N`, not `Closes #N`, in PRs.** Issues close only after the merged build has been verified and the evidence posted.
- **At most two active implementation issues at once**, and one branch owns the root `package.json` and `package-lock.json` at a time. #34 owns them until it merges or its claim is explicitly released.
- **Do not force-push or rebase someone else's branch.** Add commits on top. (Owner-requested fixes to Codex's PR #35 were done this way.)
- **Every commit and PR you create ends with the attribution lines your session's system reminder gives you** (`Co-Authored-By` and `Claude-Session`, or the Codex equivalent). Do not invent them from memory; copy them from the reminder in your own session.

## 3. Current state (6 November 2026)

### Merged on `main`

| Work | Issue | PR / merge | What it is |
| --- | --- | --- | --- |
| Design system, mock-ups, brand kit, primary-action and disclosure fixes, automated accessibility pass | #8, #9 (partial), #17, #20 | #17, #20 | Versioned exports under `design/`; renderer and checker under `design/tools/` |
| Verified offline fonts and typography polish | #22 | #32 → `1a38f4a` | Pinned Fontsource packages inlined into renders; painted-glyph verification; brand sheet, table date and placeholder fixes |
| Fixture-only NestJS API, contracts and generated client (slice 1A-0) | #24 | #33 → `8e03447` | See section 5 |
| Retrospective, #8 approval record, next-work sequence | #23 | #35 → `ab89aeb` | `docs/delivery/retrospectives/foundation-pr32-pr33.md`; the three design handoffs now say **Approved** |

**Owner design approval (#8) was granted on 6 November 2026** ([decision](https://github.com/nissan/oz-startup-brain/issues/8#issuecomment-6679674992)). It covers the committed design system, mock-ups and brand kit at `1a38f4a`. It does **not** cover implementation polish, accessibility evidence or user research; those stay separate gates.

### Open issues and their recorded status

| Issue | Status (Delivery block) | Notes |
| --- | --- | --- |
| #23 Iteration 01 hub | Ready (coordination) | Post completions and dispatches here |
| #34 Dependency advisories | Ready; proposed builder Claude, Codex reviews | Owns root manifest/lockfile until merged. See section 7 |
| #28 Source dispositions | Ready; proposed Codex | `data/sources/` and metadata only; no lockfile, API or contracts edits; Claude reviews |
| #25 Local fixture founder UI (Next.js + thin BFF) | Ready; proposed builder Claude, unclaimed | The next critical-path build. Package edits wait for #34 or an explicit handoff |
| #10 Shared evidence vocabulary | Ready, coordinated with #25 | The confirmed #25 builder owns `packages/contracts` edits until #25 merges |
| #9 Keyboard, screen-reader and zoom sessions | Ready | Needs a real screen reader and real browser zoom; automation cannot substitute |
| #26 First synthetic browser round | Blocked on #25 | Needs a pinned build URL, reset steps and verified task capabilities |
| #27 Fix and retest UX findings | Blocked on #26 | |
| #29 Live foundation epic | Backlog, decompose first | No paid calls or hosting until decomposed and gated |
| #30 Native GitHub Project | Blocked on access | The issue index is the board |

**Proposed lanes, not dispatches:** Claude builds #34 while Codex researches #28; each reviews the other. #25 follows #34's package edits. Nothing starts until the coordinator confirms a claim on the issue.

### Known follow-ups not yet in an issue

- The two Brand Sheet PNGs at `ab89aeb` were rendered with Chromium 153.0.8010.12; every other export is from the pinned 134.0.6998.35 (the pinned download was refused from the cloud session). A full regeneration on 134 will change only those two files' anti-aliasing. Recorded in `design/mockups/HANDOFF.md`.
- The Brand Sheet caption change and the #22 component refinements exist in the repository but have not been republished to the Claude Design canvas. `design/mockups/HANDOFF.md` explains how to reconcile before the next export.

## 4. Repository map

| Path | What it holds | Owner / tooling |
| --- | --- | --- |
| `apps/api/` | NestJS 11 fixture API (`src/`), fictional corpus (`fixtures/corpus.json`), Jest/supertest specs (`test/`), scripts (`dev-keys.ts`, `generate-openapi.ts`, `demo-fixture.mjs`) | Node 22.12+, npm 10; TypeScript 5.9.3 |
| `apps/web/` | Next.js 16 founder journey (slice 1A-UI): server-only BFF routes under `src/app/api/bff/`, pure envelope mapping in `src/lib/present.ts`, the design system wrapped as a module in `src/design-system/generated/` (drift-checked), BFF boundary tests in `test/`, Playwright journey/keyboard/fault/font tests in `e2e/`, final renders in `evidence/` | Node 22; `npm run web:start` needs `OZSB_API_BASE_URL` and `OZSB_API_KEY` |
| `packages/contracts/` | `schemas/v1.schema.json` (the single source of truth), generated types and ajv validators (`src/`), the OpenAPI compatibility checker (`src/compat.ts`, `scripts/check-compat.mjs`) | Regenerate with `npm run generate` |
| `packages/api-client/` | Client generated from `docs/api/openapi.json` (openapi-typescript + openapi-fetch) and the standalone fixture CLI | |
| `docs/api/` | `openapi.json` (generated), `openapi.v1.baseline.json` (frozen v1), `README.md` (how to run and what the API does) | |
| `docs/dependency-advisories.md` | Every `npm audit` finding against the lockfile: path, reachability, disposition, re-check trigger | Update whenever `package-lock.json` changes |
| `docs/decisions/` | ADR 001 (API-first NestJS, credentials, budget, MCP later) and ADR 002 (decision models; separate later increment) | |
| `docs/delivery/` | Delivery home, backlog, iteration, agent workflow, retrospectives | |
| `docs/06-delivery.md` | Roadmap and release gates, including the harness-control rules | |
| `docs/ux/` | Research, storyboards, the visual-quality standard | |
| `design/system/`, `design/mockups/`, `design/brand/` | Versioned exports of the Claude Design artifacts, each with a `HANDOFF.md` | Edit the artifact or the files, not both |
| `design/exports/` | Rendered PNGs and `font-verification.json` | Produced by `design/tools/render.py`; never hand-edit |
| `design/tools/` | Python renderer, accessibility checker, font verifier, their tests, `package.json` for pinned fonts/React | Python 3 + Playwright 1.51.0 |
| `features/` | Gherkin acceptance scenarios (`founder-journeys.feature`, `api-access.feature`); scenario IDs like SC22, API10 refer here | |
| `research/synthetic-ux/` | Persona pack, runbook, facilitator and actor material, validator | Actor isolation applies |
| `.github/workflows/checks.yml` | CI: persona-pack validator, design token/renderer checks, fixture-api job (with a non-blocking audit), founder-ui job (build, BFF tests, Playwright) | |
| `.github/pull_request_template.md` | Fill every section | |

## 5. The fixture API in one page

Everything below is documented in full in `docs/api/README.md`; this is the summary a session needs before touching it.

- **Endpoints:** `POST /v1/queries` (`query:execute`), `GET /v1/capabilities` (`capabilities:read`), `GET /v1/sources/{sourceId}` (`sources:read`), `GET /health/live` (public).
- **Auth:** header `X-API-Key: ozsb_<key_id>_<secret>`. Missing, invalid, expired and revoked keys all get the same generic 401; wrong scope gets 403. These run before the body is validated, admitted or retrieved.
- **Statuses:** `answer`, `clarification` and `insufficient_evidence` are all HTTP 200. Errors use the `ErrorResponse` shape with a server-generated `request_id` (also in the `X-Request-Id` header).
- **Only one mode exists:** `OZSB_RESPONDER=fixture` with `OZSB_CREDENTIAL_MODE=development`. Any other value, or `VERCEL`, `VERCEL_ENV` or `NODE_ENV=production` being set, makes the process refuse to start (exit 2).
- **Clock:** pinned `as_of` of `2026-11-05T00:00:00Z`. The currency rule tests effective dates first (historical, future-effective), then freshness (unverified), then current. A future-effective or historical claim is never one of today's actions or prerequisites, whatever its freshness. Stale evidence is labelled "Needs a current check" and the summary never asserts it is current.
- **Harness controls** (test clock and the faults `vector_timeout`, `budget_exhausted`, `graph_unavailable`) exist only in-process, through `HarnessControls.set()`/`reset()`. They require `OZSB_HARNESS_CONTROLS=enabled`, `OZSB_HARNESS_ENV=isolated-local-test` and a loopback host, or startup is refused. There is no HTTP way to set them; do not add one.
- **Source IDs** match `^src_[a-z0-9_]+$` everywhere (path parameter, citations, source records, corpus loader).
- **Contract protection (API10):** `npm run check:compat` compares `docs/api/openapi.json` with the frozen `openapi.v1.baseline.json` and fails on anything that could break a v1 client, including constraints written beside an unchanged `$ref`. v1 response schemas are closed, so even an added optional response field is breaking. Only refresh the baseline deliberately, after running the check against the old one and saying so in the PR.
- **Corpus is fictional**, uses `.invalid` URLs, and is never advice. Topics with a `summary_base` must also have a `summary_base_unverified`.

## 6. Commands that are known to work

Run from the repository root unless stated. Use `npm run -s …` when you capture output, or npm's banner lands in the captured text.

```sh
# API, contracts, client
npm ci                       # always from the lockfile; never `npm install` in CI-equivalent checks
npm run build
npm run typecheck            # builds first (api tests import the built client)
npm test                     # contracts 24, api-client 4, api 80 = 108 at ab89aeb
npm run check:generated      # regenerates types/OpenAPI/client, fails on any diff
npm run check:compat
npm run demo:fixture         # builds, starts the API on a free loopback port with an in-memory key, runs the standalone client (9 checks), stops
export OZSB_API_KEY=$(npm run -s dev:keys)   # prints the raw key once; stores only the digest
npm run -s api:start                          # http://127.0.0.1:3000
npm run -s client:fixture -- --question "Is round A1 open?" --jurisdiction QLD

# Founder journey UI (apps/web)
OZSB_API_BASE_URL=http://127.0.0.1:3000 OZSB_API_KEY=$OZSB_API_KEY npm run web:start   # http://127.0.0.1:3100, API must be running
npm test -w @ozsb/web            # BFF boundary tests; spawn the built API, so build first
npx playwright install --with-deps chromium   # once per machine (CI does this); the cloud session already has a matching browser
npm run e2e -w @ozsb/web         # starts four API/app pairs (plain + each fault) on 3110-3113 / 3910-3913; needs `next build`
OSB_EVIDENCE_DIR=evidence npm run e2e -w @ozsb/web   # from apps/web: regenerate the committed renders

# Design renders and checks (Python)
python -m venv /tmp/osb-venv && /tmp/osb-venv/bin/pip install playwright==1.51.0
/tmp/osb-venv/bin/python -m playwright install chromium      # pinned Chromium 134; may be blocked, see section 8
npm ci --prefix design/tools
export CHROME=<path to chromium>  OSB_RENDER_NODE_MODULES=$PWD/design/tools/node_modules
/tmp/osb-venv/bin/python design/tools/render.py design/tools/node_modules <output dir>   # render to a scratch dir, then copy only what you changed
/tmp/osb-venv/bin/python -m unittest discover -s design/tools -p 'test_*.py'
python design/tools/tokens_css.py --check

# Persona pack
python research/synthetic-ux/tools/validate_pack.py        # read-only; never with --record-scenario-review
python -m unittest discover -s research/synthetic-ux/tools -p 'test_*.py'
```

**Before any PR**, reproduce CI from a clean tree: delete `node_modules` and every `dist/`, run `npm ci`, then the checks above in that order. The first #33 head failed CI because typecheck had only passed locally against stale build output.

## 7. GitHub from an agent session

Claude Code cloud sessions cannot use GitHub's GraphQL API, so `gh pr create`, `gh pr review`, `gh pr merge` and `gh pr view` fail with HTTP 403. Use the REST API through `gh api`:

```sh
# Read
gh api repos/nissan/oz-startup-brain/pulls/<n> -q '"\(.head.sha) \(.mergeable_state)"'
gh api repos/nissan/oz-startup-brain/pulls/<n>/files --paginate -q '.[].filename'
gh api repos/nissan/oz-startup-brain/issues/<n>/comments -q '.[] | "\(.user.login): \(.body)"'
gh api repos/nissan/oz-startup-brain/commits/<sha>/check-runs -q '.check_runs[] | "\(.name): \(.status) \(.conclusion)"'
gh api repos/nissan/oz-startup-brain/actions/jobs/<job id>/logs      # CI log for a failed job

# Write (only when the role calls for it)
gh api repos/nissan/oz-startup-brain/pulls -f base=main -f head=<branch> -f title='…' -F body=@body.md
gh api repos/nissan/oz-startup-brain/pulls/<n>/reviews -f commit_id=<sha> -f event=COMMENT -F body=@review.md   # never APPROVE for your own work
gh api repos/nissan/oz-startup-brain/issues/<n>/comments -F body=@comment.md
gh api -X PATCH repos/nissan/oz-startup-brain/issues/<n> -F body=@issue.md          # to update a Delivery block: fetch, edit, PATCH the whole body
gh api -X PUT repos/nissan/oz-startup-brain/pulls/<n>/merge -f sha=<head sha> -f merge_method=merge -f commit_title='…'   # owner instruction required
```

Other facts about these sessions:

- Every comment, review and merge made through the session's credentials appears under the owner's account (`nissan`). Say which agent and model wrote it in the comment body, with the run ID.
- Review threads, draft status and auto-merge have CCR routes (`/repos/{owner}/{repo}/pulls/{n}/ccr/…`); the 403 error message lists them.
- The clone may only fetch `main`, `docs/*`, `design/*` and `chore/*` branches. To work on another prefix add a refspec first, for example `git config --add remote.origin.fetch '+refs/heads/feat/*:refs/remotes/origin/feat/*'`, then `git fetch`. Without this, "unpushed commits" warnings can be false.
- To review a PR without disturbing your own branch, use a worktree: `git worktree add /home/claude/pr<n> <sha>`, and remove it afterwards.
- To wait for CI, poll `check-runs` in a loop until no run has `status != completed`; three jobs are expected.
- Before merging, confirm `main` has not advanced past the PR's base; after merging, fetch the merge commit and check its tree equals the reviewed head's tree (`git rev-parse <sha>^{tree}`), then run the relevant checks on it.

## 8. Environment limits seen so far

| Limit | Seen where | What to do |
| --- | --- | --- |
| `cdn.playwright.dev` and `playwright.download.prss.microsoft.com` refused | Claude cloud session | Pinned Chromium 134 cannot be downloaded. The session has Chrome for Testing 153 pre-installed at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`; renders made with it differ from the committed 134 renders by anti-aliasing only. State the browser version in any evidence, copy only the changed PNGs, and leave `font-verification.json` alone unless you regenerate everything on 134. The owner can allow those domains under Settings > Capabilities. |
| Outbound HTTPS only to package registries and GitHub | Claude cloud session | `curl`/`wget` to other sites fail; ask for files to be attached instead. |
| `tsx` IPC socket `EPERM` | Codex sandbox | `node --import tsx apps/api/scripts/generate-openapi.ts` from `apps/api` produced identical output; record the substitution separately from the literal CI command. |
| GitHub GraphQL 403 | Claude cloud session | Section 7. |
| Git LFS uploads refused (`github-cloud.s3.amazonaws.com`, `lfs.github.com`) | Claude cloud session | Raster images are stored with Git LFS (`.gitattributes`, from 8 November 2026), and this workspace cannot push them. Hand screenshots to Nissan or Loki to commit, and say so in the PR; do not commit raw images (the `lfs-images` CI job fails). Clones here get pointers, which `verify-evidence.py` and `scripts/check-lfs-images.py` still verify by hash. |
| Nested `npm run` swallows `--flags` and prints banners | Any | Root scripts call `node`/`tsx` directly; use `npm run -s`. |
| Foreground `sleep` is blocked in Claude Code | Claude cloud session | Use an `until … ; do sleep 15; done` loop inside one command, or background the wait. |

## 9. Lessons that cost time (keep them)

The full list with evidence is in the [retrospective](docs/delivery/retrospectives/foundation-pr32-pr33.md) and in `docs/delivery/agent-workflow.md`. The short version:

1. A passing local run on stale build output is not CI. Clean tree first.
2. For every review finding, keep the reproduction and show the new test fails on the old code before it passes on the new.
3. Temporal logic: test both sides of every boundary (freshness window edge, effective date, verification date after `as_of`) and read the whole response: claims, actions, prerequisites, summary and warnings must agree. Assert that forbidden wording is absent, not just that a caveat is present.
4. Contract checks must cover operation schemas, parameters, security, referenced components and the constraints written beside a `$ref`; prove a break with the real validator.
5. Validate input before mutating state (harness `set()` is atomic for this reason).
6. One canonical status per issue; recheck `main` before merging; identify the resulting merge commit.
7. A lockfile is reproducibility evidence, not a permanent security verdict. Record audit time, dependency paths and reachability in `docs/dependency-advisories.md`; never force a major upgrade just to get a green audit. In #34, with npm 10.9.9 and this lockfile, adding `overrides` did not change packages the lockfile already resolved (observed behaviour in that experiment, not a documented npm guarantee); `npm update --package-lock-only <pkg>` recomputed just those entries. Whatever command you use, check the lockfile diff is limited to the intended packages and re-run the audit.
8. Intended fonts change wrapping and expose what fallback fonts hid. Verify painted fonts, then do the art-direction pass; keep owner taste decisions separate from defects.

## 10. Fresh-session prompts

Use one of these verbatim as the first message of a new session, replacing the bracketed parts. They assume a Claude Opus or Sonnet model (or Codex); nothing in them depends on the model that wrote this file.

### Builder for #34 (dependency advisories)

```text
Work in nissan/oz-startup-brain on branch main. Read HANDOVER.md fully, then AGENTS.md,
docs/delivery/README.md and docs/delivery/agent-workflow.md. Then read issue #34 and every
comment on it, and the #35 retrospective's audit section.
Role: builder for #34. Model: [opus|sonnet]. Run ID: claude-34-[YYYYMMDD-HHMM].
Base: current main (record its SHA). Branch: fix/34-dependency-advisories.
Post the claim comment on #34 using the template in docs/delivery/agent-workflow.md and wait
for the coordinator to confirm before editing.
Scope: only #34's acceptance. You own the root package.json and package-lock.json while this
is open. Choose one remedy and justify it; keep the lockfile diff to the affected packages;
run npm audit before and after and record date, paths and reachability; keep
docs/api/openapi.json unchanged. From a clean tree run: npm ci, check:generated,
check:compat, typecheck, npm test (expect 108), demo:fixture (expect 9/9).
Open the PR with `Refs #34` and the full PR template; visual gate N/A (backend only).
Post the handoff on #34 and #23. Do not merge; do not call your own review independent.
```

### Builder for #25 (local fixture founder UI)

```text
Work in nissan/oz-startup-brain on branch main. Read HANDOVER.md fully, then AGENTS.md,
docs/ux/visual-quality.md, docs/delivery/README.md, docs/delivery/agent-workflow.md,
docs/api/README.md, and the three design/*/HANDOFF.md files. Then read issue #25 (all
comments, including "Review lessons to apply"), #10, and the #35 retrospective.
Role: builder for #25. Model: [opus|sonnet]. Run ID: claude-25-[YYYYMMDD-HHMM].
Base: current main (record its SHA). Branch: feat/25-fixture-ui.
Confirm with the coordinator on #25 that #34's package edits have merged or that its claim is
released to you before touching package.json or package-lock.json. Post the claim and wait.
Build apps/web as a thin Next.js BFF over the generated client; the backend key never reaches
the browser; no business rules in Next.js; local-only fixture mode clearly labelled; no
configurable faults or dev credentials in any public preview. Implement exactly #25's
acceptance list. Coordinate #10's vocabulary inside this increment (you own
packages/contracts edits until #25 merges). Test the real BFF/API boundary including
auth failures and freshness/effective-date boundaries.
Visual polish is mandatory: render at phone and desktop widths in both themes with verified
intended fonts, rank the biggest weaknesses, fix them, re-render, and put before/after
evidence, the exact build SHA and limitations in the PR.
Record for #26: pinned build URL/SHA, fixture reset steps, and which tasks (T01, T03, T05,
T13, T14, T15 variants) are supported. Never give a synthetic actor expected outcomes.
Open the PR with `Refs #25` and the full template. Post handoffs on #25 and #23. Do not merge.
```

### Reviewer (any PR)

```text
Work in nissan/oz-startup-brain. Read HANDOVER.md fully, AGENTS.md and
docs/delivery/agent-workflow.md (especially "Review and verification practices").
Role: independent reviewer of PR #[n] at head [sha]. Model: [opus|sonnet].
Disclose at the top of your review whether this context did any of the work under review.
Check out the exact head in a fresh clone or worktree. Reproduce the PR's own evidence from a
clean tree. Read every changed file. For each claim in the PR body, say what you checked and
what you found. Look specifically for: behaviour at boundaries, prohibited output that is
merely caveated rather than absent, contract changes not caught by check:compat, secrets,
and gaps between the PR text and the diff. Post the review as a COMMENT review via
`gh api repos/nissan/oz-startup-brain/pulls/[n]/reviews -f event=COMMENT`, with findings
ranked by severity and each with a location and reproduction. Do not approve, merge, or
update the issue's Delivery block; propose the next status instead.
```

### Verifier (after review sign-off, before or after merge)

```text
Work in nissan/oz-startup-brain. Read HANDOVER.md fully and docs/delivery/agent-workflow.md.
Role: verifier of issue #[n] / PR #[n] at head [sha]. Model: [opus|sonnet].
Fresh clone; do not reuse any working tree. Run the documented commands from a clean tree and
record runtime versions, each command and its result. Walk the issue's acceptance list item by
item and name the evidence for each. Try the documented manual path (for the API: dev:keys,
api:start, client:fixture, a curl query, a call with no key, and the startup guards). If the
PR has merged, confirm the merge commit's tree equals the reviewed head's tree and that CI
passed on the merge commit. Post the verification comment on the issue, propose the status
change, and say plainly whether the verification was independent.
```

## 11. If something here is wrong

Fix the live record first (the issue, the PR), then update this file in the same PR if the change is durable. Do not let this file become a second source of truth for status; it is a map, not the territory.
