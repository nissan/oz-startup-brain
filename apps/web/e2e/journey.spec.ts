import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The founder journey in a real browser against the built app and a real fixture API. Each
 * server pair is started by playwright.config.ts; the fault pairs exist because faults are local
 * process configuration, never a page control. Screenshots go to the evidence folder when
 * OSB_EVIDENCE_DIR is set (the committed before/after set), otherwise to test-results.
 */
const WEB = { fixture: 'http://127.0.0.1:3110', vector: 'http://127.0.0.1:3111', budget: 'http://127.0.0.1:3112', graph: 'http://127.0.0.1:3113' };
const EVIDENCE = process.env.OSB_EVIDENCE_DIR ?? join('test-results', 'shots');
mkdirSync(EVIDENCE, { recursive: true });
const KEY_SHAPE = /ozsb_[a-z0-9]{8,32}_[A-Za-z0-9_-]{43}/;

async function open(page: Page, base: string, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('osb-theme', t), theme);
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function ask(page: Page, question: string) {
  await page.getByLabel('Your question').fill(question);
  await page.getByRole('button', { name: 'Ask the planner' }).click();
  await expect(page.locator('#results-heading')).not.toHaveText(/Working on your question|will appear here/);
}

const shot = (page: Page, name: string, full = true) => page.screenshot({ path: join(EVIDENCE, `${test.info().project.name}-${name}.png`), fullPage: full });

