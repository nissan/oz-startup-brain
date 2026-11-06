import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { v1Schema } from '@ozsb/contracts';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Rewrites JSON Schema `#/$defs/X` references to OpenAPI `#/components/schemas/X`. */
function rewriteRefs(node: Json): Json {
  if (Array.isArray(node)) return node.map(rewriteRefs);
  if (node && typeof node === 'object') {
    const out: { [k: string]: Json } = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === '$ref' && typeof v === 'string' ? v.replace(/^#\/\$defs\//, '#/components/schemas/') : rewriteRefs(v);
    }
    return out;
  }
  return node;
}

function sortKeys(node: Json): Json {
  if (Array.isArray(node)) return node.map(sortKeys);
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.keys(node).sort().map((k) => [k, sortKeys((node as { [k: string]: Json })[k])]));
  }
  return node;
}

/**
 * The published v1 OpenAPI 3.1 document. Paths, operations and security come from the NestJS
 * controllers; every schema is the v1 JSON Schema definition itself (packages/contracts), so the
 * OpenAPI artifact, the runtime validators and the generated types cannot describe different shapes.
 */
export function buildOpenApi(app: INestApplication): Record<string, unknown> {
  const config = new DocumentBuilder()
    .setTitle('Oz Startup Brain API')
    .setDescription(
      'Slice 1A-0 (fixture responder, development credentials). Information and routing, not an application or approval. ' +
        'Every program, round and source served in fixture mode is fictional.',
    )
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'ozsb_<key_id>_<secret>' }, 'ApiKey')
    .build();
  const document = SwaggerModule.createDocument(app, config, { operationIdFactory: (_c, method) => method }) as unknown as Record<string, Json>;
  const schemas: { [k: string]: Json } = {};
  for (const [name, def] of Object.entries(v1Schema.$defs)) schemas[name] = rewriteRefs(def as unknown as Json);
  document.openapi = '3.1.0';
  document.jsonSchemaDialect = 'https://json-schema.org/draft/2020-12/schema';
  document.components = { ...((document.components as { [k: string]: Json }) ?? {}), schemas };
  return sortKeys(document) as Record<string, unknown>;
}
