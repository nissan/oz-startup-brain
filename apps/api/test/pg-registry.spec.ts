import { createHash } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CredentialAdmin, migrate, PgCredentialRegistry, registryPool } from '../src/auth/pg-registry';
import { RegistryUnavailable } from '../src/auth/registry';
import { ConfigError, loadConfig } from '../src/config';
import type { ApiRuntime } from '../src/runtime';
import { ALL_SCOPES, expectContract, startApi } from './helpers';
import { describePg, freshSchema, type TestSchema } from './pg';

/**
 * Issue 98: the durable credential registry against a real Postgres. features/api-access.feature
 * API04 (rotation shares one quota) and API05 (independent revocation), plus fail-closed behaviour.
 * Nothing here is mocked; the outage cases point a real pool at a port nothing listens on.
 */
const ask = { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } };
/** A syntactically valid URL to a loopback port with no listener. */
const DEAD_URL = 'postgres://nobody:not-a-real-password@127.0.0.1:9/none';

describePg('durable credential registry (Postgres)', () => {
  let db: TestSchema;
  let admin: CredentialAdmin;
  let registry: PgCredentialRegistry;

  beforeAll(async () => {
    db = await freshSchema();
    admin = new CredentialAdmin(db.pool);
    registry = new PgCredentialRegistry(db.pool);
  });
  afterAll(() => db.drop());

  it('verifies an issued key and returns its consumer, key ID and scopes', async () => {
    const issued = await admin.issue('reader', ['sources:read', 'capabilities:read']);
    expect(issued.rawKey).toMatch(/^ozsb_[a-z0-9]{12}_[A-Za-z0-9_-]{43}$/);
    const id = await registry.verify(issued.rawKey);
    expect(id).toEqual({ consumerId: 'reader', keyId: issued.keyId, scopes: new Set(['sources:read', 'capabilities:read']) });
  });

  it('refuses a wrong secret, an unknown key ID, a malformed string and a missing header, all the same way', async () => {
    const issued = await admin.issue('strict', ALL_SCOPES);
    const flipped = issued.rawKey.slice(0, -1) + (issued.rawKey.endsWith('A') ? 'B' : 'A');
    expect(await registry.verify(flipped)).toBeNull();
    expect(await registry.verify(issued.rawKey.replace(issued.keyId, 'ffffffffffff'))).toBeNull();
    expect(await registry.verify('not-a-key')).toBeNull();
    expect(await registry.verify(undefined)).toBeNull();
    // Another consumer's key ID with this consumer's secret is refused too.
    const other = await admin.issue('strict-other', ALL_SCOPES);
    expect(await registry.verify(issued.rawKey.replace(issued.keyId, other.keyId))).toBeNull();
  });

  it('stores only the SHA-256 digest: no row anywhere contains the raw key or its secret', async () => {
    const issued = await admin.issue('digest-only', ALL_SCOPES);
    const secret = issued.rawKey.split('_')[2];
    const dump = await db.pool.query<{ t: string }>(`SELECT row_to_json(k)::text AS t FROM ozsb_api_keys k UNION ALL SELECT row_to_json(c)::text FROM ozsb_consumers c`);
    const all = dump.rows.map((r) => r.t).join('\n');
    expect(all).not.toContain(secret);
    expect(all).not.toContain(issued.rawKey);
    expect(all).toContain(createHash('sha256').update(issued.rawKey, 'utf8').digest('hex'));
    // The listing an operator sees has no digest either.
    expect(JSON.stringify(await admin.list())).not.toMatch(/[0-9a-f]{64}/);
  });

  it('honours expiry by the caller\'s clock', async () => {
    const issued = await admin.issue('expiring', ALL_SCOPES, '2026-06-01T00:00:00Z');
    expect(await registry.verify(issued.rawKey, new Date('2026-05-31T23:59:59Z'))).not.toBeNull();
    expect(await registry.verify(issued.rawKey, new Date('2026-06-01T00:00:00Z'))).toBeNull();
  });

  it('revokes immediately, whatever the API server\'s clock says', async () => {
    const issued = await admin.issue('clock-skew', ALL_SCOPES);
    expect(await admin.revokeKey(issued.keyId)).toBe(true);
    // Even a server whose clock is a year behind the revocation refuses the key.
    expect(await registry.verify(issued.rawKey, new Date('2025-01-01T00:00:00Z'))).toBeNull();
    expect(await admin.revokeKey(issued.keyId)).toBe(false);
    expect(await admin.revokeKey('000000000000')).toBe(false);
  });

  it('rotation copies the newest active key\'s scopes and cannot widen them by default', async () => {
    const first = await admin.issue('narrow', ['sources:read']);
    const second = await admin.rotate('narrow');
    expect(second.keyId).not.toBe(first.keyId);
    expect((await registry.verify(second.rawKey))!.scopes).toEqual(new Set(['sources:read']));
    expect((await registry.verify(first.rawKey))!.consumerId).toBe('narrow');
  });

  it('refuses to rotate an unknown or revoked consumer, and never reuses a consumer ID', async () => {
    await expect(admin.rotate('nobody-here')).rejects.toThrow('no consumer nobody-here');
    const gone = await admin.issue('gone', ALL_SCOPES);
    expect(await admin.revokeConsumer('gone')).toBe(true);
    expect(await registry.verify(gone.rawKey)).toBeNull();
    await expect(admin.rotate('gone')).rejects.toThrow('consumer gone is revoked');
    await expect(admin.issue('gone', ALL_SCOPES)).rejects.toThrow('already exists');
    await expect(admin.issue('Bad Consumer', ALL_SCOPES)).rejects.toThrow('consumer id is invalid');
    await expect(admin.issue('no-scopes', [])).rejects.toThrow('scopes must be drawn from');
  });

  it('the database itself rejects a scope outside the three public ones', async () => {
    await db.pool.query(`INSERT INTO ozsb_consumers (consumer_id) VALUES ('sneaky')`);
    await expect(
      db.pool.query(`INSERT INTO ozsb_api_keys (key_id, consumer_id, digest_sha256, scopes) VALUES ('aaaaaaaaaaaa', 'sneaky', $1, ARRAY['admin:write'])`, ['0'.repeat(64)]),
    ).rejects.toThrow(/check constraint/);
  });

  it('migrations apply once, and concurrent runners do not interleave', async () => {
    expect(await migrate(db.pool)).toEqual([]);
    const fresh = await freshSchema({ migrated: false });
    try {
      // Three runners start together on an empty schema: exactly one applies the file, none fails.
      const results = await Promise.all([migrate(fresh.pool), migrate(fresh.pool), migrate(fresh.pool)]);
      expect(results.flat()).toEqual(['001_credential_registry.sql']);
      const names = await fresh.pool.query<{ name: string }>('SELECT name FROM ozsb_schema_migrations ORDER BY name');
      expect(names.rows.map((r) => r.name)).toEqual(['001_credential_registry.sql']);
    } finally {
      await fresh.drop();
    }
  });

  it('rejects with RegistryUnavailable, naming nothing, when the database cannot be reached', async () => {
    const dead = new PgCredentialRegistry(registryPool(DEAD_URL, { connectionTimeoutMs: 500 }));
    const key = (await admin.issue('outage', ALL_SCOPES)).rawKey;
    const err = await dead.verify(key).then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(RegistryUnavailable);
    expect((err as Error).message).toBe('credential registry unavailable');
    expect(await dead.describe()).toBe('registry not reachable at startup; requests are refused until it is');
    await dead.close();
  });
});

