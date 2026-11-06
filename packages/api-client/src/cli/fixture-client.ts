#!/usr/bin/env node
/**
 * Standalone fixture client (API10, standalone portion). Talks to a running fixture API over HTTP with
 * the generated client, validates every response against the v1 contract and checks the fixture
 * behaviours #24 demonstrates. No browser, Next.js, database or model is involved.
 *
 *   OZSB_API_KEY=ozsb_... node dist/cli/fixture-client.js                 # scripted tour, exit 1 on any failure
 *   OZSB_API_KEY=ozsb_... node dist/cli/fixture-client.js --question "Is round A1 open?" [--jurisdiction QLD]
 *
 * OZSB_API_BASE_URL defaults to http://127.0.0.1:3000.
 */
import { createOzsbClient, ContractViolationError, type OzsbClient, type QueryEnvelope, type QueryRequest } from '../index';

type Check = { name: string; ok: boolean; detail: string };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function envelope(client: OzsbClient, body: QueryRequest): Promise<QueryEnvelope> {
  const r = await client.query(body);
  if (!r.ok) throw new Error(`query failed: HTTP ${r.status} ${r.error.code}`);
  return r.data;
}

async function tour(client: OzsbClient, badKey: OzsbClient): Promise<Check[]> {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  const live = await client.live();
  add('liveness', live.ok, live.ok ? 'GET /health/live ok' : `HTTP ${live.status}`);

  const caps = await client.capabilities();
  if (caps.ok) {
    const c = caps.data;
    add(
      'capabilities announce development modes',
      c.credential_mode === 'development' && c.responder === 'fixture' && c.budget_store === 'in_process_development' && c.coverage.fictional,
      `credential_mode=${c.credential_mode} responder=${c.responder} budget_store=${c.budget_store} corpus=${c.corpus_version} clock=${c.clock.mode} ${c.clock.as_of}`,
    );
  } else add('capabilities announce development modes', false, `HTTP ${caps.status} ${caps.error.code}`);

  const unauth = await badKey.query({ question: 'Is round A1 open?' });
  add('invalid key gets a generic 401', !unauth.ok && unauth.status === 401 && unauth.error.code === 'unauthenticated', `HTTP ${unauth.status}`);

  const clar = await envelope(client, { question: 'What should I do next for support?' });
  add('clarification', clar.status === 'clarification' && clar.clarification?.field === 'jurisdiction' && clar.clarification.unknown_allowed === true, `status=${clar.status} field=${clar.clarification?.field}`);

  const unknown = await envelope(client, { question: 'What should I do next for support?', confirmed_context: { jurisdiction: 'unknown' } });
  const leftOut = unknown.unresolved_conditions.find((u) => u.reason === 'explicit_unknown');
  add('explicit Unknown is not re-asked and is reported', unknown.status === 'answer' && !!leftOut && unknown.warnings.some((w) => w.code === 'explicit_unknown'), leftOut?.text ?? `status=${unknown.status}`);

  const a2 = await envelope(client, { question: 'What does round A2 require today?' });
  const future = a2.claims.find((c) => c.applicability === 'future_effective');
  add(
    'future-effective requirement is dated, not an action today',
    !!future && !a2.answer?.actions.some((a) => a.claim_ids.includes(future.claim_id)),
    future ? `${future.qualifier_text}: ${future.text}` : 'no future-effective claim',
  );

  const a1 = await envelope(client, { question: 'Is round A1 open?' });
  add('closed round: no application recommended', a1.warnings.some((w) => w.code === 'closed_round') && !a1.answer?.actions.some((a) => a.action_id === 'act_apply_a1'), a1.answer?.summary ?? '');

  const none = await envelope(client, { question: 'How do I bake sourdough bread?' });
  add('insufficient_evidence', none.status === 'insufficient_evidence' && none.answer === null, `status=${none.status}`);

  const cleared = await client.source('src_prog_a_overview');
  const rejected = await client.source('src_rejected_mirror');
  add(
    'source excerpts gated on rights status',
    cleared.ok && rejected.ok && typeof cleared.data.excerpt === 'string' && cleared.data.excerpt.length <= cleared.data.excerpt_max_chars && rejected.data.excerpt === null,
    cleared.ok && rejected.ok ? `cleared excerpt ${cleared.data.excerpt?.length}/${cleared.data.excerpt_max_chars} chars; rejected excerpt ${rejected.data.excerpt}` : 'source lookup failed',
  );
  return checks;
}

async function main(): Promise<void> {
  const baseUrl = process.env.OZSB_API_BASE_URL ?? 'http://127.0.0.1:3000';
  const apiKey = process.env.OZSB_API_KEY;
  if (!apiKey) {
    console.error('Set OZSB_API_KEY to a development key (npm run dev:keys prints one).');
    process.exit(2);
  }
  const client = createOzsbClient({ baseUrl, apiKey });

  const question = arg('question');
  if (question) {
    const jurisdiction = arg('jurisdiction');
    const r = await client.query({ question, ...(jurisdiction ? { confirmed_context: { jurisdiction: jurisdiction as never } } : {}) });
    console.log(JSON.stringify(r.ok ? r.data : { status: r.status, error: r.error }, null, 2));
    process.exit(r.ok ? 0 : 1);
  }

  const badKey = createOzsbClient({ baseUrl, apiKey: 'ozsb_000000000000_' + 'A'.repeat(43) });
  console.log(`Standalone fixture client → ${baseUrl} (every response validated against the v1 contract)`);
  const checks = await tour(client, badKey);
  for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}\n      ${c.detail}`);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `${failed} of ${checks.length} checks failed.` : `All ${checks.length} checks passed. Fixture data is fictional; this is not advice.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e instanceof ContractViolationError ? `CONTRACT VIOLATION: ${e.message}` : `error: ${(e as Error).message}`);
  process.exit(1);
});
