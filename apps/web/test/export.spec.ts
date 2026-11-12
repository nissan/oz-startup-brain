import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { check, EVIDENCE_STATE_WORDS, SERVICE_STATUS_WORDS } from '@ozsb/contracts';
import { resetApiClient } from '../src/lib/server/api';
import { handleQuery } from '../src/lib/server/bff';
import { checklistFileName, EXPORT_DISCLAIMER, renderChecklist } from '../src/lib/export';
import type { Envelope, EvidenceState } from '../src/lib/present';
import { startApi, type ApiProcess } from './api-process';

/**
 * The checklist export (SC09) and export label parity (#10), on real envelopes from the fixture
 * API through the real BFF handler. Nothing is mocked; the synthetic cases below only change one
 * decided value of a real envelope to reach states the fixture corpus does not produce.
 */
async function ask(api: ApiProcess, body: unknown): Promise<Envelope> {
  process.env.OZSB_API_BASE_URL = api.baseUrl;
  process.env.OZSB_API_KEY = api.apiKey;
  resetApiClient();
  const res = await handleQuery(new Request('http://web.test/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
  expect(res.status).toBe(200);
  const data = (await res.json()) as Envelope;
  expect(check('QueryEnvelope', data)).toEqual([]);
  return data;
}

const A2 = 'What does round A2 require today?';

describe('checklist export', () => {
  let api: ApiProcess;
  let degraded: ApiProcess;
  let a2: Envelope;
  beforeAll(async () => {
    api = await startApi();
    degraded = await startApi({ fault: 'graph_unavailable' });
    a2 = await ask(api, { question: A2, confirmed_context: { stage: 'prototype', jurisdiction: 'QLD' } });
  });
  afterAll(async () => {
    await api.stop();
    await degraded.stop();
  });

  it('SC09: carries the question, confirmed context, corpus version and as-of date', () => {
    const text = renderChecklist({ envelope: a2, question: A2 });
    expect(text).toContain(`- Question: ${A2}`);
    expect(text).toContain('- Confirmed context: Stage: Working prototype; Jurisdiction: Queensland');
    expect(text).toContain(`- Corpus version: ${a2.corpus_version}`);
    expect(text).toContain('- As of: 5 November 2026');
    expect(text).toContain(a2.request_id);
  });

  it('SC09: preserves every action, claim, citation, date and unresolved condition', () => {
    const text = renderChecklist({ envelope: a2, question: A2 });
    for (const action of a2.answer!.actions) expect(text).toContain(`- [ ] **${action.title}**`);
    // Every claim an action or step rests on is printed, with its effective date.
    const used = new Set([...a2.answer!.actions, ...a2.answer!.prerequisite_sequence!].flatMap((i) => i.claim_ids));
    for (const claim of a2.claims.filter((c) => used.has(c.claim_id))) expect(text).toContain(claim.text);
    expect(text).toContain('from 15 October 2026');
    // Every cited source appears once in Sources with publisher, both dates and its link.
    const usedCitations = new Set(a2.claims.filter((c) => used.has(c.claim_id)).flatMap((c) => c.citation_ids));
    for (const c of a2.citations.filter((x) => usedCitations.has(x.citation_id))) {
      expect(text.split(`${c.canonical_url}\n`)).toHaveLength(2);
      expect(text).toContain(`${c.title}. ${c.publisher}.`);
    }
    expect(text).toMatch(/Source version 15 October 2026; verified 4 November 2026\./);
    // Unresolved and future conditions: nothing dropped, the future one stated once.
    expect(text).toContain('## What the planner could not resolve');
    expect(text).toContain('**Not in the evidence:** A matched contribution may apply.');
    expect(text).toContain('## Takes effect later');
    expect(text.split('independent security assessment of their product.')).toHaveLength(2);
    expect(text).toContain('  - It is not a requirement or action today.');
    expect(text).toContain('  - It is not a prerequisite today.');
    // The future requirement is never a checklist item.
    expect(text).not.toMatch(/- \[ \] .*security assessment/i);
  });

  it('SC09: never describes itself as an approved application, and keeps the fixture warning', () => {
    const text = renderChecklist({ envelope: a2, question: A2 });
    expect(text).toContain(EXPORT_DISCLAIMER);
    expect(text).toContain('It is not an application, an approval, an eligibility decision or advice.');
    expect(text).toContain('Fixture mode: every program, round and source in this answer is fictional and not advice.');
    expect(text.trimEnd().endsWith(a2.statement)).toBe(true);
    expect(text).not.toMatch(/approved application|application (is|was|has been) approved|you qualify/i);
  });

  it('shows Not set and Unknown as the API confirmed them, never the words of the question', async () => {
    const gympie = await ask(api, { question: 'I have a software prototype in Gympie. What should I do next for support?' });
    const text = renderChecklist({ envelope: gympie, question: 'I have a software prototype in Gympie. What should I do next for support?' });
    expect(text).toContain('- Confirmed context: Stage: Not set; Jurisdiction: Not set');
    expect(text).toContain('**Outside current coverage:** Gympie local coverage is not available.');
    const unknown = await ask(api, { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' } });
    expect(renderChecklist({ envelope: unknown, question: 'q' })).toContain('Jurisdiction: Unknown');
  });

  it('marks editorial steps as suggestions and never as "In effect now"', () => {
    const text = renderChecklist({ envelope: a2, question: A2 });
    expect(text).toContain('2. Check IP ownership; gather customer evidence (suggested preparation, not a source requirement; Suggested next step)');
    const editorial = text.split('\n').filter((l) => l.includes('Suggested preparation;'));
    expect(editorial).toHaveLength(2);
    for (const line of editorial) expect(line).not.toContain('In effect now');
  });

  it('#10: every evidence state the schema allows is exported with exactly the shared word', () => {
    const schema = JSON.parse(readFileSync(join(__dirname, '../../../packages/contracts/schemas/v1.schema.json'), 'utf8'));
    const states: EvidenceState[] = schema.$defs.EvidenceState.enum;
    expect(states).toHaveLength(5);
    for (const state of states) {
      const envelope: Envelope = structuredClone(a2);
      envelope.answer!.actions = [{ ...envelope.answer!.actions[0], evidence_state: state }];
      envelope.answer!.prerequisite_sequence = [{ ...envelope.answer!.prerequisite_sequence![0], evidence_state: state }];
      const lines = renderChecklist({ envelope, question: A2 }).split('\n');
      const word = EVIDENCE_STATE_WORDS[state];
      expect(word).toBeTruthy();
      const evidence = lines.find((l) => l.startsWith('  - Evidence: '))!;
      // The same word and date suffix the EvidenceLabel component renders (packages/contracts/test/vocabulary.test.ts).
      expect(evidence).toBe(`  - Evidence: ${word}${state === 'checked' ? ' 4 November 2026' : ''}, Program A, Round A2: guidelines (fictional)`);
      expect(lines.find((l) => l.startsWith('1. '))).toContain(`; ${word}${state === 'checked' ? ' 28 October 2026' : ''})`);
    }
  });

  it('#10: a degraded answer exports the shared service word and no guessed sequence', async () => {
    const e = await ask(degraded, { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' } });
    const text = renderChecklist({ envelope: e, question: 'q' });
    expect(text).toContain(`**${SERVICE_STATUS_WORDS['graph-degraded']}.**`);
    expect(text).not.toContain('## What comes first');
  });

  it('#10: the export source holds no evidence or service word of its own', () => {
    // If someone types a label into the renderer instead of reading the table, this fails.
    const source = readFileSync(join(__dirname, '../src/lib/export.ts'), 'utf8');
    for (const word of [...Object.values(EVIDENCE_STATE_WORDS), ...Object.values(SERVICE_STATUS_WORDS)]) expect(source).not.toContain(word);
  });

  it('exports an abstention without inventing steps, and names the file after the corpus', async () => {
    const e = await ask(api, { question: 'Is round B1 open?' });
    const text = renderChecklist({ envelope: e, question: 'Is round B1 open?' });
    expect(text).toContain(EXPORT_DISCLAIMER);
    expect(checklistFileName(a2)).toBe(`oz-startup-brain-checklist-${a2.corpus_version}.md`);
    expect(checklistFileName({ ...a2, corpus_version: 'a/b c' })).toBe('oz-startup-brain-checklist-a-b-c.md');
    if (e.status !== 'answer') expect(text).not.toContain('- [ ]');
  });
});
