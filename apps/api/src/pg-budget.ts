import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { BudgetUnavailable, secondsUntilNextUtcDay, type Admission, type BudgetDenial, type BudgetStore, type BudgetUsage, type SettleOutcome } from './budget-store';

export interface PgBudgetOptions {
  dailyAllowance: number;
  maxConcurrent: number;
  /** How long a concurrency slot is held if nothing releases it. */
  leaseMs: number;
  /** How long a reservation may stay open before it is settled conservatively at the reserved amount. */
  reconcileMs: number;
  /** Optional cap across every consumer for the UTC day. Null means no global cap. */
  globalDailyAllowance: number | null;
  clock?: () => Date;
}

export interface LedgerRow {
  reservation_id: string;
  consumer_id: string;
  request_id: string;
  budget_day: string;
  reserved: number;
  status: 'open' | 'reconciled' | 'conservative';
  settled_amount: number | null;
  late_reported: number | null;
  effective: number;
}

const day = (now: Date) => now.toISOString().slice(0, 10);

/**
 * Durable, atomic budget store on Postgres (ADR 001; issue 99).
 *
 * Admission runs in one transaction that first takes an advisory lock for the consumer (and, when a
 * global cap is set, one for the whole store), so concurrent requests from any number of API
 * processes are decided one at a time and can never be admitted past the allowance. Remaining
 * allowance is always allowance minus settled usage minus open reservations in full.
 *
 * Settlement is a guarded status change (`WHERE status = 'open'`), so a reservation is settled
 * exactly once whether the report, the conservative sweep or both arrive, in any order. A lease
 * expiring frees the slot and nothing else.
 *
 * Any database failure rejects with BudgetUnavailable. The caller starts no paid work.
 */
export class PgBudgetStore implements BudgetStore {
  readonly kind = 'durable' as const;
  readonly dailyAllowance: number;
  readonly maxConcurrent: number;
  private readonly logger = new Logger('PgBudgetStore');
  private readonly clock: () => Date;

  constructor(
    private readonly pool: Pool,
    private readonly options: PgBudgetOptions,
  ) {
    this.dailyAllowance = options.dailyAllowance;
    this.maxConcurrent = options.maxConcurrent;
    this.clock = options.clock ?? (() => new Date());
  }

  private unavailable(e: unknown, what: string): BudgetUnavailable {
    // The driver's message can name the host or database. It is logged by class only.
    this.logger.error(`${what} failed (${(e as { code?: string }).code ?? (e as Error).name})`);
    return new BudgetUnavailable();
  }

