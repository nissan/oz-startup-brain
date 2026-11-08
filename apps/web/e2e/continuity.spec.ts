import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://127.0.0.1:3110';
const A2 = 'What does round A2 require today?';
const GYMPIE = 'I am building a software prototype in Gympie. I need a local or remote support route, not a long national list.';
const T03 = 'Which step is required now, which is a suggestion, and what is still unknown?';
const T05 = 'If there is no evidence for my area, show the next useful place to check.';
const generic = 'What should I do next for support?';
type Body = { question: string; previous_question?: string; confirmed_context?: Record<string, string> };
async function open(page: Page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const sent: Body[] = [];
  page.on('request', (r) => { if (r.url().endsWith('/api/bff/query')) sent.push(r.postDataJSON()); });
  return sent;
}
async function ask(page: Page, q: string) {
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill(q);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/bff/query'));
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await response;
  await expect(page.locator('#results-heading')).not.toHaveText('Working on your question');
}
async function stage(page: Page) {
  await page.getByRole('button', { name: /Stage: .*Edit/ }).click();
  await page.locator('.context-editor__option', { hasText: 'Working prototype' }).click();
  await page.getByRole('button', { name: 'Save stage' }).click();
}
async function reset(page: Page) {
  await page.getByRole('button', { name: 'Start a new question', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Your question', exact: true })).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Your question', exact: true })).toHaveValue('');
  await expect(page.locator('#results-heading')).toHaveText('Your next steps will appear here');
  await expect(page.locator('.evidence-panel,.stale,.summary')).toHaveCount(0);
}

test('T03/T05 preserve topic; one preceding turn, ambiguous switch and explicit reset stay conservative', async ({ page }) => {
  const sent = await open(page);
  await ask(page, A2); await ask(page, T03);
  expect(sent.at(-1)?.previous_question).toBe(A2);
  await expect(page.locator('.summary')).toContainText('Continuing with Round A2.');
  await ask(page, 'Which step is required now?');
  expect(sent.at(-1)?.previous_question).toBe(T03);
  await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
  await ask(page, T03); expect(sent.at(-1)?.previous_question).toBeUndefined();
  await ask(page, GYMPIE);
  // Gympie is not a jurisdiction inference, including after an explicit Unknown choice.
  if (await page.getByRole('button', { name: 'Keep as unknown' }).isVisible()) {
    await page.getByRole('button', { name: 'Keep as unknown' }).click();
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
  }
  await ask(page, T05);
  await expect(page.locator('.summary')).toContainText('Continuing with Gympie.');
  await expect(page.locator('.conditions')).toContainText('Gympie');
  await ask(page, 'Is round A2 or B1 open?');
  await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
  await reset(page);
  await ask(page, generic); expect(sent.at(-1)?.previous_question).toBeUndefined();
});

test('pre-dispatch validation preserves eligibility; context edits reask the active snapshot and preserve an unsent draft', async ({ page }) => {
  const sent = await open(page);
  await ask(page, A2);
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('  ');
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await expect(page.locator('.ask__error')).toContainText('Type a question first');
  expect(sent).toHaveLength(1);
  await ask(page, T03); expect(sent.at(-1)?.previous_question).toBe(A2);
  const draft = 'Is round B1 open?';
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill(draft); await stage(page);
  await expect(page.locator('.summary')).toContainText('Continuing with Round A2.');
  await expect.poll(() => sent.length).toBe(3);
  expect(sent.at(-1)).toMatchObject({ question: T03, previous_question: A2, confirmed_context: { stage: 'prototype' } });
  await expect(page.getByRole('textbox', { name: 'Your question', exact: true })).toHaveValue(draft);
  await expect(page.getByTestId('answered-question')).toContainText(T03);
  if (process.env.OSB_EVIDENCE_DIR) await page.screenshot({ path: join(process.env.OSB_EVIDENCE_DIR, `${test.info().project.name}-edited-draft.png`), fullPage: true });
  await reset(page);
  await expect(page.getByRole('button', { name: /Stage: Working prototype/ })).toBeVisible();
  await ask(page, A2); expect(sent.at(-1)?.previous_question).toBeUndefined();
  await page.reload(); await ask(page, T03); expect(sent.at(-1)?.previous_question).toBeUndefined();
  await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
});

test('clarification and insufficient evidence never become antecedents; context reask preserves the submitted question', async ({ page }) => {
  const sent = await open(page);
  await ask(page, generic);
  await expect(page.locator('#results-heading')).toHaveText('One detail first');
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('unsent draft');
  await page.getByRole('button', { name: 'Keep as unknown' }).click();
  await expect(page.locator('#results-heading')).toHaveText('Your next steps');
  expect(sent.at(-1)).toEqual({ question: generic, confirmed_context: { jurisdiction: 'unknown' } });
  await expect(page.getByRole('textbox', { name: 'Your question', exact: true })).toHaveValue('unsent draft');
  await ask(page, T03); // incompatible generic antecedent -> subject gap
  const previous = sent.at(-1)?.previous_question;
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('another draft'); await stage(page);
  await expect.poll(() => sent.length).toBe(4);
  expect(sent.at(-1)).toMatchObject({ question: T03, previous_question: previous });
  await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
  await ask(page, T03); expect(sent.at(-1)?.previous_question).toBeUndefined();
  await reset(page); await ask(page, generic);
  // Confirmed Unknown is retained by reset; reload clears it and creates a new clarification.
  await page.reload(); await ask(page, generic); await ask(page, T03);
  expect(sent.at(-1)?.previous_question).toBeUndefined();
});

