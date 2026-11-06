import 'server-only';
import { ContractViolationError } from '@ozsb/api-client';
import { check, type ErrorResponse } from '@ozsb/contracts';
import { apiClient, BffConfigError } from './api';

/**
 * Thin BFF (ADR 001): forwards validated business inputs to fixed API operations, strips anything
 * else, and returns the API's own documented shapes. It holds no business rules: freshness,
 * applicability, clarification and coverage are decided by the API and rendered as received.
 */
export type BffError = { error: { code: BffErrorCode; message: string; request_id: string | null; retry_after_seconds?: number; details?: { path: string; issue: string }[] } };
export type BffErrorCode = ErrorResponse['error']['code'] | 'bff_invalid_request' | 'bff_upstream_unreachable' | 'bff_upstream_credential' | 'bff_contract_violation' | 'bff_not_configured';

const MAX_BODY_BYTES = 16_384;

function errorJson(status: number, body: BffError, retryAfter?: number): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (body.error.request_id) headers['x-request-id'] = body.error.request_id;
  if (retryAfter !== undefined) headers['retry-after'] = String(retryAfter);
  return new Response(JSON.stringify(body), { status, headers });
}

function okJson(status: number, data: unknown, requestId: string | null): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (requestId) headers['x-request-id'] = requestId;
  return new Response(JSON.stringify(data), { status, headers });
}

/** Maps a failed call to the browser-facing response without leaking the credential or internals. */
function fromFailure(e: unknown): Response {
  if (e instanceof BffConfigError) return errorJson(503, { error: { code: 'bff_not_configured', message: 'The planner is not configured to reach its API.', request_id: null } });
  if (e instanceof ContractViolationError) return errorJson(502, { error: { code: 'bff_contract_violation', message: 'The API returned something outside the published contract, so nothing is shown.', request_id: null } });
  return errorJson(503, { error: { code: 'bff_upstream_unreachable', message: 'The planner could not reach its API. Nothing was answered.', request_id: null } });
}

/** The API's own documented errors pass through, except credential failures, which are the server's fault, never the founder's. */
function fromApiError(status: number, requestId: string | null, error: ErrorResponse['error']): Response {
  if (status === 401 || status === 403) {
    return errorJson(502, { error: { code: 'bff_upstream_credential', message: 'The planner’s own API credential was rejected. This is a server configuration problem, not something you can fix from here.', request_id: requestId } });
  }
  return errorJson(status, { error: { ...error, request_id: requestId } }, error.retry_after_seconds);
}

/**
 * Reads the body counting the bytes actually received, so a chunked request without a
 * Content-Length (or with a false one) cannot exceed the limit. Reading stops and the stream is
 * cancelled as soon as the limit is passed, before any JSON parsing or forwarding.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<{ ok: true; text: string } | { ok: false; tooLarge: boolean }> {
  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) return { ok: false, tooLarge: true };
  if (!request.body) return { ok: true, text: '' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, tooLarge: false };
  }
  const all = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder('utf-8', { fatal: false }).decode(all) };
}

export async function handleQuery(request: Request): Promise<Response> {
  const read = await readBodyLimited(request, MAX_BODY_BYTES);
  if (!read.ok && read.tooLarge) return errorJson(413, { error: { code: 'payload_too_large', message: 'The question is too long.', request_id: null } });
  let body: unknown;
  try {
    if (!read.ok) throw new Error('unreadable');
    body = JSON.parse(read.text);
  } catch {
    return errorJson(400, { error: { code: 'bff_invalid_request', message: 'The request body is not valid JSON.', request_id: null } });
  }
  // Validate against the contract here so a malformed browser request never reaches the API, and
  // only the two documented fields are forwarded: client-supplied consumer IDs, scopes or anything
  // else are dropped by construction.
  const issues = check('QueryRequest', body);
  if (issues.length) return errorJson(400, { error: { code: 'bff_invalid_request', message: 'The request does not satisfy QueryRequest.', request_id: null, details: issues } });
  const { question, confirmed_context } = body as { question: string; confirmed_context?: Record<string, string> };
  const forwarded = confirmed_context ? { question, confirmed_context } : { question };
  try {
    const r = await apiClient().query(forwarded);
    return r.ok ? okJson(200, r.data, r.requestId) : fromApiError(r.status, r.requestId, r.error);
  } catch (e) {
    return fromFailure(e);
  }
}

export async function handleSource(sourceId: string): Promise<Response> {
  if (!/^src_[a-z0-9_]+$/.test(sourceId)) return errorJson(400, { error: { code: 'bff_invalid_request', message: 'Not a source ID.', request_id: null } });
  try {
    const r = await apiClient().source(sourceId);
    return r.ok ? okJson(200, r.data, r.requestId) : fromApiError(r.status, r.requestId, r.error);
  } catch (e) {
    return fromFailure(e);
  }
}

export async function handleCapabilities(): Promise<Response> {
  try {
    const r = await apiClient().capabilities();
    return r.ok ? okJson(200, r.data, r.requestId) : fromApiError(r.status, r.requestId, r.error);
  } catch (e) {
    return fromFailure(e);
  }
}
