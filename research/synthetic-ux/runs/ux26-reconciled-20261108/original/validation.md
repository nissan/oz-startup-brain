# Local verification — ux26-loki-20261107

Pinned checkout d3f54e887fb946bccf399f142791ed87e6be1b76, tree8bc14aef68ca54c8b0b79db7f8badfb703be8ae5. Disposable clean clone, repository hook and fsmonitor disabled on clone/status. Config inspection found expected global osxkeychain/store/GitHub gh helper; no repository includes, executable aliases, filters, monitoring hooks or protocol rewrites. No credentials printed.

Runtime Node22.23.0 (temporary official darwin-arm64 distribution), npm10.9.x bundled (exact version recorded separately), Playwright1.63.0 using installed Google Chrome156.0.8078.80. No browser or system package install needed.

Observed commands/results:
- npm ci --no-audit --no-fund: PASS, 492 packages.
- npm run build: PASS, all four workspaces, Next16.4.2.
- npm run check:compat: PASS against frozen v1 baseline.
- npm test: PASS127 = contracts24 + client4 + API80 + BFF19.
- npm exec -w @ozsb/web -- playwright test --config ux-loki.config.ts: PASS36/36, 49.2s, zero retries, desktop1280x900 and phone-emulated390x844. Existing regression suite, NOT36 actor sessions.

The temporary config imports committed playwright.config.ts, selects channel chrome for both projects, reuses the already running plain fixture server and places regression output in the workspace run folder. It does not change any application, fixture or acceptance test. Three fault API/web pairs are started by the existing runner. Their startup-configured faults are not the same-page T15 transition; passing these tests does not clear #42.

Checks were run by the facilitator, not independently rerun by the verifier. No claim of full CI reproduction: generated/typecheck/design suites not separately rerun for this evidence-only continuation. No product code changes. Tracked git diff remains empty. Chrome channel/version differs from the project's bundled Chromium CI runtime; this is explicitly a local alternative run.

Exact bundled npm version:10.9.8. Temporary runtime and Chrome remain local only. No downloaded browser installed. See raw immutable actor traces, joined trace-index, actor report and independent review.
