// Primed builder captures, never participant research. Run from repository root after build.
// Start the isolated fixture server pair separately, then:
// node docs/ux/issue47-review-evidence/capture.mjs http://127.0.0.1:3150
import { chromium } from '../../../node_modules/playwright-core/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out = fileURLToPath(new URL('./final/', import.meta.url));
const base = process.argv[2];
if (!base) throw new Error('Supply an isolated fixture build URL');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const records = [];
for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const task of ['t01', 't03']) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.addInitScript((t) => localStorage.setItem('osb-theme', t), theme);
  await page.goto(base, { waitUntil: 'networkidle' });
  if (task === 't03') {
    await page.getByRole('button', { name: /Stage: Not set/ }).click();
    await page.locator('.context-editor__option', { hasText: /^Working prototype$/ }).click();
    await page.getByRole('button', { name: 'Save stage' }).click();
  }
  const question = task === 't03' ? 'What does round A2 require today?' : 'I am building a software startup in Toowoomba. Where should I begin?';
  await page.getByLabel('Your question').fill(question);
  await page.getByRole('button', { name: 'Ask the planner' }).click();
  if (task === 't01') {
    await page.getByRole('button', { name: 'Queensland', exact: true }).click();
  }
  await page.getByRole('heading', { name: 'Your next steps', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('details summary').filter({ hasText: 'Terms in plain language' }).click();
  await page.locator('.results').screenshot({ path: `${out}${task}-${width}-${theme}.png` });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const fonts = {};
  for (const selector of ['.masthead__title', '.summary', '.section__caption']) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    fonts[selector] = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
  }
  records.push({ task, width, theme, question, browser: browser.version(), clock: '2026-11-07T00:00:00Z', fonts,
    overflow: await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) });
  await page.close();
}
writeFileSync(`${out}observations.json`, JSON.stringify(records, null, 2) + '\n');
await browser.close();
