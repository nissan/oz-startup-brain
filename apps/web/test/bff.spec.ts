import { check } from '@ozsb/contracts';
import { resetApiClient } from '../src/lib/server/api';
import { handleCapabilities, handleQuery, handleSource } from '../src/lib/server/bff';
import { evidenceFor, failureView, sequenceNodes, serviceStatus, type Envelope } from '../src/lib/present';
import { startApi, type ApiProcess } from './api-process';

/**
 * The actual BFF/API boundary (#25): the route handlers run in this process against the real
 * fixture API in another, exactly as `next start` would call them. Nothing is mocked.
 */
const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://web.test/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

function pointAt(api: ApiProcess, apiKey = api.apiKey) {
  process.env.OZSB_API_BASE_URL = api.baseUrl;
  process.env.OZSB_API_KEY = apiKey;
  resetApiClient();
}

async function envelope(body: unknown): Promise<Envelope> {
  const res = await handleQuery(json(body));
  expect(res.status).toBe(200);
  const data = (await res.json()) as Envelope;
  expect(check('QueryEnvelope', data)).toEqual([]);
  return data;
}

describe('BFF over the fixture API', () => {
  let api: ApiProcess;
  beforeAll(async () => {
    api = await startApi();
    pointAt(api);
  });
  afterAll(() => api.stop());

  it('forwards a valid question and returns the contract-valid envelope with its request ID', async () => {
    const res = await handleQuery(json({ question: 'Is round A1 open?' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const data = (await res.json()) as Envelope;
    expect(check('QueryEnvelope', data)).toEqual([]);
    expect(res.headers.get('x-request-id')).toBe(data.request_id);
    expect(data.responder).toBe('fixture');
  });

  it('rejects malformed, over-long and off-contract bodies itself, before anything reaches the API', async () => {
    const notJson = await handleQuery(json('{nope'));
    expect(notJson.status).toBe(400);
    expect((await notJson.json()).error.code).toBe('bff_invalid_request');

    const big = await handleQuery(json({ question: 'x' }, { 'content-length': '999999' }));
    expect(big.status).toBe(413);

    // Client-supplied consumer IDs, scopes or keys are not request fields; they are rejected, not forwarded.
    const forged = await handleQuery(json({ question: 'Is round A1 open?', consumer_id: 'someone-else', scopes: ['query:execute'] }));
    expect(forged.status).toBe(400);
    const body = await forged.json();
    expect(body.error.code).toBe('bff_invalid_request');
    expect(body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(['/consumer_id', '/scopes']);
  });

  it('enforces the body limit on bytes actually received, not on Content-Length (review R39-2)', async () => {
    const streamed = (text: string) => {
      const bytes = new TextEncoder().encode(text);
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          for (let i = 0; i < bytes.length; i += 1000) controller.enqueue(bytes.slice(i, i + 1000));
          controller.close();
        },
      });
      // No Content-Length header: as a chunked request arrives.
      return new Request('http://web.test/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' } as RequestInit);
    };
    const question = JSON.stringify({ question: 'Is round A1 open?' });
    const over = await handleQuery(streamed(' '.repeat(20_000) + question));
    expect(over.status).toBe(413);
    expect((await over.json()).error.code).toBe('payload_too_large');
    // A false, small Content-Length does not let a large body through either.
    const lying = new Request('http://web.test/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '10' }, body: ' '.repeat(20_000) + question });
    expect((await handleQuery(lying)).status).toBe(413);
    // Padding under the limit is valid JSON and is answered.
    const under = await handleQuery(streamed(' '.repeat(10_000) + question));
    expect(under.status).toBe(200);
    expect((await under.json()).status).toBe('answer');
  });

  it('binds the documented web scripts to loopback only (review R39-1)', () => {
    const pkg = require('../package.json') as { scripts: Record<string, string> };
    for (const name of ['dev', 'start']) expect(pkg.scripts[name]).toMatch(/--hostname 127\.0\.0\.1(\s|$)/);
  });

  it('ignores identity headers from the browser; only the server key reaches the API', async () => {
    const res = await handleQuery(json({ question: 'Is round A1 open?' }, { 'x-api-key': 'ozsb_000000000000_' + 'A'.repeat(43), 'x-consumer-id': 'forged', 'x-session-hint': 'forged' }));
    expect(res.status).toBe(200);
  });

  it('never leaks the backend key or internals in any response', async () => {
    const responses = await Promise.all([
      handleQuery(json({ question: 'Is round A1 open?' })),
      handleQuery(json('{nope')),
      handleSource('src_prog_a_overview'),
      handleSource('src_nope'),
      handleCapabilities(),
    ]);
    for (const r of responses) {
      const text = await r.text();
      expect(text).not.toMatch(/ozsb_[a-z0-9]{8,32}_/);
      expect(text).not.toMatch(/stack|node_modules|\.ts:/);
      for (const [k, v] of r.headers) expect(`${k}: ${v}`).not.toContain(api.apiKey);
    }
  });

  it('turns a rejected server credential into a server-side error, not a founder-facing 401', async () => {
    pointAt(api, 'ozsb_000000000000_' + 'A'.repeat(43));
    const res = await handleQuery(json({ question: 'Is round A1 open?' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error.code).toBe('bff_upstream_credential');
    expect(JSON.stringify(body)).not.toContain('ozsb_000000000000');
    expect(failureView(502, body.error.code).kind).toBe('outage');
    pointAt(api);
  });

  it('reports an unreachable API as a service outage', async () => {
    process.env.OZSB_API_BASE_URL = 'http://127.0.0.1:9';
    resetApiClient();
    const res = await handleQuery(json({ question: 'Is round A1 open?' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe('bff_upstream_unreachable');
    pointAt(api);
  });

  it('serves source records with the rights gate intact and validates the ID shape', async () => {
    const cleared = await handleSource('src_prog_a_overview');
    expect(cleared.status).toBe(200);
    const c = await cleared.json();
    expect(check('SourceRecord', c)).toEqual([]);
    expect(typeof c.excerpt).toBe('string');
    const rejected = await handleSource('src_rejected_mirror');
    expect((await rejected.json()).excerpt).toBeNull();
    expect((await handleSource('src_nope')).status).toBe(404);
    expect((await handleSource('../etc/passwd')).status).toBe(400);
    expect((await handleSource('src_progA_overview')).status).toBe(400);
  });

  it('every citation in the fixture answers resolves through the BFF source route', async () => {
    const ids = new Set<string>();
    for (const body of [
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } },
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' } },
      { question: 'What does round A2 require today?' },
      { question: 'Is round A1 open?' },
      { question: 'Is round B1 open?' },
    ]) {
      for (const c of (await envelope(body)).citations) ids.add(c.source_id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(6);
    for (const id of ids) expect((await handleSource(id)).status).toBe(200);
  });

  it('shows explicit Unknown as never re-asked and names what was left out (SC22 at the boundary)', async () => {
    const asked = await envelope({ question: 'What should I do next for support?' });
    expect(asked.status).toBe('clarification');
    expect(asked.clarification?.field).toBe('jurisdiction');
    const unknown = await envelope({ question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' } });
    expect(unknown.status).toBe('answer');
    expect(unknown.unresolved_conditions.some((c) => c.reason === 'explicit_unknown' && /regional innovation hub/.test(c.text))).toBe(true);
    expect(unknown.answer?.actions.map((a) => a.action_id)).not.toContain('act_hub_session');
  });
});

describe('BFF with the API clock moved (freshness and effective-date boundaries through the real boundary)', () => {
  const cases: [string, string, 'checked' | 'needs-check'][] = [
    ['fresh, before the effective date', '2026-11-15T00:00:00Z', 'checked'],
    ['first stale day', '2026-11-16T00:00:00Z', 'needs-check'],
    ['stale, the day before the effective date', '2026-11-30T23:59:59Z', 'needs-check'],
  ];
  it.each(cases)('%s: the future requirement is dated, excluded, and the presented labels agree with the summary', async (_name, asOf, expected) => {
    const api = await startApi({ asOf });
    try {
      pointAt(api);
      const e = await envelope({ question: 'What does round A2 require today?' });
      const security = e.claims.find((c) => c.claim_id === 'clm_a2_security')!;
      expect(security.applicability).toBe('future_effective');
      expect(security.qualifier_text).toBe('Takes effect from 1 December 2026');
      expect(e.answer?.actions.map((a) => a.action_id)).not.toContain('act_a2_security_assessment');
      for (const a of e.answer!.actions) expect(evidenceFor(a, e).state).toBe(expected);
      if (expected === 'needs-check') {
        expect(e.answer?.summary).toMatch(/^The planner cannot confirm/);
        expect(e.answer?.summary).not.toMatch(/supports as in effect today/);
        expect(e.unresolved_conditions.map((c) => c.reason)).toEqual(expect.arrayContaining(['future_effective', 'stale_evidence']));
      } else {
        expect(e.answer?.summary).toMatch(/^These are the Round A2 conditions/);
      }
      // The evidence label never says "checked" while the summary says unverified, and vice versa.
      const anyChecked = e.answer!.actions.some((a) => evidenceFor(a, e).state === 'checked');
      expect(anyChecked).toBe(expected === 'checked');
    } finally {
      await api.stop();
    }
  });

  it('on the effective date with a stale source: admitted only as needs-check', async () => {
    const api = await startApi({ asOf: '2026-12-01T00:00:00Z' });
    try {
      pointAt(api);
      const e = await envelope({ question: 'What does round A2 require today?' });
      const action = e.answer?.actions.find((a) => a.action_id === 'act_a2_security_assessment');
      expect(action?.evidence_state).toBe('needs-check');
      expect(e.answer?.summary).toMatch(/^The planner cannot confirm/);
    } finally {
      await api.stop();
    }
  });
});

describe('BFF with harness faults (local configuration only, never a browser control)', () => {
  it('vector_timeout: 504 retrieval_timeout, presented as an outage with the draft kept', async () => {
    const api = await startApi({ fault: 'vector_timeout' });
    try {
      pointAt(api);
      const res = await handleQuery(json({ question: 'Is round A1 open?' }));
      expect(res.status).toBe(504);
      const body = await res.json();
      expect(body.error.code).toBe('retrieval_timeout');
      expect(failureView(504, body.error.code)).toMatchObject({ kind: 'outage', action: 'Try again' });
    } finally {
      await api.stop();
    }
  });

  it('budget_exhausted: 429 with retry information, presented as a budget limit', async () => {
    const api = await startApi({ fault: 'budget_exhausted' });
    try {
      pointAt(api);
      const res = await handleQuery(json({ question: 'Is round A1 open?' }));
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error.code).toBe('budget_exhausted');
      expect(body.error.retry_after_seconds).toBeGreaterThan(0);
      expect(res.headers.get('retry-after')).toBe(String(body.error.retry_after_seconds));
      expect(failureView(429, body.error.code, body.error.retry_after_seconds)).toMatchObject({ kind: 'budget', retryAfterSeconds: body.error.retry_after_seconds });
    } finally {
      await api.stop();
    }
  });

  it('graph_unavailable: 200 from passages only, no sequence, a service notice', async () => {
    const api = await startApi({ fault: 'graph_unavailable' });
    try {
      pointAt(api);
      const e = await envelope({ question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } });
      expect(e.retrieval_mode).toBe('fixture_passages_only');
      expect(sequenceNodes(e)).toBeNull();
      expect(serviceStatus(e)).toEqual({ status: 'graph-degraded', detail: 'passages only' });
      expect(e.answer?.actions.length).toBeGreaterThan(0);
    } finally {
      await api.stop();
    }
  });

  it('a real allowance (not the fault) also surfaces as 429 budget_exhausted after it is spent', async () => {
    const api = await startApi({ dailyAllowance: 1 });
    try {
      pointAt(api);
      expect((await handleQuery(json({ question: 'Is round A1 open?' }))).status).toBe(200);
      const res = await handleQuery(json({ question: 'Is round A1 open?' }));
      expect(res.status).toBe(429);
      expect((await res.json()).error.code).toBe('budget_exhausted');
    } finally {
      await api.stop();
    }
  });
});
