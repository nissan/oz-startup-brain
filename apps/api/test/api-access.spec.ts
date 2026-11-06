import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { ApiRuntime } from '../src/runtime';
import { expectContract, harnessEnv, startApi, testKeys, type TestKeys } from './helpers';

/** features/api-access.feature: API01, API02, API03, API13 (fixture evidence). */
describe('API access (fixture mode)', () => {
  let app: INestApplication;
  let rt: ApiRuntime;
  let keys: TestKeys;
  const http = () => request(app.getHttpServer());
  const ask = { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } };

  beforeAll(async () => {
    keys = testKeys();
    ({ app, rt } = await startApi(harnessEnv(keys.records)));
  });
  afterAll(() => app.close());
  beforeEach(() => {
    rt.harness.reset();
    rt.retriever.calls = 0;
    rt.graph.calls = 0;
  });

  describe('API01: use the backend without Next.js', () => {
    it('answers a server client with no cookies with the documented envelope, preserving evidence, corpus version and warnings', async () => {
      const res = await http().post('/v1/queries').set('X-API-Key', keys.full).send(ask).expect(200);
      expect(res.headers['set-cookie']).toBeUndefined();
      expectContract('QueryEnvelope', res.body);
      expect(res.body.status).toBe('answer');
      expect(res.body.corpus_version).toBe('fixture-2026-11-05.1');
      expect(res.body.as_of).toBe('2026-11-05T00:00:00Z');
      expect(res.body.responder).toBe('fixture');
      expect(res.body.request_id).toBe(res.headers['x-request-id']);
      expect(res.body.warnings.map((w: { code: string }) => w.code)).toContain('fixture_corpus');
      // Every claim resolves to a citation, and every action's claims are in the envelope.
      const citationIds = new Set(res.body.citations.map((c: { citation_id: string }) => c.citation_id));
      const claimIds = new Set(res.body.claims.map((c: { claim_id: string }) => c.claim_id));
      for (const c of res.body.claims) for (const id of c.citation_ids) expect(citationIds.has(id)).toBe(true);
      for (const a of res.body.answer.actions) for (const id of a.claim_ids) expect(claimIds.has(id)).toBe(true);
      for (const c of res.body.citations) expect(c.canonical_url).toMatch(/\.invalid\//);
    });

    it('reports the development modes and pinned clock in capabilities', async () => {
      const res = await http().get('/v1/capabilities').set('X-API-Key', keys.full).expect(200);
      expectContract('Capabilities', res.body);
      expect(res.body).toMatchObject({
        credential_mode: 'development',
        responder: 'fixture',
        budget_store: 'in_process_development',
        clock: { mode: 'pinned', as_of: '2026-11-05T00:00:00Z' },
        coverage: { jurisdictions: ['QLD', 'national'], fictional: true },
        features: { graph: 'available', streaming: false, export: 'client_side', task_intent_field: false },
        harness_controls: true,
      });
    });

    it('serves liveness publicly with no detail', async () => {
      const res = await http().get('/health/live').expect(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('API02: reject unauthenticated requests before paid work', () => {
    const states: [string, () => string | undefined][] = [
      ['missing', () => undefined],
      ['invalid', () => 'ozsb_aaaaaaaaaaaa_' + 'A'.repeat(43)],
      ['malformed', () => 'Bearer something'],
      ['expired', () => keys.expired],
      ['revoked', () => keys.revoked],
    ];
    const endpoints: [string, string][] = [
      ['POST', '/v1/queries'],
      ['GET', '/v1/capabilities'],
      ['GET', '/v1/sources/src_progA_overview'],
    ];

    it.each(states)('returns the same generic 401 for a %s key on every business endpoint and starts no retrieval', async (_state, key) => {
      for (const [method, path] of endpoints) {
        let r = method === 'POST' ? http().post(path).send(ask) : http().get(path);
        const k = key();
        if (k !== undefined) r = r.set('X-API-Key', k);
        const res = await r.expect(401);
        expectContract('ErrorResponse', res.body);
        expect(res.body.error).toEqual({ code: 'unauthenticated', message: 'A valid API key is required.', request_id: res.headers['x-request-id'] });
      }
      expect(rt.retriever.calls).toBe(0);
      expect(rt.graph.calls).toBe(0);
      expect(rt.budget.usage('expired-consumer').admitted).toBe(0);
      expect(rt.budget.usage('revoked-consumer').admitted).toBe(0);
    });

    it('answers 401 rather than revealing body handling for an unauthenticated malformed or oversized body', async () => {
      await http().post('/v1/queries').set('Content-Type', 'application/json').send('{not json').expect(401);
      await http().post('/v1/queries').send({ question: 'x'.repeat(20_000) }).expect(401);
      expect(rt.retriever.calls).toBe(0);
    });
  });

  describe('API03: enforce operation scope', () => {
    it('returns 403 to a sources:read-only key on the query endpoint before any work', async () => {
      const res = await http().post('/v1/queries').set('X-API-Key', keys.sourcesOnly).send(ask).expect(403);
      expectContract('ErrorResponse', res.body);
      expect(res.body.error.code).toBe('insufficient_scope');
      expect(rt.retriever.calls).toBe(0);
      expect(rt.budget.usage('sources-reader').admitted).toBe(0);
    });

    it('ignores client-supplied scopes and consumer IDs in headers and body', async () => {
      const res = await http()
        .post('/v1/queries')
        .set('X-API-Key', keys.sourcesOnly)
        .set('X-Scopes', 'query:execute')
        .set('X-Consumer-Id', 'tester')
        .set('X-Session-Hint', 'forged')
        .send({ ...ask, consumer_id: 'tester', scopes: ['query:execute'] })
        .expect(403);
      expect(res.body.error.code).toBe('insufficient_scope');
      expect(rt.retriever.calls).toBe(0);
    });

    it('applies scope per operation', async () => {
      await http().get('/v1/sources/src_progA_overview').set('X-API-Key', keys.queryOnly).expect(403);
      await http().get('/v1/capabilities').set('X-API-Key', keys.sourcesOnly).expect(403);
      await http().get('/v1/sources/src_progA_overview').set('X-API-Key', keys.sourcesOnly).expect(200);
    });

    it('rejects a body with fields outside the contract once authorised (consumer_id is not a request field)', async () => {
      const res = await http().post('/v1/queries').set('X-API-Key', keys.full).send({ ...ask, consumer_id: 'someone-else' }).expect(400);
      expect(res.body.error.code).toBe('invalid_request');
      expect(res.body.error.details).toEqual([{ path: '/consumer_id', issue: 'is not an allowed property' }]);
      expect(rt.retriever.calls).toBe(0);
    });
  });

  describe('API13: gate source excerpts on rights status', () => {
    const cases: [string, string][] = [
      ['cleared', 'src_progA_overview'],
      ['not_reviewed', 'src_founder_guide'],
      ['rejected', 'src_rejected_mirror'],
    ];

    it.each(cases)('%s source: public metadata and canonical URL, gated excerpt, no snapshot or archive path', async (rights, id) => {
      const res = await http().get(`/v1/sources/${id}`).set('X-API-Key', keys.sourcesOnly).expect(200);
      expectContract('SourceRecord', res.body);
      expect(res.body.rights_status).toBe(rights);
      expect(res.body.canonical_url).toMatch(/^https:\/\/.+\.invalid\//);
      expect(res.body.fictional).toBe(true);
      if (rights === 'cleared') {
        expect(typeof res.body.excerpt).toBe('string');
        expect(res.body.excerpt.length).toBeGreaterThan(0);
        expect(res.body.excerpt.length).toBeLessThanOrEqual(res.body.excerpt_max_chars);
      } else {
        expect(res.body.excerpt).toBeNull();
      }
      const raw = JSON.stringify(res.body);
      expect(raw).not.toMatch(/snapshot|fixture-archive/);
      const source = rt.corpus.sources.find((s) => s.source_id === id)!;
      if (rights !== 'cleared') expect(raw).not.toContain(source.text.slice(0, 40));
    });

    it('returns 404 in the error shape for an unknown source', async () => {
      const res = await http().get('/v1/sources/src_nope').set('X-API-Key', keys.sourcesOnly).expect(404);
      expectContract('ErrorResponse', res.body);
      expect(res.body.error.code).toBe('not_found');
    });
  });

  describe('errors and request IDs', () => {
    it('never echoes a client-supplied request ID', async () => {
      const res = await http().get('/health/live').set('X-Request-Id', 'req_ffffffffffffffff').expect(200);
      expect(res.headers['x-request-id']).toMatch(/^req_[0-9a-f]{16}$/);
      expect(res.headers['x-request-id']).not.toBe('req_ffffffffffffffff');
    });

    it('returns 400 with details for an invalid request and 413 for an oversized one, once authenticated', async () => {
      const bad = await http().post('/v1/queries').set('X-API-Key', keys.full).send({ question: '', confirmed_context: { jurisdiction: 'Queensland' } }).expect(400);
      expectContract('ErrorResponse', bad.body);
      expect(bad.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(['/confirmed_context/jurisdiction', '/question']);
      const blank = await http().post('/v1/queries').set('X-API-Key', keys.full).send({ question: '   ' }).expect(400);
      expect(blank.body.error.details).toEqual([{ path: '/question', issue: 'must not be blank' }]);
      const notJson = await http().post('/v1/queries').set('X-API-Key', keys.full).set('Content-Type', 'application/json').send('{oops').expect(400);
      expect(notJson.body.error.code).toBe('invalid_request');
      const big = await http().post('/v1/queries').set('X-API-Key', keys.full).send({ question: 'x'.repeat(20_000) }).expect(413);
      expect(big.body.error.code).toBe('payload_too_large');
      expect(rt.retriever.calls).toBe(0);
    });

    it('returns the documented error shape, without internals, for an unknown route', async () => {
      const res = await http().get('/v1/admin').set('X-API-Key', keys.full).expect(404);
      expectContract('ErrorResponse', res.body);
      expect(JSON.stringify(res.body)).not.toMatch(/stack|Error:|\.ts|node_modules/);
    });
  });
});
