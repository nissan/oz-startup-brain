import type { INestApplication } from '@nestjs/common';
import { createOzsbClient } from '@ozsb/api-client';
import { harnessEnv, startApi, testKeys } from './helpers';

/**
 * API10 standalone portion: the generated client, validating every response against the v1
 * contract, talks to the real NestJS application over HTTP. (The website half of API10 waits for #25.)
 */
describe('generated client against the fixture API', () => {
  let app: INestApplication;
  let baseUrl: string;
  const keys = testKeys();

  beforeAll(async () => {
    ({ app } = await startApi(harnessEnv(keys.records)));
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });
  afterAll(() => app.close());

  it('covers every v1 operation with contract-valid responses', async () => {
    const c = createOzsbClient({ baseUrl, apiKey: keys.full });
    expect((await c.live()).ok).toBe(true);
    const caps = await c.capabilities();
    expect(caps.ok && caps.data.credential_mode).toBe('development');
    for (const body of [
      { question: 'What should I do next for support?' },
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' as const } },
      { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'QLD' as const, stage: 'prototype' as const } },
      { question: 'What does round A2 require today?' },
      { question: 'Is round A1 open?' },
      { question: 'Is round B1 open?' },
      { question: 'How do I bake sourdough bread?' },
    ]) {
      const r = await c.query(body);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.requestId).toBe(r.data.request_id);
    }
    for (const id of ['src_progA_overview', 'src_founder_guide', 'src_rejected_mirror']) expect((await c.source(id)).ok).toBe(true);
  });

  it('surfaces 401 and 403 as documented errors', async () => {
    const wrong = createOzsbClient({ baseUrl, apiKey: keys.revoked });
    expect(await wrong.query({ question: 'Is round A1 open?' })).toMatchObject({ ok: false, status: 401, error: { code: 'unauthenticated' } });
    const narrow = createOzsbClient({ baseUrl, apiKey: keys.sourcesOnly });
    expect(await narrow.query({ question: 'Is round A1 open?' })).toMatchObject({ ok: false, status: 403, error: { code: 'insufficient_scope' } });
  });
});
