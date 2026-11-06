import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const KEY = Symbol('ozsbRequestId');

export function newRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`;
}

export function requestIdOf(req: Request): string {
  const r = req as Request & { [KEY]?: string };
  if (!r[KEY]) r[KEY] = newRequestId();
  return r[KEY];
}

/** Assigns a server-generated request ID; a client-supplied X-Request-Id is ignored, never echoed. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Request-Id', requestIdOf(req));
  res.setHeader('Cache-Control', 'no-store');
  next();
}
