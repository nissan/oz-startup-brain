import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { FAULT_NAMES, type FaultName } from './fixture/adapters';
import { parseRegistry, type DevKeyRecord } from './auth/dev-keys';
import { apiPackageRoot } from './fixture/corpus';
import { isUtcInstant, UTC_INSTANT_HINT } from './time';

/** A configuration that must not start. The message names the variable, never a secret value. */
export class ConfigError extends Error {}

export const HARNESS_ENV_VALUE = 'isolated-local-test';
const LOOPBACK = new Set(['127.0.0.1', '::1', 'localhost']);

export interface HarnessConfig {
  enabled: boolean;
  /** Clock and fault the harness starts with and returns to on reset(). */
  startAsOf: string | null;
  startFault: FaultName;
}

export interface ApiConfig {
  responder: 'fixture';
  credentialMode: 'development' | 'durable';
  /** Development mode only; empty in durable mode. */
  devKeys: DevKeyRecord[];
  /** Durable mode only. A secret: never logged, never returned. */
  databaseUrl: string | null;
  databaseSchema: string | null;
  host: string;
  port: number;
  excerptMaxChars: number;
  dailyQueryAllowance: number;
  maxConcurrentQueries: number;
  leaseMs: number;
  maxQuestionChars: number;
  maxRequestBytes: number;
  harness: HarnessConfig;
}

export const DEFAULTS = {
  host: '127.0.0.1',
  port: 3000,
  excerptMaxChars: 280,
  dailyQueryAllowance: 500,
  maxConcurrentQueries: 4,
  leaseMs: 30_000,
  maxQuestionChars: 2000,
  maxRequestBytes: 16_384,
} as const;

/** Repository root (two levels above apps/api). */
export function repoRoot(): string {
  return resolve(apiPackageRoot(), '..', '..');
}

export const DEFAULT_DEV_KEYS_FILE = '.ozsb/dev-keys.json';

function int(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  if (!/^[0-9]+$/.test(raw)) throw new ConfigError(`${name} must be a whole number`);
  const n = Number(raw);
  if (n < min || n > max) throw new ConfigError(`${name} must be between ${min} and ${max}`);
  return n;
}

function isPublicDeployment(env: NodeJS.ProcessEnv): string | null {
  if (env.VERCEL || env.VERCEL_ENV) return 'a Vercel deployment (VERCEL/VERCEL_ENV is set)';
  if (env.NODE_ENV === 'production') return 'NODE_ENV=production';
  return null;
}

