import request from 'supertest';
import { DevKeyRegistry, issueKey, parseRegistry } from '../src/auth/dev-keys';
import { InProcessBudget, secondsUntilNextUtcDay } from '../src/budget';
import { startApi, testKeys } from './helpers';

describe('in-process development budget', () => {
  it('denies the query after the daily allowance with 429 and retry information, per consumer', async () => {
    const keys = testKeys();
    const { app, rt } = await startApi({ OZSB_DEV_KEYS: JSON.stringify(keys.records), OZSB_DAILY_QUERY_ALLOWANCE: '2' });
    const q = (key: string) => request(app.getHttpServer()).post('/v1/queries').set('X-API-Key', key).send({ question: 'Is round A1 open?' });
    await q(keys.full).expect(200);
    await q(keys.full).expect(200);
    const denied = await q(keys.full).expect(429);
    expect(denied.body.error.code).toBe('budget_exhausted');
    expect(denied.body.error.retry_after_seconds).toBeGreaterThan(0);
    expect(denied.headers['retry-after']).toBeDefined();
    expect(await rt.budget.usage('tester')).toEqual({ admitted: 2, active: 0 });
    await q(keys.queryOnly).expect(200); // a different consumer has its own allowance
    // Rejected calls never count.
    await request(app.getHttpServer()).post('/v1/queries').send({ question: 'x' }).expect(401);
    expect((await rt.budget.usage('tester')).admitted).toBe(2);
    await app.close();
  });

  it('limits concurrency with leases, reclaims abandoned leases on expiry and resets daily', () => {
    let now = new Date('2026-11-05T10:00:00Z');
    const b = new InProcessBudget(10, 2, 30_000, () => now);
    const a1 = b.acquire('c');
    const a2 = b.acquire('c');
    expect('lease' in a1 && 'lease' in a2).toBe(true);
    expect(b.acquire('c')).toEqual({ denied: { code: 'concurrency_limited', retryAfterSeconds: 1 } });
    if ('lease' in a1) {
      a1.lease.release();
      a1.lease.release(); // idempotent
    }
    expect('lease' in b.acquire('c')).toBe(true);
    // Both remaining leases are abandoned; they are reclaimed once their lease expires.
    now = new Date('2026-11-05T10:00:31Z');
    expect('lease' in b.acquire('c')).toBe(true);
    expect(b.usageSync('c').admitted).toBe(4);
    now = new Date('2026-11-06T00:00:01Z');
    b.acquire('c');
    expect(b.usageSync('c').admitted).toBe(1);
  });

  it('computes retry-after to the next UTC day', () => {
    expect(secondsUntilNextUtcDay(new Date('2026-11-05T23:59:00Z'))).toBe(60);
  });
});

describe('development key registry', () => {
  it('issues ozsb_<key_id>_<secret> keys with a 256-bit secret and stores only the SHA-256 digest', () => {
    const { rawKey, record } = issueKey('consumer-a', ['query:execute']);
    expect(rawKey).toMatch(/^ozsb_[0-9a-f]{12}_[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(rawKey.split('_').slice(2).join('_'), 'base64url')).toHaveLength(32);
    expect(JSON.stringify(record)).not.toContain(rawKey.slice(-43));
    expect(record.digest_sha256).toMatch(/^[0-9a-f]{64}$/);
    const registry = new DevKeyRegistry(parseRegistry(JSON.stringify([record])));
    expect(registry.verifySync(rawKey)?.consumerId).toBe('consumer-a');
    expect(registry.verifySync(rawKey.slice(0, -1) + (rawKey.endsWith('A') ? 'B' : 'A'))).toBeNull();
    expect(registry.verifySync(undefined)).toBeNull();
  });

  it('treats expiry and revocation as of the wall clock', () => {
    const { rawKey, record } = issueKey('consumer-b', ['query:execute'], new Date('2026-01-01T00:00:00Z'), '2026-06-01T00:00:00Z');
    const registry = new DevKeyRegistry([record]);
    expect(registry.verifySync(rawKey, new Date('2026-05-31T00:00:00Z'))).not.toBeNull();
    expect(registry.verifySync(rawKey, new Date('2026-06-01T00:00:00Z'))).toBeNull();
    const revoked = new DevKeyRegistry([{ ...record, expires_at: null, revoked_at: '2026-04-01T00:00:00Z' }]);
    expect(revoked.verifySync(rawKey, new Date('2026-03-31T00:00:00Z'))).not.toBeNull();
    expect(revoked.verifySync(rawKey, new Date('2026-04-01T00:00:00Z'))).toBeNull();
  });
});
