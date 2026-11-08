import type { FixtureCorpus, FixtureSequenceStep, FixtureTopic } from './corpus';

export type FaultName = 'none' | 'vector_timeout' | 'budget_exhausted' | 'graph_unavailable';
export const FAULT_NAMES: readonly FaultName[] = ['none', 'vector_timeout', 'budget_exhausted', 'graph_unavailable'];

/** Read-only view of the harness fault selection; only the guarded HarnessControls can change it. */
export interface FaultSource {
  currentFault(): FaultName;
}

export class RetrievalTimeoutError extends Error {
  constructor() {
    super('fixture passage retrieval exceeded its deadline');
  }
}

export class GraphUnavailableError extends Error {
  constructor() {
    super('fixture claim graph is unavailable');
  }
}

export function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

/**
 * Deterministic stand-in for passage retrieval: chooses the first fixture topic whose term groups all
 * match whole tokens of the question. No embeddings, network or model. The question is data, never
 * instructions: it can only select among authored topics.
 */
export class FixtureRetriever {
  /** Number of retrieval attempts, so tests can prove no retrieval starts before auth/scope/validation. */
  calls = 0;

  constructor(
    private readonly corpus: FixtureCorpus,
    private readonly faults: FaultSource,
  ) {}

  retrieve(question: string, previousQuestion?: string): { topic: FixtureTopic | null; continued: boolean; needsSubject: boolean } {
    this.calls += 1;
    if (this.faults.currentFault() === 'vector_timeout') throw new RetrievalTimeoutError();
    const normalise = (text: string) => text.trim().toLowerCase().replace(/[.!?]+$/u, '').trim().replace(/\s+/gu, ' ');
    const followUps = (text: string) => this.corpus.topics.filter((t) => t.follow_up_phrases?.some((p) => normalise(p) === normalise(text)));
    const standalone = (text: string) => {
      const words = tokens(text);
      const named = this.corpus.topics.filter((t) => t.subject_terms?.some((term) => words.has(term)));
      // A round identifier outside the authored inventory must not fall through to generic support.
      const roundIds = [...text.toLowerCase().matchAll(/\bround\s+([a-z]+[0-9]+)\b/g)].map((m) => m[1]);
      const unsupported = roundIds.some((id) => !this.corpus.topics.some((t) => t.subject_terms?.includes(id)));
      if (named.length > 1 || unsupported) return { topic: null, named: true, ambiguous: true };
      const candidates = named.length ? named : this.corpus.topics;
      return { topic: candidates.find((t) => t.match.every((group) => group.some((term) => words.has(term)))) ?? null, named: !!named.length, ambiguous: false };
    };
    const current = standalone(question);
    const abstain = { topic: null, continued: false, needsSubject: true };
    if (current.ambiguous) return abstain;
    if (current.named) return { topic: current.topic, continued: false, needsSubject: !current.topic };
    const registered = followUps(question);
    const priorFollowUp = previousQuestion ? followUps(previousQuestion).length > 0 : false;
    const prior = previousQuestion && !priorFollowUp ? standalone(previousQuestion) : null;
    if (registered.length) {
      if (!prior?.topic || prior.ambiguous || !registered.includes(prior.topic)) return abstain;
      return { topic: prior.topic, continued: true, needsSubject: false };
    }
    if (current.topic?.topic_id === 'next_support_step' && (priorFollowUp || (prior?.topic?.follow_up_phrases?.length && !prior.ambiguous))) return abstain;
    return { topic: current.topic, continued: false, needsSubject: false };
  }
}

/** Deterministic stand-in for the reviewed-claims graph: returns a topic's prerequisite sequence. */
export class FixtureGraph {
  calls = 0;

  constructor(private readonly faults: FaultSource) {}

  sequenceFor(topic: FixtureTopic): FixtureSequenceStep[] {
    this.calls += 1;
    if (this.faults.currentFault() === 'graph_unavailable') throw new GraphUnavailableError();
    return topic.sequence;
  }
}
