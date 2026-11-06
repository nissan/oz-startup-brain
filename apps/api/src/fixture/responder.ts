import {
  STANDING_STATEMENT,
  type Action,
  type Answer,
  type Citation,
  type Claim,
  type Clarification,
  type ConfirmedContext,
  type Jurisdiction,
  type QueryEnvelope,
  type QueryRequest,
  type SequenceStep,
  type UnresolvedCondition,
  type Warning,
} from '@ozsb/contracts';
import { FixtureGraph, FixtureRetriever, GraphUnavailableError } from './adapters';
import type { FixtureCorpus, FixtureTopic } from './corpus';
import { assessClaim, longDate, weakest, type ClaimAssessment } from './currency';

export const MAX_ACTIONS = 3;

const JURISDICTION_LABELS: Record<Exclude<Jurisdiction, 'unknown'>, string> = {
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT: 'Northern Territory',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA: 'Western Australia',
  national: 'National routes only',
};

export interface RespondContext {
  requestId: string;
  asOf: string;
}

/**
 * Deterministic slice 1A-0 responder over the fictional fixture corpus. It follows the online workflow's
 * order (retrieve, one clarification at most, graph lookup, evidence assembly with the currency rule,
 * structured output) without any model call. Its output is validated against the v1 envelope schema
 * by the caller before it leaves the API.
 */
export class FixtureResponder {
  constructor(
    private readonly corpus: FixtureCorpus,
    private readonly retriever: FixtureRetriever,
    private readonly graph: FixtureGraph,
  ) {}

