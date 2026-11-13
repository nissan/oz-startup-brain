import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CredentialAdmin, registryPool } from '../src/auth/pg-registry';
import { BudgetUnavailable, secondsUntilNextUtcDay, type Admission } from '../src/budget-store';
import { PgBudgetStore, type PgBudgetOptions } from '../src/pg-budget';
import type { ApiRuntime } from '../src/runtime';
import { ALL_SCOPES, expectContract, startApi } from './helpers';
import { describePg, freshSchema, type TestSchema } from './pg';

/**
 * Issue 99: the atomic budget store against a real Postgres, with real concurrency.
 * features/api-access.feature API06 (budget across concurrent requests, abort, crash, late report)
 * and the budget half of API07 (fail closed). Nothing is mocked. Costs are fake units: no provider
 * is called anywhere.
 */
const DEAD_URL = 'postgres://nobody:not-a-real-password@127.0.0.1:9/none';
const T0 = new Date('2026-11-05T10:00:00Z');
const ask = { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } };

const admittedOf = <T extends { admission: Admission } | { denied: unknown }>(results: T[]) => results.filter((r): r is Extract<T, { admission: Admission }> => 'admission' in r);
const deniedOf = <T extends { admission: unknown } | { denied: { code: string; retryAfterSeconds: number } }>(results: T[]) =>
  results.filter((r): r is Extract<T, { denied: { code: string; retryAfterSeconds: number } }> => 'denied' in r).map((r) => r.denied);

