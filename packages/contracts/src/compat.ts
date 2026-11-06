/**
 * v1 compatibility check (API10). Compares a candidate OpenAPI document with the frozen v1 baseline
 * and reports every change that could break an existing client.
 *
 * What is compared:
 * - every baseline operation: operationId, security, parameters, request body and each documented
 *   response with its media types, schemas and headers;
 * - every baseline component schema, in the direction(s) it is used (request, response or both);
 * - security schemes and the document-level security requirement, by exact value.
 *
 * Schema keywords are handled directionally where the effect is understood: $ref, type, enum/const,
 * properties, required, additionalProperties, items, oneOf/anyOf and the min/max bounds and pattern.
 * A response may not lose or loosen anything a validating client relies on (v1 response schemas are
 * closed, so a new response property is breaking too); a request may not newly require, narrow or
 * reject what the baseline accepted. Any change to any other contract-affecting keyword (allOf,
 * if/then/else, not, format, uniqueItems, multipleOf, dependent*, ...) is reported conservatively as
 * breaking, because this checker does not reason about it. Annotations (description, title,
 * examples, $comment) are ignored. Additive changes that pass: a new optional request property on a
 * closed request schema, a new operation, a new component.
 */
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

export interface CompatIssue {
  where: string;
  change: string;
}

type Direction = 'request' | 'response' | 'both';

const isObj = (v: Json | undefined): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const asObj = (v: Json | undefined): Obj => (isObj(v) ? v : {});
const typesOf = (s: Obj): string[] => (s.type === undefined ? [] : Array.isArray(s.type) ? (s.type as string[]) : [s.type as string]);
const enumOf = (s: Obj): Json[] | null => (Array.isArray(s.enum) ? s.enum : s.const !== undefined ? [s.const] : null);
const key = (v: Json | undefined) => JSON.stringify(v ?? null);
const checksRequest = (d: Direction) => d !== 'response';
const checksResponse = (d: Direction) => d !== 'request';

const ANNOTATIONS = new Set(['description', 'title', 'examples', 'example', '$comment', 'deprecated']);
const HANDLED = new Set([
  '$ref', 'type', 'enum', 'const', 'properties', 'required', 'additionalProperties', 'items', 'oneOf', 'anyOf',
  'minLength', 'maxLength', 'minItems', 'maxItems', 'minimum', 'maximum', 'pattern',
]);
const MIN_BOUNDS = ['minLength', 'minItems', 'minimum'] as const;
const MAX_BOUNDS = ['maxLength', 'maxItems', 'maximum'] as const;
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

function refName(s: Obj): string | null {
  return typeof s.$ref === 'string' ? s.$ref.replace('#/components/schemas/', '') : null;
}

/** Which components are reachable from requests and from responses. */
function usage(doc: Obj): Map<string, Set<'request' | 'response'>> {
  const schemas = asObj(asObj(doc.components).schemas);
  const result = new Map<string, Set<'request' | 'response'>>();
  const walk = (node: Json | undefined, dir: 'request' | 'response', seen: Set<string>) => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n, dir, seen));
    if (!isObj(node)) return;
    const name = refName(node);
    if (name) {
      if (!result.has(name)) result.set(name, new Set());
      result.get(name)!.add(dir);
      if (!seen.has(name)) {
        seen.add(name);
        walk(schemas[name], dir, seen);
      }
    }
    for (const v of Object.values(node)) walk(v, dir, seen);
  };
  for (const item of Object.values(asObj(doc.paths))) {
    if (!isObj(item)) continue;
    walk(item.parameters, 'request', new Set());
    for (const m of METHODS) {
      const op = item[m];
      if (!isObj(op)) continue;
      walk(op.requestBody, 'request', new Set());
      walk(op.parameters, 'request', new Set());
      walk(op.responses, 'response', new Set());
    }
  }
  return result;
}

