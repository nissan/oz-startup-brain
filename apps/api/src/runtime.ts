import { DevKeyRegistry } from './auth/dev-keys';
import { InProcessBudget } from './budget';
import type { ApiConfig } from './config';
import { FixtureGraph, FixtureRetriever } from './fixture/adapters';
import { loadFixtureCorpus, type FixtureCorpus } from './fixture/corpus';
import { FixtureResponder } from './fixture/responder';
import { HarnessControls } from './harness';

/**
 * Everything one API process holds, built once from a checked configuration. Tests reach the harness,
 * the adapters' call counters and the budget through this object; HTTP callers cannot.
 */
export class ApiRuntime {
  readonly corpus: FixtureCorpus;
  readonly registry: DevKeyRegistry;
  readonly harness: HarnessControls;
  readonly retriever: FixtureRetriever;
  readonly graph: FixtureGraph;
  readonly responder: FixtureResponder;
  readonly budget: InProcessBudget;

  constructor(readonly config: ApiConfig, budgetClock?: () => Date) {
    this.corpus = loadFixtureCorpus();
    this.registry = new DevKeyRegistry(config.devKeys);
    this.harness = new HarnessControls(config.harness, this.corpus.default_as_of);
    this.retriever = new FixtureRetriever(this.corpus, this.harness);
    this.graph = new FixtureGraph(this.harness);
    this.responder = new FixtureResponder(this.corpus, this.retriever, this.graph);
    this.budget = new InProcessBudget(config.dailyQueryAllowance, config.maxConcurrentQueries, config.leaseMs, budgetClock);
  }
}
