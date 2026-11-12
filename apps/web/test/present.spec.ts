import { claimKindView, conditionGroups, conditionViews, excerptRepeatsClaim, type Claim, type Condition } from '@/lib/present';

/** #73 presentation helpers. They regroup and de-duplicate what the API decided; they never drop or re-judge it. */
const cond = (id: string, reason: Condition['reason'], text: string): Condition => ({ condition_id: id, reason, field: null, text });

const SECURITY = 'Takes effect from 1 December 2026: Round A2 applicants must complete an independent security assessment of their product.';

describe('conditionViews', () => {
  it('shows a twice-stated future condition once and keeps both closing qualifications', () => {
    const views = conditionViews([
      cond('cond_2', 'future_effective', `${SECURITY} It is not a requirement or action today.`),
      cond('cond_3', 'future_effective', `${SECURITY} It is not a prerequisite today.`),
    ]);
    expect(views).toHaveLength(1);
    expect(views[0].lead).toBe(SECURITY);
    expect(views[0].qualifications).toEqual(['It is not a requirement or action today.', 'It is not a prerequisite today.']);
  });

  it('does not merge conditions whose statements differ, or that have different reasons', () => {
    const views = conditionViews([
      cond('a', 'future_effective', `${SECURITY} It is not a prerequisite today.`),
      cond('b', 'future_effective', 'Takes effect from 1 January 2027: A fee applies. It is not a prerequisite today.'),
      cond('c', 'stale_evidence', `${SECURITY} It is not a prerequisite today.`),
    ]);
    expect(views.map((v) => v.id)).toEqual(['a', 'b', 'c']);
    expect(views.every((v) => v.qualifications.length === 0)).toBe(true);
    expect(views[0].lead).toBe(`${SECURITY} It is not a prerequisite today.`);
  });

  it('leaves a single-sentence condition whole, even when repeated', () => {
    const views = conditionViews([cond('a', 'not_in_evidence', 'Not established.'), cond('b', 'not_in_evidence', 'Not established.')]);
    expect(views).toHaveLength(2);
  });

  it('does not repeat an identical qualification', () => {
    const text = `${SECURITY} It is not a prerequisite today.`;
    const views = conditionViews([cond('a', 'future_effective', text), cond('b', 'future_effective', text)]);
    expect(views).toHaveLength(1);
    expect(views[0].qualifications).toEqual(['It is not a prerequisite today.']);
  });
});

describe('conditionGroups', () => {
  it('separates known future conditions from what could not be resolved, keeping order', () => {
    const groups = conditionGroups([
      cond('c1', 'not_in_evidence', 'A matched contribution may apply. Its amount is not established.'),
      cond('c2', 'future_effective', `${SECURITY} It is not a prerequisite today.`),
      cond('c3', 'explicit_unknown', 'Jurisdiction is Unknown. State routes are left out.'),
    ]);
    expect(groups.unresolved.map((v) => v.id)).toEqual(['c1', 'c3']);
    expect(groups.future.map((v) => v.id)).toEqual(['c2']);
  });
});

describe('excerptRepeatsClaim', () => {
  const claim = 'STATIC FICTIONAL SOURCE DIRECTORY — not verified local matches. 1. Fictional Regional Innovation Hub Network: ask whether Gympie is served. 2. Fictional University Commercialisation Office: ask about IP.';
  it('is true for a truncated copy of the claim printed below', () => {
    expect(excerptRepeatsClaim('STATIC FICTIONAL SOURCE DIRECTORY — not verified local matches. 1. Fictional Regional  Innovation Hub Network:…', [claim])).toBe(true);
  });
  it('is false for a passage that says more than, or differs from, the claim', () => {
    expect(excerptRepeatsClaim('Round A2 of Program A (fictional) is scheduled to open on 1 December 2026. Under guidelines…', ['Round A2 applicants must be a Queensland-registered company with a working prototype.'])).toBe(false);
    expect(excerptRepeatsClaim(`${claim} And one more sentence the claim does not have.`, [claim])).toBe(false);
  });
  it('is false for no excerpt and for a fragment too short to judge', () => {
    expect(excerptRepeatsClaim(undefined, [claim])).toBe(false);
    expect(excerptRepeatsClaim('STATIC FICTIONAL…', [claim])).toBe(false);
  });
});

describe('claimKindView', () => {
  const base: Claim = { claim_id: 'c', text: 't', evidence_state: 'checked', assertion_kind: 'sourced', applicability: 'current', valid_from: '2026-10-15', valid_to: null, qualifier: null, qualifier_text: null, citation_ids: ['cit_1'] };
  it('keeps the API timing word for a source statement', () => {
    expect(claimKindView(base)).toEqual({ kind: 'Stated by the source', timing: 'In effect now', note: '' });
  });
  it('never calls a current editorial suggestion "In effect now"', () => {
    const view = claimKindView({ ...base, assertion_kind: 'editorial', evidence_state: 'suggested' });
    expect(view.kind).toBe('Suggested preparation');
    expect(view.timing).toBe('Editorial guidance');
    expect(view.note).toBe('editorial sequencing, not a source requirement');
  });
  it('keeps a dated qualifier and non-current timing on any kind', () => {
    expect(claimKindView({ ...base, applicability: 'future_effective', qualifier: 'takes_effect_from', qualifier_text: 'Takes effect from 1 December 2026' }).timing).toBe('Takes effect from 1 December 2026');
    expect(claimKindView({ ...base, assertion_kind: 'editorial', applicability: 'historical' }).timing).toBe('No longer in effect');
  });
});
