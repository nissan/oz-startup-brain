/**
 * Writes docs/api/openapi.json from the NestJS application. `npm run check:generated` regenerates it
 * in CI and fails on any difference, so the checked-in artifact always matches the code.
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../src/app';
import { loadConfig, repoRoot } from '../src/config';
import { buildOpenApi } from '../src/openapi';
import { ApiRuntime } from '../src/runtime';

async function main(): Promise<void> {
  // An empty registry: generation needs the routes, not any credential.
  const app = await createApp(new ApiRuntime(loadConfig({ OZSB_DEV_KEYS: '[]' })), false);
  const out = join(repoRoot(), 'docs', 'api', 'openapi.json');
  writeFileSync(out, `${JSON.stringify(buildOpenApi(app), null, 2)}\n`);
  await app.close();
  console.log(`wrote ${out}`);
}

void main();
