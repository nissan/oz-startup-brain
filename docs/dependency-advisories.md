# Dependency advisories and dispositions

A lockfile is reproducibility evidence, not a permanent security verdict: advisories are published after versions are locked. This file records each `npm audit` finding against the root lockfile, where it enters the tree, whether the vulnerable code is reachable from this repository, and what was decided. Re-run the audit and update this table whenever `package-lock.json` changes and before any hosted or preview deployment.

How to audit:

```sh
rm -rf node_modules && npm ci
npm audit                 # everything, including development tooling
npm audit --omit=dev      # what a deployed API would carry
```

CI runs `npm audit --omit=dev --audit-level=moderate` in the `fixture-api` job as a **non-blocking** step (`continue-on-error`), so a newly published advisory shows as a warning on every PR without turning an unrelated change red. Treat a warning there as a prompt to update this file, not as something to silence.

## Current dispositions (6 November 2026, lockfile after #34)

| Advisory | Package and path | Severity | Reachable here? | Disposition | Re-check when |
| --- | --- | --- | --- | --- | --- |
| [GHSA-q7qp-rjg7-q26m](https://github.com/advisories/GHSA-q7qp-rjg7-q26m): multer denial of service through a pending async `fileFilter` after request teardown | `@nestjs/platform-express@11.2.8` pins `multer@2.4.0` | high | No. The API has no upload or multipart route and never registers a file interceptor. | **Fixed** by a root `overrides` entry pinning `multer` to `2.5.0` (published 22 October 2026, outside the advisory range `<2.5.0`). The lockfile diff is the one entry; multer 2.5.0 has the same dependencies as 2.4.0. Nest 12 would also fix it but is a major upgrade. | When `@nestjs/platform-express` 11.x ships a release that pins a fixed multer, drop the override. |
| [GHSA-r3ph-w7gj-g6xm](https://github.com/advisories/GHSA-r3ph-w7gj-g6xm): js-yaml `maxTotalMergeKeys` does not limit CPU use for empty merge sources | `@nestjs/swagger@11.4.7` pins `js-yaml@5.3.0` | moderate | No. Swagger uses js-yaml only to serve a YAML document from `SwaggerModule.setup`, which this API never calls; the OpenAPI JSON is generated at build time and checked in. | **Fixed** by a scoped `overrides` entry pinning `js-yaml` under `@nestjs/swagger` to `5.4.3` (published 5 October 2026; the advisory ends at 5.4.0). Scoped, not global, because the tree also holds js-yaml 3.x and 4.x for other tools, which must not be forced across a major version. `@nestjs/swagger@11.4.8` fixes it upstream but was published on 4 November 2026, two days before this change. This change deliberately pinned only releases at least two weeks old; that is a conservative choice made for this remediation, not an established project policy (no repository document sets a minimum package age). Swap to 11.4.8 in a later dependency pass and drop the override. | In the next dependency pass (11.4.8 reaches two weeks old on 18 November 2026). |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): deepmerge `mergeObject()` allows prototype poisoning | `jest@29.7.0` → `jest-cli` / `@jest/core` → `jest-config@29.7.0` → `deepmerge@4.3.1` (also reached through `ts-jest` and `create-jest`); 7 audit entries for one advisory | low | Not in any meaningful way. deepmerge is a development-only dependency used by Jest to merge configuration objects that come from this repository's own `package.json` files; nothing deployed includes it, and an attacker would need to commit a malicious Jest configuration. | **Accepted, development tooling only.** No fixed deepmerge exists (the advisory covers every 4.x release and 4.3.1 is the latest); npm's only offered "fix" is downgrading Jest to 25, which is not acceptable. `npm audit --omit=dev` reports 0 vulnerabilities. | When deepmerge publishes a fixed release or Jest moves off it. Revisit at the next Jest major. |

## History

| Date | Lockfile state | Audit result | Notes |
| --- | --- | --- | --- |
| 6 November 2026, before #33 merged (`8e1bff4`) | multer 2.4.0, js-yaml 5.3.0 | 4 entries: 2 high, 2 moderate | Found during post-merge verification of #33 (#24). Recorded in #34. |
| 6 November 2026, main `1a38f4a` | unchanged | 11 entries: 2 high, 2 moderate, 7 low | The 7 low entries are the deepmerge chain, published after the previous audit; recorded in the #35 retrospective and corrected in #34. |
| 6 November 2026, #34 | multer 2.5.0, js-yaml 5.4.3 under swagger | 7 low (deepmerge chain only); `--omit=dev`: 0 | This table. |
