import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { ContractIssue, ErrorCode, ErrorResponse } from '@ozsb/contracts';
import type { Request, Response } from 'express';
import { requestIdOf } from './request-id';

/** A documented API error: a stable code, an HTTP status and a message safe to show any caller. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly retryAfterSeconds?: number,
    readonly details?: ContractIssue[],
  ) {
    super(message);
  }
}

export const unauthenticated = () => new ApiError(401, 'unauthenticated', 'A valid API key is required.');
export const insufficientScope = () => new ApiError(403, 'insufficient_scope', 'This API key is not permitted to use this operation.');

function fromHttpException(e: HttpException): ApiError {
  const status = e.getStatus();
  if (status === 404) return new ApiError(404, 'not_found', 'No such resource.');
  if (status === 413) return new ApiError(413, 'payload_too_large', 'The request body is too large.');
  if (status >= 400 && status < 500) return new ApiError(400, 'invalid_request', 'The request is not valid.');
  return new ApiError(500, 'internal_error', 'The request could not be completed.');
}

export function errorBody(e: ApiError, requestId: string): ErrorResponse {
  return {
    error: {
      code: e.code,
      message: e.message,
      request_id: requestId,
      ...(e.retryAfterSeconds !== undefined ? { retry_after_seconds: e.retryAfterSeconds } : {}),
      ...(e.details?.length ? { details: e.details } : {}),
    },
  };
}

export function sendError(res: Response, e: ApiError, requestId: string): void {
  if (e.retryAfterSeconds !== undefined) res.setHeader('Retry-After', String(e.retryAfterSeconds));
  res.status(e.status).json(errorBody(e, requestId));
}

/**
 * Every failure leaves as the documented ErrorResponse shape with the request ID. Unknown errors become
 * a generic 500: no stack trace, exception message, internal path or prompt is ever returned.
 */
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiErrorFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    let error: ApiError;
    if (exception instanceof ApiError) error = exception;
    else if (exception instanceof HttpException) error = fromHttpException(exception);
    else {
      this.logger.error(`unhandled error for ${requestIdOf(req)}: ${(exception as Error)?.message ?? String(exception)}`);
      error = new ApiError(500, 'internal_error', 'The request could not be completed.');
    }
    sendError(res, error, requestIdOf(req));
  }
}