function compareSchema(where: string, base: Obj, cand: Obj | undefined, dir: Direction, issues: CompatIssue[]): void {
  const add = (change: string, at = where): void => {
    issues.push({ where: at, change });
  };
  if (!cand) {
    add('removed');
    return;
  }

  const bRef = refName(base);
  const cRef = refName(cand);
  if (bRef !== null || cRef !== null) {
    // Referenced components are compared once, in the direction(s) they are used.
    if (bRef !== cRef) add(`reference changed from ${bRef ?? 'an inline schema'} to ${cRef ?? 'an inline schema'}`);
    return;
  }

  // Keywords this checker does not analyse directionally: any change is breaking.
  for (const k of new Set([...Object.keys(base), ...Object.keys(cand)])) {
    if (ANNOTATIONS.has(k) || HANDLED.has(k)) continue;
    if (key(base[k]) !== key(cand[k])) add(`${k} changed (not analysed directionally, so treated as breaking)`);
  }

  const bTypes = typesOf(base);
  const cTypes = typesOf(cand);
  if (bTypes.length && !cTypes.length) {
    if (checksResponse(dir)) add(`type constraint ${bTypes.join('|')} removed`);
  } else if (!bTypes.length && cTypes.length) {
    if (checksRequest(dir)) add(`request value newly restricted to type ${cTypes.join('|')}`);
  } else {
    const lost = bTypes.filter((t) => !cTypes.includes(t));
    const gained = cTypes.filter((t) => !bTypes.includes(t));
    if (lost.length) add(dir === 'response' ? `type ${lost.join('|')} changed to ${cTypes.join('|')}` : `no longer accepts type ${lost.join('|')}`);
    if (gained.length && checksResponse(dir)) add(`may now return type ${gained.join('|')}`);
  }

  const bEnum = enumOf(base);
  const cEnum = enumOf(cand);
  if (bEnum) {
    if (!cEnum) {
      if (checksResponse(dir)) add('enumeration removed');
    } else {
      const cSet = new Set(cEnum.map(key));
      const bSet = new Set(bEnum.map(key));
      const lost = bEnum.filter((v) => !cSet.has(key(v)));
      const gained = cEnum.filter((v) => !bSet.has(key(v)));
      if (lost.length) add(`enumeration lost ${lost.map(key).join(', ')}`);
      if (gained.length && checksResponse(dir)) add(`enumeration gained ${gained.map(key).join(', ')} in a response`);
    }
  } else if (cEnum && checksRequest(dir)) {
    add('request value newly restricted to an enumeration');
  }

  for (const bound of MIN_BOUNDS) {
    const b = base[bound];
    const c = cand[bound];
    if (typeof c === 'number' && (typeof b !== 'number' || c > b) && checksRequest(dir)) add(`${bound} tightened`);
    if (typeof b === 'number' && (typeof c !== 'number' || c < b) && checksResponse(dir)) add(`${bound} loosened in a response`);
  }
  for (const bound of MAX_BOUNDS) {
    const b = base[bound];
    const c = cand[bound];
    if (typeof c === 'number' && (typeof b !== 'number' || c < b) && checksRequest(dir)) add(`${bound} tightened`);
    if (typeof b === 'number' && (typeof c !== 'number' || c > b) && checksResponse(dir)) add(`${bound} loosened in a response`);
  }
  if (typeof base.pattern === 'string' && cand.pattern !== base.pattern) add('pattern changed');
  if (typeof cand.pattern === 'string' && base.pattern === undefined && checksRequest(dir)) add('pattern added to a request value');

  // Objects.
  const bProps = asObj(base.properties);
  const cProps = asObj(cand.properties);
  const bReq = new Set(Array.isArray(base.required) ? (base.required as string[]) : []);
  const cReq = new Set(Array.isArray(cand.required) ? (cand.required as string[]) : []);
  for (const [name, schema] of Object.entries(bProps)) {
    if (!(name in cProps)) {
      add('property removed', `${where}.${name}`);
      continue;
    }
    if (isObj(schema)) compareSchema(`${where}.${name}`, schema, isObj(cProps[name]) ? (cProps[name] as Obj) : undefined, dir, issues);
  }
  for (const name of Object.keys(cProps)) {
    if (name in bProps) continue;
    if (base.additionalProperties === false && checksResponse(dir)) add('property added to a closed response schema', `${where}.${name}`);
    if (base.additionalProperties !== false && checksRequest(dir)) add('request property newly constrained', `${where}.${name}`);
  }
  for (const name of bReq) if (!cReq.has(name) && checksResponse(dir)) add('no longer required in a response', `${where}.${name}`);
  for (const name of cReq) if (!bReq.has(name) && checksRequest(dir)) add('newly required in a request', `${where}.${name}`);

  const bAP = base.additionalProperties;
  const cAP = cand.additionalProperties;
  if (isObj(bAP) || isObj(cAP)) {
    if (key(bAP) !== key(cAP)) add('additionalProperties schema changed (not analysed directionally, so treated as breaking)');
  } else {
    if (bAP !== false && cAP === false && checksRequest(dir)) add('request now rejects additional properties');
    if (bAP === false && cAP !== false && checksResponse(dir)) add('closed response schema now allows additional properties');
  }

  for (const comb of ['oneOf', 'anyOf'] as const) {
    const b = Array.isArray(base[comb]) ? (base[comb] as Json[]) : [];
    const c = Array.isArray(cand[comb]) ? (cand[comb] as Json[]) : [];
    if (b.length !== c.length) add(`${comb} branches changed from ${b.length} to ${c.length}`);
    else b.forEach((s, i) => isObj(s) && compareSchema(`${where}.${comb}[${i}]`, s, isObj(c[i]) ? (c[i] as Obj) : undefined, dir, issues));
  }

  if (isObj(base.items)) compareSchema(`${where}[]`, base.items, isObj(cand.items) ? cand.items : undefined, dir, issues);
  else if (isObj(cand.items) && checksRequest(dir)) add('request array items newly constrained');
}

function paramsOf(item: Obj, op: Obj): Map<string, Obj> {
  const out = new Map<string, Obj>();
  for (const list of [item.parameters, op.parameters]) {
    if (!Array.isArray(list)) continue;
    for (const p of list) if (isObj(p)) out.set(`${String(p.in)} ${String(p.name)}`, p);
  }
  return out;
}

