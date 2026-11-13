import type { Identity } from './dev-keys';

/**
 * Where API keys are checked (ADR 001). Two adapters exist: the development registry loaded from
 * the environment, and the durable Postgres registry. The guard knows only this port.
 *
 * `verify` resolves to an identity, or to null for every reason a key is not acceptable (unknown,
 * wrong secret, expired, revoked, consumer revoked), so a caller can only ever produce the generic
 * 401. It rejects with RegistryUnavailable when the registry itself cannot be read; the caller must
 * then fail closed.
 */
export interface CredentialRegistry {
  readonly kind: 'development' | 'durable';
  verify(rawKey: string | undefined, now?: Date): Promise<Identity | null>;
  /** A short, secret-free description for the startup log. */
  describe(): Promise<string>;
  close(): Promise<void>;
}

/** The registry could not be read. Carries no connection detail; the cause is logged, never returned. */
export class RegistryUnavailable extends Error {
  constructor() {
    super('credential registry unavailable');
  }
}

export const CREDENTIAL_REGISTRY = Symbol('ozsbCredentialRegistry');
