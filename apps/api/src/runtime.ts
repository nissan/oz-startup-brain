import { DevKeyRegistry } from './auth/dev-keys';
import { PgCredentialRegistry, registryPool } from './auth/pg-registry';
import type { CredentialRegistry } from './auth/registry';
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
  readonly registry: CredentialRegistry;
  readonly harness: HarnessControls;
  readonly retriever: FixtureRetriever;
  readonly graph: FixtureGraph;
  readonly responder: FixtureResponder;
  readonly budget: InProcessBudget;

  constructor(readonly config: ApiConfig, budgetClock?: () => Date) {
    this.corpus = loadFixtureCorpus();
    // The durable pool connects lazily: an unreachable database does not stop startup, it refuses requests.
    this.registry =
      config.credentialMode === 'durable'
        ? new PgCredentialRegistry(registryPool(config.databaseUrl!, { schema: config.databaseSchema ?? undefined }))
        : new DevKeyRegistry(config.devKeys);
    this.harness = new HarnessControls(config.harness, this.corpus.default_as_of);
    this.retriever = new FixtureRetriever(this.corpus, this.harness);
    this.graph = new FixtureGraph(this.harness);
    this.responder = new FixtureResponder(this.corpus, this.retriever, this.graph);
    this.budget = new InProcessBudget(config.dailyQueryAllowance, config.maxConcurrentQueries, config.leaseMs, budgetClock);
  }

  /** Releases what the process holds open (the registry's connections). */
  close(): Promise<void> {
    return this.registry.close();
  }
}
