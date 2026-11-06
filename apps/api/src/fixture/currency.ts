import type { EvidenceState } from '@ozsb/contracts';
import type { Applicability, FixtureClaim, FixtureCorpus, FixtureSource } from './corpus';

/**
 * The answer-time currency rule (docs/04-data-and-ontology.md): freshness and applicability are two
 * independent tests, both computed from the records at `as_of`, never from a maintenance cadence.
 */
export interface ClaimAssessment {
  claim: FixtureClaim;
  source: FixtureSource;
  fresh: boolean;
  freshness: 'fresh' | 'stale' | 'unverified';
  applicability: Applicability;
  evidence_state: EvidenceState;
  qualifier: 'takes_effect_from' | 'effective_date_not_stated' | 'historical' | null;
  qualifier_text: string | null;
}

const DAY_MS = 86_400_000;

export function isoDate(asOf: string): string {
  return new Date(asOf).toISOString().slice(0, 10);
}

/** "2026-12-01" -> "1 December 2026" (Australian English, dates written in full in copy). */
export function longDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function daysBetween(from: string, to: string): number {
  return Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function assessClaim(claim: FixtureClaim, source: FixtureSource, asOf: string, corpus: FixtureCorpus): ClaimAssessment {
  const today = isoDate(asOf);

  // Fresh at as_of: verified, not after as_of, and within the class's staleness window.
  let freshness: ClaimAssessment['freshness'];
  if (source.last_verified_at === null || source.last_verified_at > today) {
    freshness = 'unverified';
  } else {
    freshness = daysBetween(source.last_verified_at, today) <= corpus.staleness_days[source.source_class] ? 'fresh' : 'stale';
  }
  const fresh = freshness === 'fresh';

  // In effect at as_of: a null valid_from is bounded below by the source's publication date.
  const effectiveFrom = claim.valid_from ?? source.published_at;
  const ended = claim.valid_to !== null && claim.valid_to <= today;
  const notYet = effectiveFrom !== null && effectiveFrom > today;

  // The two tests stay independent (R33-01): the effective interval decides whether a claim can be
  // acted on today at all; freshness only decides whether an in-effect claim can be stated as current.
  // A stale source never turns a future or ended requirement into a current one.
  let applicability: Applicability;
  if (ended) applicability = 'historical';
  else if (notYet) applicability = 'future_effective';
  else if (!fresh) applicability = 'unverified';
  else applicability = 'current';

  let qualifier: ClaimAssessment['qualifier'] = null;
  let qualifier_text: string | null = null;
  if (applicability === 'future_effective' && effectiveFrom) {
    qualifier = 'takes_effect_from';
    qualifier_text = `Takes effect from ${longDate(effectiveFrom)}`;
  } else if (applicability === 'historical' && claim.valid_to) {
    qualifier = 'historical';
    qualifier_text = `No longer in effect from ${longDate(claim.valid_to)}`;
  } else if (claim.valid_from === null && corpus.classes_that_state_effective_dates.includes(source.source_class)) {
    // Dates are never invented: the claim stays usable if fresh but carries the caveat.
    qualifier = 'effective_date_not_stated';
    qualifier_text = 'Effective date not stated';
  }

  let evidence_state: EvidenceState;
  if (!fresh) evidence_state = 'needs-check';
  else if (claim.assertion_kind === 'editorial') evidence_state = 'suggested';
  else evidence_state = 'checked';

  return { claim, source, fresh, freshness, applicability, evidence_state, qualifier, qualifier_text };
}

const SEVERITY: Record<EvidenceState, number> = { checked: 0, suggested: 1, disagree: 2, 'needs-check': 3, outside: 4 };

/** The weakest evidence state among an item's claims decides its label. */
export function weakest(states: EvidenceState[]): EvidenceState {
  return states.reduce((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a), 'checked' as EvidenceState);
}