test.describe('journey', () => {
  test('question -> clarification -> explicit Unknown -> dated steps, with the key never reaching the browser', async ({ page }) => {
    const bodies: string[] = [];
    page.on('response', async (r) => {
      const ct = r.headers()['content-type'] ?? '';
      if (/json|javascript|html|css/.test(ct)) bodies.push(await r.text().catch(() => ''));
    });
    page.on('request', (r) => expect(JSON.stringify([r.url(), r.headers(), r.postData() ?? ''])).not.toMatch(KEY_SHAPE));
    await open(page, WEB.fixture, 'light');
    await expect(page.getByText('Local fixture mode')).toBeVisible();
    await expect(page.getByText('Development mode')).toBeVisible();
    await expect(page.getByText(/corpus fixture-2026-11-07\.1/)).toBeVisible();
    await shot(page, 'initial-light', false);

    await ask(page, 'What should I do next for support?');
    await expect(page.locator('#results-heading')).toHaveText('One detail first');
    await expect(page.getByRole('button', { name: 'Keep as unknown' })).toBeVisible();
    await shot(page, 'clarification-light');

    await page.getByRole('button', { name: 'Keep as unknown' }).click();
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
    // Never asked again, the chip says Unknown by choice, and the left-out routes are named.
    await expect(page.getByRole('button', { name: /Jurisdiction: Unknown\. Edit/ })).toBeVisible();
    await expect(page.getByText('Left out because a field is Unknown')).toBeVisible();
    await expect(page.locator('.conditions').getByText(/Book a session with the regional innovation hub/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Book a session with the regional innovation hub' })).toHaveCount(0);
    await expect(page.getByRole('article')).toHaveCount(2);
    await shot(page, 'answer-unknown-light');

    // Editing the assumption re-asks with the new context (SC02): the Queensland route appears.
    await page.getByRole('button', { name: /Jurisdiction: Unknown\. Edit/ }).click();
    await page.locator('.context-editor__option', { hasText: 'Queensland' }).click();
    await page.getByRole('button', { name: 'Save jurisdiction' }).click();
    await expect(page.getByRole('heading', { name: 'Book a session with the regional innovation hub' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Jurisdiction: Queensland\. Edit/ })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(3);
    await expect(page.getByText('Left out because a field is Unknown')).toHaveCount(0);

    // Evidence: source, version and verification date; rights-gated excerpt; every claim dated.
    const panel = page.locator('.evidence-panel:visible');
    await expect(panel.getByText('Book a founder session (fictional)')).toBeVisible();
    await expect(panel.getByText('10 October 2026').first()).toBeVisible();
    await expect(panel.locator('blockquote')).toContainText('free one-to-one founder sessions');
    await expect(panel.getByText('In effect now')).toBeVisible();
    await expect(page.getByRole('img', { name: /Prerequisite sequence/ })).toBeVisible();
    await expect(page.locator('.osb-map__list').getByText('Suggested next step').first()).toBeVisible();
    await shot(page, 'answer-qld-light');

    // The IP editorial prerequisite still uses the uncleared founder guide. Select it by
    // meaning, not action position: the university contact action now has a cleared source.
    await page.getByRole('button', { name: 'Show evidence for step 1: Confirm IP ownership', exact: true }).click();
    const editorialPanel = page.locator('.evidence-panel--step');
    await expect(editorialPanel).toContainText('Before you chase a named program (fictional sample article)');
    await expect(editorialPanel).toContainText('Excerpt not shown: this source is not cleared');
    await expect(editorialPanel.locator('.evidence-panel__heading')).toBeFocused();

    expect(bodies.join('\n')).not.toMatch(KEY_SHAPE);
  });

  test('future-effective requirement is dated and excluded; closed round abstains; stale evidence is never current', async ({ page }) => {
    await open(page, WEB.fixture, 'dark');
    await ask(page, 'What does round A2 require today?');
    const futureConditions = page.locator('.conditions__item').filter({ hasText: 'Takes effect later' });
    await expect(futureConditions).toHaveCount(2);
    await expect(futureConditions).toContainText([
      /Takes effect from 1 December 2026: .* It is not a requirement or action today\./,
      /Takes effect from 1 December 2026: .* It is not a prerequisite today\./,
    ]);
    await expect(page.getByRole('heading', { name: /security assessment/ })).toHaveCount(0);
    await expect(page.locator('.osb-map__list')).not.toContainText(/security assessment/i);
    const eligibilityPanel = page.locator('.evidence-panel:visible');
    await expect(eligibilityPanel.getByText('In effect now')).toBeVisible();
    await expect(eligibilityPanel.getByText('from 15 October 2026', { exact: true })).toBeVisible();
    await expect(eligibilityPanel.getByText('Effective date not stated')).toHaveCount(0);
    await shot(page, 'a2-dark');

    await ask(page, 'Is round A1 open?');
    await expect(page.getByText(/has closed/)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Prepare a Round A1 application/ })).toHaveCount(0);

    await ask(page, 'Is round B1 open?');
    await expect(page.getByRole('article').first().getByText('Needs a current check')).toBeVisible();
    await expect(page.getByText(/cannot confirm whether Round B1/)).toBeVisible();
    await expect(page.locator('.summary')).not.toHaveText(/^Round B1 of Program B is open/);
  });

  test('insufficient evidence is a result, not an error, and keeps the question', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await ask(page, 'How do I bake sourdough bread?');
    await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
    await expect(page.getByText('Outside current coverage')).toBeVisible();
    await expect(page.getByLabel('Your question')).toHaveValue('How do I bake sourdough bread?');
    await page.getByRole('button', { name: 'Change my question' }).click();
    await expect(page.getByLabel('Your question')).toBeFocused();
  });

  test('an empty question is refused in place', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await page.getByRole('button', { name: 'Ask the planner' }).click();
    await expect(page.locator('.ask__error')).toHaveText('Type a question first.');
    await expect(page.locator('.ask__error')).toHaveAttribute('role', 'alert');
    await expect(page.getByLabel('Your question')).toBeFocused();
  });
});

