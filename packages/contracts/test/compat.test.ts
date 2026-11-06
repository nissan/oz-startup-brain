import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareOpenApi } from '../src/compat';

/** API10: the v1 OpenAPI artifact cannot be silently replaced by an incompatible one. */
const docs = join(__dirname, '..', '..', '..', 'docs', 'api');
const load = (name: string) => JSON.parse(readFileSync(join(docs, name), 'utf8'));
const baseline = load('openapi.v1.baseline.json');
const clone = () => JSON.parse(JSON.stringify(baseline));
const schemas = (d: any) => d.components.schemas;
const changes = (candidate: unknown) => compareOpenApi(baseline, candidate).map((i) => `${i.where}: ${i.change}`);

describe('v1 compatibility check', () => {
  it('accepts the checked-in OpenAPI artifact against the frozen v1 baseline', () => {
    expect(compareOpenApi(baseline, load('openapi.json'))).toEqual([]);
  });

  it('blocks removing a required response field', () => {
    const d = clone();
    delete schemas(d).QueryEnvelope.properties.corpus_version;
    schemas(d).QueryEnvelope.required = schemas(d).QueryEnvelope.required.filter((r: string) => r !== 'corpus_version');
    expect(changes(d)).toEqual(expect.arrayContaining([
      '#/components/schemas/QueryEnvelope.corpus_version: property removed',
      '#/components/schemas/QueryEnvelope.corpus_version: no longer required in a response',
    ]));
  });

  it('blocks making a response field optional, retyping it, or adding a field to a closed response', () => {
    const d = clone();
    schemas(d).Citation.required = schemas(d).Citation.required.filter((r: string) => r !== 'last_verified_at');
    schemas(d).Citation.properties.last_verified_at.type = 'string';
    schemas(d).Action.properties.priority = { type: 'integer' };
    expect(changes(d)).toEqual(expect.arrayContaining([
      '#/components/schemas/Citation.last_verified_at: no longer required in a response',
      '#/components/schemas/Citation.last_verified_at: type null changed to string',
      '#/components/schemas/Action.priority: property added to a closed response schema',
    ]));
  });

  it('blocks enumeration changes that clients switch on', () => {
    const d = clone();
    schemas(d).QueryEnvelope.properties.status.enum = ['answer', 'clarification'];
    schemas(d).Warning.properties.code.enum.push('new_code');
    expect(changes(d)).toEqual(expect.arrayContaining([
      '#/components/schemas/QueryEnvelope.status: enumeration lost "insufficient_evidence"',
      '#/components/schemas/Warning.code: enumeration gained "new_code" in a response',
    ]));
  });

  it('blocks a newly required or narrowed request field, and allows a new optional one', () => {
    const narrowed = clone();
    schemas(narrowed).QueryRequest.required.push('confirmed_context');
    schemas(narrowed).QueryRequest.properties.question.maxLength = 500;
    expect(changes(narrowed)).toEqual(expect.arrayContaining([
      '#/components/schemas/QueryRequest.confirmed_context: newly required in a request',
      '#/components/schemas/QueryRequest.question: maxLength tightened',
    ]));
    const widened = clone();
    schemas(widened).QueryRequest.properties.task_intent = { type: 'string', enum: ['lookup', 'comparison', 'prerequisite'] };
    expect(compareOpenApi(baseline, widened)).toEqual([]);
  });

  it('blocks removing an operation, a documented response or the security requirement', () => {
    const d = clone();
    delete d.paths['/v1/sources/{sourceId}'];
    delete d.paths['/v1/queries'].post.responses['429'];
    d.paths['/v1/capabilities'].get.security = [];
    expect(changes(d)).toEqual(expect.arrayContaining([
      'GET /v1/sources/{sourceId}: operation removed',
      'POST /v1/queries: documented 429 response removed',
      'GET /v1/capabilities: security requirement changed',
    ]));
  });

  describe('review R33-02 regressions: each mutation alone must be reported', () => {
    it('an operation response schema reference changes, even though the old component is unchanged', () => {
      const d = clone();
      d.paths['/v1/queries'].post.responses['200'].content['application/json'].schema = { $ref: '#/components/schemas/Liveness' };
      expect(changes(d)).toContain('POST /v1/queries 200 response application/json: reference changed from QueryEnvelope to Liveness');
    });

    it('a request body schema reference changes', () => {
      const d = clone();
      d.paths['/v1/queries'].post.requestBody.content['application/json'].schema = { $ref: '#/components/schemas/ConfirmedContext' };
      expect(changes(d)).toContain('POST /v1/queries request body application/json: reference changed from QueryRequest to ConfirmedContext');
    });

    it('the status/payload conditions (allOf) are deleted', () => {
      const d = clone();
      delete schemas(d).QueryEnvelope.allOf;
      expect(changes(d)).toContain('#/components/schemas/QueryEnvelope: allOf changed (not analysed directionally, so treated as breaking)');
    });

    it('a closed response schema is opened', () => {
      const d = clone();
      schemas(d).QueryEnvelope.additionalProperties = true;
      expect(changes(d)).toContain('#/components/schemas/QueryEnvelope: closed response schema now allows additional properties');
    });

    it('a response minimum is loosened', () => {
      const d = clone();
      schemas(d).Action.properties.claim_ids.minItems = 0;
      expect(changes(d)).toContain('#/components/schemas/Action.claim_ids: minItems loosened in a response');
    });

    it('the API key security scheme changes', () => {
      const d = clone();
      d.components.securitySchemes.ApiKey.name = 'X-Different-Key';
      expect(changes(d)).toContain('#/components/securitySchemes/ApiKey: security scheme changed (clients send the baseline credential)');
    });

    it('a path parameter pattern or requirement changes, or a required parameter is added', () => {
      const d = clone();
      const op = d.paths['/v1/sources/{sourceId}'].get;
      op.parameters[0].schema.pattern = '^src_[a-z]+$';
      d.paths['/v1/capabilities'].get.parameters = [{ name: 'tier', in: 'query', required: true, schema: { type: 'string' } }];
      expect(changes(d)).toEqual(expect.arrayContaining([
        'GET /v1/sources/{sourceId} parameter path sourceId: pattern changed',
        'GET /v1/capabilities parameter query tier: required parameter added',
      ]));
    });

    it('a format, an if/then rule or another unanalysed keyword changes', () => {
      const d = clone();
      schemas(d).QueryEnvelope.properties.as_of.format = 'date';
      schemas(d).Clarification.properties.options.uniqueItems = true;
      expect(changes(d)).toEqual(expect.arrayContaining([
        '#/components/schemas/QueryEnvelope.as_of: format changed (not analysed directionally, so treated as breaking)',
        '#/components/schemas/Clarification.options: uniqueItems changed (not analysed directionally, so treated as breaking)',
      ]));
    });

    it('still allows annotation-only changes and an optional request property', () => {
      const d = clone();
      schemas(d).Claim.properties.applicability.description = 'reworded';
      d.paths['/v1/queries'].post.summary = 'reworded';
      schemas(d).QueryRequest.properties.task_intent = { type: 'string', enum: ['lookup', 'comparison', 'prerequisite'] };
      expect(compareOpenApi(baseline, d)).toEqual([]);
    });
  });
});

