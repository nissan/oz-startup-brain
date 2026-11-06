#!/usr/bin/env node
// Usage: node packages/contracts/scripts/check-compat.mjs <baseline.json> <candidate.json>
// Exits 1 and lists every breaking change when the candidate would silently replace v1 (API10).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { compareOpenApi } = require('../dist/compat.js');
const [baselinePath, candidatePath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) {
  console.error('usage: check-compat.mjs <baseline.json> <candidate.json>');
  process.exit(2);
}
const issues = compareOpenApi(JSON.parse(readFileSync(baselinePath, 'utf8')), JSON.parse(readFileSync(candidatePath, 'utf8')));
if (issues.length) {
  console.error(`${candidatePath} is not compatible with the v1 baseline ${baselinePath}:`);
  for (const i of issues) console.error(`  - ${i.where}: ${i.change}`);
  console.error('Breaking changes belong in a new major version (/v2), not in v1.');
  process.exit(1);
}
console.log(`${candidatePath} is compatible with the v1 baseline (${baselinePath}).`);
