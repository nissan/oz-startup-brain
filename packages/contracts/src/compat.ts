/**
 * v1 compatibility check (API10). Compares a candidate OpenAPI document with the frozen v1 baseline
 * and reports every change that could break an existing client. Additive changes (a new optional
 * request field, a new endpoint, a new optional response field) are allowed; anything that removes,
 * renames, retypes, narrows or newly requires something is a breaking change and must go to /v2.
 *
 * Direction matters: response schemas must keep every property and requirement; request schemas must
 * not add required properties or reject values the baseline accepted. Enumerations may not lose
 * values in either direction, and may not gain values in a response (clients switch on them).
 */
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = { [k: string]: Json };

export interface CompatIssue {
  where: string;
  change: string;
}

type Direction = 'request' | 'response' | 'both';

const isObj = (v: Json | undefined): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const typesOf = (s: Obj): string[] => (s.type === undefined ? [] : Array.isArray(s.type) ? (s.type as string[]) : [s.type as string]);
const enumOf = (s: Obj): Json[] | null => (Array.isArray(s.enum) ? s.enum : s.const !== undefined ? [s.const] : null);
const key = (v: Json) => JSON.stringify(v);

function refName(s: Obj): string | null {
  return typeof s.$ref === 'string' ? s.$ref.replace('#/components/schemas/', '') : null;
}