test.describe('keyboard', () => {
  test('the whole route is operable by keyboard with a visible focus ring', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await page.getByLabel('Your question').focus();
    await page.keyboard.type('What should I do next for support?');
    await page.keyboard.press('Control+Enter');
    await expect(page.locator('#results-heading')).toHaveText('One detail first');
    await expect(page.locator('#results-heading')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Australian Capital Territory' })).toBeFocused();
    for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Queensland' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
    await expect(page.locator('#results-heading')).toBeFocused();
    await page.keyboard.press('Tab');
    const inspect = page.getByRole('article').first().getByRole('button', { name: 'Show supporting passage' });
    await expect(inspect).toBeFocused();
    const ring = await inspect.evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth);
    expect(ring).toMatch(/solid 2px/);
    await page.keyboard.press('Enter');
    await expect(page.locator('.evidence-panel__heading:visible')).toBeFocused();
    // Shift+Tab goes to the previous control in document order: on phones the inline panel sits inside
    // the opened card, so that is the same button; on wide screens the aside follows the editorial terms help.
    await page.keyboard.press('Shift+Tab');
    const width = page.viewportSize()!.width;
    const previous = width < 880 ? inspect : page.locator('.terms-help > summary');
    await expect(previous).toBeFocused();
  });
});

test.describe('faults (local harness configuration)', () => {
  test('vector_timeout: outage panel, draft kept, earlier answer labelled stale', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await ask(page, 'Is round A1 open?');
    await expect(page.getByText(/has closed/)).toBeVisible();
    // Point the same page at the faulting pair by swapping the BFF origin: a new tab on the vector
    // pair starts fresh, so instead assert the fresh outage here and the stale label on the fixture pair.
    await page.goto(WEB.vector + '/', { waitUntil: 'networkidle' });
    await ask(page, 'Is round A1 open?');
    await expect(page.locator('#results-heading')).toHaveText('The planner could not answer');
    await expect(page.getByText('Source retrieval did not finish')).toBeVisible();
    await expect(page.getByText('Your draft, kept')).toBeVisible();
    await expect(page.getByLabel('Your question')).toHaveValue('Is round A1 open?');
    await expect(page.getByText('Source retrieval unavailable')).toBeVisible();
    await shot(page, 'fault-vector-light');
  });

  test('budget_exhausted: budget panel with retry information and the draft', async ({ page }) => {
    await open(page, WEB.budget, 'dark');
    await ask(page, 'Is round A1 open?');
    await expect(page.getByText('Today’s query allowance is used up')).toBeVisible();
    await expect(page.getByText(/waiting about \d+ seconds/)).toBeVisible();
    await expect(page.getByText('Daily budget reached')).toBeVisible();
    await expect(page.getByText('Your draft, kept')).toBeVisible();
    await shot(page, 'fault-budget-dark');
  });

  test('graph_unavailable: answer from passages, sequence left out, service notice', async ({ page }) => {
    await open(page, WEB.graph, 'light');
    await ask(page, 'What should I do next for support?');
    await page.getByRole('button', { name: 'Keep as unknown' }).click();
    await expect(page.getByText('Graph unavailable: passage evidence only')).toBeVisible();
    await expect(page.getByText('left out rather than guessed')).toBeVisible();
    await expect(page.getByRole('img', { name: /Prerequisite sequence/ })).toHaveCount(0);
    await expect(page.getByRole('article').first()).toBeVisible();
    await shot(page, 'fault-graph-light');
  });

  test('a stale earlier answer stays visible and labelled when a later request fails', async ({ page }) => {
    // The fixture pair answers, then the BFF is made to fail by blocking the query route in the browser.
    await open(page, WEB.fixture, 'light');
    await ask(page, 'Is round A1 open?');
    await expect(page.getByText(/has closed/)).toBeVisible();
    await page.route('**/api/bff/query', (route) => route.abort('connectionrefused'));
    await ask(page, 'Is round B1 open?');
    await expect(page.locator('.stale')).toContainText('Stale');
    await expect(page.locator('.stale')).toContainText('Is round A1 open?');
    await expect(page.getByText(/has closed/)).toBeVisible();
    await expect(page.getByText('Your draft, kept')).toBeVisible();
    await expect(page.getByLabel('Your question')).toHaveValue('Is round B1 open?');
    await shot(page, 'stale-light');
  });
});

