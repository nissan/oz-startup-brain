import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigError, loadConfig } from '../src/config';
import { HarnessDisabledError } from '../src/harness';
import { ApiRuntime } from '../src/runtime';
import { expectContract, harnessEnv, startApi, testKeys } from './helpers';

const keys = testKeys();
const registry = JSON.stringify(keys.records);

describe('startup guard (docs/06-delivery.md, fixture-mode test controls)', () => {
  const reject = (env: NodeJS.ProcessEnv, message: RegExp) => {
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(message);
  };

  it('starts in the only supported mode with harness controls disabled by default', () => {
    const c = loadConfig({ OZSB_DEV_KEYS: registry });
    expect(c).toMatchObject({ responder: 'fixture', credentialMode: 'development', host: '127.0.0.1', harness: { enabled: false } });
  });

  it('rejects a responder or credential mode that slice 1A-0 does not implement', () => {
    reject({ OZSB_DEV_KEYS: registry, OZSB_RESPONDER: 'live' }, /OZSB_RESPONDER=live/);
    reject({ OZSB_DEV_KEYS: registry, OZSB_CREDENTIAL_MODE: 'durable' }, /OZSB_CREDENTIAL_MODE=durable/);
  });

  it.each([
    [{ VERCEL: '1' }, /Vercel/],
    [{ VERCEL_ENV: 'preview' }, /Vercel/],
    [{ NODE_ENV: 'production' }, /NODE_ENV=production/],
  ])('refuses development credential mode in a public deployment (%j)', (extra, message) => {
    reject({ OZSB_DEV_KEYS: registry, ...extra }, message);
    reject(harnessEnv(keys.records, extra), message);
  });

  it('rejects clock or fault overrides unless the harness is explicitly enabled', () => {
    reject({ OZSB_DEV_KEYS: registry, OZSB_HARNESS_AS_OF: '2026-12-02T00:00:00Z' }, /require OZSB_HARNESS_CONTROLS=enabled/);
    reject({ OZSB_DEV_KEYS: registry, OZSB_HARNESS_FAULT: 'vector_timeout' }, /require OZSB_HARNESS_CONTROLS=enabled/);
    reject({ OZSB_DEV_KEYS: registry, OZSB_HARNESS_CONTROLS: 'on' }, /require OZSB_HARNESS_CONTROLS=enabled/);
  });

  it('rejects enabled harness controls outside an isolated local test environment', () => {
    reject({ OZSB_DEV_KEYS: registry, OZSB_HARNESS_CONTROLS: 'enabled' }, /OZSB_HARNESS_ENV=isolated-local-test/);
    reject(harnessEnv(keys.records, { OZSB_HOST: '0.0.0.0' }), /loopback/);
    reject(harnessEnv(keys.records, { OZSB_RESPONDER: 'live' }), /OZSB_RESPONDER/);
    reject(harnessEnv(keys.records, { OZSB_CREDENTIAL_MODE: 'durable' }), /OZSB_CREDENTIAL_MODE/);
  });

  it('rejects malformed harness values', () => {
    reject(harnessEnv(keys.records, { OZSB_HARNESS_AS_OF: 'tomorrow' }), /ISO 8601/);
    reject(harnessEnv(keys.records, { OZSB_HARNESS_FAULT: 'disk_full' }), /OZSB_HARNESS_FAULT must be one of/);
  });

  it('refuses a registry that holds a raw key or is malformed, without echoing it', () => {
    const leaked = JSON.stringify([{ ...keys.records[0], digest_sha256: keys.full }]);
    let message = '';
    try {
      loadConfig({ OZSB_DEV_KEYS: leaked });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/raw API key/);
    expect(message).not.toContain(keys.full);
    reject({ OZSB_DEV_KEYS: '{}' }, /JSON array/);
    reject({ OZSB_DEV_KEYS: JSON.stringify([{ ...keys.records[0], scopes: ['admin'] }]) }, /scopes/);
    reject({ OZSB_DEV_KEYS_FILE: '/nonexistent/keys.json' }, /npm run dev:keys/);
  });

  it('applies configured limits, including the excerpt cap', async () => {
    const { app } = await startApi({ OZSB_DEV_KEYS: registry, OZSB_EXCERPT_MAX_CHARS: '60' });
    const res = await request(app.getHttpServer()).get('/v1/sources/src_prog_a_overview').set('X-API-Key', keys.full).expect(200);
    expect(res.body.excerpt_max_chars).toBe(60);
    expect(res.body.excerpt.length).toBeLessThanOrEqual(60);
    expect(res.body.excerpt.endsWith('…')).toBe(true);
    await app.close();
  });
});