describePg('durable credential mode over HTTP', () => {
  let db: TestSchema;
  let admin: CredentialAdmin;
  let app: INestApplication;
  let rt: ApiRuntime;
  const http = () => request(app.getHttpServer());
  const query = (key: string) => http().post('/v1/queries').set('X-API-Key', key).send(ask);
  const env = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({ OZSB_CREDENTIAL_MODE: 'durable', OZSB_DATABASE_URL: db.url, OZSB_DATABASE_SCHEMA: db.schema, ...extra });

  beforeAll(async () => {
    db = await freshSchema();
    admin = new CredentialAdmin(db.pool);
    ({ app, rt } = await startApi(env({ OZSB_DAILY_QUERY_ALLOWANCE: '3' })));
  });
  afterAll(async () => {
    await app.close();
    await rt.close();
    await db.drop();
  });

  it('announces credential_mode: durable in capabilities, within the frozen contract', async () => {
    const key = (await admin.issue('caps', ALL_SCOPES)).rawKey;
    const res = await http().get('/v1/capabilities').set('X-API-Key', key).expect(200);
    expectContract('Capabilities', res.body);
    expect(res.body.credential_mode).toBe('durable');
    expect(res.body.budget_store).toBe('in_process_development');
  });

  it('API04: both keys of a rotation draw on one allowance; revoking the old one fails its next request and the new one carries on', async () => {
    const oldKey = await admin.issue('website', ALL_SCOPES);
    await query(oldKey.rawKey).expect(200);
    const newKey = await admin.rotate('website');
    // Rotation window: both keys work, and both count against the same consumer.
    await query(newKey.rawKey).expect(200);
    await query(oldKey.rawKey).expect(200);
    expect(rt.budget.usage('website').admitted).toBe(3);
    // The allowance of 3 is spent between them: a second key did not buy a second allowance.
    const over = await query(newKey.rawKey).expect(429);
    expect(over.body.error.code).toBe('budget_exhausted');
    // Revoke the old key: its very next request is the generic 401, on the same running process.
    expect(await admin.revokeKey(oldKey.keyId)).toBe(true);
    const refused = await query(oldKey.rawKey).expect(401);
    expectContract('ErrorResponse', refused.body);
    expect(refused.body.error).toMatchObject({ code: 'unauthenticated', message: 'A valid API key is required.' });
    // The new key still authenticates, and is still inside the original (spent) allowance.
    await http().get('/v1/capabilities').set('X-API-Key', newKey.rawKey).expect(200);
    await query(newKey.rawKey).expect(429);
    expect(rt.budget.usage('website').admitted).toBe(3);
  });

  it('API05: revoking consumer A fails A\'s next request and leaves consumer B working', async () => {
    const a = await admin.issue('consumer-a', ALL_SCOPES);
    const b = await admin.issue('consumer-b', ALL_SCOPES);
    await query(a.rawKey).expect(200);
    await query(b.rawKey).expect(200);
    expect(await admin.revokeKey(a.keyId)).toBe(true);
    expect((await query(a.rawKey).expect(401)).body.error.code).toBe('unauthenticated');
    await query(b.rawKey).expect(200);
    expect(rt.budget.usage('consumer-b').admitted).toBe(2);
    // Revoking the whole consumer cuts off every key it holds, and still only that consumer.
    const b2 = await admin.rotate('consumer-b');
    expect(await admin.revokeConsumer('consumer-b')).toBe(true);
    await query(b.rawKey).expect(401);
    await query(b2.rawKey).expect(401);
    const c = await admin.issue('consumer-c', ALL_SCOPES);
    await query(c.rawKey).expect(200);
  });

  it('still enforces scope: a key without query:execute gets 403 and starts no work', async () => {
    const reader = await admin.issue('reader-only', ['sources:read']);
    const before = rt.retriever.calls;
    expect((await query(reader.rawKey).expect(403)).body.error.code).toBe('insufficient_scope');
    expect(rt.retriever.calls).toBe(before);
  });

  it('fails closed when the registry is unreachable, with only documented statuses and no dependency detail; liveness stays up', async () => {
    const key = (await admin.issue('during-outage', ALL_SCOPES)).rawKey;
    const down = await startApi({ OZSB_CREDENTIAL_MODE: 'durable', OZSB_DATABASE_URL: DEAD_URL });
    try {
      const server = request(down.app.getHttpServer());
      // POST /v1/queries documents 503 in the frozen v1 contract, so the refusal says so.
      const q = await server.post('/v1/queries').set('X-API-Key', key).send(ask);
      expect(q.status).toBe(503);
      expect(q.body.error.code).toBe('dependency_unavailable');
      expect(q.headers['retry-after']).toBe('5');
      // The other two operations do not document 503 in v1; they refuse with the generic 500 they do document.
      const others = [await server.get('/v1/capabilities').set('X-API-Key', key), await server.get('/v1/sources/src_fixture_program_a').set('X-API-Key', key)];
      for (const res of others) {
        expect(res.status).toBe(500);
        expect(res.body.error.code).toBe('internal_error');
      }
      for (const res of [q, ...others]) {
        expectContract('ErrorResponse', res.body);
        expect(JSON.stringify(res.body)).not.toMatch(/127\.0\.0\.1|postgres|ECONN|not-a-real-password|nobody|:9\b/i);
      }
      // No work started for a caller nobody could authenticate.
      expect(down.rt.retriever.calls).toBe(0);
      expect(down.rt.budget.usage('during-outage').admitted).toBe(0);
      // A string that is not key-shaped needs no lookup and is still the generic 401.
      await server.get('/v1/capabilities').set('X-API-Key', 'nonsense').expect(401);
      await server.get('/v1/capabilities').expect(401);
      expect((await server.get('/health/live').expect(200)).body).toEqual({ status: 'ok' });
    } finally {
      await down.app.close();
      await down.rt.close();
    }
  });
});

