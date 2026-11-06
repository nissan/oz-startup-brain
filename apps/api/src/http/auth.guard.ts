import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { DevKeyRegistry, type Identity, type Scope } from '../auth/dev-keys';
import { insufficientScope, unauthenticated } from './errors';

export const REQUIRED_SCOPE = 'ozsb:requiredScope';
export const PUBLIC_ROUTE = 'ozsb:public';

/** Marks a handler as requiring one scope. Handlers without this or @Public() are denied. */
export const RequireScope = (scope: Scope) => SetMetadata(REQUIRED_SCOPE, scope);
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);

const IDENTITY = Symbol('ozsbIdentity');

export function identityOf(req: Request): Identity {
  const id = (req as Request & { [IDENTITY]?: Identity })[IDENTITY];
  if (!id) throw unauthenticated();
  return id;
}

/**
 * Protects every route by default (ADR 001). Identity comes only from the verified X-API-Key header;
 * client-supplied scopes, consumer IDs or identity headers are never read. Runs before body
 * validation, budget admission and retrieval, so a rejected call starts no work.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(DevKeyRegistry) private readonly registry: DevKeyRegistry,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets)) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['x-api-key'];
    const identity = this.registry.verify(Array.isArray(header) ? undefined : header);
    if (!identity) throw unauthenticated();
    const scope = this.reflector.getAllAndOverride<Scope | undefined>(REQUIRED_SCOPE, targets);
    if (!scope || !identity.scopes.has(scope)) throw insufficientScope();
    (req as Request & { [IDENTITY]?: Identity })[IDENTITY] = identity;
    return true;
  }
}