describe('harness controls', () => {
  it('cannot change the clock or fault when the harness is disabled; capabilities say so', async () => {
    const { app, rt } = await startApi({ OZSB_DEV_KEYS: registry });
    expect(() => rt.harness.set({ fault: 'vector_timeout' })).toThrow(HarnessDisabledError);
    expect(() => rt.harness.set({ asOf: '2026-12-02T00:00:00Z' })).toThrow(HarnessDisabledError);
    const caps = await request(app.getHttpServer()).get('/v1/capabilities').set('X-API-Key', keys.full).expect(200);
    expect(caps.body.harness_controls).toBe(false);
    expect(caps.body.clock).toEqual({ mode: 'pinned', as_of: '2026-11-05T00:00:00Z' });
    await app.close();
  });

  it('has no HTTP surface: query parameters, headers and body fields cannot select a fault or clock', async () => {
    const { app } = await startApi(harnessEnv(keys.records));
    const res = await request(app.getHttpServer())
      .post('/v1/queries?fault=vector_timeout&as_of=2026-12-02T00:00:00Z')
      .set('X-API-Key', keys.full)
      .set('X-Ozsb-Fault', 'vector_timeout')
      .set('X-Ozsb-As-Of', '2026-12-02T00:00:00Z')
      .send({ question: 'Is round A1 open?' })
      .expect(200);
    expect(res.body.as_of).toBe('2026-11-05T00:00:00Z');
    expect(res.body.retrieval_mode).toBe('fixture');
    const body = await request(app.getHttpServer()).post('/v1/queries').set('X-API-Key', keys.full).send({ question: 'Is round A1 open?', as_of: '2026-12-02T00:00:00Z' }).expect(400);
    expect(body.body.error.details).toEqual([{ path: '/as_of', issue: 'is not an allowed property' }]);
    await app.close();
  });

  describe('enabled in an isolated local test process', () => {
    let app: INestApplication;
    let rt: ApiRuntime;
    const q = (question: string, confirmed_context?: object) =>
      request(app.getHttpServer()).post('/v1/queries').set('X-API-Key', keys.full).send(confirmed_context ? { question, confirmed_context } : { question });

    beforeAll(async () => {
      ({ app, rt } = await startApi(harnessEnv(keys.records)));
    });
    afterAll(() => app.close());
    afterEach(() => rt.harness.reset());

    it('vector_timeout: returns 504 retrieval_timeout with no answer', async () => {
      rt.harness.set({ fault: 'vector_timeout' });
      const res = await q('Is round A1 open?').expect(504);
      expectContract('ErrorResponse', res.body);
      expect(res.body.error.code).toBe('retrieval_timeout');
    });

    it('budget_exhausted: returns 429 with retry information before retrieval', async () => {
      rt.harness.set({ fault: 'budget_exhausted' });
      rt.retriever.calls = 0;
      const res = await q('Is round A1 open?').expect(429);
      expectContract('ErrorResponse', res.body);
      expect(res.body.error.code).toBe('budget_exhausted');
      expect(res.body.error.retry_after_seconds).toBeGreaterThan(0);
      expect(res.headers['retry-after']).toBe(String(res.body.error.retry_after_seconds));
      expect(rt.retriever.calls).toBe(0);
    });

    it('graph_unavailable: answers from passages only, omits the sequence and says so as a service warning', async () => {
      rt.harness.set({ fault: 'graph_unavailable' });
      const res = await q('What should I do next for support?', { jurisdiction: 'QLD' }).expect(200);
      expectContract('QueryEnvelope', res.body);
      expect(res.body.retrieval_mode).toBe('fixture_passages_only');
      expect(res.body.answer.prerequisite_sequence).toBeNull();
      expect(res.body.answer.actions.length).toBeGreaterThan(0);
      expect(res.body.warnings).toContainEqual(expect.objectContaining({ code: 'graph_unavailable', kind: 'service' }));
      const caps = await request(app.getHttpServer()).get('/v1/capabilities').set('X-API-Key', keys.full).expect(200);
      expect(caps.body.features.graph).toBe('unavailable');
    });

    it('the pinned clock drives the currency rule: before Round A1 closed it is a current, checkable action', async () => {
      rt.harness.set({ asOf: '2026-09-25T00:00:00Z' });
      // Fixture verification dates are after this as_of, so evidence is unverified at this instant and
      // the action is admitted only with "Needs a current check" — never as checked.
      const before = (await q('Is round A1 open?').expect(200)).body;
      expect(before.as_of).toBe('2026-09-25T00:00:00Z');
      expect(before.answer.actions.map((a: { action_id: string }) => a.action_id)).toContain('act_apply_a1');
      expect(before.answer.actions.every((a: { evidence_state: string }) => a.evidence_state === 'needs-check')).toBe(true);
      expect(before.warnings.map((w: { code: string }) => w.code)).not.toContain('closed_round');
    });

    it('the pinned clock moves stale evidence into the staleness window', async () => {
      rt.harness.set({ asOf: '2026-08-25T00:00:00Z' });
      const fresh = (await q('Is round B1 open?').expect(200)).body;
      expect(fresh.claims.find((c: { claim_id: string }) => c.claim_id === 'clm_b1_open').applicability).toBe('current');
      expect(fresh.answer.actions[0].evidence_state).toBe('checked');
    });

    it('reset() restores the pinned clock and clears the fault', async () => {
      rt.harness.set({ asOf: '2026-12-02T00:00:00Z', fault: 'vector_timeout' });
      await q('Is round A1 open?').expect(504);
      rt.harness.reset();
      expect(rt.harness.asOf()).toBe('2026-11-05T00:00:00Z');
      expect(rt.harness.currentFault()).toBe('none');
      const res = await q('Is round A1 open?').expect(200);
      expect(res.body.as_of).toBe('2026-11-05T00:00:00Z');
    });

    it('starts from a configured clock and fault and resets back to them', () => {
      const local = new ApiRuntime(loadConfig(harnessEnv(keys.records, { OZSB_HARNESS_AS_OF: '2026-08-25T00:00:00Z', OZSB_HARNESS_FAULT: 'graph_unavailable' })));
      expect(local.harness.asOf()).toBe('2026-08-25T00:00:00Z');
      local.harness.set({ asOf: '2026-11-05T00:00:00Z', fault: 'none' });
      local.harness.reset();
      expect(local.harness.asOf()).toBe('2026-08-25T00:00:00Z');
      expect(local.harness.currentFault()).toBe('graph_unavailable');
    });
  });
});
