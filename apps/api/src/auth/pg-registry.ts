import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';
import { digest, issueKey, KEY_PATTERN, SCOPES, type Identity, type Scope } from './dev-keys';
import { RegistryUnavailable, type CredentialRegistry } from './registry';

const DUMMY_DIGEST = Buffer.alloc(32);
const CONSUMER_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export interface PgRegistryOptions {
  /** Milliseconds before a registry read is abandoned and the request is refused. */
  statementTimeoutMs?: number;
  connectionTimeoutMs?: number;
  /**
   * A schema to work in instead of the connection's default. Tests use one schema each. It is sent as
   * a startup option, so it needs a direct connection; leave it unset behind a transaction-mode pooler.
   */
  schema?: string;
}

/** A pool for the registry. Timeouts are short: an auth check that hangs is an outage, so it must fail closed quickly. */
export function registryPool(connectionString: string, options: PgRegistryOptions = {}): Pool {
  const statementTimeout = options.statementTimeoutMs ?? 2000;
  if (options.schema !== undefined && !/^[a-z_][a-z0-9_]{0,62}$/.test(options.schema)) throw new Error('schema name is invalid');
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: options.connectionTimeoutMs ?? 2000,
    idleTimeoutMillis: 10_000,
    // Client-side timeout only. A server-side statement_timeout would be a startup parameter, which
    // connection poolers in transaction mode (the usual hosted setup) can reject.
    query_timeout: statementTimeout,
    ...(options.schema ? { options: `-c search_path=${options.schema}` } : {}),
  });
  // An idle client dropping must never crash the process; the next query reports the outage.
  pool.on('error', () => undefined);
  return pool;
}

interface KeyRow {
  consumer_id: string;
  digest_sha256: string;
  scopes: string[];
  expires_at: Date | null;
  key_revoked: boolean;
  consumer_revoked: boolean;
}

/**
 * Durable credential registry on Postgres (Supabase- and Neon-compatible plain SQL).
 *
 * State is read on every request, with no cache of a positive result, so a revoked key fails on its
 * next request (ADR 001). Any non-null `revoked_at` means revoked: revocation is immediate and does
 * not depend on the API server's clock agreeing with whoever revoked. Expiry is compared with the
 * caller's clock. A read failure rejects with RegistryUnavailable and the guard refuses the request.
 */
export class PgCredentialRegistry implements CredentialRegistry {
  readonly kind = 'durable' as const;
  private readonly logger = new Logger('PgCredentialRegistry');

  constructor(private readonly pool: Pool) {}

  async verify(rawKey: string | undefined, now: Date = new Date()): Promise<Identity | null> {
    if (typeof rawKey !== 'string') return null;
    const m = KEY_PATTERN.exec(rawKey);
    // A string that is not key-shaped cannot match any row, so it is refused without a query.
    if (!m) return null;
    let row: KeyRow | undefined;
    try {
      const res = await this.pool.query<KeyRow>(
        `SELECT k.consumer_id, k.digest_sha256, k.scopes, k.expires_at,
                (k.revoked_at IS NOT NULL) AS key_revoked,
                (c.revoked_at IS NOT NULL) AS consumer_revoked
           FROM ozsb_api_keys k JOIN ozsb_consumers c USING (consumer_id)
          WHERE k.key_id = $1`,
        [m[1]],
      );
      row = res.rows[0];
    } catch (e) {
      // The driver's message can name the host or database. It is logged by class only.
      this.logger.error(`registry read failed (${(e as { code?: string }).code ?? (e as Error).name})`);
      throw new RegistryUnavailable();
    }
    const presented = digest(rawKey);
    // Compare even when the key ID is unknown, so timing does not reveal which key IDs exist.
    const matches = timingSafeEqual(presented, row ? Buffer.from(row.digest_sha256, 'hex') : DUMMY_DIGEST);
    if (!row || !matches) return null;
    if (row.key_revoked || row.consumer_revoked) return null;
    if (row.expires_at !== null && row.expires_at.getTime() <= now.getTime()) return null;
    const scopes = row.scopes.filter((s): s is Scope => (SCOPES as readonly string[]).includes(s));
    return { consumerId: row.consumer_id, keyId: m[1], scopes: new Set(scopes) };
  }

  async describe(): Promise<string> {
    try {
      const res = await this.pool.query<{ keys: string; consumers: string }>(
        `SELECT (SELECT count(*) FROM ozsb_api_keys WHERE revoked_at IS NULL) AS keys,
                (SELECT count(*) FROM ozsb_consumers WHERE revoked_at IS NULL) AS consumers`,
      );
      return `${res.rows[0].keys} active key(s) for ${res.rows[0].consumers} consumer(s)`;
    } catch {
      return 'registry not reachable at startup; requests are refused until it is';
    }
  }

  close(): Promise<void> {
    return this.pool.end();
  }
}

// ---- Administration: used by scripts/keys.ts and tests. There is no HTTP surface for any of this. ----

export function migrationsDir(): string {
  // src/auth -> apps/api, and dist/src/auth -> apps/api, both end at the package's migrations folder.
  let dir = __dirname;
  for (let i = 0; i < 4; i++) {
    try {
      if (readdirSync(join(dir, 'migrations')).some((f) => f.endsWith('.sql'))) return join(dir, 'migrations');
    } catch {
      /* keep climbing */
    }
    dir = join(dir, '..');
  }
  throw new Error('migrations folder not found');
}

