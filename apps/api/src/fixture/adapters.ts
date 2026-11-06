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

  retrieve(question: string): FixtureTopic | null {
    this.calls += 1;
    if (this.faults.currentFault() === 'vector_timeout') throw new RetrievalTimeoutError();
    const words = tokens(question);
    return this.corpus.topics.find((t) => t.match.every((group) => group.some((term) => words.has(term)))) ?? null;
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
