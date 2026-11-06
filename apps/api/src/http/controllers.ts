import { Body, Controller, Get, HttpCode, Inject, Logger, Param, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  check,
  type Capabilities,
  type DefinitionName,
  type Liveness,
  type QueryEnvelope,
  type QueryRequest,
  type SourceRecord,
} from '@ozsb/contracts';
import type { Request } from 'express';
import { RetrievalTimeoutError } from '../fixture/adapters';
import { bodyErrorOf } from './body';
import { ApiRuntime } from '../runtime';
import { ApiError } from './errors';
import { identityOf, Public, RequireScope } from './auth.guard';
import { requestIdOf } from './request-id';

const ref = (name: DefinitionName) => ({ $ref: `#/components/schemas/${name}` });
const errorResponses = (...statuses: number[]) =>
  statuses.map((status) => ApiResponse({ status, description: ERROR_DESCRIPTIONS[status], schema: ref('ErrorResponse') }));
const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'invalid_request: the body does not satisfy QueryRequest',
  401: 'unauthenticated: missing, invalid, expired or revoked key (generic)',
  403: 'insufficient_scope: the key lacks the operation scope',
  404: 'not_found',
  413: 'payload_too_large',
  429: 'budget_exhausted or concurrency_limited, with retry_after_seconds and a Retry-After header',
  500: 'internal_error (no internal detail is returned)',
  503: 'dependency_unavailable',
  504: 'retrieval_timeout: the retrieval deadline elapsed',
};
const applyAll = (decorators: MethodDecorator[]): MethodDecorator => (target, key, descriptor) => {
  for (const d of decorators) d(target, key, descriptor);
};

/** Every response leaves only after it satisfies its v1 definition; a violation is a 500, never a malformed 200. */
function contractOut<T>(name: DefinitionName, value: T, logger: Logger, requestId: string): T {
  const issues = check(name, value);
  if (issues.length) {
    logger.error(`${requestId} produced an invalid ${name}: ${issues.map((i) => `${i.path} ${i.issue}`).join('; ')}`);
    throw new ApiError(500, 'internal_error', 'The request could not be completed.');
  }
  return value;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @Public()
  @ApiOperation({ operationId: 'getLiveness', summary: 'Minimal liveness; no credentials or detail.' })
  @ApiResponse({ status: 200, schema: ref('Liveness') })
  live(): Liveness {
    return { status: 'ok' };
  }
}

@ApiTags('v1')
@ApiSecurity('ApiKey')
@Controller('v1')
export class V1Controller {
  private readonly logger = new Logger('V1Controller');

  constructor(@Inject(ApiRuntime) private readonly rt: ApiRuntime) {}

  @Get('capabilities')
  @RequireScope('capabilities:read')
  @ApiOperation({ operationId: 'getCapabilities', summary: 'Modes, coverage, supported tasks, features and limits.' })
  @ApiResponse({ status: 200, schema: ref('Capabilities') })
  @applyAll(errorResponses(401, 403, 500))
  capabilities(@Req() req: Request): Capabilities {
    const { config, corpus, harness } = this.rt;
    const value: Capabilities = {
      schema_version: '1.0.0',
      api_version: 'v1',
      credential_mode: config.credentialMode,
      responder: config.responder,
      budget_store: this.rt.budget.kind,
      corpus_version: corpus.corpus_version,
      clock: { mode: 'pinned', as_of: harness.asOf() },
      coverage: {
        jurisdictions: corpus.coverage,
        fictional: true,
        note: 'Fixture corpus: every program, round, organisation and source is fictional. Not advice.',
      },
      supported_tasks: ['next_step', 'round_status', 'requirements_today'],
      features: {
        graph: harness.currentFault() === 'graph_unavailable' ? 'unavailable' : 'available',
        streaming: false,
        export: 'client_side',
        task_intent_field: false,
      },
      limits: {
        max_question_chars: config.maxQuestionChars,
        max_request_bytes: config.maxRequestBytes,
        excerpt_max_chars: config.excerptMaxChars,
        daily_query_allowance: config.dailyQueryAllowance,
        max_concurrent_queries: config.maxConcurrentQueries,
      },
      harness_controls: harness.enabled,
    };
    return contractOut('Capabilities', value, this.logger, requestIdOf(req));
  }

