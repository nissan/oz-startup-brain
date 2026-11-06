import type { INestApplication } from '@nestjs/common';
import { check, type DefinitionName } from '@ozsb/contracts';
import { issueKey, type DevKeyRecord, type Scope } from '../src/auth/dev-keys';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { ApiRuntime } from '../src/runtime';

export const ALL_SCOPES: Scope[] = ['query:execute', 'sources:read', 'capabilities:read'];

export interface TestKeys {
  full: string;
  sourcesOnly: string;
  queryOnly: string;
  expired: string;
  revoked: string;
  records: DevKeyRecord[];
}

export function testKeys(): TestKeys {
  const full = issueKey('tester', ALL_SCOPES);
  const sourcesOnly = issueKey('sources-reader', ['sources:read']);
  const queryOnly = issueKey('query-only', ['query:execute']);
  const expired = issueKey('expired-consumer', ALL_SCOPES, new Date('2026-01-01T00:00:00Z'), '2026-02-01T00:00:00Z');
  const revoked = issueKey('revoked-consumer', ALL_SCOPES);
  revoked.record.revoked_at = '2026-03-01T00:00:00Z';
  return {
    full: full.rawKey,
    sourcesOnly: sourcesOnly.rawKey,
    queryOnly: queryOnly.rawKey,
    expired: expired.rawKey,
    revoked: revoked.rawKey,
    records: [full.record, sourcesOnly.record, queryOnly.record, expired.record, revoked.record],
  };
}

/** An isolated local test environment with the harness enabled, as docs/06-delivery.md requires. */
export function harnessEnv(records: DevKeyRecord[], extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    OZSB_DEV_KEYS: JSON.stringify(records),
    OZSB_HARNESS_CONTROLS: 'enabled',
    OZSB_HARNESS_ENV: 'isolated-local-test',
    ...extra,
  };
}

export async function startApi(env: NodeJS.ProcessEnv, budgetClock?: () => Date): Promise<{ app: INestApplication; rt: ApiRuntime }> {
  const rt = new ApiRuntime(loadConfig(env), budgetClock);
  const app = await createApp(rt, false);
  await app.init();
  return { app, rt };
}

export function expectContract(name: DefinitionName, body: unknown): void {
  const issues = check(name, body);
  if (issues.length) throw new Error(`${name} violation: ${JSON.stringify(issues)}`);
}
