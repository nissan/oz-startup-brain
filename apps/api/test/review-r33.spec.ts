import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigError, loadConfig } from '../src/config';
import { FixtureGraph, FixtureRetriever } from '../src/fixture/adapters';
import { CORPUS_PATH, loadFixtureCorpus, type FixtureCorpus } from '../src/fixture/corpus';
import { FixtureResponder } from '../src/fixture/responder';
import type { ApiRuntime } from '../src/runtime';
import { isUtcInstant } from '../src/time';
import { expectContract, harnessEnv, startApi, testKeys } from './helpers';

/** Regressions for the Codex review of #33 (R33-01, R33-03, R33-04). */
const keys = testKeys();

describe('R33-01: the effective interval is tested independently of freshness', () => {
  let app: INestApplication;
  let rt: ApiRuntime;
  beforeAll(async () => {
    ({ app, rt } = await startApi(harnessEnv(keys.records)));
  });
  afterAll(() => app.close());
  afterEach(() => rt.harness.reset());

  const a2At = async (asOf: string) => {
    rt.harness.set({ asOf });
    const res = await request(app.getHttpServer()).post('/v1/queries').set('X-API-Key', keys.full).send({ question: 'What does round A2 require today?' }).expect(200);
    expectContract('QueryEnvelope', res.body);
    const body = res.body;
    return {
      body,
      actions: body.answer.actions.map((a: { action_id: string }) => a.action_id) as string[],
      security: body.claims.find((c: { claim_id: string }) => c.claim_id === 'clm_a2_security'),
      reasons: body.unresolved_conditions.map((c: { reason: string }) => c.reason) as string[],
    };
  };

  // Round A2's source (program_round, 14-day window) was verified on 1 November 2026: fresh through
  // 15 November, stale from 16 November. The security requirement takes effect on 1 December 2026.
  it.each([
    ['fresh, before the effective date', '2026-11-15T00:00:00Z', 'checked'],
    ['first stale day, before the effective date', '2026-11-16T00:00:00Z', 'needs-check'],
    ['the reviewer\'s reproduction (stale, before the effective date)', '2026-11-20T00:00:00Z', 'needs-check'],
    ['stale, the day before the effective date', '2026-11-30T23:59:59Z', 'needs-check'],
    ['an unverified source (verified after as_of), before the effective date', '2026-10-20T00:00:00Z', 'needs-check'],
  ])('%s: the future requirement is dated and never an action today', async (_case, asOf, evidence) => {
    const { body, actions, security, reasons } = await a2At(asOf);
    expect(actions).not.toContain('act_a2_security_assessment');
    expect(security).toMatchObject({ applicability: 'future_effective', qualifier: 'takes_effect_from', qualifier_text: 'Takes effect from 1 December 2026', evidence_state: evidence });
    expect(reasons).toContain('future_effective');
    if (evidence === 'needs-check') {
      expect(reasons).toContain('stale_evidence');
      expect(body.warnings.map((w: { code: string }) => w.code)).toContain('stale_evidence');
      expect(body.answer.summary).toMatch(/check the official source before relying on it/);
      // The fresh-case assertion is replaced, not merely followed by a caveat (R33-01 follow-up).
      expect(body.answer.summary).not.toMatch(/supports as in effect today/);
      expect(body.answer.summary).toMatch(/^The planner cannot confirm which Round A2 conditions are in effect today/);
    } else {
      expect(body.answer.summary).toMatch(/^These are the Round A2 conditions the fixture corpus supports as in effect today\./);
      expect(body.answer.summary).not.toMatch(/cannot confirm|staleness window/);
    }
  });

  it('on the effective date with a stale source: in effect, so it is an action, but only as "Needs a current check"', async () => {
    const { body, actions, security } = await a2At('2026-12-01T00:00:00Z');
    expect(security).toMatchObject({ applicability: 'unverified', qualifier: null, evidence_state: 'needs-check' });
    expect(actions).toContain('act_a2_security_assessment');
    const action = body.answer.actions.find((a: { action_id: string }) => a.action_id === 'act_a2_security_assessment');
    expect(action.evidence_state).toBe('needs-check');
    expect(body.answer.summary).not.toMatch(/takes effect from 1 December 2026, so it is not listed/);
    expect(body.claims.every((c: { evidence_state: string }) => c.evidence_state === 'needs-check')).toBe(true);
    expect(body.answer.summary).not.toMatch(/supports as in effect today/);
    expect(body.answer.summary).toMatch(/^The planner cannot confirm which Round A2 conditions are in effect today/);
  });

  it('applies the same gate to prerequisite steps, whatever the freshness', () => {
    const corpus: FixtureCorpus = JSON.parse(JSON.stringify(loadFixtureCorpus()));
    corpus.claims.find((c) => c.claim_id === 'clm_progA_prerequisites')!.valid_from = '2026-12-01';
    const faults = { currentFault: () => 'none' as const };
    const responder = new FixtureResponder(corpus, new FixtureRetriever(corpus, faults), new FixtureGraph(faults));
    for (const asOf of ['2026-11-05T00:00:00Z', '2026-11-25T00:00:00Z']) {
      const e = responder.respond({ question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } }, { requestId: 'req_0000000000000000', asOf });
      expectContract('QueryEnvelope', e);
      expect(e.answer!.prerequisite_sequence!.map((s) => s.label)).not.toContain('Apply to an open Program A round');
      expect(e.answer!.prerequisite_sequence!.map((s) => s.position)).toEqual([1, 2]);
      expect(e.unresolved_conditions.some((c) => c.reason === 'future_effective' && /not a prerequisite today/.test(c.text))).toBe(true);
    }
  });
});