  respond(request: QueryRequest, ctx: RespondContext): QueryEnvelope {
    const context: ConfirmedContext = { ...(request.confirmed_context ?? {}) };
    const warnings: Warning[] = [
      { code: 'fixture_corpus', kind: 'mode', message: 'Fixture mode: every program, round and source in this answer is fictional and not advice.' },
    ];
    const base = {
      schema_version: '1.0.0' as const,
      request_id: ctx.requestId,
      corpus_version: this.corpus.corpus_version,
      as_of: ctx.asOf,
      responder: 'fixture' as const,
      confirmed_context: context,
      statement: STANDING_STATEMENT,
    };

    const topic = this.retriever.retrieve(request.question);
    if (!topic) {
      return {
        ...base,
        status: 'insufficient_evidence',
        retrieval_mode: 'fixture',
        answer: null,
        clarification: null,
        claims: [],
        citations: [],
        unresolved_conditions: [
          { condition_id: 'cond_1', reason: 'not_in_evidence', field: null, text: 'The fixture corpus holds no evidence for this question, so the planner gives no answer rather than a guess.' },
        ],
        warnings,
      };
    }

    // One clarification at most, only for an unconfirmed field that changes the route (SC01).
    // A field the founder marked 'unknown' is never asked for again (SC22).
    if (topic.jurisdiction_sensitive && context.jurisdiction === undefined) {
      return { ...base, status: 'clarification', retrieval_mode: 'fixture', answer: null, clarification: this.jurisdictionClarification(), claims: [], citations: [], unresolved_conditions: [], warnings };
    }

    const conditions: UnresolvedCondition[] = [];
    const addCondition = (c: Omit<UnresolvedCondition, 'condition_id'>) => conditions.push({ condition_id: `cond_${conditions.length + 1}`, ...c });

    let retrievalMode: QueryEnvelope['retrieval_mode'] = 'fixture';
    let sequenceSource = topic.sequence;
    try {
      sequenceSource = this.graph.sequenceFor(topic);
    } catch (e) {
      if (!(e instanceof GraphUnavailableError)) throw e;
      retrievalMode = 'fixture_passages_only';
      sequenceSource = [];
      warnings.push({ code: 'graph_unavailable', kind: 'service', message: 'Graph unavailable: this answer uses source passages only. The prerequisite sequence is left out rather than guessed.' });
    }

    const jurisdictionActions = topic.actions.filter((a) => this.jurisdictionAdmits(topic, a.jurisdiction, context));
    const sequence = sequenceSource.filter((s) => this.jurisdictionAdmits(topic, s.jurisdiction, context));
    const leftOut = [
      ...topic.actions.filter((a) => !jurisdictionActions.includes(a)).map((a) => ({ name: a.title, jurisdiction: a.jurisdiction })),
      ...sequenceSource.filter((s) => !sequence.includes(s)).map((s) => ({ name: s.label, jurisdiction: s.jurisdiction })),
    ];
    this.reportJurisdictionGaps(topic, leftOut, context, warnings, addCondition);

    // Assess every claim that the admitted items rely on, once.
    const assessments = new Map<string, ClaimAssessment>();
    const assess = (claimId: string) => {
      let a = assessments.get(claimId);
      if (!a) {
        const claim = this.corpus.claims.find((c) => c.claim_id === claimId)!;
        const source = this.corpus.sources.find((s) => s.source_id === claim.source_id)!;
        a = assessClaim(claim, source, ctx.asOf, this.corpus);
        assessments.set(claimId, a);
      }
      return a;
    };
    for (const id of [...jurisdictionActions.flatMap((a) => a.claim_ids), ...sequence.flatMap((s) => s.claim_ids), ...topic.context_claim_ids]) assess(id);

    // Today's actions contain only claims that are current or need a check; future-effective and
    // historical claims are shown as dated claims, never as something to do today (SC23, closed rounds).
    const actions: Action[] = [];
    let closedRound = false;
    for (const fa of jurisdictionActions) {
      const as = fa.claim_ids.map(assess);
      const future = as.filter((a) => a.applicability === 'future_effective');
      const historical = as.filter((a) => a.applicability === 'historical');
      if (future.length) {
        for (const f of future) addCondition({ reason: 'future_effective', field: null, text: `${f.qualifier_text}: ${f.claim.text} It is not a requirement or action today.` });
        continue;
      }
      if (historical.length) {
        if (historical.some((h) => h.source.source_class === 'round_status' || h.source.source_class === 'program_round')) closedRound = true;
        continue;
      }
      if (actions.length < MAX_ACTIONS) {
        actions.push({ action_id: fa.action_id, title: fa.title, why: fa.why, evidence_state: weakest(as.map((a) => a.evidence_state)), claim_ids: fa.claim_ids as Action['claim_ids'], next_door: fa.next_door });
      }
    }
    if (closedRound) warnings.push({ code: 'closed_round', kind: 'evidence', message: 'A program round in this answer has closed; the planner does not recommend applying to it.' });

    // The same effective-interval gate applies to prerequisites: a step resting on a requirement that
    // has not started, or has ended, is not part of today's route, whatever its source's freshness.
    const steps: SequenceStep[] = [];
    for (const s of sequence) {
      const as = s.claim_ids.map(assess);
      const future = as.filter((a) => a.applicability === 'future_effective');
      if (future.length) {
        for (const f of future) addCondition({ reason: 'future_effective', field: null, text: `${f.qualifier_text}: ${f.claim.text} It is not a prerequisite today.` });
        continue;
      }
      if (as.some((a) => a.applicability === 'historical')) continue;
      steps.push({
        position: steps.length + 1,
        label: s.label,
        assertion_kind: as.every((a) => a.claim.assertion_kind === 'editorial') ? 'editorial' : 'sourced',
        evidence_state: weakest(as.map((a) => a.evidence_state)),
        claim_ids: s.claim_ids as SequenceStep['claim_ids'],
      });
    }

    // Stale evidence can never be stated as current (SC06).
    // Any claim that is not fresh is reported, including a future-effective one (whose date still
    // excludes it from today's actions). Ended claims are reported as closed or historical instead.
    const stale = [...assessments.values()].filter((a) => !a.fresh && a.applicability !== 'historical');
    for (const s of stale) {
      addCondition({
        reason: 'stale_evidence',
        field: null,
        text: s.source.last_verified_at
          ? `Current status unverified: "${s.claim.text}" was last verified on ${longDate(s.source.last_verified_at)}. Check ${s.source.title} before acting.`
          : `Current status unverified: "${s.claim.text}" has never been verified. Check ${s.source.title} before acting.`,
      });
    }
    if (stale.length) warnings.push({ code: 'stale_evidence', kind: 'evidence', message: 'Some evidence is outside its staleness window and is labelled "Needs a current check".' });
    if ([...assessments.values()].some((a) => a.qualifier === 'effective_date_not_stated')) {
      warnings.push({ code: 'effective_date_not_stated', kind: 'evidence', message: 'A source that normally states effective dates does not state one for a claim used here.' });
    }

    const matchedRules = topic.summary_rules.filter((r) => assessments.get(r.claim_id)?.applicability === r.applicability);
    const summaryParts = [topic.summary_base, ...matchedRules.map((r) => r.text)];
    // The topic's base summary describes the fresh case; never let it read as current over stale evidence.
    if (stale.length && !matchedRules.some((r) => r.applicability === 'unverified')) {
      summaryParts.push('Some of this evidence is outside its staleness window, so check the official source before relying on it.');
    }
    if (leftOut.length && context.jurisdiction === 'unknown') summaryParts.push('Because your jurisdiction is Unknown, only national routes are shown.');
    const summary = summaryParts.filter(Boolean).join(' ');

    if (!actions.length && !steps.length && !summary) {
      return { ...base, status: 'insufficient_evidence', retrieval_mode: retrievalMode, answer: null, clarification: null, claims: [], citations: [], unresolved_conditions: conditions, warnings };
    }

    const { claims, citations } = this.buildClaimsAndCitations([...assessments.values()]);
    return {
      ...base,
      status: 'answer',
      retrieval_mode: retrievalMode,
      // The schema's minItems/maxItems become tuple types; MAX_ACTIONS and the length checks enforce them,
      // and the controller validates the whole envelope before it leaves the API.
      answer: { summary, actions: actions as Answer['actions'], prerequisite_sequence: steps.length ? (steps as NonNullable<Answer['prerequisite_sequence']>) : null },
      clarification: null,
      claims,
      citations,
      unresolved_conditions: conditions,
      warnings,
    };
  }