test('transport failures keep retry snapshots; different new questions cannot borrow a stale answer', async ({ page }) => {
  const sent = await open(page);
  await ask(page, A2);
  let fail = true;
  await page.route('**/api/bff/query', async (route) => {
    if (fail) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'retrieval_timeout' } }) });
    else await route.continue();
  });
  await ask(page, T03); await expect(page.locator('.stale')).toBeVisible();
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('unsent different draft');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(() => sent.length).toBe(3);
  expect(sent.at(-1)).toMatchObject({ question: T03, previous_question: A2 });
  await expect(page.locator('#results-heading')).toHaveText('The planner could not answer');
  await stage(page); await expect.poll(() => sent.length).toBe(4);
  expect(sent.at(-1)).toMatchObject({ question: T03, previous_question: A2, confirmed_context: { stage: 'prototype' } });
  await expect(page.locator('#results-heading')).toHaveText('The planner could not answer');
  fail = false;
  await ask(page, '  ' + T03 + '  '); expect(sent.at(-1)?.previous_question).toBe(A2);
  await expect(page.locator('.summary')).toContainText('Continuing with Round A2.');
  fail = true; await ask(page, T03);
  fail = false; await ask(page, 'Is round B1 open?');
  expect(sent.at(-1)?.previous_question).toBeUndefined();
  await expect(page.locator('.summary')).not.toContainText('Continuing');
});

test('pending context, superseding Ask, reset and late responses use the newest generation only', async ({ page }) => {
  const sent = await open(page);
  await ask(page, A2);
  const releases: (() => void)[] = [];
  await page.route('**/api/bff/query', async (route) => {
    const response = await route.fetch();
    await new Promise<void>((resolve) => releases.push(resolve));
    await route.fulfill({ response });
  });
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill(T03);
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await expect.poll(() => releases.length).toBe(1);
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('unsent draft'); await stage(page);
  await expect.poll(() => releases.length).toBe(2);
  expect(sent.at(-1)).toMatchObject({ question: T03, previous_question: A2, confirmed_context: { stage: 'prototype' } });
  releases[1](); await expect(page.locator('.summary')).toContainText('Continuing with Round A2.');
  releases[0]();
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill(A2);
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await expect.poll(() => releases.length).toBe(3);
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('Is round B1 open?');
  await page.getByRole('textbox', { name: 'Your question', exact: true }).press('Control+Enter');
  await expect.poll(() => releases.length).toBe(4);
  expect(sent.at(-1)?.previous_question).toBeUndefined();
  releases[3](); await expect(page.locator('#results-heading')).toHaveText('Your next steps');
  releases[2]();
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill(A2);
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await expect.poll(() => releases.length).toBe(5);
  await reset(page); releases[4]();
  await page.unrouteAll({ behavior: 'wait' });
  await expect(page.locator('#results-heading')).toHaveText('Your next steps will appear here');
  await ask(page, T03); expect(sent.at(-1)?.previous_question).toBeUndefined();
});

for (const theme of ['light', 'dark'] as const) {
  test(`visual continuity/reset review in ${theme} theme, real fixture API`, async ({ page }, info) => {
    await page.addInitScript((t) => localStorage.setItem('osb-theme', t), theme);
    await open(page);
    const widths = info.project.name === 'desktop' ? [1440, 1280] : [390];
    const dir = process.env.OSB_EVIDENCE_DIR ?? 'test-results/continuity'; mkdirSync(dir, { recursive: true });
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await ask(page, A2); await ask(page, T03);
      await expect(page.locator('.summary')).toContainText('Continuing with Round A2.');
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: join(dir, `${width}-${theme}-a2.png`), fullPage: true });
      await ask(page, GYMPIE); await ask(page, T05);
      await expect(page.locator('.summary')).toContainText('Continuing with Gympie.');
      await page.screenshot({ path: join(dir, `${width}-${theme}-gympie.png`), fullPage: true });
      await ask(page, 'What is the next useful place to check?');
      await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
      await page.screenshot({ path: join(dir, `${width}-${theme}-subject-gap.png`), fullPage: true });
      await reset(page);
      await page.screenshot({ path: join(dir, `${width}-${theme}-reset.png`), fullPage: true });
    }
  });
}

test('Unicode validation counts code points and leaves the previous answer eligible after a rejected draft', async ({ page }) => {
  const sent = await open(page);
  await ask(page, A2);
  await page.getByRole('textbox', { name: 'Your question', exact: true }).fill('😀'.repeat(2001));
  await page.getByRole('button', { name: 'Ask the planner', exact: true }).click();
  await expect(page.locator('.ask__error')).toContainText('this one is 2001');
  expect(sent).toHaveLength(1);
  await ask(page, '😀'.repeat(2000));
  expect(sent.at(-1)?.previous_question).toBe(A2);
  expect(Array.from(sent.at(-1)!.question)).toHaveLength(2000);
  await expect(page.locator('#question-count')).toHaveText('2000/2000');
});

test('reset discards delayed source records as well as answer state', async ({ page }) => {
  await open(page);
  let release: (() => void) | undefined;
  let requests = 0;
  await page.route('**/api/bff/sources/*', async (route) => {
    requests++;
    if (requests === 1) {
      const response = await route.fetch();
      await new Promise<void>((resolve) => { release = resolve; });
      await route.fulfill({ response });
    } else await route.continue();
  });
  await ask(page, A2);
  await expect.poll(() => !!release).toBe(true);
  await reset(page); release!();
  await page.unrouteAll({ behavior: 'wait' });
  let newRequests = 0;
  page.on('request', (r) => { if (r.url().includes('/api/bff/sources/')) newRequests++; });
  await ask(page, A2);
  await expect.poll(() => newRequests).toBeGreaterThan(0);
});
