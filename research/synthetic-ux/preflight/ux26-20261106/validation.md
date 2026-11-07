# Validation record

Target: `d3f54e887fb946bccf399f142791ed87e6be1b76`. Date: 7 November 2026 (Australia/Sydney).
Facilitator: Codex, run `ux26-20261106`. Facilitator-run checks, not independent runtime verification.

## Passing evidence

| Command / check | Observed result |
|---|---|
| Fresh clone, `git rev-parse HEAD` | Exact target SHA; clean source before checkpoint files |
| `node --version`; `npm --version` | v22.23.4; 10.9.9 |
| `npm ci --fetch-retries=0 --fetch-timeout=20000` under that toolchain | Clean locked install, 494 packages |
| `npm run build` | Contracts, generated client, NestJS and Next.js built; Next.js 16.4.2 |
| `npm run typecheck --workspaces --if-present` after build | All workspace typechecks passed |
| `npm run check:compat` | Current OpenAPI compatible with frozen v1 baseline |
| `npm test` | Contracts 24, client 4, API 80, web/BFF 19: **127 passed** |
| `node apps/api/scripts/demo-fixture.mjs` after successful build | **9/9** actual HTTP/contract checks passed |
| `python3 research/synthetic-ux/tools/validate_pack.py` | 8 profiles, 16 tasks, 20 variants, 22 capability IDs passed; no UX sessions |
| `python3 -m unittest discover -s research/synthetic-ux/tools -p 'test_*.py'` | **13 passed** |
| `python3 design/tools/tokens_css.py --check` | tokens.css matches tokens.json |

## Generated-file command substitution

Literal `npm run check:generated` did **not** pass: it reached the API OpenAPI step, then `tsx` failed to bind `/tmp/tsx-0/86.pipe` with `EPERM`.

Used the HANDOVER-documented substitute after the preceding contract generation/build had succeeded:

```sh
(cd apps/api && node --import tsx scripts/generate-openapi.ts)
npm run generate -w @ozsb/api-client
npm run generate -w @ozsb/web
git diff --exit-code -- packages/contracts/src/generated docs/api/openapi.json packages/api-client/src/generated apps/web/src/design-system/generated
```

The substitute succeeded and the generated paths had no diff. This is equivalent-artifact evidence, not a claim that the literal CI command passed.

Root `npm run typecheck` and `npm run demo:fixture` were not rerun redundantly: the successful build was followed by their workspace typecheck / demo entry points. Record these as the exact commands above.

## Blocked / failed setup checks

- Browser tool navigation to the local app: `net::ERR_CONNECTION_REFUSED`; no app DOM/screenshot observed.
- `npx playwright install chromium`: failed, invalid/truncated ZIP extraction. Requested Chromium 153.0.8010.12, v1243; this is an installer target, not an observed running-browser version.
- Browser e2e suite: **not run**, browser unavailable.
- Design Python regression invocation: **setup failed**. Python Playwright was absent and the design React/tool dependency directory was not configured. It did not run the advertised design test suite; no visual/renderer pass is claimed.
- Actual 200% zoom, screen reader, isolated actor browser contexts: **not demonstrated**.
- Initial transient Git/npm connectivity failures recovered. They are not continuing blockers.
- Earlier Node 24.22.1/npm 11.9.0 install was superseded by the clean Node 22/npm 10 install. It is not used as acceptance evidence.

## Evidence boundary

Passing deterministic tests establishes only the tested API/BFF/contract behavior. It does not establish browser task completion, fresh actor observations, visual polish, human comprehension, accessibility conformance, durable quotas, live RAG correctness or a successful hosted deployment.

No product changes were made. Visual-polish change gate: not applicable to documentation-only checkpoint; actual interface visual sign-off remains incomplete.

