import { FAULT_NAMES, type FaultName, type FaultSource } from './fixture/adapters';
import type { HarnessConfig } from './config';
import { isUtcInstant, UTC_INSTANT_HINT } from './time';

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
    // Validate everything before changing anything, so a rejected set leaves the prior state intact.
    if (change.asOf !== undefined && !isUtcInstant(change.asOf)) throw new Error(`asOf must be ${UTC_INSTANT_HINT}`);
    if (change.fault !== undefined && !FAULT_NAMES.includes(change.fault)) throw new Error(`fault must be one of ${FAULT_NAMES.join(', ')}`);
    if (change.asOf !== undefined) this.asOfValue = change.asOf;
    if (change.fault !== undefined) this.fault = change.fault;
  }

  /** Returns to the configured starting clock and fault (the corpus default and "none" unless configured). */
  reset(): void {
    this.asOfValue = this.config.startAsOf ?? this.defaultAsOf;
    this.fault = this.config.startFault;
  }
}