function compareContent(where: string, base: Obj, cand: Obj, dir: Direction, issues: CompatIssue[]): void {
  const bContent = asObj(base.content);
  const cContent = asObj(cand.content);
  for (const [media, bMedia] of Object.entries(bContent)) {
    const cMedia = cContent[media];
    if (!isObj(cMedia)) {
      issues.push({ where, change: `media type ${media} removed` });
      continue;
    }
    if (isObj(bMedia) && isObj(bMedia.schema)) compareSchema(`${where} ${media}`, bMedia.schema, isObj(cMedia.schema) ? cMedia.schema : undefined, dir, issues);
  }
  if (dir === 'request') for (const media of Object.keys(cContent)) if (!(media in bContent) && !Object.keys(bContent).length) issues.push({ where, change: `request body newly constrained to ${media}` });
}

function compareOperation(where: string, item: Obj, op: Obj, cItem: Obj, cOp: Obj, issues: CompatIssue[]): void {
  const add = (change: string, at = where): void => {
    issues.push({ where: at, change });
  };
  if (op.operationId !== cOp.operationId) add(`operationId changed from ${op.operationId} to ${cOp.operationId}`);
  if (key(op.security) !== key(cOp.security)) add('security requirement changed');

  const bParams = paramsOf(item, op);
  const cParams = paramsOf(cItem, cOp);
  for (const [id, p] of bParams) {
    const c = cParams.get(id);
    const at = `${where} parameter ${id}`;
    if (!c) {
      add('parameter removed', at);
      continue;
    }
    if (p.required !== true && c.required === true) add('parameter newly required', at);
    if (key(p.style) !== key(c.style) || key(p.explode) !== key(c.explode)) add('parameter serialisation changed', at);
    if (isObj(p.schema)) compareSchema(at, p.schema, isObj(c.schema) ? c.schema : undefined, 'request', issues);
  }
  for (const [id, c] of cParams) if (!bParams.has(id) && c.required === true) add('required parameter added', `${where} parameter ${id}`);

  if (isObj(op.requestBody)) {
    if (!isObj(cOp.requestBody)) add('request body removed');
    else {
      if (op.requestBody.required !== true && cOp.requestBody.required === true) add('request body newly required');
      compareContent(`${where} request body`, op.requestBody, cOp.requestBody, 'request', issues);
    }
  } else if (isObj(cOp.requestBody) && cOp.requestBody.required === true) {
    add('required request body added');
  }

  const bRes = asObj(op.responses);
  const cRes = asObj(cOp.responses);
  for (const [status, b] of Object.entries(bRes)) {
    const c = cRes[status];
    if (!isObj(c)) {
      add(`documented ${status} response removed`);
      continue;
    }
    if (!isObj(b)) continue;
    if (key(b.headers) !== key(c.headers)) add(`${status} response headers changed`);
    compareContent(`${where} ${status} response`, b, c, 'response', issues);
  }
  for (const status of Object.keys(cRes)) if (!(status in bRes)) add(`undocumented ${status} response added`);
}

export function compareOpenApi(baseline: unknown, candidate: unknown): CompatIssue[] {
  const b = asObj(baseline as Json);
  const c = asObj(candidate as Json);
  const issues: CompatIssue[] = [];

  if (key(b.security) !== key(c.security)) issues.push({ where: 'document', change: 'document-level security requirement changed' });
  const bSchemes = asObj(asObj(b.components).securitySchemes);
  const cSchemes = asObj(asObj(c.components).securitySchemes);
  for (const [name, scheme] of Object.entries(bSchemes)) {
    const where = `#/components/securitySchemes/${name}`;
    if (!(name in cSchemes)) issues.push({ where, change: 'security scheme removed' });
    else if (key(scheme) !== key(cSchemes[name])) issues.push({ where, change: 'security scheme changed (clients send the baseline credential)' });
  }

  const bPaths = asObj(b.paths);
  const cPaths = asObj(c.paths);
  for (const [path, item] of Object.entries(bPaths)) {
    if (!isObj(item)) continue;
    const cItem = asObj(cPaths[path]);
    for (const method of METHODS) {
      const op = item[method];
      if (!isObj(op)) continue;
      const where = `${method.toUpperCase()} ${path}`;
      const cOp = cItem[method];
      if (!isObj(cOp)) issues.push({ where, change: 'operation removed' });
      else compareOperation(where, item, op, cItem, cOp, issues);
    }
  }

  const bSchemas = asObj(asObj(b.components).schemas);
  const cSchemas = asObj(asObj(c.components).schemas);
  const used = usage(b);
  for (const [name, schema] of Object.entries(bSchemas)) {
    if (!isObj(schema)) continue;
    const dirs = used.get(name);
    const dir: Direction = !dirs || dirs.size === 2 ? 'both' : [...dirs][0];
    compareSchema(`#/components/schemas/${name}`, schema, isObj(cSchemas[name]) ? (cSchemas[name] as Obj) : undefined, dir, issues);
  }
  return issues;
}
