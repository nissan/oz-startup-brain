import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { createApp } from './app';
import { ConfigError, loadConfig } from './config';
import { ApiRuntime } from './runtime';

async function main(): Promise<void> {
  const logger = new Logger('ozsb-api');
  let runtime: ApiRuntime;
  try {
    runtime = new ApiRuntime(loadConfig());
  } catch (e) {
    if (e instanceof ConfigError) {
      logger.error(`refusing to start: ${e.message}`);
      process.exit(2);
    }
    throw e;
  }
  const app = await createApp(runtime, logger);
  const { host, port } = runtime.config;
  await app.listen(port, host);
  const address = app.getHttpServer().address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  logger.log(
    `listening on http://${host}:${actualPort} — responder=fixture, credential_mode=development (${runtime.registry.size} key(s)), ` +
      `budget_store=in_process_development, clock=pinned ${runtime.harness.asOf()}, harness_controls=${runtime.harness.enabled ? 'enabled' : 'disabled'}. ` +
      'Fictional fixture data only; never deploy this mode publicly.',
  );
}

void main();
