import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// CI archives these four real-browser conditions through an upload-only artifact step.
// They are builder-run captures, not fresh synthetic actors or accessibility approval.
const EVIDENCE = process.env.OSB_EVIDENCE_DIR ?? join('test-results', 'shots');
mkdirSync(EVIDENCE, { recursive: true });

for (const theme of ['light', 'dark'] as const) {
  test(`#72 question prose never silently confirms Stage or Jurisdiction (${theme})`, async ({ page }, testInfo) => {
    if (testInfo.project.name === 'desktop') {
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await page.addInitScript((value) => localStorage.setItem('osb-theme', value), theme);
    await page.goto('http://127.0.0.1:3110/', { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

    const question = 'I have a software prototype in Gympie. What should I do next for support?';
    const draft = page.locator('textarea#question');
    await draft.fill(question);
    await page.getByRole('button', { name: 'Ask the planner' }).click();
    await expect(page.locator('#results-heading')).not.toHaveText(/Working on your question|will appear here/);
    await expect(draft).toHaveValue(question);

    const situation = page.locator('section[aria-labelledby="context-heading"]');
    await expect(situation.locator('.context-guidance strong')).toHaveText(
      'Your question and confirmed situation are separate.',
    );
    await expect(situation.locator('.context-guidance')).toContainText(
      'A town or prototype in your question won\'t fill these chips.',
    );
    await expect(situation.locator('.context-guidance')).toContainText(
      '“Not set” may be asked once; “Unknown” is a saved answer.',
    );
    // Owner decision, 11 November 2026: the approved SB1 non-inference statement covers
    // personal status as well as IP (docs/ux/sb1-student.svg).
    await expect(situation.locator('.context-guidance')).toContainText(
      'Personal status and IP ownership are never assumed.',
    );
    const stage = situation.getByRole('button', { name: 'Stage: Not set. Edit' });
    await expect(stage).toBeVisible();
    await expect(situation.getByRole('button', { name: 'Jurisdiction: Not set. Edit' })).toBeVisible();

    // Check the actual rendered helper at the requested phone/desktop width and theme.
    await page.evaluate(() => document.fonts.ready);
    const viewport = page.viewportSize()!;
    const guideBounds = await situation.locator('.context-guidance').boundingBox();
    expect(guideBounds).not.toBeNull();
    expect(guideBounds!.x).toBeGreaterThanOrEqual(0);
    expect(guideBounds!.x + guideBounds!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({
      path: join(EVIDENCE, `${testInfo.project.name}-context72-${theme}-not-set.png`),
      fullPage: true,
    });

    // Deliberate keyboard confirmation (rather than inference from the submitted question).
    await stage.focus();
    await expect(stage).toBeFocused();
    await page.keyboard.press('Enter');
    const prototype = situation.getByRole('radio', { name: 'Working prototype', exact: true });
    await expect(prototype).toBeVisible();
    await prototype.focus();
    await page.keyboard.press('Space');
    await situation.getByRole('button', { name: 'Save stage' }).click();
    await expect(situation.getByRole('button', { name: 'Stage: Working prototype. Edit' })).toBeVisible();
    await expect(draft).toHaveValue(question);

    await situation.getByRole('button', { name: 'Jurisdiction: Not set. Edit' }).focus();
    await page.keyboard.press('Enter');
    const unknown = situation.getByRole('radio', { name: 'Unknown', exact: true });
    await unknown.focus();
    await page.keyboard.press('Space');
    await expect(unknown).toBeChecked();
    await situation.getByRole('button', { name: 'Save jurisdiction' }).click();
    await expect(situation.getByRole('button', { name: 'Jurisdiction: Unknown. Edit' })).toBeVisible();
    await expect(draft).toHaveValue(question);
    await page.screenshot({
      path: join(EVIDENCE, `${testInfo.project.name}-context72-${theme}-confirmed.png`),
      fullPage: true,
    });

    // A new question clears only the draft and answer, not deliberately saved context.
    await page.getByRole('button', { name: 'Start a new question' }).click();
    await expect(draft).toHaveValue('');
    await expect(situation.getByRole('button', { name: 'Stage: Working prototype. Edit' })).toBeVisible();
    await expect(situation.getByRole('button', { name: 'Jurisdiction: Unknown. Edit' })).toBeVisible();
  });
}