  private async tx<T>(what: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch (e) {
      throw this.unavailable(e, what);
    }
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw this.unavailable(e, what);
    } finally {
      client.release();
    }
  }

  async admit(consumerId: string, requestId: string, reserve: number): Promise<{ admission: Admission } | { denied: BudgetDenial }> {
    if (!Number.isSafeInteger(reserve) || reserve <= 0) throw new Error('reserve must be a positive whole number of units');
    const now = this.clock();
    const today = day(now);
    const leaseId = randomUUID();
    const reservationId = randomUUID();

    const denied = await this.tx('admission', async (client): Promise<BudgetDenial | null> => {
      // Lock order is fixed (global, then consumer) so two admissions can never deadlock.
      if (this.options.globalDailyAllowance !== null) await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('ozsb-budget-global', 0))`);
      await client.query(`SELECT pg_advisory_xact_lock(hashtextextended('ozsb-budget:' || $1, 0))`, [consumerId]);

      // Slots whose lease has expired are reclaimed. Their reservations are untouched.
      await client.query('DELETE FROM ozsb_budget_leases WHERE consumer_id = $1 AND expires_at <= $2', [consumerId, now]);
      // Reservations past their deadline are settled conservatively, once. This does not change what
      // they count for (an open reservation already counts in full); it closes the ledger entry.
      await client.query(
        `UPDATE ozsb_budget_reservations SET status = 'conservative', settled_amount = reserved, settled_at = $2
          WHERE consumer_id = $1 AND status = 'open' AND reconcile_by <= $2`,
        [consumerId, now],
      );

      const used = await client.query<{ consumer: string; everyone: string }>(
        `SELECT COALESCE(SUM(ozsb_budget_effective(r)) FILTER (WHERE r.consumer_id = $1), 0) AS consumer,
                COALESCE(SUM(ozsb_budget_effective(r)), 0) AS everyone
           FROM ozsb_budget_reservations r WHERE r.budget_day = $2`,
        [consumerId, today],
      );
      const exhausted: BudgetDenial = { code: 'budget_exhausted', retryAfterSeconds: secondsUntilNextUtcDay(now) };
      if (Number(used.rows[0].consumer) + reserve > this.options.dailyAllowance) return exhausted;
      if (this.options.globalDailyAllowance !== null && Number(used.rows[0].everyone) + reserve > this.options.globalDailyAllowance) return exhausted;

      const active = await client.query<{ n: string }>('SELECT count(*) AS n FROM ozsb_budget_leases WHERE consumer_id = $1', [consumerId]);
      if (Number(active.rows[0].n) >= this.options.maxConcurrent) return { code: 'concurrency_limited', retryAfterSeconds: 1 };

      await client.query('INSERT INTO ozsb_budget_leases (lease_id, consumer_id, expires_at) VALUES ($1, $2, $3)', [leaseId, consumerId, new Date(now.getTime() + this.options.leaseMs)]);
      await client.query(
        `INSERT INTO ozsb_budget_reservations (reservation_id, consumer_id, request_id, budget_day, reserved, created_at, reconcile_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [reservationId, consumerId, requestId, today, reserve, now, new Date(now.getTime() + this.options.reconcileMs)],
      );
      return null;
    });
    if (denied) return { denied };

    let released = false;
    return {
      admission: {
        reservationId,
        release: async () => {
          if (released) return;
          released = true;
          // If this fails the slot is reclaimed at lease expiry, so the failure is not the caller's problem.
          await this.pool.query('DELETE FROM ozsb_budget_leases WHERE lease_id = $1', [leaseId]).catch((e) => void this.unavailable(e, 'lease release'));
        },
        settle: (actual: number) => this.settle(reservationId, actual),
      },
    };
  }

  /** Reports actual usage for a reservation. Safe to repeat and safe to arrive late; see SettleOutcome. */
  async settle(reservationId: string, actual: number): Promise<SettleOutcome> {
    if (!Number.isSafeInteger(actual) || actual < 0) throw new Error('actual usage must be a whole number of units, zero or more');
    const now = this.clock();
    return this.tx('settlement', async (client) => {
      const reconciled = await client.query(
        `UPDATE ozsb_budget_reservations SET status = 'reconciled', settled_amount = $2, settled_at = $3
          WHERE reservation_id = $1 AND status = 'open'`,
        [reservationId, actual, now],
      );
      if (reconciled.rowCount === 1) return 'reconciled';
      // Not open. A late report is recorded, and so credited, at most once, and only against a
      // conservatively settled reservation. Two late reports racing: only one row update can match.
      const late = await client.query(`UPDATE ozsb_budget_reservations SET late_reported = $2 WHERE reservation_id = $1 AND status = 'conservative' AND late_reported IS NULL`, [reservationId, actual]);
      if (late.rowCount === 1) return 'late_report_applied';
      const exists = await client.query('SELECT 1 FROM ozsb_budget_reservations WHERE reservation_id = $1', [reservationId]);
      return exists.rowCount ? 'already_settled' : 'unknown';
    });
  }

  /** Settles every reservation past its deadline, for all consumers. Returns how many were settled. */
  async settleOverdue(): Promise<number> {
    const now = this.clock();
    return this.tx('conservative settlement', async (client) => {
      const res = await client.query(`UPDATE ozsb_budget_reservations SET status = 'conservative', settled_amount = reserved, settled_at = $1 WHERE status = 'open' AND reconcile_by <= $1`, [now]);
      return res.rowCount ?? 0;
    });
  }

  async usage(consumerId: string): Promise<BudgetUsage> {
    const now = this.clock();
    return this.tx('usage read', async (client) => {
      const res = await client.query<{ admitted: string; active: string }>(
        `SELECT (SELECT COALESCE(SUM(ozsb_budget_effective(r)), 0) FROM ozsb_budget_reservations r WHERE r.consumer_id = $1 AND r.budget_day = $2) AS admitted,
                (SELECT count(*) FROM ozsb_budget_leases WHERE consumer_id = $1 AND expires_at > $3) AS active`,
        [consumerId, day(now), now],
      );
      return { admitted: Number(res.rows[0].admitted), active: Number(res.rows[0].active) };
    });
  }

  /** The usage ledger for one consumer and UTC day, oldest first. */
  async ledger(consumerId: string, budgetDay: string = day(this.clock())): Promise<LedgerRow[]> {
    return this.tx('ledger read', async (client) => {
      const res = await client.query(
        `SELECT r.reservation_id, r.consumer_id, r.request_id, to_char(r.budget_day, 'YYYY-MM-DD') AS budget_day, r.reserved::int AS reserved, r.status,
                r.settled_amount::int AS settled_amount, r.late_reported::int AS late_reported, ozsb_budget_effective(r)::int AS effective
           FROM ozsb_budget_reservations r WHERE r.consumer_id = $1 AND r.budget_day = $2 ORDER BY r.created_at, r.reservation_id`,
        [consumerId, budgetDay],
      );
      return res.rows as LedgerRow[];
    });
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}
