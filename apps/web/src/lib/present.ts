import type { components } from '@ozsb/api-client';

/**
 * Pure mapping from the v1 envelope to what the design-system components render. No business
 * rule lives here: applicability, freshness, clarification and coverage arrive decided by the API;
 * this file only chooses which decided value goes in which slot and formats dates for display.
 */
type S = components['schemas'];
export type Envelope = S['QueryEnvelope'];
export type Action = S['Action'];
export type Claim = S['Claim'];
export type Citation = S['Citation'];
export type Capabilities = S['Capabilities'];
export type Jurisdiction = S['Jurisdiction'];
export type Stage = S['Stage'];
export type EvidenceState = S['EvidenceState'];

export const JURISDICTIONS: { value: Jurisdiction; label: string }[] = [
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'national', label: 'National routes only' },
  { value: 'unknown', label: 'Unknown' },
];

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'prototype', label: 'Working prototype' },
  { value: 'early_revenue', label: 'Early revenue' },
  { value: 'growth', label: 'Growth' },
  { value: 'unknown', label: 'Unknown' },
];

export function jurisdictionLabel(v: Jurisdiction | undefined): string | undefined {
  return JURISDICTIONS.find((j) => j.value === v)?.label;
}
export function stageLabel(v: Stage | undefined): string | undefined {
  return STAGES.find((s) => s.value === v)?.label;
}

/** "2026-07-22" or "2026-07-22T00:00:00Z" -> "22 July 2026" (Australian English, dates in full). */
export function longDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export interface ClaimView {
  claim: Claim;
  citation: Citation | undefined;
}

export function claimsFor(action: { claim_ids: string[] }, envelope: Envelope): ClaimView[] {
  const byId = new Map(envelope.claims.map((c) => [c.claim_id, c]));
  const cits = new Map(envelope.citations.map((c) => [c.citation_id, c]));
  return action.claim_ids
    .map((id) => byId.get(id))
    .filter((c): c is Claim => !!c)
    .map((claim) => ({ claim, citation: cits.get(claim.citation_ids[0]) }));
}

export interface EvidenceView {
  state: EvidenceState;
  /** Only for 'checked': the verification date of the first supporting source. */
  date?: string;
  publisher?: string;
}

/** The label on a card: the action's own (weakest) evidence state, dated by its first source. */
export function evidenceFor(action: Action, envelope: Envelope): EvidenceView {
  const first = claimsFor(action, envelope)[0];
  const publisher = first?.citation ? `${first.citation.title}` : undefined;
  return { state: action.evidence_state, date: action.evidence_state === 'checked' ? longDate(first?.citation?.last_verified_at) ?? 'date unknown' : undefined, publisher };
}

export interface SequenceNodeView {
  id: string;
  label: string;
  kind: 'sourced' | 'editorial';
  state: EvidenceState;
  date?: string;
}

export function sequenceNodes(envelope: Envelope): SequenceNodeView[] | null {
  const seq = envelope.answer?.prerequisite_sequence;
  if (!seq) return null;
  return seq.map((s) => {
    const first = claimsFor(s, envelope)[0];
    return { id: `step-${s.position}`, label: s.label, kind: s.assertion_kind, state: s.evidence_state, date: s.evidence_state === 'checked' ? longDate(first?.citation?.last_verified_at) : undefined };
  });
}

export const CONDITION_HEADINGS: Record<S['UnresolvedCondition']['reason'], string> = {
  explicit_unknown: 'Left out because a field is Unknown',
  stale_evidence: 'Current status unverified',
  future_effective: 'Takes effect later',
  outside_coverage: 'Outside current coverage',
  not_in_evidence: 'Not in the evidence',
};

export const APPLICABILITY_WORDS: Record<Claim['applicability'], string> = {
  current: 'In effect now',
  future_effective: 'Takes effect later',
  historical: 'No longer in effect',
  unverified: 'Needs a current check',
};

/** The service condition to announce with StatusNotice, if any. Evidence and coverage warnings are not service states. */
export function serviceStatus(envelope: Envelope): { status: 'graph-degraded'; detail?: string } | null {
  const w = envelope.warnings.find((x) => x.kind === 'service' && x.code === 'graph_unavailable');
  return w ? { status: 'graph-degraded', detail: envelope.retrieval_mode === 'fixture_passages_only' ? 'passages only' : undefined } : null;
}

export type LimitKind = 'outage' | 'budget' | 'graph-degraded' | 'outside';

export interface FailureView {
  kind: LimitKind;
  title: string;
  body: string;
  action: string;
  retryAfterSeconds?: number;
}

/** How a failed BFF call is shown. The founder's draft is always kept by the caller. */
export function failureView(status: number, code: string | undefined, retryAfterSeconds?: number): FailureView {
  switch (code) {
    case 'retrieval_timeout':
      return { kind: 'outage', title: 'Source retrieval did not finish', body: 'The planner stopped rather than answer from an incomplete search. Your question is kept below; try again, or check the source directory meanwhile.', action: 'Try again' };
    case 'budget_exhausted':
      return { kind: 'budget', title: 'Today’s query allowance is used up', body: 'The planner has stopped rather than keep going past its limit. This is a service limit, not a statement about any source. Your question is kept below.', action: 'Try again later', retryAfterSeconds };
    case 'concurrency_limited':
      return { kind: 'budget', title: 'Too many questions at once', body: 'The planner is answering other questions right now. Wait a moment and try again; your question is kept below.', action: 'Try again', retryAfterSeconds };
    case 'dependency_unavailable':
    case 'bff_upstream_unreachable':
    case 'bff_not_configured':
      return { kind: 'outage', title: 'The planner cannot reach its sources', body: 'No answer is shown rather than a made-up one. Your question is kept below.', action: 'Try again' };
    case 'bff_upstream_credential':
      return { kind: 'outage', title: 'The planner’s own credential was rejected', body: 'This local fixture setup is misconfigured on the server side. Nothing about your question or context is at fault, and nothing was sent to a live service.', action: 'Try again' };
    case 'bff_contract_violation':
      return { kind: 'outage', title: 'The answer did not match the published contract', body: 'The planner refuses to show an answer it cannot validate. Your question is kept below.', action: 'Try again' };
    case 'payload_too_large':
    case 'invalid_request':
    case 'bff_invalid_request':
      return { kind: 'outside', title: 'That question could not be sent', body: 'Questions are up to 2000 characters of text. Shorten it and try again.', action: 'Edit my question' };
    default:
      return { kind: 'outage', title: `The planner could not answer (HTTP ${status})`, body: 'No answer is shown rather than a guess. Your question is kept below.', action: 'Try again' };
  }
}

/** Example questions the fixture corpus answers, one per supported task. */
export const STARTERS: Record<Capabilities['supported_tasks'][number], { title: string; hint: string; example: string }> = {
  next_step: { title: 'Find my next step', hint: 'Start from your goal and situation', example: 'What should I do next for support?' },
  round_status: { title: 'Check a round', hint: 'Is a program round open today?', example: 'Is round A1 open?' },
  requirements_today: { title: 'What is required today', hint: 'Conditions in effect now, dated', example: 'What does round A2 require today?' },
};
