import { check, EVIDENCE_STATE_WORDS, v1Schema } from '../src';

const citation = {
  citation_id: 'cit_1', source_id: 'src_x', publisher: 'P', title: 'T', canonical_url: 'https://example.invalid/x',
  source_class: 'program_round', jurisdiction: 'QLD', source_version_date: '2026-10-01', last_verified_at: '2026-10-30', freshness: 'fresh',
};
const base = {
  schema_version: '1.0.0', request_id: 'req_0123456789abcdef', corpus_version: 'fixture-1', as_of: '2026-11-05T00:00:00Z',
  retrieval_mode: 'fixture', responder: 'fixture', confirmed_context: {}, claims: [], citations: [citation],
  unresolved_conditions: [], warnings: [], statement: 'Information and routing, not an application or approval.',
};

describe('v1 envelope schema', () => {
  it('accepts each status only with its matching payload', () => {
    const answer = { summary: 's', actions: [], prerequisite_sequence: null };
    const clarification = { field: 'jurisdiction', question: 'q', why: 'w', options: [{ value: 'QLD', label: 'Queensland' }], unknown_allowed: true };
    expect(check('QueryEnvelope', { ...base, status: 'answer', answer, clarification: null })).toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'clarification', answer: null, clarification })).toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'insufficient_evidence', answer: null, clarification: null })).toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'answer', answer: null, clarification: null })).not.toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'clarification', answer, clarification })).not.toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'insufficient_evidence', answer, clarification: null })).not.toEqual([]);
  });

  it('rejects more than three actions and unknown fields', () => {
    const action = { action_id: 'act_a', title: 't', why: 'w', evidence_state: 'checked', claim_ids: ['c'], next_door: null };
    const answer = { summary: 's', actions: [action, action, action, action], prerequisite_sequence: null };
    expect(check('QueryEnvelope', { ...base, status: 'answer', answer, clarification: null })).not.toEqual([]);
    expect(check('QueryEnvelope', { ...base, status: 'insufficient_evidence', answer: null, clarification: null, debug: 1 })).not.toEqual([]);
  });

  it('keeps the evidence-state words aligned with the schema enum', () => {
    expect(Object.keys(EVIDENCE_STATE_WORDS).sort()).toEqual([...v1Schema.$defs.EvidenceState.enum].sort());
  });

  it('rejects client-supplied identity or scope fields in a query request', () => {
    expect(check('QueryRequest', { question: 'q' })).toEqual([]);
    expect(check('QueryRequest', { question: 'q', consumer_id: 'x' })).toEqual([{ path: '/consumer_id', issue: 'is not an allowed property' }]);
    expect(check('QueryRequest', { question: 'q', confirmed_context: { jurisdiction: 'Narnia' } })).not.toEqual([]);
    expect(check('QueryRequest', { question: '' })).not.toEqual([]);
  });

  it('never allows a snapshot path in a source record', () => {
    const source = {
      source_id: 's', publisher: 'p', title: 't', canonical_url: 'https://example.invalid/s', source_class: 'article', jurisdiction: 'national',
      published_at: null, source_version_date: '2026-01-01', last_verified_at: null, rights_status: 'not_reviewed', excerpt: null, excerpt_max_chars: 280, fictional: true,
    };
    expect(check('SourceRecord', source)).toEqual([]);
    expect(check('SourceRecord', { ...source, snapshot_location: '/archive/s.html' })).not.toEqual([]);
  });
});