/** Which components are reachable from request bodies and from responses. */
function usage(doc: Obj): Map<string, Set<'request' | 'response'>> {
  const schemas = (isObj(doc.components) && isObj(doc.components.schemas) ? doc.components.schemas : {}) as Obj;
  const result = new Map<string, Set<'request' | 'response'>>();
  const walk = (node: Json, dir: 'request' | 'response', seen: Set<string>) => {
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
  const paths = isObj(doc.paths) ? doc.paths : {};
  for (const item of Object.values(paths)) {
    if (!isObj(item)) continue;
    for (const op of Object.values(item)) {
      if (!isObj(op)) continue;
      walk(op.requestBody ?? null, 'request', new Set());
      walk(op.parameters ?? null, 'request', new Set());
      walk(op.responses ?? null, 'response', new Set());
    }
  }
  return result;
}

function compareSchema(where: string, base: Obj, cand: Obj | undefined, dir: Direction, issues: CompatIssue[]): void {
  if (!cand) {
    issues.push({ where, change: 'removed' });
    return;
  }
  const bRef = refName(base);
  if (bRef !== null || refName(cand) !== null) {
    if (bRef !== refName(cand)) issues.push({ where, change: `reference changed from ${bRef} to ${refName(cand)}` });
    return;
  }
  const bTypes = typesOf(base);
  const cTypes = typesOf(cand);
  if (bTypes.length || cTypes.length) {
    const lost = bTypes.filter((t) => !cTypes.includes(t));
    const gained = cTypes.filter((t) => !bTypes.includes(t));
    if (cTypes.length === 0 && bTypes.length) {
      if (dir !== 'request') issues.push({ where, change: `type constraint ${bTypes.join('|')} removed` });
    } else {
      if (lost.length && dir !== 'response') issues.push({ where, change: `no longer accepts type ${lost.join('|')}` });
      if (lost.length && dir === 'response') issues.push({ where, change: `type ${lost.join('|')} changed to ${cTypes.join('|')}` });
      if (gained.length && dir !== 'request') issues.push({ where, change: `may now return type ${gained.join('|')}` });
    }
  }
  const bEnum = enumOf(base);
  const cEnum = enumOf(cand);
  if (bEnum) {
    if (!cEnum) {
      if (dir !== 'request') issues.push({ where, change: 'enumeration removed' });
    } else {
      const cSet = new Set(cEnum.map(key));
      const bSet = new Set(bEnum.map(key));
      const lost = bEnum.filter((v) => !cSet.has(key(v)));
      const gained = cEnum.filter((v) => !bSet.has(key(v)));
      if (lost.length) issues.push({ where, change: `enumeration lost ${lost.map(key).join(', ')}` });
      if (gained.length && dir !== 'request') issues.push({ where, change: `enumeration gained ${gained.map(key).join(', ')} in a response` });
    }
  } else if (cEnum && dir !== 'response') {
    issues.push({ where, change: 'request value newly restricted to an enumeration' });
  }
  for (const bound of ['minLength', 'minItems', 'minimum'] as const) {
    if (typeof cand[bound] === 'number' && (typeof base[bound] !== 'number' || (cand[bound] as number) > (base[bound] as number)) && dir !== 'response') {
      issues.push({ where, change: `${bound} tightened` });
    }
  }
  for (const bound of ['maxLength', 'maxItems', 'maximum'] as const) {
    if (typeof cand[bound] === 'number' && (typeof base[bound] !== 'number' || (cand[bound] as number) < (base[bound] as number)) && dir !== 'response') {
      issues.push({ where, change: `${bound} tightened` });
    }
    if (typeof base[bound] === 'number' && (typeof cand[bound] !== 'number' || (cand[bound] as number) > (base[bound] as number)) && dir !== 'request') {
      issues.push({ where, change: `${bound} loosened in a response` });
    }
  }
  if (typeof base.pattern === 'string' && cand.pattern !== base.pattern) issues.push({ where, change: 'pattern changed' });
  if (typeof cand.pattern === 'string' && base.pattern === undefined && dir !== 'response') issues.push({ where, change: 'pattern added to a request value' });

  const bProps = isObj(base.properties) ? base.properties : {};
  const cProps = isObj(cand.properties) ? cand.properties : {};
  const bReq = new Set(Array.isArray(base.required) ? (base.required as string[]) : []);
  const cReq = new Set(Array.isArray(cand.required) ? (cand.required as string[]) : []);
  for (const [name, schema] of Object.entries(bProps)) {
    if (!(name in cProps)) {
      issues.push({ where: `${where}.${name}`, change: 'property removed' });
      continue;
    }
    if (isObj(schema)) compareSchema(`${where}.${name}`, schema, cProps[name] as Obj, dir, issues);
  }
  if (base.additionalProperties === false && dir !== 'request') {
    // v1 response shapes are closed, so a client validating against the baseline rejects any new field.
    for (const name of Object.keys(cProps)) if (!(name in bProps)) issues.push({ where: `${where}.${name}`, change: 'property added to a closed response schema' });
  }
  for (const name of bReq) if (!cReq.has(name) && dir !== 'request') issues.push({ where: `${where}.${name}`, change: 'no longer required in a response' });
  for (const name of cReq) if (!bReq.has(name) && dir !== 'response') issues.push({ where: `${where}.${name}`, change: 'newly required in a request' });
  if (base.additionalProperties !== false && cand.additionalProperties === false && dir !== 'response') {
    issues.push({ where, change: 'request now rejects additional properties' });
  }
  for (const comb of ['oneOf', 'anyOf'] as const) {
    const b = Array.isArray(base[comb]) ? (base[comb] as Json[]) : [];
    const c = Array.isArray(cand[comb]) ? (cand[comb] as Json[]) : [];
    if (b.length !== c.length) issues.push({ where, change: `${comb} branches changed from ${b.length} to ${c.length}` });
    else b.forEach((s, i) => isObj(s) && compareSchema(`${where}.${comb}[${i}]`, s, c[i] as Obj, dir, issues));
  }
  if (isObj(base.items)) compareSchema(`${where}[]`, base.items, isObj(cand.items) ? cand.items : undefined, dir, issues);
}

export function compareOpenApi(baseline: unknown, candidate: unknown): CompatIssue[] {
  const b = baseline as Obj;
  const c = candidate as Obj;
  const issues: CompatIssue[] = [];
  const bPaths = (isObj(b.paths) ? b.paths : {}) as Obj;
  const cPaths = (isObj(c.paths) ? c.paths : {}) as Obj;
  for (const [path, item] of Object.entries(bPaths)) {
    if (!isObj(item)) continue;
    const cItem = cPaths[path];
    for (const [method, op] of Object.entries(item)) {
      if (!isObj(op)) continue;
      const cOp = isObj(cItem) ? cItem[method] : undefined;
      const where = `${method.toUpperCase()} ${path}`;
      if (!isObj(cOp)) {
        issues.push({ where, change: 'operation removed' });
        continue;
      }
      if (op.operationId !== cOp.operationId) issues.push({ where, change: `operationId changed from ${op.operationId} to ${cOp.operationId}` });
      if (key(op.security ?? null) !== key(cOp.security ?? null)) issues.push({ where, change: 'security requirement changed' });
      const bRes = isObj(op.responses) ? op.responses : {};
      const cRes = isObj(cOp.responses) ? cOp.responses : {};
      for (const status of Object.keys(bRes)) if (!(status in cRes)) issues.push({ where, change: `documented ${status} response removed` });
      for (const status of Object.keys(cRes)) if (!(status in bRes)) issues.push({ where, change: `undocumented ${status} response added` });
    }
  }
  const bSchemas = (isObj(b.components) && isObj(b.components.schemas) ? b.components.schemas : {}) as Obj;
  const cSchemas = (isObj(c.components) && isObj(c.components.schemas) ? c.components.schemas : {}) as Obj;
  const used = usage(b);
  for (const [name, schema] of Object.entries(bSchemas)) {
    if (!isObj(schema)) continue;
    const dirs = used.get(name);
    const dir: Direction = !dirs || dirs.size === 2 ? 'both' : [...dirs][0];
    compareSchema(`#/components/schemas/${name}`, schema, isObj(cSchemas[name]) ? (cSchemas[name] as Obj) : undefined, dir, issues);
  }
  return issues;
}