/**
 * Reads and checks the process configuration. The fixture responder is the only responder. Keys come
 * from the development registry (the default) or, with OZSB_CREDENTIAL_MODE=durable, from Postgres
 * (issue 98). Anything else, and every unsafe harness combination, is a startup error rather than a
 * silent fallback (docs/06-delivery.md, fixture-mode test controls).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env, cwd = repoRoot()): ApiConfig {
  const responder = env.OZSB_RESPONDER ?? 'fixture';
  if (responder !== 'fixture') throw new ConfigError(`OZSB_RESPONDER=${responder} is not available in slice 1A-0; only "fixture" is implemented`);
  const credentialMode = env.OZSB_CREDENTIAL_MODE ?? 'development';
  if (credentialMode !== 'development' && credentialMode !== 'durable') {
    throw new ConfigError('OZSB_CREDENTIAL_MODE must be "development" or "durable"');
  }
  // The fixture responder is the only one implemented, and it is never public whatever the credential mode.
  const publicDeployment = isPublicDeployment(env);
  if (publicDeployment) throw new ConfigError(`the fixture responder and development credential mode are never deployed publicly; refusing to start in ${publicDeployment}`);

  let databaseUrl: string | null = null;
  let databaseSchema: string | null = null;
  if (credentialMode === 'durable') {
    const url = env.OZSB_DATABASE_URL;
    // Messages name the variable only. The value holds a password and is never echoed.
    if (!url) throw new ConfigError('OZSB_CREDENTIAL_MODE=durable requires OZSB_DATABASE_URL');
    if (!/^postgres(ql)?:\/\/[^\s]+$/.test(url)) throw new ConfigError('OZSB_DATABASE_URL must be a postgres:// or postgresql:// URL');
    if (env.OZSB_DEV_KEYS !== undefined || env.OZSB_DEV_KEYS_FILE !== undefined) {
      throw new ConfigError('OZSB_DEV_KEYS/OZSB_DEV_KEYS_FILE are for development credential mode; unset them when OZSB_CREDENTIAL_MODE=durable');
    }
    databaseUrl = url;
    const schema = env.OZSB_DATABASE_SCHEMA;
    if (schema !== undefined && !/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new ConfigError('OZSB_DATABASE_SCHEMA must be a lowercase identifier');
    databaseSchema = schema ?? null;
  } else if (env.OZSB_DATABASE_URL !== undefined) {
    throw new ConfigError('OZSB_DATABASE_URL is set but OZSB_CREDENTIAL_MODE is not "durable"; refusing to guess which registry was meant');
  }

  const host = env.OZSB_HOST ?? DEFAULTS.host;
  const port = int(env, 'PORT', DEFAULTS.port, 0, 65535);

  // Harness controls: all three conditions must hold, or startup fails.
  const harnessRequested = env.OZSB_HARNESS_CONTROLS !== undefined || env.OZSB_HARNESS_AS_OF !== undefined || env.OZSB_HARNESS_FAULT !== undefined;
  const harness: HarnessConfig = { enabled: false, startAsOf: null, startFault: 'none' };
  if (harnessRequested) {
    if (env.OZSB_HARNESS_CONTROLS !== 'enabled') {
      throw new ConfigError('OZSB_HARNESS_AS_OF/OZSB_HARNESS_FAULT require OZSB_HARNESS_CONTROLS=enabled');
    }
    if (env.OZSB_HARNESS_ENV !== HARNESS_ENV_VALUE) {
      throw new ConfigError(`harness controls require OZSB_HARNESS_ENV=${HARNESS_ENV_VALUE} (an isolated local test process)`);
    }
    if (!LOOPBACK.has(host)) throw new ConfigError('harness controls require a loopback OZSB_HOST (127.0.0.1, ::1 or localhost)');
    const asOf = env.OZSB_HARNESS_AS_OF;
    if (asOf !== undefined && !isUtcInstant(asOf)) throw new ConfigError(`OZSB_HARNESS_AS_OF must be ${UTC_INSTANT_HINT}`);
    const fault = (env.OZSB_HARNESS_FAULT ?? 'none') as FaultName;
    if (!FAULT_NAMES.includes(fault)) throw new ConfigError(`OZSB_HARNESS_FAULT must be one of ${FAULT_NAMES.join(', ')}`);
    harness.enabled = true;
    harness.startAsOf = asOf ?? null;
    harness.startFault = fault;
  }

  let devKeys: DevKeyRecord[] = [];
  if (credentialMode === 'development') {
    let registryText: string;
    if (env.OZSB_DEV_KEYS !== undefined) {
      registryText = env.OZSB_DEV_KEYS;
    } else {
      const file = env.OZSB_DEV_KEYS_FILE ?? DEFAULT_DEV_KEYS_FILE;
      const path = isAbsolute(file) ? file : join(cwd, file);
      if (!existsSync(path)) throw new ConfigError(`no development key registry at ${file}; run "npm run dev:keys" first or set OZSB_DEV_KEYS`);
      registryText = readFileSync(path, 'utf8');
    }
    try {
      devKeys = parseRegistry(registryText);
    } catch (e) {
      throw new ConfigError(`development key registry is invalid: ${(e as Error).message}`);
    }
  }

  return {
    responder: 'fixture',
    credentialMode,
    devKeys,
    databaseUrl,
    databaseSchema,
    host,
    port,
    excerptMaxChars: int(env, 'OZSB_EXCERPT_MAX_CHARS', DEFAULTS.excerptMaxChars, 0, 2000),
    dailyQueryAllowance: int(env, 'OZSB_DAILY_QUERY_ALLOWANCE', DEFAULTS.dailyQueryAllowance, 0, 1_000_000),
    maxConcurrentQueries: int(env, 'OZSB_MAX_CONCURRENT_QUERIES', DEFAULTS.maxConcurrentQueries, 1, 64),
    leaseMs: DEFAULTS.leaseMs,
    maxQuestionChars: DEFAULTS.maxQuestionChars,
    maxRequestBytes: DEFAULTS.maxRequestBytes,
    harness,
  };
}
