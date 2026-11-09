import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { pathToFileURL } from 'node:url';
import { EVIDENCE_STATE_WORDS, SERVICE_STATUS_WORDS } from '../src/vocabulary';

const root = resolve(__dirname, '../../..');
const bundlePath = 'design/system/components/bundle.js';
const source = readFileSync(join(root, bundlePath), 'utf8');
type Node = string | number | null | undefined | { children: Node[] };
function text(node: Node): string {
  return node == null ? '' : typeof node === 'object' ? node.children.map(text).join('') : String(node);
}
function components(bundle: string) {
  const window: any = { React: { createElement: (_type: unknown, _props: unknown, ...children: Node[]) => ({ children }) } };
  runInNewContext(bundle, { window });
  return window.OzStartupBrain;
}

describe('shared display vocabulary on existing surfaces (export deferred)', () => {

  it('guards the published API evidence-state description against vocabulary drift', () => {
    const schema = JSON.parse(readFileSync(join(root, 'packages/contracts/schemas/v1.schema.json'), 'utf8'));
    const stateSchema = schema.$defs.EvidenceState;
    // The API description repeats the approved labels for documentation.
    // Checked alone adds a date suffix; it is not part of the canonical word.
    const quoted = [...stateSchema.description.matchAll(/([a-z-]+) = '([^']+)'/g)]
      .map(([, state, label]: string[]) => [state, label] as const);
    expect(stateSchema.enum).toEqual(Object.keys(EVIDENCE_STATE_WORDS));
    expect(quoted).toHaveLength(stateSchema.enum.length);
    expect(Object.fromEntries(quoted.map(([state, label]) =>
      [state, label.replace(/ \[date\]$/, '')]))).toEqual(EVIDENCE_STATE_WORDS);
    expect(quoted.find(([state]) => state === 'checked')?.[1]).toBe('Source checked [date]');
  });
  it('renders all five evidence words and all four service words from contracts', () => {
    const ds = components(source);
    for (const [state, word] of Object.entries(EVIDENCE_STATE_WORDS)) {
      expect(text(ds.EvidenceLabel({ state, date: '9 November 2026' }))).toBe(word + (state === 'checked' ? ' 9 November 2026' : ''));
    }
    expect(Object.keys(SERVICE_STATUS_WORDS).sort()).toEqual(['budget-exhausted', 'graph-degraded', 'paused', 'retrieval-unavailable']);
    for (const [status, word] of Object.entries(SERVICE_STATUS_WORDS)) {
      expect(text(ds.StatusNotice({ status }))).toBe(word);
    }
  });

  it('preserves date/detail suffixes and unknown-value fallbacks', () => {
    const ds = components(source);
    expect(text(ds.EvidenceLabel({ state: 'checked' }))).toBe('Source checked date unknown');
    expect(text(ds.EvidenceLabel({ state: 'invalid' }))).toBe('Outside current coverage');
    expect(text(ds.StatusNotice({ status: 'paused', detail: 'after retry' }))).toBe('Graph paused; resume requested · after retry');
    expect(text(ds.StatusNotice({}))).toBe('Service status');
  });

  it('web wrapper contains the exact standalone component implementation', () => {
    const web = readFileSync(join(root, 'apps/web/src/design-system/generated/bundle.js'), 'utf8');
    expect(web).toContain(source);
  });

  it('detects a drifted rendered word, then regenerates it from the canonical table', () => {
    const folder = mkdtempSync(join(tmpdir(), 'ozsb-vocabulary-'));
    try {
      for (const file of [bundlePath, 'packages/contracts/src/vocabulary.json', 'packages/contracts/schemas/v1.schema.json']) {
        mkdirSync(dirname(join(folder, file)), { recursive: true });
        writeFileSync(join(folder, file), readFileSync(join(root, file)));
      }
      const drifted = source.replace('Source checked', 'Invented approval');
      writeFileSync(join(folder, bundlePath), drifted);
      expect(text(components(drifted).EvidenceLabel({ state: 'checked' }))).not.toContain(EVIDENCE_STATE_WORDS.checked);
      const script = pathToFileURL(join(root, 'packages/contracts/scripts/sync-vocabulary.mjs')).href;
      const run = (check: boolean) => execFileSync(process.execPath, ['--input-type=module', '-e',
        `import {syncVocabulary} from ${JSON.stringify(script)}; syncVocabulary({repositoryRoot:process.argv[1],check:${check}});`, folder], { stdio: 'pipe' });
      expect(() => run(true)).toThrow(/Vocabulary drift/);
      run(false);
      run(true);
      expect(readFileSync(join(folder, bundlePath), 'utf8')).toBe(source);
      const wordsPath = join(folder, 'packages/contracts/src/vocabulary.json');
      const words = JSON.parse(readFileSync(wordsPath, 'utf8'));
      delete words.evidence.checked;
      writeFileSync(wordsPath, JSON.stringify(words));
      expect(() => run(false)).toThrow(/Every schema evidence state/);
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
});