  @Post('queries')
  @HttpCode(200)
  @RequireScope('query:execute')
  @ApiOperation({
    operationId: 'createQuery',
    summary: 'Ask a question with confirmed context. answer, clarification and insufficient_evidence are all HTTP 200 domain results.',
  })
  @ApiBody({ schema: ref('QueryRequest') })
  @ApiResponse({ status: 200, schema: ref('QueryEnvelope') })
  @applyAll(errorResponses(400, 401, 403, 413, 429, 500, 503, 504))
  query(@Req() req: Request, @Body() body: unknown): QueryEnvelope {
    const requestId = requestIdOf(req);
    const identity = identityOf(req);

    // 1. Validate the business input before any admission or retrieval.
    const bodyError = bodyErrorOf(req);
    if (bodyError) throw bodyError;
    const issues = check('QueryRequest', body);
    if (issues.length) throw new ApiError(400, 'invalid_request', 'The request body does not satisfy QueryRequest.', undefined, issues);
    const request = body as QueryRequest;
    if (!request.question.trim()) {
      throw new ApiError(400, 'invalid_request', 'The request body does not satisfy QueryRequest.', undefined, [{ path: '/question', issue: 'must not be blank' }]);
    }

    // 2. Budget admission (simulated exhaustion is a harness fault, not a ledger test).
    const { harness, budget } = this.rt;
    if (harness.currentFault() === 'budget_exhausted') {
      throw new ApiError(429, 'budget_exhausted', 'The query allowance is exhausted. Try again later.', 3600);
    }
    const admission = budget.acquire(identity.consumerId);
    if ('denied' in admission) {
      const { code, retryAfterSeconds } = admission.denied;
      throw new ApiError(429, code, code === 'budget_exhausted' ? 'The query allowance is exhausted. Try again later.' : 'Too many queries are in progress. Try again shortly.', retryAfterSeconds);
    }

    // 3. Deterministic fixture responder.
    try {
      const envelope = this.rt.responder.respond(request, { requestId, asOf: harness.asOf() });
      return contractOut('QueryEnvelope', envelope, this.logger, requestId);
    } catch (e) {
      if (e instanceof RetrievalTimeoutError) throw new ApiError(504, 'retrieval_timeout', 'Retrieval did not finish within its deadline. No answer was produced.');
      throw e;
    } finally {
      admission.lease.release();
    }
  }

  @Get('sources/:sourceId')
  @RequireScope('sources:read')
  @ApiOperation({ operationId: 'getSource', summary: 'Public citation metadata; a bounded excerpt only when rights_status is cleared.' })
  @ApiParam({ name: 'sourceId', schema: { type: 'string', pattern: '^src_[a-z0-9_]+$' } })
  @ApiResponse({ status: 200, schema: ref('SourceRecord') })
  @applyAll(errorResponses(401, 403, 404, 500))
  source(@Req() req: Request, @Param('sourceId') sourceId: string): SourceRecord {
    const s = this.rt.corpus.sources.find((x) => x.source_id === sourceId);
    if (!s) throw new ApiError(404, 'not_found', 'No such source.');
    const cap = this.rt.config.excerptMaxChars;
    // The rights gate is enforced here, in code: only cleared sources ever yield excerpt text (API13).
    const excerpt = s.rights_status === 'cleared' && cap > 0 ? boundedExcerpt(s.text, cap) : null;
    const value: SourceRecord = {
      source_id: s.source_id,
      publisher: s.publisher,
      title: s.title,
      canonical_url: s.canonical_url,
      source_class: s.source_class,
      jurisdiction: s.jurisdiction,
      published_at: s.published_at,
      source_version_date: s.source_version_date,
      last_verified_at: s.last_verified_at,
      rights_status: s.rights_status,
      excerpt,
      excerpt_max_chars: cap,
      fictional: true,
    };
    return contractOut('SourceRecord', value, this.logger, requestIdOf(req));
  }
}

/** At most `cap` characters, cut at a word boundary with an ellipsis when shortened. */
export function boundedExcerpt(text: string, cap: number): string {
  if (text.length <= cap) return text;
  const room = cap - 1;
  const cut = text.slice(0, room);
  const space = cut.lastIndexOf(' ');
  return `${(space > room / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
