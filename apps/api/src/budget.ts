/**
 * In-process development budget store (ADR 001, development credential mode). A single-instance
 * per-consumer counter of query admissions per UTC day plus concurrency leases. It is labelled
 * `in_process_development` in capabilities: it is not a global or durable spend cap, holds no monetary
 * reservations (there are no paid calls in slice 1A-0) and cannot satisfy API06/API07.
 */
import { randomUUID } from 'node:crypto';
import { secondsUntilNextUtcDay, type Admission, type BudgetDenial, type BudgetStore, type BudgetUsage } from './budget-store';

export { secondsUntilNextUtcDay, type BudgetDenial };

export interface Lease {
  release(): void;
}

interface ConsumerState {
  day: string;
  admitted: number;
  leases: Map<number, number>; // lease id -> expiry (ms)
}

export class InProcessBudget implements BudgetStore {
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

  /**
   * The port's admission. This development store counts one admission per query and keeps no
   * reservations, so the reserved amount is not used and settlement changes nothing.
   */
  admit(consumerId: string, _requestId: string, _reserve: number): Promise<{ admission: Admission } | { denied: BudgetDenial }> {
    const result = this.acquire(consumerId);
    if ('denied' in result) return Promise.resolve(result);
    const { lease } = result;
    return Promise.resolve({
      admission: {
        reservationId: randomUUID(),
        release: () => Promise.resolve(lease.release()),
        settle: () => Promise.resolve('reconciled' as const),
      },
    });
  }

  usage(consumerId: string): Promise<BudgetUsage> {
    return Promise.resolve(this.usageSync(consumerId));
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  usageSync(consumerId: string): BudgetUsage {
    const s = this.consumers.get(consumerId);
    return { admitted: s?.admitted ?? 0, active: s?.leases.size ?? 0 };
  }
}
