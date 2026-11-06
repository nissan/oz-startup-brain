import express, { type NextFunction, type Request, type Response } from 'express';
import { ApiError } from './errors';

const BODY_ERROR = Symbol('ozsbBodyError');

/**
 * JSON parsing that never answers on its own. A malformed or oversized body is remembered and raised
 * by the handler after the auth guard, so an unauthenticated caller always gets the generic 401 and
 * learns nothing about body handling.
 */
export function deferredJson(limitBytes: number) {
  const parse = express.json({ limit: limitBytes, strict: true });
  return (req: Request, res: Response, next: NextFunction) =>
    parse(req, res, (err?: unknown) => {
      if (err) {
        const type = (err as { type?: string }).type;
        (req as Request & { [BODY_ERROR]?: ApiError })[BODY_ERROR] =
          type === 'entity.too.large'
            ? new ApiError(413, 'payload_too_large', 'The request body is too large.')
            : new ApiError(400, 'invalid_request', 'The request body is not valid JSON.');
        req.body = undefined;
      }
      next();
    });
}

export function bodyErrorOf(req: Request): ApiError | undefined {
  return (req as Request & { [BODY_ERROR]?: ApiError })[BODY_ERROR];
}

