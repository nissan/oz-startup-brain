import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { v1Schema } from './generated/schema';

export * from './generated/types';
export { v1Schema };

/** Names of the definitions in schemas/v1.schema.json. */
export type DefinitionName = keyof typeof v1Schema.$defs;

export const SCHEMA_VERSION = '1.0.0' as const;
export const STANDING_STATEMENT = 'Information and routing, not an application or approval.' as const;

/** The five evidence-state words rendered by the design system's EvidenceLabel. #10 moves the UI to this table. */
export const EVIDENCE_STATE_WORDS = {
  checked: 'Source checked',
  'needs-check': 'Needs a current check',
  disagree: 'Sources disagree',
  suggested: 'Suggested next step',
  outside: 'Outside current coverage',
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
addFormats(ajv);
// The whole document is registered once; validators are compiled from JSON pointers into it,
// so cross-definition $refs resolve exactly as they do in the published OpenAPI components.
ajv.addSchema(v1Schema as unknown as object);

const cache = new Map<DefinitionName, ValidateFunction>();

export function validatorFor(name: DefinitionName): ValidateFunction {
  let v = cache.get(name);
  if (!v) {
    const compiled = ajv.getSchema(`${v1Schema.$id}#/$defs/${name}`);
    if (!compiled) throw new Error(`unknown contract definition ${name}`);
    v = compiled;
    cache.set(name, v);
  }
  return v;
}

export interface ContractIssue {
  path: string;
  issue: string;
}

export function contractIssues(errors: ErrorObject[] | null | undefined): ContractIssue[] {
  return (errors ?? []).map((e) => {
    let path = e.instancePath || '/';
    if (e.keyword === 'additionalProperties' && 'additionalProperty' in e.params) {
      path = `${e.instancePath}/${String((e.params as { additionalProperty: string }).additionalProperty)}`;
    }
    if (e.keyword === 'required' && 'missingProperty' in e.params) {
      path = `${e.instancePath}/${String((e.params as { missingProperty: string }).missingProperty)}`;
    }
    return { path, issue: e.keyword === 'additionalProperties' ? 'is not an allowed property' : (e.message ?? e.keyword) };
  });
}

/** Validates a value against a named definition; returns the issues (empty when valid). */
export function check(name: DefinitionName, value: unknown): ContractIssue[] {
  const v = validatorFor(name);
  return v(value) ? [] : contractIssues(v.errors);
}

/** Throws with readable issues if the value does not satisfy the named definition. */
export function assertValid(name: DefinitionName, value: unknown): void {
  const issues = check(name, value);
  if (issues.length) {
    throw new Error(`${name} contract violation: ${issues.map((i) => `${i.path} ${i.issue}`).join('; ')}`);
  }
}
export { compareOpenApi, type CompatIssue } from './compat';