describe('R33-03: harness instants must exist on the calendar', () => {
  const invalid = ['2026-13-40T00:00:00Z', '2026-02-30T00:00:00Z', '2026-02-29T00:00:00Z', '2026-04-31T00:00:00Z', '2026-11-05T24:00:00Z', '2026-11-05T23:60:00Z', '2026-11-05T00:00:00.000Z', '2026-11-05'];
  const valid = ['2028-02-29T00:00:00Z', '2026-12-31T23:59:59Z', '2026-11-05T00:00:00Z'];

  it.each(invalid)('rejects %s in the shared validator and at startup', (value) => {
    expect(isUtcInstant(value)).toBe(false);
    expect(() => loadConfig(harnessEnv(keys.records, { OZSB_HARNESS_AS_OF: value }))).toThrow(ConfigError);
  });

  it.each(valid)('accepts %s, including a real leap day', (value) => {
    expect(isUtcInstant(value)).toBe(true);
    expect(loadConfig(harnessEnv(keys.records, { OZSB_HARNESS_AS_OF: value })).harness.startAsOf).toBe(value);
  });

  it('a rejected set() leaves the prior clock and fault intact; reset() still restores the start', async () => {
    const { app, rt } = await startApi(harnessEnv(keys.records));
    rt.harness.set({ asOf: '2028-02-29T00:00:00Z', fault: 'graph_unavailable' });
    for (const asOf of invalid) {
      expect(() => rt.harness.set({ asOf, fault: 'vector_timeout' })).toThrow(/calendar/);
      expect(rt.harness.asOf()).toBe('2028-02-29T00:00:00Z');
      expect(rt.harness.currentFault()).toBe('graph_unavailable');
    }
    const caps = await request(app.getHttpServer()).get('/v1/capabilities').set('X-API-Key', keys.full).expect(200);
    expect(caps.body.clock.as_of).toBe('2028-02-29T00:00:00Z');
    rt.harness.reset();
    expect(rt.harness.asOf()).toBe('2026-11-05T00:00:00Z');
    expect(rt.harness.currentFault()).toBe('none');
    await app.close();
  });
});

describe('R33-04: every cited source ID satisfies the published path contract and resolves', () => {
  const openapi = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.json'), 'utf8'));
  const param = openapi.paths['/v1/sources/{sourceId}'].get.parameters.find((p: { name: string }) => p.name === 'sourceId');
  const published = new RegExp(param.schema.pattern);

  it('publishes the same pattern on the path parameter and on citation and source-record IDs', () => {
    expect(openapi.components.schemas.Citation.properties.source_id.pattern).toBe(param.schema.pattern);
    expect(openapi.components.schemas.SourceRecord.properties.source_id.pattern).toBe(param.schema.pattern);
  });

  it('every corpus source and every citation returned by the fixture questions matches it and resolves over HTTP', async () => {
    const { app, rt } = await startApi(harnessEnv(keys.records));
    for (const s of rt.corpus.sources) expect(s.source_id).toMatch(published);
    const cited = new Set<string>();
    for (const body of [
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } },
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' } },
      { question: 'What does round A2 require today?' },
      { question: 'Is round A1 open?' },
      { question: 'Is round B1 open?' },
    ]) {
      const res = await request(app.getHttpServer()).post('/v1/queries').set('X-API-Key', keys.full).send(body).expect(200);
      for (const c of res.body.citations) cited.add(c.source_id);
    }
    expect(cited.size).toBeGreaterThanOrEqual(6);
    for (const id of cited) {
      expect(id).toMatch(published);
      const res = await request(app.getHttpServer()).get(`/v1/sources/${id}`).set('X-API-Key', keys.full).expect(200);
      expect(res.body.source_id).toBe(id);
    }
    await app.close();
  });

  it('refuses a topic whose base summary has no unverified wording', () => {
    const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8')) as FixtureCorpus;
    const topic = corpus.topics.find((t) => t.summary_base !== null)!;
    delete (topic as Partial<typeof topic>).summary_base_unverified;
    const dir = mkdtempSync(join(tmpdir(), 'ozsb-corpus-'));
    writeFileSync(join(dir, 'corpus.json'), JSON.stringify(corpus));
    expect(() => loadFixtureCorpus(join(dir, 'corpus.json'))).toThrow(/without summary_base_unverified/);
  });

  it('refuses to load a corpus whose source ID could not be requested', () => {
    const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8')) as FixtureCorpus;
    corpus.sources[0].source_id = 'src_progA_overview';
    for (const c of corpus.claims) if (c.source_id === 'src_prog_a_overview') c.source_id = 'src_progA_overview';
    const dir = mkdtempSync(join(tmpdir(), 'ozsb-corpus-'));
    writeFileSync(join(dir, 'corpus.json'), JSON.stringify(corpus));
    expect(() => loadFixtureCorpus(join(dir, 'corpus.json'))).toThrow(/src_progA_overview does not match/);
  });
});