describePg('atomic budget store (Postgres)', () => {
  let db: TestSchema;
  let now: Date;
  let n = 0;
  /** Each case uses its own consumer so cases cannot affect one another. */
  const consumer = () => `c${++n}`;
  const store = (o: Partial<PgBudgetOptions> = {}, pool = db.pool) =>
    new PgBudgetStore(pool, { dailyAllowance: 10, maxConcurrent: 100, leaseMs: 30_000, reconcileMs: 120_000, globalDailyAllowance: null, clock: () => now, ...o });
  const advance = (ms: number) => {
    now = new Date(now.getTime() + ms);
  };
  const admitOk = async (s: PgBudgetStore, c: string, reserve = 1): Promise<Admission> => {
    const r = await s.admit(c, `req_${Math.random().toString(36).slice(2)}`, reserve);
    if (!('admission' in r)) throw new Error(`expected admission, got ${JSON.stringify(r.denied)}`);
    return r.admission;
  };

  // A schema per case: the conservative sweep is store-wide, so cases must not share reservations.
  beforeEach(async () => {
    db = await freshSchema();
    now = new Date(T0);
  });
  afterEach(() => db.drop());

  it('API06: with allowance for one more, two concurrent requests admit exactly one and deny the other with reset information', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 3 });
    await admitOk(s, c);
    await admitOk(s, c);
    const results = await Promise.all([s.admit(c, 'req_a', 1), s.admit(c, 'req_b', 1)]);
    expect(admittedOf(results)).toHaveLength(1);
    expect(deniedOf(results)).toEqual([{ code: 'budget_exhausted', retryAfterSeconds: secondsUntilNextUtcDay(T0) }]);
    expect(secondsUntilNextUtcDay(T0)).toBe(14 * 3600);
    expect((await s.usage(c)).admitted).toBe(3);
  });

  it('OZ-99-S1: forty requests at once across two processes admit exactly the affordable seven', async () => {
    const c = consumer();
    const other = registryPool(db.url, { schema: db.schema });
    try {
      const a = store({ dailyAllowance: 7 });
      const b = store({ dailyAllowance: 7 }, other); // a second API process: its own pool, the same database
      const results = await Promise.all(Array.from({ length: 40 }, (_, i) => (i % 2 ? a : b).admit(c, `req_${i}`, 1)));
      expect(admittedOf(results)).toHaveLength(7);
      const denied = deniedOf(results);
      expect(denied).toHaveLength(33);
      expect(new Set(denied.map((d) => d.code))).toEqual(new Set(['budget_exhausted']));
      expect((await a.usage(c)).admitted).toBe(7);
      expect(await a.ledger(c)).toHaveLength(7);
    } finally {
      await other.end();
    }
  });

  it('never admits a reservation that would cross the allowance, whatever its size', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 10 });
    await admitOk(s, c, 8);
    expect(deniedOf([await s.admit(c, 'req_big', 3)])).toHaveLength(1); // 8 + 3 > 10
    await admitOk(s, c, 2); // 8 + 2 = 10 exactly
    expect(deniedOf([await s.admit(c, 'req_one', 1)])[0].code).toBe('budget_exhausted');
    await expect(s.admit(c, 'req_bad', 0)).rejects.toThrow('reserve must be a positive whole number');
    await expect(s.admit(c, 'req_bad', 1.5)).rejects.toThrow('reserve must be a positive whole number');
  });

  it('limits concurrency atomically: twenty at once with three slots admit exactly three', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 1000, maxConcurrent: 3 });
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => s.admit(c, `req_${i}`, 1)));
    const admitted = admittedOf(results);
    expect(admitted).toHaveLength(3);
    expect(deniedOf(results)).toEqual(Array.from({ length: 17 }, () => ({ code: 'concurrency_limited', retryAfterSeconds: 1 })));
    // A denied request reserved nothing.
    expect((await s.usage(c)).admitted).toBe(3);
    // Releasing a slot (twice, harmlessly) lets exactly one more in.
    await admitted[0].admission.release();
    await admitted[0].admission.release();
    expect(await s.usage(c)).toEqual({ admitted: 3, active: 2 });
    await admitOk(s, c);
    expect(deniedOf([await s.admit(c, 'req_x', 1)])[0].code).toBe('concurrency_limited');
  });

  it('API06 abort: the slot is reclaimed at lease expiry, and the reservation is not released with it', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 2, maxConcurrent: 1, leaseMs: 30_000, reconcileMs: 120_000 });
    await admitOk(s, c); // the client aborts: nothing releases the slot or reports usage
    expect(deniedOf([await s.admit(c, 'req_wait', 1)])[0].code).toBe('concurrency_limited');
    advance(29_999);
    expect(deniedOf([await s.admit(c, 'req_wait', 1)])[0].code).toBe('concurrency_limited');
    advance(1); // lease expiry
    expect(await s.usage(c)).toEqual({ admitted: 1, active: 0 });
    await admitOk(s, c); // the slot is free again
    // The aborted request's unit is still counted: the allowance of 2 is now spent.
    expect((await s.usage(c)).admitted).toBe(2);
    advance(30_000);
    expect(deniedOf([await s.admit(c, 'req_more', 1)])[0].code).toBe('budget_exhausted');
  });

  it('OZ-99-S2 crash: with no usage report the reservation is settled at the reserved amount exactly once', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 10 });
    const crashed = await admitOk(s, c, 4);
    expect((await s.ledger(c))[0]).toMatchObject({ status: 'open', reserved: 4, settled_amount: null, effective: 4 });
    advance(119_999);
    expect(await s.settleOverdue()).toBe(0); // not yet due
    advance(1);
    expect(await s.settleOverdue()).toBe(1);
    expect(await s.settleOverdue()).toBe(0); // exactly once
    expect(await s.ledger(c)).toEqual([expect.objectContaining({ reservation_id: crashed.reservationId, status: 'conservative', settled_amount: 4, late_reported: null, effective: 4 })]);
    // Remaining budget equals the allowance less the full reserved amount.
    expect((await s.usage(c)).admitted).toBe(4);
    await admitOk(s, c, 6);
    expect(deniedOf([await s.admit(c, 'req_over', 1)])[0].code).toBe('budget_exhausted');
  });

  it('settles an overdue reservation during the next admission too, without a separate sweep', async () => {
    const c = consumer();
    const s = store();
    await admitOk(s, c, 2);
    advance(120_000);
    await admitOk(s, c, 1);
    expect((await s.ledger(c)).map((r) => r.status)).toEqual(['conservative', 'open']);
  });

  it('OZ-99-S3 late report: recorded and credited at most once, and no allowance is released twice', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 10 });
    const a = await admitOk(s, c, 5);
    advance(120_000);
    await s.settleOverdue();
    expect((await s.usage(c)).admitted).toBe(5);
    // Ten copies of the late report arrive together, claiming different amounts.
    const outcomes = await Promise.all(Array.from({ length: 10 }, (_, i) => s.settle(a.reservationId, i)));
    expect(outcomes.filter((o) => o === 'late_report_applied')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'already_settled')).toHaveLength(9);
    const row = (await s.ledger(c))[0];
    expect(row.status).toBe('conservative');
    expect(row.settled_amount).toBe(5); // what was conservatively settled is kept on the ledger
    expect(row.effective).toBe(row.late_reported); // the one accepted report sets what counts
    const after = (await s.usage(c)).admitted;
    // A further report, much lower, changes nothing: the credit was given once.
    expect(await a.settle(0)).toBe('already_settled');
    expect((await s.usage(c)).admitted).toBe(after);
  });

  it('reconciles to reported usage once; repeats and a later sweep change nothing', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 10 });
    const a = await admitOk(s, c, 5);
    const outcomes = await Promise.all([a.settle(2), a.settle(3), a.settle(4), a.settle(5)]);
    expect(outcomes.filter((o) => o === 'reconciled')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'already_settled')).toHaveLength(3);
    const settled = (await s.ledger(c))[0];
    expect(settled.status).toBe('reconciled');
    expect([2, 3, 4, 5]).toContain(settled.settled_amount);
    advance(500_000);
    expect(await s.settleOverdue()).toBe(0);
    expect((await s.ledger(c))[0]).toEqual(settled);
    // Usage reported above the reservation is counted as reported, not capped at the reservation.
    const b = await admitOk(s, consumer(), 1);
    expect(await b.settle(3)).toBe('reconciled');
    expect(await s.settle('00000000-0000-4000-8000-000000000000', 1)).toBe('unknown');
    await expect(a.settle(-1)).rejects.toThrow('actual usage must be a whole number');
  });

  it('a report racing the conservative sweep settles each reservation exactly once, in either order', async () => {
    const c = consumer();
    const s = store({ dailyAllowance: 1000 });
    const admissions = await Promise.all(Array.from({ length: 12 }, () => admitOk(s, c, 3)));
    advance(120_000);
    const [, ...outcomes] = await Promise.all([s.settleOverdue(), ...admissions.map((a) => a.settle(1))]);
    for (const o of outcomes) expect(['reconciled', 'late_report_applied']).toContain(o);
    const rows = await s.ledger(c);
    expect(rows).toHaveLength(12);
    for (const r of rows) {
      // Whichever won, the reported usage of 1 is what counts, and it counts once.
      expect(r.effective).toBe(1);
      expect(r.status === 'reconciled' ? r.settled_amount : r.late_reported).toBe(1);
    }
    expect((await s.usage(c)).admitted).toBe(12);
  });

  it('keeps consumers separate, resets on the next UTC day, and enforces an optional cap across all consumers', async () => {
    const a = consumer();
    const b = consumer();
    const s = store({ dailyAllowance: 1 });
    await admitOk(s, a);
    expect(deniedOf([await s.admit(a, 'req', 1)])[0].code).toBe('budget_exhausted');
    await admitOk(s, b); // B is unaffected by A
    advance(14 * 3600 * 1000); // midnight UTC
    expect((await s.usage(a)).admitted).toBe(0);
    await admitOk(s, a);
    expect(await s.ledger(a, '2026-11-05')).toHaveLength(1);

    // A global cap: thirty requests from six consumers at once, room for five in total.
    const iso = await freshSchema();
    try {
      const capped = store({ dailyAllowance: 100, globalDailyAllowance: 5 }, iso.pool);
      const results = await Promise.all(Array.from({ length: 30 }, (_, i) => capped.admit(`g${i % 6}`, `req_${i}`, 1)));
      expect(admittedOf(results)).toHaveLength(5);
      expect(new Set(deniedOf(results).map((d) => d.code))).toEqual(new Set(['budget_exhausted']));
    } finally {
      await iso.drop();
    }
  });

  it('property: over 300 random concurrent operations, what counts against the allowance never exceeds it', async () => {
    const c = consumer();
    const allowance = 25;
    const s = store({ dailyAllowance: allowance, maxConcurrent: 6 });
    let seed = 20261113;
    const rand = (k: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % k;
    };
    const open: { a: Admission; reserved: number }[] = [];
    let ops = 0;
    let admitted = 0;
    while (ops < 300) {
      const batch = Array.from({ length: 1 + rand(6) }, () => rand(10));
      ops += batch.length;
      await Promise.all(
        batch.map(async (kind) => {
          if (kind < 5) {
            const reserved = 1 + rand(3);
            const r = await s.admit(c, `req_${ops}_${kind}`, reserved);
            if ('admission' in r) {
              admitted++;
              open.push({ a: r.admission, reserved });
            }
          } else if (kind < 8 && open.length) {
            const { a, reserved } = open.splice(rand(open.length), 1)[0];
            await a.settle(rand(reserved + 1)); // actual usage between zero and what was reserved
            await a.release();
          } else if (kind === 8) {
            await s.settleOverdue();
          } else {
            advance(rand(50_000));
          }
        }),
      );
      const usage = await s.usage(c);
      expect(usage.admitted).toBeLessThanOrEqual(allowance);
      expect(usage.active).toBeLessThanOrEqual(6);
      // Same UTC day throughout, so the sum of ledger entries is the whole story.
      const sum = (await s.ledger(c, '2026-11-05')).reduce((t, r) => t + r.effective, 0);
      expect(sum).toBeLessThanOrEqual(allowance);
      if (now.getTime() - T0.getTime() > 13 * 3600 * 1000) now = new Date(T0);
    }
    expect(admitted).toBeGreaterThan(10); // the run really exercised admission
  });

  it('OZ-99-S4: rejects with BudgetUnavailable, naming nothing, when the database cannot be reached', async () => {
    const dead = new PgBudgetStore(registryPool(DEAD_URL, { connectionTimeoutMs: 500 }), { dailyAllowance: 10, maxConcurrent: 4, leaseMs: 30_000, reconcileMs: 120_000, globalDailyAllowance: null });
    for (const attempt of [dead.admit('c', 'req', 1), dead.usage('c'), dead.settle('00000000-0000-4000-8000-000000000000', 1), dead.settleOverdue()]) {
      const err = await attempt.then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toBeInstanceOf(BudgetUnavailable);
      expect((err as Error).message).toBe('budget store unavailable');
    }
    await dead.close();
  });
});

