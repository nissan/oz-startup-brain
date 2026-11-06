import { ContractViolationError, createOzsbClient } from '../src/index';

/** API10: the generated client refuses a response that drifted from the published contract. */
const KEY = 'ozsb_000000000000_' + 'A'.repeat(43);
const respond = (status: number, body: unknown) => async (req: Request) => {
  expect(req.headers.get('x-api-key')).toBe(KEY);
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-request-id': 'req_0123456789abcdef' } });
};

const liveness = { status: 'ok' };
const error = { error: { code: 'unauthenticated', message: 'A valid API key is required.', request_id: 'req_0123456789abcdef' } };

describe('generated client', () => {
  it('returns typed data for a valid response and keeps the request ID', async () => {
    const c = createOzsbClient({ baseUrl: 'http://api.invalid', apiKey: KEY, fetch: respond(200, liveness) });
    await expect(c.live()).resolves.toEqual({ ok: true, status: 200, requestId: 'req_0123456789abcdef', data: liveness });
  });

  it('returns documented errors as ok:false with the stable code', async () => {
    const c = createOzsbClient({ baseUrl: 'http://api.invalid', apiKey: KEY, fetch: respond(401, error) });
    const r = await c.query({ question: 'Is round A1 open?' });
    expect(r).toMatchObject({ ok: false, status: 401, error: { code: 'unauthenticated' } });
  });

  it('throws ContractViolationError when a required response field is missing', async () => {
    const drifted = { schema_version: '2.0.0', status: 'answer' };
    const c = createOzsbClient({ baseUrl: 'http://api.invalid', apiKey: KEY, fetch: respond(200, drifted) });
    await expect(c.query({ question: 'Is round A1 open?' })).rejects.toBeInstanceOf(ContractViolationError);
    const e = (await c.query({ question: "Is round A1 open?" }).catch((x: unknown) => x)) as ContractViolationError;
    expect(e.issues.map((i: { path: string }) => i.path)).toEqual(expect.arrayContaining(['/corpus_version', '/request_id', '/schema_version']));
  });

  it('rejects an error body outside the ErrorResponse shape', async () => {
    const c = createOzsbClient({ baseUrl: 'http://api.invalid', apiKey: KEY, fetch: respond(500, { message: 'stack trace here' }) });
    await expect(c.capabilities()).rejects.toBeInstanceOf(ContractViolationError);
  });
});
