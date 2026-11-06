import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SOURCE_ID_PATTERN, type Jurisdiction, type RightsStatus, type SourceClass, type UnresolvedCondition } from '@ozsb/contracts';

/**
 * The fictional fixture corpus (apps/api/fixtures/corpus.json). Every program, round, organisation and URL
 * in it is invented; `snapshot_location` and `text` are internal fields that the API must never return
 * verbatim except as a rights-gated excerpt (API13).
 */
export interface FixtureSource {
  source_id: string;
  publisher: string;
  title: string;
  canonical_url: string;
  source_class: SourceClass;
  jurisdiction: Jurisdiction;
  published_at: string | null;
  source_version_date: string;
  last_verified_at: string | null;
  rights_status: RightsStatus;
  snapshot_location: string;
  text: string;
}

export interface FixtureClaim {
  claim_id: string;
  source_id: string;
  assertion_kind: 'sourced' | 'editorial';
  valid_from: string | null;
  valid_to: string | null;
  text: string;
}

export type Applicability = 'current' | 'future_effective' | 'historical' | 'unverified';

export interface FixtureAction {
  action_id: string;
  jurisdiction: Jurisdiction;
  title: string;
  why: string;
  claim_ids: string[];
  next_door: string | null;
}

export interface FixtureSequenceStep {
  label: string;
  jurisdiction: Jurisdiction;
  claim_ids: string[];
}

export interface FixtureStageVariant {
  summary_base: string;
  summary_base_unverified: string;
  actions: FixtureAction[];
  sequence: FixtureSequenceStep[];
}

export interface FixtureTopic {
  topic_id: string;
  conditions?: Omit<UnresolvedCondition, 'condition_id'>[];
  stage_variants?: Partial<Record<'idea' | 'prototype', FixtureStageVariant>>;
  task: 'next_step' | 'round_status' | 'requirements_today';
  /** Every group must contain at least one of its terms (case-insensitive whole tokens). */
  match: string[][];
  jurisdiction_sensitive: boolean;
  summary_base: string | null;
  /**
   * Replaces summary_base whenever any claim behind the answer is not fresh, so a base sentence that
   * asserts current applicability is never shown over stale evidence (R33-01 follow-up). Required
   * whenever summary_base is set; it may repeat summary_base only if that sentence asserts nothing
   * about what is in effect today.
   */
  summary_base_unverified: string | null;
  summary_rules: { claim_id: string; applicability: Applicability; text: string }[];
  actions: FixtureAction[];
  context_claim_ids: string[];
  sequence: FixtureSequenceStep[];
}

export interface FixtureCorpus {
  notice: string;
  corpus_version: string;
  fictional: true;
  coverage: Jurisdiction[];
  default_as_of: string;
  staleness_days: Record<SourceClass, number>;
  classes_that_state_effective_dates: SourceClass[];
  sources: FixtureSource[];
  claims: FixtureClaim[];
  topics: FixtureTopic[];
}

/** apps/api, found by walking up from this file, so the path holds both from src (tests) and dist (runtime). */
export function apiPackageRoot(start = __dirname): string {
  let dir = start;
  for (;;) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate) && (JSON.parse(readFileSync(candidate, 'utf8')) as { name?: string }).name === '@ozsb/api') return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('cannot locate the @ozsb/api package root');
    dir = parent;
  }
}

export const CORPUS_PATH = join(apiPackageRoot(), 'fixtures', 'corpus.json');

/** Loads the corpus and checks its internal references so a broken fixture fails at startup, not mid-request. */
export function loadFixtureCorpus(path = CORPUS_PATH): FixtureCorpus {
  const corpus = JSON.parse(readFileSync(path, 'utf8')) as FixtureCorpus;
  if (corpus.fictional !== true) throw new Error('fixture corpus must be marked fictional');
  const sources = new Set(corpus.sources.map((s) => s.source_id));
  const claims = new Set<string>();
  for (const c of corpus.claims) {
    if (!sources.has(c.source_id)) throw new Error(`claim ${c.claim_id} cites unknown source ${c.source_id}`);
    if (claims.has(c.claim_id)) throw new Error(`duplicate claim ${c.claim_id}`);
    claims.add(c.claim_id);
  }
  const sourceIdPattern = new RegExp(SOURCE_ID_PATTERN);
  for (const s of corpus.sources) {
    // Every ID a citation can carry must be requestable through the published path contract (R33-04).
    if (!sourceIdPattern.test(s.source_id)) throw new Error(`fixture source ID ${s.source_id} does not match ${SOURCE_ID_PATTERN}`);
    if (!/^https:\/\/[a-z0-9.-]+\.invalid\//.test(s.canonical_url)) {
      throw new Error(`fixture source ${s.source_id} must use a reserved .invalid URL`);
    }
  }
  for (const t of corpus.topics) {
    if (t.summary_base !== null && typeof t.summary_base_unverified !== 'string') {
      throw new Error(`topic ${t.topic_id} sets summary_base without summary_base_unverified`);
    }
    const variants = Object.values(t.stage_variants ?? {});
    for (const v of variants) {
      if (typeof v.summary_base !== 'string' || typeof v.summary_base_unverified !== 'string') throw new Error(`topic ${t.topic_id} has incomplete stage summary`);
    }
    const ids = [...variants.flatMap((v) => [...v.actions.flatMap((a) => a.claim_ids), ...v.sequence.flatMap((s) => s.claim_ids)]), ...t.actions.flatMap((a) => a.claim_ids), ...t.context_claim_ids, ...t.sequence.flatMap((s) => s.claim_ids), ...t.summary_rules.map((r) => r.claim_id)];
    for (const id of ids) if (!claims.has(id)) throw new Error(`topic ${t.topic_id} references unknown claim ${id}`);
  }
  return corpus;
}
