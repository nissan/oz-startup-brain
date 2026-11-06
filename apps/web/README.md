# Founder journey UI (slice 1A-UI, local fixture mode)

A thin Next.js app over the fixture API (#24/#33): the browser talks only to same-origin BFF routes, which forward validated inputs to NestJS with a server-held key. Every answer, label, date and condition shown comes from the API's envelope; the UI holds no business rules. The corpus is fictional, and the page says so.

## Run it

Build everything once, start the API with a development key, then the app:

```sh
npm ci && npm run build
export OZSB_API_KEY=$(npm run -s dev:keys)
npm run -s api:start                           # http://127.0.0.1:3000
OZSB_API_BASE_URL=http://127.0.0.1:3000 OZSB_API_KEY=$OZSB_API_KEY npm run web:start   # http://127.0.0.1:3100
```

`npm run web:dev` runs the dev server with the same two variables. The key is read only in `src/lib/server/api.ts`; nothing is exposed through `NEXT_PUBLIC_`.

Questions the fixture corpus answers: "What should I do next for support?" (asks for jurisdiction once; Unknown is accepted and never re-asked), "Is round A1 open?" (a closed round), "Is round B1 open?" (stale evidence), "What does round A2 require today?" (a future-effective requirement). Anything else returns `insufficient_evidence`.

## What is where

| Path | Role |
| --- | --- |
| `src/app/api/bff/*` | Route handlers: `POST query`, `GET sources/{sourceId}`, `GET capabilities`. Thin wrappers over `src/lib/server/bff.ts`. |
| `src/lib/server/bff.ts` | Validates the body against the contract, forwards only `question` and `confirmed_context`, maps API errors to browser-facing ones (credential failures become a server-side 502, never a founder-facing 401) and never echoes the key. |
| `src/lib/present.ts` | Pure mapping from the envelope to component props: dates in full, evidence per step, sequence nodes, condition headings, failure panels. |
| `src/components/Journey.tsx` | UI state: draft question, confirmed context, last answer, selected step. Keeps the draft and labels the previous answer stale when a request fails. |
| `src/design-system/generated/` | The committed design system (`design/system/`) wrapped as a module by `scripts/sync-design-system.mjs`; drift-checked by `npm run check:generated`. Components are consumed as published, so the five evidence words have one source (#10). |
| `src/styles/fonts.css`, `public/fonts/` | Pinned Fontsource faces, synced at install by `scripts/sync-fonts.mjs`; same selection and alias as `design/tools/fonts.py`. |
| `test/` | Jest: the route handlers against a real fixture API process, including harness faults and moved clocks. |
| `e2e/` | Playwright: the journey, keyboard route, faults, stale labelling, painted fonts and layout at 1280 and 390 in both themes. |
| `evidence/` | The final renders from the browser tests at this commit (before/after sets live at their own commits; see the PR). |

## Harness faults and the clock

Faults (`vector_timeout`, `budget_exhausted`, `graph_unavailable`) and the pinned clock are API process configuration behind the startup guard (`docs/api/README.md`). The browser tests start one API per fault (`e2e/serve.mjs`). There is no page control, query parameter or header that selects them, and nothing in this app adds one.

## Checks

```sh
npm run typecheck -w @ozsb/web     # app, tests and e2e
npm test -w @ozsb/web              # needs apps/api built
npm run e2e -w @ozsb/web           # needs the app built; starts four API/app pairs on 3110–3113 / 3910–3913
OSB_EVIDENCE_DIR=evidence npm run e2e -w @ozsb/web   # regenerate the committed renders
```
