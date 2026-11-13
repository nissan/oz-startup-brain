/**
 * Administers the durable credential registry (issue 98). There is no HTTP surface for this.
 *
 *   OZSB_DATABASE_URL=postgres://... npm run keys -- migrate
 *   npm run keys -- issue --consumer website --scopes query:execute,sources:read,capabilities:read
 *   npm run keys -- rotate --consumer website          # second key, same scopes, same allowance
 *   npm run keys -- revoke-key --key 0123abcd4567
 *   npm run keys -- revoke-consumer --consumer website
 *   npm run keys -- list
 *
 * A raw key is printed once on stdout and stored nowhere: only its SHA-256 digest is kept. Put it
 * straight into the consumer's secret manager. Messages go to stderr and never include the
 * connection string.
 */
import { CredentialAdmin, migrate, registryPool } from '../src/auth/pg-registry';
import { SCOPES, type Scope } from '../src/auth/dev-keys';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function need(name: string): string {
  const v = arg(name);
  if (!v) fail(`--${name} is required`);
  return v;
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

function scopesArg(): Scope[] | undefined {
  const raw = arg('scopes');
  if (raw === undefined) return undefined;
  const scopes = raw.split(',') as Scope[];
  for (const s of scopes) if (!(SCOPES as readonly string[]).includes(s)) fail(`unknown scope ${s}; choose from ${SCOPES.join(', ')}`);
  return scopes;
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const url = process.env.OZSB_DATABASE_URL;
  if (!url) fail('OZSB_DATABASE_URL is required');
  const pool = registryPool(url, { schema: process.env.OZSB_DATABASE_SCHEMA, statementTimeoutMs: 15_000, connectionTimeoutMs: 10_000 });
  const admin = new CredentialAdmin(pool);
  try {
    switch (command) {
      case 'migrate': {
        const applied = await migrate(pool);
        console.error(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date.');
        break;
      }
      case 'issue':
      case 'rotate': {
        const consumer = need('consumer');
        const expires = arg('expires') ?? null;
        if (expires !== null && Number.isNaN(Date.parse(expires))) fail('--expires must be an ISO 8601 instant');
        const issued = command === 'issue' ? await admin.issue(consumer, scopesArg() ?? [...SCOPES], expires) : await admin.rotate(consumer, scopesArg(), expires);
        console.error(`${command === 'issue' ? 'Issued' : 'Rotation: issued a second'} key ${issued.keyId} for consumer "${issued.consumerId}" (${issued.scopes.join(', ')})${issued.expiresAt ? `, expiring ${issued.expiresAt}` : ''}.`);
        if (command === 'rotate') console.error('Both keys now work and share one allowance. Switch the consumer, then revoke the old key with revoke-key.');
        console.error('The raw key is shown once, below. Keep it out of the repository and out of any browser bundle.');
        console.log(issued.rawKey);
        break;
      }
      case 'revoke-key': {
        const key = need('key');
        console.error((await admin.revokeKey(key)) ? `Key ${key} is revoked; its next request fails.` : `No active key ${key}.`);
        break;
      }
      case 'revoke-consumer': {
        const consumer = need('consumer');
        console.error((await admin.revokeConsumer(consumer)) ? `Consumer "${consumer}" and all its keys are revoked.` : `No active consumer "${consumer}".`);
        break;
      }
      case 'list':
        console.table(await admin.list());
        break;
      default:
        fail('usage: keys <migrate|issue|rotate|revoke-key|revoke-consumer|list> [--consumer id] [--scopes a,b] [--expires instant] [--key id]');
    }
  } catch (e) {
    // pg errors can carry the host; print only our own messages and the SQLSTATE of anything else.
    const code = (e as { code?: string }).code;
    fail(code ? `database error (${code})` : (e as Error).message);
  } finally {
    await pool.end();
  }
}

void main();