describe('durable credential mode: configuration', () => {
  const durable = (extra: NodeJS.ProcessEnv): NodeJS.ProcessEnv => ({ OZSB_CREDENTIAL_MODE: 'durable', ...extra });
  const message = (env: NodeJS.ProcessEnv): string => {
    try {
      loadConfig(env);
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      return (e as Error).message;
    }
    throw new Error('expected a ConfigError');
  };

  it('requires OZSB_DATABASE_URL and names only the variable', () => {
    expect(message(durable({}))).toBe('OZSB_CREDENTIAL_MODE=durable requires OZSB_DATABASE_URL');
  });

  it('never echoes the connection string, even when it is malformed', () => {
    const m = message(durable({ OZSB_DATABASE_URL: 'mysql://admin:hunter2@db.internal/prod' }));
    expect(m).toBe('OZSB_DATABASE_URL must be a postgres:// or postgresql:// URL');
    expect(m).not.toMatch(/hunter2|db\.internal|admin/);
  });

  it('refuses ambiguous combinations instead of guessing a registry', () => {
    expect(message(durable({ OZSB_DATABASE_URL: DEAD_URL, OZSB_DEV_KEYS: '[]' }))).toContain('unset them when OZSB_CREDENTIAL_MODE=durable');
    expect(message({ OZSB_DEV_KEYS: '[]', OZSB_DATABASE_URL: DEAD_URL })).toContain('OZSB_CREDENTIAL_MODE is not "durable"');
    expect(message({ OZSB_CREDENTIAL_MODE: 'production' })).toBe('OZSB_CREDENTIAL_MODE must be "development" or "durable"');
    expect(message(durable({ OZSB_DATABASE_URL: DEAD_URL, OZSB_DATABASE_SCHEMA: 'Bad;Name' }))).toContain('OZSB_DATABASE_SCHEMA');
  });

  it('still refuses any public deployment while the responder is the fixture', () => {
    for (const extra of [{ VERCEL: '1' }, { VERCEL_ENV: 'preview' }, { NODE_ENV: 'production' }]) {
      expect(message(durable({ OZSB_DATABASE_URL: DEAD_URL, ...extra }))).toContain('never deployed publicly');
    }
  });

  it('accepts a durable configuration without touching the network, and holds no development keys', () => {
    const config = loadConfig(durable({ OZSB_DATABASE_URL: DEAD_URL, OZSB_DATABASE_SCHEMA: 'ozsb' }));
    expect(config).toMatchObject({ credentialMode: 'durable', devKeys: [], databaseSchema: 'ozsb', responder: 'fixture' });
  });
});
