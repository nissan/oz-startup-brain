import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Identity, Scope } from '../auth/dev-keys';
import { CREDENTIAL_REGISTRY, RegistryUnavailable, type CredentialRegistry } from '../auth/registry';
import { ApiError, insufficientScope, registryUnavailable, unauthenticated } from './errors';

export const REQUIRED_SCOPE = 'ozsb:requiredScope';
export const PUBLIC_ROUTE = 'ozsb:public';

/** Marks a handler as requiring one scope. Handlers without this or @Public() are denied. */
export const RequireScope = (scope: Scope) => SetMetadata(REQUIRED_SCOPE, scope);
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);

const IDENTITY = Symbol('ozsbIdentity');
/**
 * Where @nestjs/swagger's @ApiResponse records an operation's documented statuses. The package does
 * not export the constant; the outage test in pg-registry.spec.ts fails if this name ever changes.
 */
const DOCUMENTED_RESPONSES = 'swagger/apiResponse';

export function identityOf(req: Request): Identity {
  const id = (req as Request & { [IDENTITY]?: Identity })[IDENTITY];
  if (!id) throw unauthenticated();
  return id;
}

/**
 * Protects every route by default (ADR 001). Identity comes only from the verified X-API-Key header;
 * client-supplied scopes, consumer IDs or identity headers are never read. Runs before body
 * validation, budget admission and retrieval, so a rejected call starts no work. If the registry
 * cannot be read the request is refused: 503 where the operation's contract documents it, otherwise
 * the generic 500. Neither names a dependency.
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
      if (!(e instanceof RegistryUnavailable)) throw e;
      // The frozen v1 contract documents 503 on some operations and not others. Where it does not,
      // the refusal is the generic 500 the contract does document, so no caller sees an undeclared status.
      const documented = (Reflect.getMetadata(DOCUMENTED_RESPONSES, ctx.getHandler()) ?? {}) as Record<string, unknown>;
      throw '503' in documented ? registryUnavailable() : new ApiError(500, 'internal_error', 'The request could not be completed.');
    }
    if (!identity) throw unauthenticated();
    const scope = this.reflector.getAllAndOverride<Scope | undefined>(REQUIRED_SCOPE, targets);
    if (!scope || !identity.scopes.has(scope)) throw insufficientScope();
    (req as Request & { [IDENTITY]?: Identity })[IDENTITY] = identity;
    return true;
  }
}
