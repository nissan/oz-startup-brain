#!/usr/bin/env node
// Starts one fixture API (optionally with a guarded harness fault or clock) and one built Next.js
// server pointed at it, for the Playwright projects. Usage: node e2e/serve.mjs <webPort> <apiPort> [fault] [asOf]
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [webPort, apiPort, fault, asOf] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const keyId = randomBytes(6).toString('hex');
const apiKey = `ozsb_${keyId}_${randomBytes(32).toString('base64url')}`;
const registry = JSON.stringify([{ key_id: keyId, consumer_id: 'web-e2e', digest_sha256: createHash('sha256').update(apiKey).digest('hex'), scopes: ['query:execute', 'sources:read', 'capabilities:read'], created_at: new Date().toISOString(), expires_at: null, revoked_at: null }]);
const { VERCEL, VERCEL_ENV, NODE_ENV, OZSB_HARNESS_CONTROLS, OZSB_HARNESS_ENV, OZSB_HARNESS_AS_OF, OZSB_HARNESS_FAULT, ...inherited } = process.env;
const apiEnv = { ...inherited, PORT: apiPort, OZSB_HOST: '127.0.0.1', OZSB_DEV_KEYS: registry };
if (fault || asOf) Object.assign(apiEnv, { OZSB_HARNESS_CONTROLS: 'enabled', OZSB_HARNESS_ENV: 'isolated-local-test', ...(fault && fault !== 'none' ? { OZSB_HARNESS_FAULT: fault } : {}), ...(asOf ? { OZSB_HARNESS_AS_OF: asOf } : {}) });
const api = spawn(process.execPath, [join(root, 'apps/api/dist/src/main.js')], { env: apiEnv, stdio: ['ignore', 'inherit', 'inherit'] });
const web = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'start', '--port', webPort, '--hostname', '127.0.0.1'], {
  cwd: join(here, '..'),
  env: { ...inherited, OZSB_API_BASE_URL: `http://127.0.0.1:${apiPort}`, OZSB_API_KEY: apiKey },
  stdio: ['ignore', 'inherit', 'inherit'],
});
const stop = () => {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
};
for (const sig of ['SIGINT', 'SIGTERM', 'exit']) process.on(sig, stop);
web.on('exit', (code) => { api.kill('SIGTERM'); process.exit(code ?? 0); });
api.on('exit', (code) => { if (code) { web.kill('SIGTERM'); process.exit(code); } });