  private jurisdictionAdmits(topic: FixtureTopic, item: Jurisdiction, context: ConfirmedContext): boolean {
    if (!topic.jurisdiction_sensitive || item === 'national') return true;
    return context.jurisdiction === item;
  }

  /** Says what was not considered and why; nothing is inferred from the question text (SC22). */
  private reportJurisdictionGaps(
    topic: FixtureTopic,
    leftOut: { name: string; jurisdiction: Jurisdiction }[],
    context: ConfirmedContext,
    warnings: Warning[],
    addCondition: (c: Omit<UnresolvedCondition, 'condition_id'>) => void,
  ): void {
    if (!topic.jurisdiction_sensitive) return;
    const j = context.jurisdiction;
    if (j === 'unknown') {
      if (leftOut.length) {
        const names = leftOut.map((i) => `"${i.name}" (${JURISDICTION_LABELS[i.jurisdiction as Exclude<Jurisdiction, 'unknown'>]})`).join(', ');
        addCondition({ reason: 'explicit_unknown', field: 'jurisdiction', text: `Jurisdiction is Unknown, so state and territory routes were left out: ${names}. Set your jurisdiction to see them.` });
        warnings.push({ code: 'explicit_unknown', kind: 'coverage', message: `${leftOut.length} state or territory option(s) were not considered because jurisdiction is Unknown. No jurisdiction was inferred from the question.` });
      }
    } else if (j !== undefined && j !== 'national' && !this.corpus.coverage.includes(j)) {
      addCondition({ reason: 'outside_coverage', field: 'jurisdiction', text: `${JURISDICTION_LABELS[j]} is outside the current coverage (${this.coverageLabel()}), so no ${JURISDICTION_LABELS[j]} routes are shown.` });
      warnings.push({ code: 'outside_coverage', kind: 'coverage', message: `${JURISDICTION_LABELS[j]} is outside current coverage; only national routes are shown.` });
    }
  }

  private coverageLabel(): string {
    return this.corpus.coverage.map((j) => (j === 'national' ? 'national routes' : JURISDICTION_LABELS[j as Exclude<Jurisdiction, 'unknown'>])).join(' and ');
  }

  private jurisdictionClarification(): Clarification {
    const options = (Object.keys(JURISDICTION_LABELS) as Exclude<Jurisdiction, 'unknown'>[]).map((value) => ({ value, label: JURISDICTION_LABELS[value] }));
    return {
      field: 'jurisdiction',
      question: 'Which state or territory are you based in?',
      why: 'Support routes differ by state or territory. You can choose Unknown and the planner will show national routes only.',
      options: [...options, { value: 'unknown', label: 'Unknown / prefer not to say' }] as unknown as Clarification['options'],
      unknown_allowed: true,
    };
  }

  private buildClaimsAndCitations(assessed: ClaimAssessment[]): { claims: Claim[]; citations: Citation[] } {
    const citationBySource = new Map<string, Citation>();
    const claims: Claim[] = assessed.map((a) => {
      let cit = citationBySource.get(a.source.source_id);
      if (!cit) {
        cit = {
          citation_id: `cit_${citationBySource.size + 1}`,
          source_id: a.source.source_id,
          publisher: a.source.publisher,
          title: a.source.title,
          canonical_url: a.source.canonical_url,
          source_class: a.source.source_class,
          jurisdiction: a.source.jurisdiction,
          source_version_date: a.source.source_version_date,
          last_verified_at: a.source.last_verified_at,
          freshness: a.freshness,
        };
        citationBySource.set(a.source.source_id, cit);
      }
      return {
        claim_id: a.claim.claim_id,
        text: a.claim.text,
        evidence_state: a.evidence_state,
        assertion_kind: a.claim.assertion_kind,
        applicability: a.applicability,
        valid_from: a.claim.valid_from,
        valid_to: a.claim.valid_to,
        qualifier: a.qualifier,
        qualifier_text: a.qualifier_text,
        citation_ids: [cit.citation_id],
      };
    });
    return { claims, citations: [...citationBySource.values()] };
  }
}
