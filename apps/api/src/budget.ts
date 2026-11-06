/**
 * In-process development budget store (ADR 001, development credential mode). A single-instance
 * per-consumer counter of query admissions per UTC day plus concurrency leases. It is labelled
 * `in_process_development` in capabilities: it is not a global or durable spend cap, holds no monetary
 * reservations (there are no paid calls in slice 1A-0) and cannot satisfy API06/API07.
 */
export type BudgetDenial = { code: 'budget_exhausted' | 'concurrency_limited'; retryAfterSeconds: number };

export interface Lease {
  release(): void;
}

interface ConsumerState {
  day: string;
  admitted: number;
  leases: Map<number, number>; // lease id -> expiry (ms)
}

export function secondsUntilNextUtcDay(now: Date): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

export class InProcessBudget {
  readonly kind = 'in_process_development' as const;
  private readonly consumers = new Map<string, ConsumerState>();
  private nextLeaseId = 1;

  constructor(
    readonly dailyAllowance: number,
    readonly maxConcurrent: number,
    readonly leaseMs: number,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Admits one query or returns the reason it is denied. Never throws. */
  acquire(consumerId: string): { lease: Lease } | { denied: BudgetDenial } {
    const now = this.clock();
    const day = now.toISOString().slice(0, 10);
    let state = this.consumers.get(consumerId);
    if (!state || state.day !== day) {
      state = { day, admitted: 0, leases: state?.leases ?? new Map() };
      this.consumers.set(consumerId, state);
    }
    // Reclaim abandoned slots whose lease has expired; slots are not money.
    for (const [id, expiry] of state.leases) if (expiry <= now.getTime()) state.leases.delete(id);

    if (state.admitted >= this.dailyAllowance) return { denied: { code: 'budget_exhausted', retryAfterSeconds: secondsUntilNextUtcDay(now) } };
    if (state.leases.size >= this.maxConcurrent) return { denied: { code: 'concurrency_limited', retryAfterSeconds: 1 } };

    state.admitted += 1;
    const id = this.nextLeaseId++;
    state.leases.set(id, now.getTime() + this.leaseMs);
    const leases = state.leases;
    let released = false;
    return {
      lease: {
        release: () => {
          if (released) return;
          released = true;
          leases.delete(id);
        },
      },
    };
  }

  usage(consumerId: string): { admitted: number; active: number } {
    const s = this.consumers.get(consumerId);
    return { admitted: s?.admitted ?? 0, active: s?.leases.size ?? 0 };
  }
}