test.describe('fonts and layout', () => {
  test('intended fonts are painted, in both themes, at this viewport', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await open(page, WEB.fixture, theme);
      await page.evaluate(() => document.fonts.ready);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const expectations: [string, string][] = [
        ['.masthead__title', 'Fraunces'],
        ['.masthead__tagline', 'Atkinson Hyperlegible'],
        ['.osb-starter__title', 'Atkinson Hyperlegible'],
        ['.osb-mono', 'JetBrains Mono'],
      ];
      for (const [selector, family] of expectations) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        const painted = fonts.filter((f) => f.glyphCount > 0);
        expect(painted.length, `${selector} in ${theme}`).toBeGreaterThan(0);
        for (const f of painted) {
          expect(f.isCustomFont, `${selector} in ${theme} painted ${f.familyName}`).toBe(true);
          expect(f.familyName.replace(/ \(Fontations\)$/, ''), `${selector} in ${theme}`).toBe(family);
        }
      }
      await cdp.detach();
    }
  });

  test('no horizontal overflow and the evidence placement matches the width', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await ask(page, 'What should I do next for support?');
    await page.getByRole('button', { name: 'Keep as unknown' }).click();
    await expect(page.getByRole('article').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const width = page.viewportSize()!.width;
    if (width < 880) {
      await expect(page.locator('.evidence-panel--inline')).toBeVisible();
      await expect(page.locator('.evidence-panel--aside')).toBeHidden();
      // The inline panel sits inside the selected card's block, right under it.
      await expect(page.locator('.card--selected .evidence-panel--inline')).toBeVisible();
    } else {
      await expect(page.locator('.evidence-panel--aside')).toBeVisible();
      await expect(page.locator('.evidence-panel--inline')).toBeHidden();
    }
    await shot(page, 'answer-unknown-light-layout');
  });
});

