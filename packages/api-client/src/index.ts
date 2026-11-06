import createClient from 'openapi-fetch';
import { check, type DefinitionName } from '@ozsb/contracts';
import type { components, paths } from './generated/openapi';

export type { components, paths } from './generated/openapi';
type Schemas = components['schemas'];
export type QueryRequest = Schemas['QueryRequest'];
export type QueryEnvelope = Schemas['QueryEnvelope'];
export type Capabilities = Schemas['Capabilities'];
export type SourceRecord = Schemas['SourceRecord'];
export type ErrorResponse = Schemas['ErrorResponse'];

export interface OzsbClientOptions {
  /** e.g. http://127.0.0.1:3000 */
  baseUrl: string;
  /** A server-held key (`ozsb_<key_id>_<secret>`). Never ship it to a browser. */
  apiKey: string;
  fetch?: (input: Request) => Promise<Response>;
  /** Validate every response against the v1 contract (default true). */
  validate?: boolean;
}

export type Result<T> =
  | { ok: true; status: number; requestId: string | null; data: T }
  | { ok: false; status: number; requestId: string | null; error: ErrorResponse['error'] };

/** The server returned something outside the published v1 contract. */
export class ContractViolationError extends Error {
  constructor(
    readonly definition: DefinitionName,
    readonly issues: { path: string; issue: string }[],
  ) {
    super(`response does not satisfy ${definition}: ${issues.map((i) => `${i.path} ${i.issue}`).join('; ')}`);
  }
}

/**
 * Typed /v1 client generated from docs/api/openapi.json. Paid query POSTs are never retried
 * automatically (ADR 001). Domain results (answer, clarification, insufficient_evidence) are ok
 * results; documented errors come back as ok:false with the stable error code.
 */
export function createOzsbClient(options: OzsbClientOptions) {
  const client = createClient<paths>({ baseUrl: options.baseUrl, headers: { 'X-API-Key': options.apiKey }, fetch: options.fetch });
  const validate = options.validate ?? true;

  function settle<T>(definition: DefinitionName, r: { data?: unknown; error?: unknown; response: Response }): Result<T> {
    const requestId = r.response.headers.get('x-request-id');
    if (r.response.ok) {
      if (validate) {
        const issues = check(definition, r.data);
        if (issues.length) throw new ContractViolationError(definition, issues);
      }
      return { ok: true, status: r.response.status, requestId, data: r.data as T };
    }
    if (validate) {
      const issues = check('ErrorResponse', r.error);
      if (issues.length) throw new ContractViolationError('ErrorResponse', issues);
    }
    return { ok: false, status: r.response.status, requestId, error: (r.error as ErrorResponse).error };
  }

  return {
    async query(body: QueryRequest): Promise<Result<QueryEnvelope>> {
      return settle('QueryEnvelope', await client.POST('/v1/queries', { body }));
    },
    async capabilities(): Promise<Result<Capabilities>> {
      return settle('Capabilities', await client.GET('/v1/capabilities'));
    },
    async source(sourceId: string): Promise<Result<SourceRecord>> {
      return settle('SourceRecord', await client.GET('/v1/sources/{sourceId}', { params: { path: { sourceId } } }));
    },
    async live(): Promise<Result<{ status: 'ok' }>> {
      return settle('Liveness', await client.GET('/health/live'));
    },
  };
}

export type OzsbClient = ReturnType<typeof createOzsbClient>;
