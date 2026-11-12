import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * SC09 / #10 in a real browser: the founder exports the checklist for the answer on the page.
 * Builder-run primed regression against the fixture API; not a synthetic actor or a human finding.
 */
const EVIDENCE = process.env.OSB_EVIDENCE_DIR ?? join('test-results', 'shots');
mkdirSync(EVIDENCE, { recursive: true });

for (const theme of ['light', 'dark'] as const) {
  test(`SC09 export carries context, corpus version, citations, dates and open conditions (${theme})`, async ({ page }, info) => {
    await page.addInitScript((t) => localStorage.setItem('osb-theme', t), theme);
    await page.goto('http://127.0.0.1:3110/', { waitUntil: 'networkidle' });
    // Nothing to export before there is an answer.
    await expect(page.getByRole('button', { name: 'Export checklist' })).toHaveCount(0);

    await page.getByRole('button', { name: /Stage: Not set/ }).click();
    await page.locator('.context-editor__option', { hasText: /^Working prototype$/ }).click();
    await page.getByRole('button', { name: 'Save stage' }).click();
    await page.locator('textarea#question').fill('What does round A2 require today?');
    await page.getByRole('button', { name: 'Ask the planner' }).click();
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');

    const section = page.getByRole('region', { name: 'Keep this answer' });
    await expect(section).toContainText('It is not an application or an approval.');
    const button = section.getByRole('button', { name: 'Export checklist' });
    // Keyboard: reachable, visibly focused, activated with Enter.
    // Real Tab presses from the results heading, so the browser treats focus as keyboard focus.
    await page.locator('#results-heading').focus();
    for (let i = 0; i < 60 && !(await button.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    expect(await button.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
    expect(download.suggestedFilename()).toMatch(/^oz-startup-brain-checklist-fixture-[0-9.-]+\.md$/);
    const text = readFileSync(await download.path(), 'utf8');

    // The file agrees with the page it was exported from.
    expect(text).toContain('- Question: What does round A2 require today?');
    expect(text).toContain('- Confirmed context: Stage: Working prototype; Jurisdiction: Not set');
    const corpus = (await page.locator('.footer-line').innerText()).match(/corpus (\S+)/)![1];
    expect(text).toContain(`- Corpus version: ${corpus}`);
    for (const title of await page.getByRole('article').getByRole('heading').allInnerTexts()) expect(text).toContain(`- [ ] **${title}**`);
    // The page's evidence label and the export's evidence line use the same words and date.
    const label = (await page.getByRole('article').first().locator('.osb-label').innerText()).replace(/\s+/g, ' ').trim();
    expect(label).toBe('Source checked 4 November 2026');
    expect(text).toContain(`  - Evidence: ${label}, `);
    expect(text).toContain('## Takes effect later');
    expect(text).toContain('Takes effect from 1 December 2026');
    expect(text).toContain('**Not in the evidence:** A matched contribution may apply.');
    expect(text).toContain('https://programs.example.invalid/qld/program-a/round-a2');
    expect(text).toContain('It is not an application, an approval, an eligibility decision or advice.');
    // Exporting sends nothing: the file is built in the browser from the answer already shown.
    expect(requests.filter((u) => !u.startsWith('blob:'))).toEqual([]);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: join(EVIDENCE, `${info.project.name}-export10-${theme}.png`) });
  });
}