test.describe('review R39 regressions', () => {
  test('R39-2: a chunked request with no Content-Length is limited by bytes received, at the real HTTP server', async () => {
    const http = await import('node:http');
    const send = (payload: string) =>
      new Promise<{ status: number; body: string }>((resolve, reject) => {
        const req = http.request('http://127.0.0.1:3110/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' } }, (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
        });
        req.on('error', reject);
        for (let i = 0; i < payload.length; i += 1024) req.write(payload.slice(i, i + 1024));
        req.end();
      });
    const q = JSON.stringify({ question: 'Is round A1 open?' });
    const over = await send(' '.repeat(20_000) + q);
    expect(over.status).toBe(413);
    expect(JSON.parse(over.body).error.code).toBe('payload_too_large');
    const under = await send(' '.repeat(10_000) + q);
    expect(under.status).toBe(200);
    expect(JSON.parse(under.body).status).toBe('answer');
  });

  test('R39-3: a context saved while the first request is pending replaces it; Unknown is not asked again', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    let calls = 0;
    await page.route('**/api/bff/query', async (route) => {
      calls += 1;
      // The first request is slow; the superseding one is fast, so the responses arrive out of order.
      if (calls === 1) await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });
    await page.getByLabel('Your question').fill('What should I do next for support?');
    await page.getByRole('button', { name: 'Ask the planner' }).click();
    await expect(page.locator('.waiting')).toBeVisible();
    await page.getByRole('button', { name: /Jurisdiction: Not set\. Edit/ }).click();
    await page.locator('.context-editor__option', { hasText: /^Unknown$/ }).click();
    await page.getByRole('button', { name: 'Save jurisdiction' }).click();
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
    await expect(page.getByRole('button', { name: /Jurisdiction: Unknown\. Edit/ })).toBeVisible();
    // Let the slow first response arrive; it must not replace the newer answer.
    await page.waitForTimeout(3000);
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
    await expect(page.getByRole('button', { name: 'Keep as unknown' })).toHaveCount(0);
    await expect(page.getByText('Left out because a field is Unknown')).toBeVisible();
    expect(calls).toBe(2);
  });

  test('R39-4: a prerequisite step that no action cites still opens its source, metadata and excerpt', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await ask(page, 'What should I do next for support?');
    await page.getByRole('button', { name: 'Queensland' }).click();
    await expect(page.getByRole('heading', { name: 'Book a session with the regional innovation hub' })).toBeVisible();
    const toggle = page.locator('.step-evidence__toggle').nth(2);
    await expect(toggle).toHaveText('Evidence for step 3');
    await expect(toggle).toHaveAccessibleName('Show evidence for step 3: Apply to an open Program A round');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Hide evidence for step 3: Apply to an open Program A round');
    const panel = page.locator('.evidence-panel--step');
    await expect(page.locator('#evidence-heading-step')).toBeFocused();
    await expect(panel.locator('[data-source-id="src_prog_a_overview"]')).toBeVisible();
    await expect(panel.getByText('Program A overview (fictional)')).toBeVisible();
    await expect(panel.getByText('28 October 2026').first()).toBeVisible();
    await expect(panel.locator('blockquote')).toContainText('Program A (fictional) supports Queensland founders');
    await expect(panel.getByText(/requires a working prototype/)).toBeVisible();
    await shot(page, 'step-evidence-light');
  });

  test('R39-5: waiting never claims completed work, and a later failure says so plainly', async ({ page }) => {
    await open(page, WEB.fixture, 'dark');
    await page.route('**/api/bff/query', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.abort('connectionrefused');
    });
    await page.getByLabel('Your question').fill('Is round A1 open?');
    await page.getByRole('button', { name: 'Ask the planner' }).click();
    const waiting = page.locator('.waiting');
    await expect(waiting).toBeVisible();
    await expect(waiting).toHaveAttribute('role', 'status');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Completed/)).toHaveCount(0);
    await expect(page.locator('.osb-wait')).toHaveCount(0);
    await expect(page.locator('#results-heading')).toHaveText('The planner could not answer');
    await expect(page.getByText('The planner cannot reach its sources')).toBeVisible();
    await expect(page.getByText('Your draft, kept')).toBeVisible();
  });

  test('Gympie static directory remains readable without horizontal overflow at 390px in both themes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ['light', 'dark'] as const) {
      await open(page, WEB.fixture, theme);
      await ask(page, 'What support is there in Gympie?');
      const panel = page.locator('.evidence-panel:visible');
      const directory = panel.locator('.claims__item').filter({ hasText: 'STATIC FICTIONAL SOURCE DIRECTORY' });
      await expect(directory).toBeVisible();
      // Keep both complete directory entries and their checks; hiding or truncating the claim
      // must not become a substitute for wrapping its long URLs.
      await expect(directory).toContainText('https://hubs.example.invalid/qld/sessions');
      await expect(directory).toContainText('https://support.example.invalid/src_university_contact');
      await expect(directory).toContainText('Verify locality, remote access, scope and current availability');
      await page.evaluate(() => document.fonts.ready);
      const bounds = await directory.evaluate((item) => {
        const claim = item.firstElementChild!;
        const rect = claim.getBoundingClientRect();
        const style = getComputedStyle(claim);
        return {
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          claimRight: rect.right,
          claimLeft: rect.left,
          claimOverflow: claim.scrollWidth - claim.clientWidth,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          textOverflow: style.textOverflow,
        };
      });
      expect(bounds.pageWidth, theme).toBeLessThanOrEqual(bounds.viewportWidth);
      expect(bounds.claimRight, theme).toBeLessThanOrEqual(bounds.viewportWidth);
      expect(bounds.claimLeft, theme).toBeGreaterThanOrEqual(0);
      expect(bounds.claimOverflow, theme).toBeLessThanOrEqual(1);
      expect(bounds.overflowX, theme).toBe('visible');
      expect(bounds.overflowY, theme).toBe('visible');
      expect(bounds.textOverflow, theme).not.toBe('ellipsis');
      await shot(page, `gympie-directory-${theme}-390`);
    }
  });

  for (const width of [390, 600, 1280]) {
    test(`R39-6: every prerequisite label fits inside the drawing at ${width}px, both themes`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark'] as const) {
        await open(page, WEB.fixture, theme);
        await ask(page, 'What should I do next for support?');
        await page.getByRole('button', { name: 'Queensland' }).click();
        await expect(page.getByRole('img', { name: /Prerequisite sequence/ })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.locator('.osb-map__svg').evaluate((svg: SVGSVGElement) => {
          const box = svg.viewBox.baseVal;
          return Array.from(svg.querySelectorAll('text')).map((t) => {
            const b = (t as SVGTextElement).getBBox();
            return { text: t.textContent, right: b.x + b.width, bottom: b.y + b.height, limitRight: box.x + box.width, limitBottom: box.y + box.height };
          }).filter((r) => r.right > r.limitRight || r.bottom > r.limitBottom);
        });
        expect(overflow, `${theme} at ${width}px`).toEqual([]);
        // The long label wraps onto two lines rather than being clipped.
        // Both long labels wrap onto two lines rather than being clipped.
        await expect(page.locator('.osb-map__svg text', { hasText: 'Gather evidence of' }).locator('tspan')).toHaveText(['Gather evidence of', 'customer interest']);
        await expect(page.locator('.osb-map__svg text', { hasText: 'Apply to an open' }).locator('tspan')).toHaveText(['Apply to an open Program A', 'round']);
        if (width === 390) await page.locator('.osb-map').screenshot({ path: join(EVIDENCE, `${test.info().project.name}-map-${theme}-${width}.png`) });
      }
    });
  }
});

