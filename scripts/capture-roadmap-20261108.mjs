// One-shot evidence capture. This script never publishes or changes tracked source.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const sourceCommit = '99c516df8af4b94cb05bbbf63855b8d6ce35f3eb';
const sourcePath = 'docs/delivery/roadmap/index.html';
const expectedHtmlHash = '7a19be3ee35be31c6ae1ba7ef290b4e6df57fa3eb7653dbc3bf0400cc4c3c005';
const destination = 'design/exports/roadmap-20261108';
const artifactName = 'roadmap-captures-20261108';
const reconstructionCss = '@media(max-width:700px){h1{font-size:46px}.hero{padding-top:38px}}';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const html = await readFile(sourcePath);
assert.equal(hash(html), expectedHtmlHash, 'target HTML differs from the reviewed source');
assert.equal(hash(execFileSync('git', ['show', `${sourceCommit}:${sourcePath}`])), expectedHtmlHash);
assert.equal(process.env.GITHUB_REPOSITORY, 'nissan/oz-startup-brain');
assert.equal(process.env.GITHUB_REF, 'refs/heads/ci/roadmap-capture-20261108');
assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
assert.equal(git('rev-parse', 'HEAD'), process.env.GITHUB_SHA);
git('merge-base', '--is-ancestor', sourceCommit, 'HEAD');
const output = resolve('_roadmap-capture');
await mkdir(`${output}/final`, { recursive: true });
await mkdir(`${output}/reconstruction`, { recursive: true });
const url = pathToFileURL(resolve(sourcePath)).href;
const blockedRequests = [];
const pageErrors = [];
const browser = await chromium.launch();
const manifest = {
  schema_version: 1,
  evidence_class: 'primed_document_visual_capture',
  source_commit: sourceCommit,
  source_path: sourcePath,
  source_sha256: hash(html),
  capture_script_commit: git('rev-parse', 'HEAD'),
  capture_script_sha256: hash(await readFile('scripts/capture-roadmap-20261108.mjs')),
  repository: process.env.GITHUB_REPOSITORY,
  event: process.env.GITHUB_EVENT_NAME,
  ref: process.env.GITHUB_REF,
  run_id: process.env.GITHUB_RUN_ID,
  run_attempt: process.env.GITHUB_RUN_ATTEMPT,
  run_url: `https://github.com/nissan/oz-startup-brain/actions/runs/${process.env.GITHUB_RUN_ID}`,
  artifact_name: artifactName,
  artifact_retention_days: 90,
  captured_at: new Date().toISOString(),
  browser: { name: 'chromium', version: browser.version(), playwright: JSON.parse(await readFile('node_modules/@playwright/test/package.json', 'utf8')).version },
  context: { locale: 'en-AU', timezone: 'UTC', reduced_motion: 'reduce', device_scale_factor: 1, actual_browser_zoom_tested: false },
  limitations: [
    'Scripted captures and interaction checks require a separate human/agent visual inspection.',
    'CSS viewport widths are not actual browser zoom, assistive technology or physical devices.',
    'The original initial screenshot was not preserved. The before comparison is explicitly reconstructed, not historical evidence.',
    'Reconstruction PNG is only in the 90-day Actions artifact; only final renders and this manifest enter Git.',
    'The dated 08:38 UTC roadmap snapshot is preserved; later issue changes supersede its status.',
  ],
  captures: [],
  reconstruction: null,
  actor_evidence: JSON.parse(await readFile(`${output}/actor-staging.json`, 'utf8')),
};

