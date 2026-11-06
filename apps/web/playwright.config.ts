import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against the built app and a real fixture API. Four server pairs run at once: the
 * plain fixture and one per harness fault, because faults are local process configuration, never
 * something a page can select. Run `npm run build` at the repository root first.
 */
const pairs = {
  fixture: { web: 3110, api: 3910, fault: 'none' },
  vector: { web: 3111, api: 3911, fault: 'vector_timeout' },
  budget: { web: 3112, api: 3912, fault: 'budget_exhausted' },
  graph: { web: 3113, api: 3913, fault: 'graph_unavailable' },
} as const;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: { trace: 'retain-on-failure', deviceScaleFactor: 1 },
  webServer: Object.values(pairs).map((p) => ({
    command: `node e2e/serve.mjs ${p.web} ${p.api} ${p.fault}`,
    url: `http://127.0.0.1:${p.web}/`,
    reuseExistingServer: false,
    timeout: 90_000,
  })),
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  metadata: pairs,
});