describePg('durable budget over HTTP', () => {
  let db: TestSchema;
  let admin: CredentialAdmin;
  const apps: { app: INestApplication; rt: ApiRuntime }[] = [];
  const env = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
    OZSB_CREDENTIAL_MODE: 'durable',
    OZSB_DATABASE_URL: db.url,
    OZSB_DATABASE_SCHEMA: db.schema,
    OZSB_DAILY_QUERY_ALLOWANCE: '5',
    OZSB_MAX_CONCURRENT_QUERIES: '64',
    ...extra,
  });
  const urls: string[] = [];
  const query = (i: number, key: string) => request(urls[i]).post('/v1/queries').set('X-API-Key', key).send(ask);

  beforeAll(async () => {
    db = await freshSchema();
    admin = new CredentialAdmin(db.pool);
    // Two API processes' worth of runtime sharing one database: the cap has to hold across both.
    apps.push(await startApi(env()), await startApi(env()));
    // Real listening sockets on loopback, so thirty requests really are concurrent connections.
    for (const { app } of apps) {
      await app.listen(0, '127.0.0.1');
      urls.push(await app.getUrl());
    }
  });
  afterAll(async () => {
    for (const { app, rt } of apps) {
      await app.close();
      await rt.close();
    }
    await db.drop();
  });

  it('API06: thirty concurrent queries through two API processes start exactly the five the allowance covers', async () => {
    const key = (await admin.issue('burst', ALL_SCOPES)).rawKey;
    const before = apps[0].rt.retriever.calls + apps[1].rt.retriever.calls;
    const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => query(i % 2, key)));
    const ok = responses.filter((r) => r.status === 200);
    const limited = responses.filter((r) => r.status === 429);
    expect(ok).toHaveLength(5);
    expect(limited).toHaveLength(25);
    for (const r of limited) {
      expectContract('ErrorResponse', r.body);
      expect(r.body.error.code).toBe('budget_exhausted');
      expect(r.body.error.retry_after_seconds).toBeGreaterThan(0);
      expect(Number(r.headers['retry-after'])).toBe(r.body.error.retry_after_seconds);
    }
    for (const r of ok) expectContract('QueryEnvelope', r.body);
    // Work started only for the admitted five.
    expect(apps[0].rt.retriever.calls + apps[1].rt.retriever.calls - before).toBe(5);
    // The ledger has one settled entry per admitted request, keyed by that request's ID, and no slot is still held.
    const store = apps[0].rt.budget as PgBudgetStore;
    const ledger = await store.ledger('burst');
    expect(ledger.map((r) => r.request_id).sort()).toEqual(ok.map((r) => r.body.request_id as string).sort());
    expect(ledger.every((r) => r.status === 'reconciled' && r.settled_amount === 1 && r.effective === 1)).toBe(true);
    expect(await store.usage('burst')).toEqual({ admitted: 5, active: 0 });
  });

  it('a request refused before admission reserves nothing', async () => {
    const reader = (await admin.issue('refused', ['sources:read'])).rawKey;
    const full = (await admin.issue('refused-full', ALL_SCOPES)).rawKey;
    await query(0, reader).expect(403);
    await request(urls[0]).post('/v1/queries').set('X-API-Key', full).send({ question: '' }).expect(400);
    await request(urls[0]).post('/v1/queries').send(ask).expect(401);
    const store = apps[0].rt.budget as PgBudgetStore;
    expect(await store.ledger('refused')).toEqual([]);
    expect(await store.ledger('refused-full')).toEqual([]);
  });

  it('API07: when the budget store cannot be used, a query is refused with 503 and no work starts', async () => {
    const key = (await admin.issue('budget-down', ALL_SCOPES)).rawKey;
    const down = await startApi(env());
    try {
      await request(down.app.getHttpServer()).post('/v1/queries').set('X-API-Key', key).send(ask).expect(200);
      // The budget store's own connections go away; the credential registry is still reachable.
      await down.rt.budget.close();
      const calls = down.rt.retriever.calls;
      const res = await request(down.app.getHttpServer()).post('/v1/queries').set('X-API-Key', key).send(ask);
      expect(res.status).toBe(503);
      expectContract('ErrorResponse', res.body);
      expect(res.body.error.code).toBe('dependency_unavailable');
      expect(res.headers['retry-after']).toBe('5');
      expect(JSON.stringify(res.body)).not.toMatch(/pool|postgres|127\.0\.0\.1|ECONN/i);
      expect(down.rt.retriever.calls).toBe(calls);
      // Operations that cost nothing still work: only paid work is denied.
      await request(down.app.getHttpServer()).get('/v1/capabilities').set('X-API-Key', key).expect(200);
    } finally {
      await down.app.close();
      await down.rt.registry.close();
    }
  });
});
