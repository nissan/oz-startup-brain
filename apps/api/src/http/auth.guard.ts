import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Identity, Scope } from '../auth/dev-keys';
import { CREDENTIAL_REGISTRY, RegistryUnavailable, type CredentialRegistry } from '../auth/registry';
import { insufficientScope, registryUnavailable, unauthenticated } from './errors';

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
 * validation, budget admission and retrieval, so a rejected call starts no work. If the registry
 * cannot be read the request is refused with a 503 that names no dependency.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(CREDENTIAL_REGISTRY) private readonly registry: CredentialRegistry,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets)) return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['x-api-key'];
    let identity: Identity | null;
    try {
      identity = await this.registry.verify(Array.isArray(header) ? undefined : header);
    } catch (e) {
      // Fail closed (ADR 001): when the registry cannot be read, nobody is authenticated.
      // Every authenticated operation documents this 503 (owner decision, 13 November 2026).
      if (e instanceof RegistryUnavailable) throw registryUnavailable();
      throw e;
    }
    if (!identity) throw unauthenticated();
    const scope = this.reflector.getAllAndOverride<Scope | undefined>(REQUIRED_SCOPE, targets);
    if (!scope || !identity.scopes.has(scope)) throw insufficientScope();
    (req as Request & { [IDENTITY]?: Identity })[IDENTITY] = identity;
    return true;
  }
}