/** Applies each migration file once, in name order, under an advisory lock so two runners cannot interleave. */
export async function migrate(pool: Pool): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query('SELECT pg_advisory_lock(7203198)');
    await client.query('CREATE TABLE IF NOT EXISTS ozsb_schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const done = new Set((await client.query<{ name: string }>('SELECT name FROM ozsb_schema_migrations')).rows.map((r) => r.name));
    for (const name of readdirSync(migrationsDir()).filter((f) => f.endsWith('.sql')).sort()) {
      if (done.has(name)) continue;
      await client.query('BEGIN');
      try {
        await client.query(readFileSync(join(migrationsDir(), name), 'utf8'));
        await client.query('INSERT INTO ozsb_schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        applied.push(name);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(7203198)').catch(() => undefined);
    client.release();
  }
  return applied;
}

export interface IssuedKey {
  /** Shown once to whoever runs the command. It is not stored anywhere. */
  rawKey: string;
  keyId: string;
  consumerId: string;
  scopes: Scope[];
  expiresAt: string | null;
}

export interface KeyListing {
  key_id: string;
  consumer_id: string;
  scopes: string[];
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  consumer_revoked_at: string | null;
}

async function insertKey(client: PoolClient, consumerId: string, scopes: Scope[], expiresAt: string | null): Promise<IssuedKey> {
  const { rawKey, record } = issueKey(consumerId, scopes, new Date(), expiresAt);
  await client.query('INSERT INTO ozsb_api_keys (key_id, consumer_id, digest_sha256, scopes, expires_at) VALUES ($1, $2, $3, $4, $5)', [
    record.key_id,
    consumerId,
    record.digest_sha256,
    scopes,
    expiresAt,
  ]);
  return { rawKey, keyId: record.key_id, consumerId, scopes, expiresAt };
}

function checkScopes(scopes: Scope[]): void {
  if (!scopes.length || !scopes.every((s) => (SCOPES as readonly string[]).includes(s))) throw new Error(`scopes must be drawn from ${SCOPES.join(', ')}`);
}

export class CredentialAdmin {
  constructor(private readonly pool: Pool) {}

  private async tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }

  /** Creates a consumer and its first key. A consumer ID is never reused, even after revocation. */
  async issue(consumerId: string, scopes: Scope[], expiresAt: string | null = null): Promise<IssuedKey> {
    if (!CONSUMER_ID.test(consumerId)) throw new Error('consumer id is invalid');
    checkScopes(scopes);
    return this.tx(async (client) => {
      const created = await client.query('INSERT INTO ozsb_consumers (consumer_id) VALUES ($1) ON CONFLICT DO NOTHING', [consumerId]);
      if (created.rowCount === 0) throw new Error(`consumer ${consumerId} already exists; use rotate to give it another key`);
      return insertKey(client, consumerId, scopes, expiresAt);
    });
  }

  /**
   * Rotation, step one (ADR 001): a second key for the same consumer. It carries the scopes of the
   * consumer's newest active key unless others are given, so rotation cannot quietly widen access.
   * Both keys then work and draw on the one consumer allowance until the old key is revoked.
   */
  async rotate(consumerId: string, scopes?: Scope[], expiresAt: string | null = null): Promise<IssuedKey> {
    if (scopes) checkScopes(scopes);
    return this.tx(async (client) => {
      const consumer = await client.query<{ revoked: boolean }>('SELECT (revoked_at IS NOT NULL) AS revoked FROM ozsb_consumers WHERE consumer_id = $1 FOR UPDATE', [consumerId]);
      if (!consumer.rows[0]) throw new Error(`no consumer ${consumerId}`);
      if (consumer.rows[0].revoked) throw new Error(`consumer ${consumerId} is revoked`);
      let use = scopes;
      if (!use) {
        const current = await client.query<{ scopes: Scope[] }>(
          'SELECT scopes FROM ozsb_api_keys WHERE consumer_id = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()) ORDER BY created_at DESC, key_id LIMIT 1',
          [consumerId],
        );
        if (!current.rows[0]) throw new Error(`consumer ${consumerId} has no active key to copy scopes from; pass scopes explicitly`);
        use = current.rows[0].scopes;
      }
      return insertKey(client, consumerId, use, expiresAt);
    });
  }

  /** Revokes one key. Returns false when the key does not exist or was already revoked. */
  async revokeKey(keyId: string): Promise<boolean> {
    const res = await this.pool.query('UPDATE ozsb_api_keys SET revoked_at = now() WHERE key_id = $1 AND revoked_at IS NULL', [keyId]);
    return res.rowCount === 1;
  }

  /** Revokes a consumer and so every key it holds. Other consumers are untouched. */
  async revokeConsumer(consumerId: string): Promise<boolean> {
    const res = await this.pool.query('UPDATE ozsb_consumers SET revoked_at = now() WHERE consumer_id = $1 AND revoked_at IS NULL', [consumerId]);
    return res.rowCount === 1;
  }

  /** Lists keys without digests. */
  async list(): Promise<KeyListing[]> {
    const res = await this.pool.query<KeyListing>(
      `SELECT k.key_id, k.consumer_id, k.scopes,
              to_char(k.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
              to_char(k.expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS expires_at,
              to_char(k.revoked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS revoked_at,
              to_char(c.revoked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS consumer_revoked_at
         FROM ozsb_api_keys k JOIN ozsb_consumers c USING (consumer_id)
        ORDER BY k.consumer_id, k.created_at, k.key_id`,
    );
    return res.rows;
  }
}
