import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { CredentialRegistry } from './registry';

export const SCOPES = ['query:execute', 'sources:read', 'capabilities:read'] as const;
export type Scope = (typeof SCOPES)[number];

/**
 * One entry in the development key registry (ADR 001, development credential mode). It holds the
 * SHA-256 digest of the full key, never the key itself.
 */
export interface DevKeyRecord {
  key_id: string;
  consumer_id: string;
  digest_sha256: string;
  scopes: Scope[];
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface Identity {
  consumerId: string;
  keyId: string;
  scopes: ReadonlySet<Scope>;
}

export const KEY_PATTERN = /^ozsb_([a-z0-9]{8,32})_([A-Za-z0-9_-]{43})$/;
const RAW_KEY_ANYWHERE = /ozsb_[a-z0-9]{8,32}_[A-Za-z0-9_-]{43}/;

export function digest(rawKey: string): Buffer {
  return createHash('sha256').update(rawKey, 'utf8').digest();
}

/** Issues a key: `ozsb_<key_id>_<secret>` with a 256-bit secret. The raw key is returned once and never stored. */
export function issueKey(consumerId: string, scopes: Scope[], now = new Date(), expiresAt: string | null = null): { rawKey: string; record: DevKeyRecord } {
  const keyId = randomBytes(6).toString('hex');
  const secret = randomBytes(32).toString('base64url');
  const rawKey = `ozsb_${keyId}_${secret}`;
  return {
    rawKey,
    record: {
      key_id: keyId,
      consumer_id: consumerId,
      digest_sha256: digest(rawKey).toString('hex'),
      scopes: [...scopes],
      created_at: now.toISOString(),
      expires_at: expiresAt,
      revoked_at: null,
    },
  };
}

function isInstant(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

/** Parses and checks a registry document (a JSON array of DevKeyRecord). */
export function parseRegistry(text: string): DevKeyRecord[] {
  if (RAW_KEY_ANYWHERE.test(text)) throw new Error('it contains what looks like a raw API key; store only digests');
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) throw new Error('expected a JSON array of key records');
  const ids = new Set<string>();
  return data.map((r: Record<string, unknown>, i) => {
    const at = `record ${i}`;
    if (typeof r !== 'object' || r === null) throw new Error(`${at} is not an object`);
    const allowed = new Set(['key_id', 'consumer_id', 'digest_sha256', 'scopes', 'created_at', 'expires_at', 'revoked_at']);
    for (const k of Object.keys(r)) if (!allowed.has(k)) throw new Error(`${at} has unknown field ${k}`);
    if (typeof r.key_id !== 'string' || !/^[a-z0-9]{8,32}$/.test(r.key_id)) throw new Error(`${at} key_id is invalid`);
    if (ids.has(r.key_id)) throw new Error(`${at} duplicates key_id ${r.key_id}`);
    ids.add(r.key_id);
    if (typeof r.consumer_id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(r.consumer_id)) throw new Error(`${at} consumer_id is invalid`);
    if (typeof r.digest_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(r.digest_sha256)) throw new Error(`${at} digest_sha256 must be 64 lowercase hex characters`);
    if (!Array.isArray(r.scopes) || !r.scopes.every((s) => (SCOPES as readonly unknown[]).includes(s))) throw new Error(`${at} scopes must be drawn from ${SCOPES.join(', ')}`);
    if (!isInstant(r.created_at)) throw new Error(`${at} created_at must be an ISO 8601 instant`);
    if (r.expires_at !== null && r.expires_at !== undefined && !isInstant(r.expires_at)) throw new Error(`${at} expires_at must be null or an ISO 8601 instant`);
    if (r.revoked_at !== null && r.revoked_at !== undefined && !isInstant(r.revoked_at)) throw new Error(`${at} revoked_at must be null or an ISO 8601 instant`);
    return {
      key_id: r.key_id,
      consumer_id: r.consumer_id,
      digest_sha256: r.digest_sha256,
      scopes: r.scopes as Scope[],
      created_at: r.created_at,
      expires_at: (r.expires_at as string | null | undefined) ?? null,
      revoked_at: (r.revoked_at as string | null | undefined) ?? null,
    };
  });
}

const DUMMY_DIGEST = Buffer.alloc(32);

/**
 * Development key registry. Lookup is by the non-secret key ID; the secret is checked by comparing
 * SHA-256 digests in constant time. Every failure reason returns the same null, so callers can only
 * produce the generic 401 (ADR 001).
 */
export class DevKeyRegistry implements CredentialRegistry {
  readonly kind = 'development' as const;
  private readonly byId: Map<string, { record: DevKeyRecord; digest: Buffer }>;

  constructor(records: DevKeyRecord[]) {
    this.byId = new Map(records.map((r) => [r.key_id, { record: r, digest: Buffer.from(r.digest_sha256, 'hex') }]));
  }

  get size(): number {
    return this.byId.size;
  }

  /** The port is asynchronous; this adapter answers from memory. */
  verify(rawKey: string | undefined, now: Date = new Date()): Promise<Identity | null> {
    return Promise.resolve(this.verifySync(rawKey, now));
  }

  describe(): Promise<string> {
    return Promise.resolve(`${this.size} key(s)`);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  verifySync(rawKey: string | undefined, now: Date = new Date()): Identity | null {
    if (typeof rawKey !== 'string') return null;
    const m = KEY_PATTERN.exec(rawKey);
    const entry = m ? this.byId.get(m[1]) : undefined;
    const presented = digest(rawKey);
    // Compare even when the key ID is unknown, so the response time does not reveal valid key IDs.
    const matches = timingSafeEqual(presented, entry ? entry.digest : DUMMY_DIGEST);
    if (!entry || !matches) return null;
    const { record } = entry;
    if (record.revoked_at !== null && Date.parse(record.revoked_at) <= now.getTime()) return null;
    if (record.expires_at !== null && Date.parse(record.expires_at) <= now.getTime()) return null;
    return { consumerId: record.consumer_id, keyId: record.key_id, scopes: new Set(record.scopes) };
  }
}
