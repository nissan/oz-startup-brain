#!/usr/bin/env node
// One command for the whole standalone path: issue an ephemeral development key (held only in memory),
// start the built fixture API on a free loopback port, run the standalone fixture client against it
// over HTTP, then stop the API. Exit status is the client's. Run `npm run build` first (the root
// `demo:fixture` script does).
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const keyId = randomBytes(6).toString('hex');
const rawKey = `ozsb_${keyId}_${randomBytes(32).toString('base64url')}`;
const registry = [{
  key_id: keyId,
  consumer_id: 'demo-fixture-client',
  digest_sha256: createHash('sha256').update(rawKey).digest('hex'),
  scopes: ['query:execute', 'sources:read', 'capabilities:read'],
  created_at: new Date().toISOString(),
  expires_at: null,
  revoked_at: null,
}];

const port = await new Promise((resolve, reject) => {
  const s = createServer().listen(0, '127.0.0.1', () => {
    const { port: p } = s.address();
    s.close(() => resolve(p));
  });
  s.on('error', reject);
});

const { VERCEL, VERCEL_ENV, OZSB_HARNESS_CONTROLS, OZSB_HARNESS_ENV, OZSB_HARNESS_AS_OF, OZSB_HARNESS_FAULT, ...inherited } = process.env;
const api = spawn(process.execPath, [join(root, 'apps/api/dist/src/main.js')], {
  env: { ...inherited, PORT: String(port), OZSB_HOST: '127.0.0.1', OZSB_DEV_KEYS: JSON.stringify(registry) },
  stdio: ['ignore', 'inherit', 'inherit'],
});
const stop = () => api.exitCode === null && api.kill('SIGTERM');
process.on('exit', stop);

const baseUrl = `http://127.0.0.1:${port}`;
const deadline = Date.now() + 15_000;
for (;;) {
  if (api.exitCode !== null) {
    console.error(`fixture API exited early with status ${api.exitCode}`);
    process.exit(1);
  }
  try {
    const r = await fetch(`${baseUrl}/health/live`);
    if (r.ok) break;
  } catch {}
  if (Date.now() > deadline) {
    console.error('fixture API did not become live within 15 s');
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 150));
}

const client = spawn(process.execPath, [join(root, 'packages/api-client/dist/cli/fixture-client.js')], {
  env: { ...inherited, OZSB_API_BASE_URL: baseUrl, OZSB_API_KEY: rawKey },
  stdio: 'inherit',
});
const code = await new Promise((resolve) => client.on('exit', resolve));
stop();
process.exit(code ?? 1);