async function loadedPage(width, theme) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce', locale: 'en-AU', timezoneId: 'UTC' });
  await ctx.route(/https?:\/\//, route => {
    blockedRequests.push(route.request().url());
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', error => { pageErrors.push(error.message); });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
  const fontLoaded = await page.evaluate(() => [
    ['Fraunces', '600 36px "Fraunces"'],
    ['Atkinson regular', '400 17px "Atkinson Hyperlegible"'],
    ['Atkinson bold', '700 17px "Atkinson Hyperlegible"'],
    ['JetBrains Mono', '400 14px "JetBrains Mono"'],
  ].map(([name, font]) => ({ name, loaded: document.fonts.check(font) })));
  assert(fontLoaded.every(font => font.loaded));
  const client = await ctx.newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const paintedFonts = [];
  for (const [selector, expected] of [['h1', 'Fraunces'], ['.lede', 'Atkinson'], ['.owner', 'Atkinson'], ['.refs', 'JetBrains']]) {
    const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { fonts } = await client.send('CSS.getPlatformFontsForNode', { nodeId });
    assert(fonts.some(font => font.isCustomFont && font.glyphCount > 0 && font.familyName.includes(expected)), `intended font not painted at ${selector}`);
    paintedFonts.push({ selector, fonts });
  }
  await client.detach();
  return { ctx, page, fontLoaded, paintedFonts };
}

try {
  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      const { ctx, page, fontLoaded, paintedFonts } = await loadedPage(width, theme);
      const interactions = [];
      for (const [filter, expected] of [['all', 10], ['delivered', 2], ['review', 2], ['next', 5], ['later', 1], ['all', 10]]) {
        await page.locator(`[data-filter="${filter}"]`).click();
        assert.equal(await page.locator('.stream:not([hidden])').count(), expected);
        assert.equal(await page.locator('[data-filter][aria-pressed="true"]').count(), 1);
        interactions.push({ filter, visible: expected });
      }
      await page.locator('#theme').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme === 'light' ? 'dark' : 'light');
      await page.locator('#theme').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      await page.locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('details').getAttribute('open'), '');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('details').getAttribute('open'), null);
      await page.locator('summary').evaluate(node => node.blur());
      await page.evaluate(() => window.scrollTo(0, 0));
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
      assert(dimensions.document <= dimensions.viewport, `horizontal overflow at ${width}/${theme}`);
      const name = `final-${width}-${theme}.png`;
      const bytes = await page.screenshot({ path: `${output}/final/${name}`, fullPage: true, animations: 'disabled' });
      manifest.captures.push({ path: `${destination}/${name}`, artifact_path: `final/${name}`, sha256: hash(bytes), bytes: bytes.length, css_viewport: { width, height: 900 }, device_scale_factor: 1, theme, full_page: true, dimensions, font_loaded: fontLoaded, painted_fonts: paintedFonts, filters: interactions, theme_toggle: 'passed', disclosure_enter: 'passed', disclosure_state: 'closed', stale_notice_visible: await page.locator('#stale').isVisible() });
      await ctx.close();
    }
  }
  const { ctx, page } = await loadedPage(390, 'light');
  await page.addStyleTag({ content: reconstructionCss });
  const name = 'reconstructed-before-390-light.png';
  const bytes = await page.screenshot({ path: `${output}/reconstruction/${name}`, fullPage: false, animations: 'disabled' });
  manifest.reconstruction = {
    label: 'RECONSTRUCTED comparison — not the lost historical initial screenshot',
    artifact_path: `reconstruction/${name}`,
    sha256: hash(bytes), bytes: bytes.length,
    css_viewport: { width: 390, height: 900 }, device_scale_factor: 1, theme: 'light', full_page: false,
    source_commit: sourceCommit, source_sha256: expectedHtmlHash,
    override_css: reconstructionCss,
    basis: 'REVIEW.md records initial phone heading 46px and a 10px top-padding reduction; current top padding is 28px, so this reconstruction uses 38px.',
    historical_original_available: false,
    git_storage: false,
  };
  await ctx.close();
  assert.deepEqual(blockedRequests, [], 'self-contained roadmap attempted external requests');
  assert.deepEqual(pageErrors, [], 'roadmap emitted browser errors');
  manifest.external_requests = blockedRequests;
  await writeFile(`${output}/final/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ source_commit: sourceCommit, html_sha256: expectedHtmlHash, final_captures: manifest.captures.length, reconstruction: manifest.reconstruction.label, browser: manifest.browser }));
} finally {
  await browser.close();
}
