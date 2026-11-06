import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

/**
 * Starts the built fixture API as a separate process with an ephemeral in-memory development key,
 * the way scripts/demo-fixture.mjs does, so tests exercise the real HTTP boundary. Harness options
 * are passed through the guarded environment (isolated local test), never through HTTP.
 */
export interface ApiProcess {
  baseUrl: string;
  apiKey: string;
  stop(): Promise<void>;
}

const MAIN = join(__dirname, '..', '..', 'api', 'dist', 'src', 'main.js');

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer().listen(0, '127.0.0.1', () => {
      const address = s.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

export function issueKey(consumer = 'web-test'): { apiKey: string; registry: string } {
  const keyId = randomBytes(6).toString('hex');
  const apiKey = `ozsb_${keyId}_${randomBytes(32).toString('base64url')}`;
  const registry = JSON.stringify([
    { key_id: keyId, consumer_id: consumer, digest_sha256: createHash('sha256').update(apiKey).digest('hex'), scopes: ['query:execute', 'sources:read', 'capabilities:read'], created_at: new Date().toISOString(), expires_at: null, revoked_at: null },
  ]);
  return { apiKey, registry };
}

export async function startApi(options: { fault?: string; asOf?: string; dailyAllowance?: number } = {}): Promise<ApiProcess> {
  if (!existsSync(MAIN)) throw new Error(`fixture API is not built (${MAIN}); run \`npm run build\` at the repository root first`);
  const port = await freePort();
  const { apiKey, registry } = issueKey();
  const { VERCEL, VERCEL_ENV, NODE_ENV, OZSB_HARNESS_CONTROLS, OZSB_HARNESS_ENV, OZSB_HARNESS_AS_OF, OZSB_HARNESS_FAULT, ...inherited } = process.env;
  const env = { ...inherited, PORT: String(port), OZSB_HOST: '127.0.0.1', OZSB_DEV_KEYS: registry } as NodeJS.ProcessEnv;
  if (options.dailyAllowance !== undefined) env.OZSB_DAILY_QUERY_ALLOWANCE = String(options.dailyAllowance);
  if (options.fault || options.asOf) {
    env.OZSB_HARNESS_CONTROLS = 'enabled';
    env.OZSB_HARNESS_ENV = 'isolated-local-test';
    if (options.fault) env.OZSB_HARNESS_FAULT = options.fault;
    if (options.asOf) env.OZSB_HARNESS_AS_OF = options.asOf;
  }
  const child: ChildProcess = spawn(process.execPath, [MAIN], { env, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr?.on('data', (d) => (stderr += String(d)));
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`fixture API exited with ${child.exitCode}: ${stderr}`);
    try {
      const r = await fetch(`${baseUrl}/health/live`);
      if (r.ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`fixture API did not become live: ${stderr}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    baseUrl,
    apiKey,
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null) return resolve();
        child.once('exit', () => resolve());
        child.kill('SIGTERM');
      }),
  };
}
