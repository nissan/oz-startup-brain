import { FAULT_NAMES, type FaultName, type FaultSource } from './fixture/adapters';
import type { HarnessConfig } from './config';

export class HarnessDisabledError extends Error {
  constructor() {
    super('harness controls are disabled in this process');
  }
}

/**
 * The pinned answer clock and the named fault selection (docs/06-delivery.md, fixture-mode test
 * controls). The clock is always pinned in fixture mode: it is the corpus's default as_of unless an
 * enabled harness moves it. Changes happen only through set()/reset() on this in-process object,
 * which tests and the local harness reach by dependency injection; there is no HTTP route, query
 * parameter or header that can change either value.
 */
export class HarnessControls implements FaultSource {
  private asOfValue: string;
  private fault: FaultName;

  constructor(
    private readonly config: HarnessConfig,
    private readonly defaultAsOf: string,
  ) {
    this.asOfValue = config.startAsOf ?? defaultAsOf;
    this.fault = config.startFault;
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  asOf(): string {
    return this.asOfValue;
  }

  currentFault(): FaultName {
    return this.fault;
  }

  set(change: { asOf?: string; fault?: FaultName }): void {
    if (!this.config.enabled) throw new HarnessDisabledError();
    if (change.asOf !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(change.asOf)) throw new Error('asOf must be an ISO 8601 UTC instant');
      this.asOfValue = change.asOf;
    }
    if (change.fault !== undefined) {
      if (!FAULT_NAMES.includes(change.fault)) throw new Error(`fault must be one of ${FAULT_NAMES.join(', ')}`);
      this.fault = change.fault;
    }
  }

  /** Returns to the configured starting clock and fault (the corpus default and "none" unless configured). */
  reset(): void {
    this.asOfValue = this.config.startAsOf ?? this.defaultAsOf;
    this.fault = this.config.startFault;
  }
}