test.describe('issue 46 plain-language evidence help (primed regression)', () => {
  test('A2 prototype separates requirement from preparation without changing dated evidence', async ({ page }) => {
    await open(page, WEB.fixture, 'light');
    await page.getByRole('button', { name: /Stage: Not set/ }).click();
    await page.locator('.context-editor__option', { hasText: /^Working prototype$/ }).click();
    await page.getByRole('button', { name: 'Save stage' }).click();
    await ask(page, 'What does round A2 require today?');
    const sequence = page.getByRole('region', { name: 'What comes first' });
    await expect(sequence).toContainText('A source-stated requirement says what must be in place before applying.');
    await expect(sequence).toContainText('A suggested preparation step helps you get ready; its place in this list is not an extra eligibility rule.');
    await expect(sequence).toContainText('For example, customer-interest evidence can appear in both: the requirement is to have it, and the preparation step is to gather it. That overlap is not a source disagreement.');
    await expect(sequence.locator('.osb-map__list')).toContainText('Suggested next step');
    await expect(page.locator('.conditions')).toContainText('1 December 2026');
    await page.getByRole('button', { name: /Show evidence for step 1:/ }).click();
    await expect(page.locator('#evidence-heading-step')).toBeFocused();
    await expect(page.locator('.evidence-panel--step blockquote').first()).toBeVisible();
    await page.getByRole('button', { name: /Show evidence for step 2:/ }).click();
    await expect(page.locator('.evidence-panel--step')).toContainText('Excerpt not shown: this source is not cleared');
  });

  test('T01 terms are keyboard-discoverable editorial help, not a checked claim or clarification', async ({ page }) => {
    await open(page, WEB.fixture, 'dark');
    await expect(page.getByText('Terms in plain language', { exact: true })).toHaveCount(0);
    await ask(page, 'What should I do next for support?');
    await expect(page.getByText('Terms in plain language', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Queensland', exact: true }).click();
    await expect(page.locator('#results-heading')).toHaveText('Your next steps');
    await expect(page.locator('#results-heading')).toBeFocused();
    const terms = page.locator('details').filter({ hasText: 'Terms in plain language' });
    const toggle = terms.locator('summary');
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(terms).toHaveAttribute('open', '');
    await expect(terms).toContainText('Editorial explanation — not a source excerpt or an eligibility check.');
    await expect(terms).toContainText('turning an idea or research into a product or service people can use or buy');
    await expect(terms).toContainText('does not establish IP ownership or eligibility');
    await expect(terms).toContainText('Whether it applies, what qualifies and how much are not established here');
    await expect(terms).not.toContainText(/Checked|\$|\d+%/);
    await expect(terms.locator('blockquote')).toHaveCount(0);
    expect(await toggle.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.keyboard.press('Space');
    await expect(terms).not.toHaveAttribute('open', '');
    await page.getByRole('article').first().getByRole('button', { name: 'Show supporting passage' }).click();
    await expect(page.locator('.evidence-panel__heading:visible')).toBeFocused();
  });
});

test('PR47 off-topic subject words do not trigger support clarification', async ({ page }) => {
  await open(page, WEB.fixture, 'light');
  for (const question of ['Is AI regulated in Australia?', 'Can I patent my prototype?', 'Which university ranks highest?', 'How do AI models work?']) {
    await ask(page, question);
    await expect(page.locator('#results-heading')).toHaveText('No answer from the evidence');
    await expect(page.getByRole('button', { name: 'Queensland', exact: true })).toHaveCount(0);
  }
});

// PR47 review regressions: no stale claim while a response is hidden during loading.
test('PR47 held follow-up hides earlier answer without claiming it is displayed', async ({ page }) => {
  await open(page, WEB.fixture, 'light');
  await ask(page, 'Is round A1 open?');
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/bff/query', async (route) => { await held; await route.continue(); });
  await page.getByLabel('Your question').fill('What does round A2 require today?');
  await page.getByRole('button', { name: 'Ask the planner' }).click();
  await expect(page.locator('.waiting')).toBeVisible();
  try {
    await expect(page.locator('.stale')).toHaveCount(0);
    await expect(page.getByText(/^Answer context —/)).toHaveCount(0);
  } finally { release(); }
  await expect(page.locator('#results-heading')).toHaveText('Your next steps');
  const context = page.getByText(/^Answer context —/);
  await expect(context).toBeVisible();
  await expect(context).not.toHaveAttribute('aria-label');
});

for (const width of [390, 768, 1280]) {
  test(`PR47 A2 and stage routes fit SVG bounds at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark'] as const) for (const stage of ['a2', 'idea', 'prototype'] as const) {
      await open(page, WEB.fixture, theme);
      if (stage !== 'a2') {
        await page.getByRole('button', { name: /Stage: Not set/ }).click();
        await page.locator('.context-editor__option', { hasText: stage === 'idea' ? /^Idea$/ : /^Working prototype$/ }).click();
        await page.getByRole('button', { name: 'Save stage' }).click();
      }
      await ask(page, stage === 'a2' ? 'What does round A2 require today?' : 'What should I do next for support?');
      if (stage !== 'a2') {
        await page.getByRole('button', { name: 'Queensland', exact: true }).click();
        await expect(page.locator('#results-heading')).toHaveText('Your next steps');
      }
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.locator('.osb-map__svg').evaluate((svg: SVGSVGElement) => {
        const box = svg.viewBox.baseVal;
        return Array.from(svg.querySelectorAll('text')).map((text) => {
          const b = (text as SVGTextElement).getBBox();
          return { text: text.textContent, x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height };
        }).filter((b) => b.x < box.x || b.y < box.y || b.right > box.x + box.width || b.bottom > box.y + box.height);
      });
      // Capture before assertion so the failing baseline also leaves its actual rendered defect.
      await page.locator('.results').screenshot({ path: join(EVIDENCE, `pr47-${test.info().project.name}-${stage}-${width}-${theme}.png`) });
      expect(overflow, `${stage} ${theme} ${width}`).toEqual([]);
    }
  });
}
