// Keep the standalone design artifact usable without runtime module/network dependencies.
// Only the two marked tables are generated; component behavior and icons remain design-owned.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const icons = { checked: 'tick', 'needs-check': 'clock', disagree: 'disagree', suggested: 'arrow', outside: 'outside' };

export function vocabularyTables(words, evidenceStates) {
  const sameKeys = (a, b) => JSON.stringify(Object.keys(a).sort()) === JSON.stringify([...b].sort());
  if (!sameKeys(words.evidence, evidenceStates) || !sameKeys(icons, evidenceStates)) {
    throw new Error('Every schema evidence state must have exactly one word and design icon');
  }
  for (const table of [words.evidence, words.service]) {
    const values = Object.values(table);
    if (!values.length || values.some(v => typeof v !== 'string' || !v.trim()) || new Set(values).size !== values.length) {
      throw new Error('Display words must be nonempty and unique within each vocabulary');
    }
  }
  return {
    STATES: Object.fromEntries(Object.entries(words.evidence).map(([key, word]) => [key, { word, icon: icons[key] }])),
    SERVICE: Object.fromEntries(Object.entries(words.service).map(([key, word]) => [key, { word }])),
  };
}

export function syncVocabulary({ check = false, repositoryRoot = root } = {}) {
  const words = JSON.parse(readFileSync(resolve(repositoryRoot, 'packages/contracts/src/vocabulary.json'), 'utf8'));
  const schema = JSON.parse(readFileSync(resolve(repositoryRoot, 'packages/contracts/schemas/v1.schema.json'), 'utf8'));
  const path = resolve(repositoryRoot, 'design/system/components/bundle.js');
  const original = readFileSync(path, 'utf8');
  let output = original;
  for (const [name, table] of Object.entries(vocabularyTables(words, schema.$defs.EvidenceState.enum))) {
    const start = `  // BEGIN GENERATED ${name} from packages/contracts/src/vocabulary.json`;
    const end = `  // END GENERATED ${name}`;
    if (output.split(start).length !== 2 || output.split(end).length !== 2 || output.indexOf(start) >= output.indexOf(end)) {
      throw new Error(`Expected one ordered ${name} generated region`);
    }
    const value = JSON.stringify(table, null, 2).replaceAll('\n', '\n  ');
    output = output.slice(0, output.indexOf(start)) + `${start}\n  var ${name} = ${value};\n${end}` + output.slice(output.indexOf(end) + end.length);
  }
  if (check && output !== original) throw new Error('Vocabulary drift: run npm run generate');
  if (!check) writeFileSync(path, output);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncVocabulary({ check: process.argv.includes('--check') });
}
