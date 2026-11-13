/**
 * Where query admission is decided (ADR 001). Two adapters exist: the in-process development budget
 * and the durable Postgres store. The query handler knows only this port.
 *
 * Admission does two things that expire differently:
 *  - it takes a concurrency slot under a lease (released on completion, reclaimed on expiry); and
 *  - it reserves a cost amount, which is never released by lease expiry and is settled exactly once.
 */
export type BudgetDenial = { code: 'budget_exhausted' | 'concurrency_limited'; retryAfterSeconds: number };

export type SettleOutcome =
  /** Settled now at the reported usage. */
  | 'reconciled'
  /** The reservation had been settled conservatively; this late report is recorded and credited, once. */
  | 'late_report_applied'
  /** Already reconciled, or a late report was already applied: nothing changes. */
  | 'already_settled'
  /** No such reservation. */
  | 'unknown';

export interface Admission {
  readonly reservationId: string;
  /** Releases the concurrency slot. Safe to call more than once. Never touches the reservation. */
  release(): Promise<void>;
  /** Reports actual usage for this reservation. Idempotent by reservation ID. */
  settle(actual: number): Promise<SettleOutcome>;
}

export interface BudgetUsage {
  /** Cost units counted against today's allowance: settled usage plus open reservations in full. */
  admitted: number;
  /** Concurrency slots currently held under an unexpired lease. */
  active: number;
}

export interface BudgetStore {
  readonly kind: 'in_process_development' | 'durable';
  readonly dailyAllowance: number;
  readonly maxConcurrent: number;
  /**
   * Admits one request, reserving `reserve` units, or says why not. Atomic: concurrent callers can
   * never be admitted past the allowance or the concurrency limit. Rejects with BudgetUnavailable
   * when the store cannot be used; the caller must then start no paid work.
   */
  admit(consumerId: string, requestId: string, reserve: number): Promise<{ admission: Admission } | { denied: BudgetDenial }>;
  usage(consumerId: string): Promise<BudgetUsage>;
  close(): Promise<void>;
}

/** The budget store could not be used. Carries no connection detail. */
export class BudgetUnavailable extends Error {
  constructor() {
    super('budget store unavailable');
  }
}

export function secondsUntilNextUtcDay(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}
