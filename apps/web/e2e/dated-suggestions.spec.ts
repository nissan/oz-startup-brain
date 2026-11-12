import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * #73: dated suggestions read as their kind, and evidence is not repeated in full. Builder-run
 * primed regression in a real browser against the fixture API; not a fresh synthetic actor and
 * not a human comprehension finding.
 */
const BASE = 'http://127.0.0.1:3110';
const EVIDENCE = process.env.OSB_EVIDENCE_DIR ?? join('test-results', 'shots');
mkdirSync(EVIDENCE, { recursive: true });

async function open(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('osb-theme', t), theme);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function ask(page: Page, question: string) {
  await page.locator('textarea#question').fill(question);
  await page.getByRole('button', { name: 'Ask the planner' }).click();
  await expect(page.locator('#results-heading')).not.toHaveText(/Working on your question|will appear here/);
}

const noSidewaysScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const theme of ['light', 'dark'] as const) {
  test(`#73 A2: a future condition is listed once, apart from what is unresolved (${theme})`, async ({ page }, info) => {
    await open(page, theme);
    await page.getByRole('button', { name: /Stage: Not set/ }).click();
    await page.locator('.context-editor__option', { hasText: /^Working prototype$/ }).click();
    await page.getByRole('button', { name: 'Save stage' }).click();
    await ask(page, 'What does round A2 require today?');

    // Unresolved: only the matched-contribution gap. No future condition sits under this heading.
    const unresolved = page.getByRole('region', { name: 'What the planner could not resolve' });
    await expect(unresolved.locator('.conditions__item')).toHaveCount(1);
    await expect(unresolved).toContainText('A matched contribution may apply.');
    await expect(unresolved).not.toContainText('security assessment');

    // Known future condition: once, dated, with both of the API's closing qualifications kept.
    const future = page.getByRole('region', { name: 'Takes effect later' });
    await expect(future.locator('.conditions__item')).toHaveCount(1);
    await expect(future).toContainText('Takes effect from 1 December 2026: Round A2 applicants must complete an independent security assessment of their product.');
    await expect(future.locator('.conditions__qualifications li')).toHaveText(['It is not a requirement or action today.', 'It is not a prerequisite today.']);
    await expect(page.getByText('independent security assessment of their product.')).toHaveCount(1);
    // It is still never an action or a prerequisite.
    await expect(page.getByRole('heading', { name: /security assessment/ })).toHaveCount(0);
    await expect(page.locator('.osb-map__list')).not.toContainText(/security assessment/i);

    // OZ-73-S1: the suggestion's kind is on the page before any evidence panel for it is opened.
    await expect(page.locator('.evidence-panel--step')).toHaveCount(0);
    await expect(page.locator('.osb-map__list li').filter({ hasText: 'Check IP ownership; gather customer evidence' })).toContainText('Suggested next step');

    // Opened, an editorial claim leads with its kind and is never labelled "In effect now".
    await page.getByRole('button', { name: /Show evidence for step 2:/ }).click();
    const editorial = page.locator('.evidence-panel--step .claims__item');
    await expect(editorial).toHaveCount(2);
    for (const item of await editorial.all()) {
      await expect(item.locator('.claims__kind')).toHaveText('Suggested preparation');
      await expect(item).toContainText('Editorial guidance');
      await expect(item).toContainText('from 12 May 2026');
      await expect(item).toContainText('editorial sequencing, not a source requirement');
      await expect(item).not.toContainText('In effect now');
    }
    await page.locator('.evidence-panel--step').screenshot({ path: join(EVIDENCE, `${info.project.name}-dated73-editorial-${theme}.png`) });
    await page.getByRole('region', { name: 'Takes effect later' }).screenshot({ path: join(EVIDENCE, `${info.project.name}-dated73-future-${theme}.png`) });
    // A source requirement keeps the API's timing word and its effective date.
    await page.getByRole('button', { name: /Show evidence for step 1:/ }).click();
    const sourced = page.locator('.evidence-panel--step .claims__item');
    await expect(sourced.locator('.claims__kind')).toHaveText('Stated by the source');
    await expect(sourced).toContainText('In effect now');
    await expect(sourced).toContainText('from 1 February 2026');
    // A passage that says more than the claim is still quoted.
    await expect(page.locator('.evidence-panel--step blockquote')).toBeVisible();

    expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(EVIDENCE, `${info.project.name}-dated73-a2-${theme}.png`), fullPage: true });
  });

  test(`#73 Gympie: the directory passage is printed once, with its checks and citation (${theme})`, async ({ page }, info) => {
    await open(page, theme);
    await ask(page, 'I have a software prototype in Gympie. What should I do next for support?');
    const panel = page.locator('.evidence-panel:visible');
    await expect(panel).toHaveCount(1);
    // The useful next checks appear exactly once in the open panel, in full.
    await expect(panel.getByText('ask whether remote sessions are available and whether Gympie is served', { exact: false }).filter({ visible: true })).toHaveCount(1);
    await expect(panel.getByText('ask whether your institution or project can use its IP conversation', { exact: false }).filter({ visible: true })).toHaveCount(1);
    await expect(panel.locator('blockquote:visible')).toHaveCount(0);
    await expect(panel).toContainText('The source passage is shown in full under “What this rests on”.');
    // The citation is not hidden: title, publisher, dates and link remain.
    const source = panel.locator('.osb-source');
    await expect(source).toContainText('STATIC FICTIONAL SOURCE DIRECTORY (fictional)');
    await expect(source).toContainText('Fictional Founder Support Network');
    await expect(source).toContainText('4 November 2026');
    await expect(source.getByRole('link')).toHaveAttribute('href', /example\.invalid/);
    await expect(source).not.toContainText('Excerpt not shown');
    // Coverage caveat is unchanged and still not a verified local match.
    await expect(page.getByRole('region', { name: 'What the planner could not resolve' })).toContainText('Gympie local coverage is not available.');
    await expect(page.getByRole('region', { name: 'Takes effect later' })).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: join(EVIDENCE, `${info.project.name}-dated73-gympie-${theme}.png`), fullPage: true });
  });
}
