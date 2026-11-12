import 'reflect-metadata';
import { Logger, Module, type DynamicModule, type LoggerService } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { CREDENTIAL_REGISTRY } from './auth/registry';
import { ApiRuntime } from './runtime';
import { AuthGuard } from './http/auth.guard';
import { HealthController, V1Controller } from './http/controllers';
import { deferredJson } from './http/body';
import { ApiErrorFilter } from './http/errors';
import { requestIdMiddleware } from './http/request-id';

export function apiModule(runtime: ApiRuntime): DynamicModule {
  @Module({})
  class ApiModule {}
  return {
    module: ApiModule,
    controllers: [HealthController, V1Controller],
    providers: [
      { provide: ApiRuntime, useValue: runtime },
      { provide: CREDENTIAL_REGISTRY, useValue: runtime.registry },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: ApiErrorFilter },
    ],
  };
}

export async function createApp(runtime: ApiRuntime, logger: LoggerService | false = new Logger()): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(apiModule(runtime), { bodyParser: false, logger: logger === false ? false : logger, abortOnError: false });
  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(deferredJson(runtime.config.maxRequestBytes));
  return app;
}
