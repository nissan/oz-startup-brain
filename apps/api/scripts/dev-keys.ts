/**
 * Issues a development API key for the local fixture API.
 *
 *   npm run dev:keys                                   # consumer "local-dev", all three scopes
 *   npm run dev:keys -- --consumer my-tool --scopes sources:read,capabilities:read
 *
 * The SHA-256 digest is appended to .ozsb/dev-keys.json (gitignored); the raw key is printed once and
 * stored nowhere. Lose it and issue another. Development keys are for a developer machine only.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { issueKey, parseRegistry, SCOPES, type Scope } from '../src/auth/dev-keys';
import { DEFAULT_DEV_KEYS_FILE, repoRoot } from '../src/config';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const consumer = arg('consumer') ?? 'local-dev';
const scopes = (arg('scopes')?.split(',') ?? [...SCOPES]) as Scope[];
for (const s of scopes) {
  if (!(SCOPES as readonly string[]).includes(s)) {
    console.error(`unknown scope ${s}; choose from ${SCOPES.join(', ')}`);
    process.exit(2);
  }
}
const file = join(repoRoot(), process.env.OZSB_DEV_KEYS_FILE ?? DEFAULT_DEV_KEYS_FILE);
const existing = existsSync(file) ? parseRegistry(readFileSync(file, 'utf8')) : [];
const { rawKey, record } = issueKey(consumer, scopes);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, `${JSON.stringify([...existing, record], null, 2)}\n`, { mode: 0o600 });
console.error(`Added key ${record.key_id} for consumer "${consumer}" (${scopes.join(', ')}) to ${file}.`);
console.error('The raw key is shown once, below. Keep it out of the repository and out of any browser bundle.');
console.log(rawKey);
