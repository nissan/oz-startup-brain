'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { components } from '@ozsb/api-client';
import {
  Button,
  ClarificationPrompt,
  ContextChip,
  CoverageBanner,
  LimitPanel,
  NextStepCard,
  PrerequisiteMap,
  StarterTask,
  StatusNotice,
} from '@/design-system/generated/bundle';
import {
  CONDITION_HEADINGS,
  JURISDICTIONS,
  STAGES,
  STARTERS,
  evidenceFor,
  failureView,
  jurisdictionLabel,
  longDate,
  sequenceNodes,
  serviceStatus,
  sourceIdsFor,
  stageLabel,
  type Capabilities,
  type Envelope,
  type FailureView,
  type Jurisdiction,
  type Stage,
} from '@/lib/present';
import { ContextEditor } from './ContextEditor';
import { EvidencePanel } from './EvidencePanel';
import { ThemeToggle } from './ThemeToggle';

type SourceRecord = components['schemas']['SourceRecord'];
type Context = { jurisdiction?: Jurisdiction; stage?: Stage };
/** What the evidence panel is showing: one of today's actions, or one prerequisite step. */
type Selection = { kind: 'action'; id: string } | { kind: 'step'; position: number };
interface Result {
  envelope: Envelope;
  question: string;
  context: Context;
  askedAt: Date;
}

const MAX_QUESTION = 2000;

async function bff<T>(path: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; code?: string; retryAfterSeconds?: number }> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { ...(init?.headers ?? {}), accept: 'application/json' }, cache: 'no-store' });
  } catch {
    return { ok: false, status: 0, code: 'bff_upstream_unreachable' };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (res.ok) return { ok: true, data: body as T };
  const err = (body as { error?: { code?: string; retry_after_seconds?: number } } | null)?.error;
  return { ok: false, status: res.status, code: err?.code, retryAfterSeconds: err?.retry_after_seconds };
}

/**
 * The founder journey (slice 1A-UI, local fixture mode). Everything shown comes from the fixture
 * API through the thin BFF: this component holds UI state (draft question, confirmed context,
 * the last answer, which step's evidence is open) and never decides freshness, applicability,
 * clarification or coverage itself.
 */
export function Journey() {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [capsFailed, setCapsFailed] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [context, setContext] = useState<Context>({});
  const [editing, setEditing] = useState<'jurisdiction' | 'stage' | null>(null);
  // Non-streaming API: there is no real progress to report, so waiting is a single honest state.
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState<(FailureView & { draft: string }) | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [sources, setSources] = useState<Record<string, SourceRecord | null | 'unavailable'>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const evidenceAsideRef = useRef<HTMLHeadingElement>(null);
  const evidenceInlineRef = useRef<HTMLHeadingElement>(null);
  const evidenceStepRef = useRef<HTMLHeadingElement>(null);
  /** Focus whichever evidence heading is displayed (the aside and inline action panels swap by width). */
  const focusEvidence = () => {
    const target = [evidenceStepRef.current, evidenceInlineRef.current, evidenceAsideRef.current].find((el) => el && el.offsetParent !== null);
    target?.focus();
  };
  /** Increments per request; a response is applied only if it belongs to the latest request. */
  const inFlight = useRef(0);
  /** The question of the request currently in flight, so a context change can re-ask it. */
  const pendingQuestion = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bff<Capabilities>('/api/bff/capabilities').then((r) => {
      if (cancelled) return;
      if (r.ok) setCaps(r.data);
      else setCapsFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(
    async (q: string, ctx: Context) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setQuestionError('Type a question first.');
        textareaRef.current?.focus();
        return;
      }
      if (trimmed.length > MAX_QUESTION) {
        setQuestionError(`Questions are up to ${MAX_QUESTION} characters; this one is ${trimmed.length}.`);
        textareaRef.current?.focus();
        return;
      }
      setQuestionError(null);
      const id = ++inFlight.current;
      pendingQuestion.current = trimmed;
      setPending(true);
      const body: { question: string; confirmed_context?: Context } = { question: trimmed };
      const confirmed = Object.fromEntries(Object.entries(ctx).filter(([, v]) => v !== undefined)) as Context;
      if (Object.keys(confirmed).length) body.confirmed_context = confirmed;
      const r = await bff<Envelope>('/api/bff/query', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      // A newer request (for example after a context edit) supersedes this one, whatever order they return in.
      if (id !== inFlight.current) return;
      pendingQuestion.current = null;
      setPending(false);
      if (r.ok) {
        setFailure(null);
        setResult({ envelope: r.data, question: trimmed, context: confirmed, askedAt: new Date() });
        const first = r.data.answer?.actions[0]?.action_id;
        setSelected(first ? { kind: 'action', id: first } : null);
        requestAnimationFrame(() => resultsRef.current?.focus());
      } else {
        // The draft and the previous answer are both kept; the previous answer is labelled stale below.
        setFailure({ ...failureView(r.status, r.code, r.retryAfterSeconds), draft: trimmed });
        requestAnimationFrame(() => resultsRef.current?.focus());
      }
    },
    [],
  );

  const envelope = result?.envelope ?? null;
  const answer = envelope?.answer ?? null;
  const selectedAction = selected?.kind === 'action' ? answer?.actions.find((a) => a.action_id === selected.id) ?? null : null;
  const selectedStep = selected?.kind === 'step' ? answer?.prerequisite_sequence?.find((s) => s.position === selected.position) ?? null : null;
  const selectedItem = selectedAction ? { title: selectedAction.title, claim_ids: selectedAction.claim_ids } : selectedStep ? { title: `Step ${selectedStep.position}: ${selectedStep.label}`, claim_ids: selectedStep.claim_ids } : null;
  const selectedSourceIds = envelope && selectedItem ? sourceIdsFor(selectedItem, envelope) : [];

  // Fetch the rights-gated source record for every source behind the selected item, once per source.
  useEffect(() => {
    for (const id of selectedSourceIds) {
      if (sources[id] !== undefined) continue;
      setSources((s) => ({ ...s, [id]: null }));
      bff<SourceRecord>(`/api/bff/sources/${encodeURIComponent(id)}`).then((r) => {
        setSources((s) => ({ ...s, [id]: r.ok ? r.data : 'unavailable' }));
      });
    }
  }, [selectedSourceIds.join('|'), sources]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextMismatch = !!result && (result.context.stage !== context.stage || result.context.jurisdiction !== context.jurisdiction);
  const stale = !!result && !pending && (!!failure || contextMismatch);
  const service = envelope ? serviceStatus(envelope) : null;
  const nodes = envelope ? sequenceNodes(envelope) : null;
  const supportedTasks = caps?.supported_tasks ?? (['next_step', 'round_status', 'requirements_today'] as const);

  const saveContext = (patch: Context) => {
    const next = { ...context, ...patch };
    for (const k of Object.keys(next) as (keyof Context)[]) if (next[k] === undefined) delete next[k];
    setContext(next);
    setEditing(null);
    // An edited assumption re-asks so the answer reflects the new context (SC02). If a request is in
    // flight, it is superseded: the new request gets a new ID and the old response is ignored when it
    // arrives, so the earlier context can never win. Nothing is sent when no question has been asked.
    const inFlightQuestion = pendingQuestion.current;
    if (inFlightQuestion) void submit(inFlightQuestion, next);
    else if (question.trim() && (result || failure)) void submit(question, next);
  };

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="masthead__title">Oz Startup Brain</h1>
        <div className="masthead__meta">
          <p className="masthead__tagline">Evidence-backed next steps for Australian founders.</p>
          <span className="mode-pill" title="This local build answers from a fictional fixture corpus. Nothing here is live, and nothing here is advice.">
            Local fixture mode
          </span>
          <ThemeToggle />
        </div>
      </header>

      {caps ? (
        <CoverageBanner
          jurisdictions={caps.coverage.jurisdictions.map((j) => jurisdictionLabel(j) ?? j)}
          corpusVersion={caps.corpus_version}
          asOf={longDate(caps.clock.as_of)}
          credentialMode={caps.credential_mode === 'development' ? 'development' : 'live'}
        />
      ) : (
        <p className="section__caption" role="status">
          {capsFailed ? 'The planner’s coverage and corpus version could not be loaded; answers will still say which corpus they came from.' : 'Loading coverage…'}
        </p>
      )}

      <section className="section" aria-labelledby="ask-heading">
        <h2 id="ask-heading" className="section__title">
          Start with a task
        </h2>
        <StarterTask
          tasks={supportedTasks.map((t) => ({ id: t, title: STARTERS[t].title, hint: STARTERS[t].hint, active: question.trim() === STARTERS[t].example }))}
          onSelect={(id) => {
            const ex = STARTERS[id as keyof typeof STARTERS]?.example;
            if (ex) {
              setQuestion(ex);
              setQuestionError(null);
              textareaRef.current?.focus();
            }
          }}
        />
        <form
          className="ask"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(question, context);
          }}
        >
          <label htmlFor="question" className="ask__label">
            Your question
          </label>
          <textarea
            id="question"
            ref={textareaRef}
            className="ask__textarea"
            rows={3}
            value={question}
            maxLength={MAX_QUESTION + 500}
            placeholder="e.g. I am building a software startup in Toowoomba. Where should I begin?"
            aria-describedby="question-help question-count"
            aria-invalid={questionError ? 'true' : undefined}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (questionError) setQuestionError(null);
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit(question, context);
            }}
          />
          {questionError ? (
            <p className="ask__error" role="alert">
              {questionError}
            </p>
          ) : null}
          <div className="ask__actions">
            <Button variant="primary" onClick={() => void submit(question, context)} disabled={pending}>
              Ask the planner
            </Button>
            <span id="question-count" className="ask__count" aria-live="polite">
              {question.trim().length}/{MAX_QUESTION}
            </span>
          </div>
          <p id="question-help" className="section__caption">
            Information and routing, not an application or approval. This local build answers from a fictional fixture corpus.
          </p>
        </form>
      </section>

      <section className="section" aria-labelledby="context-heading">
        <h2 id="context-heading" className="section__title">
          Your situation
        </h2>
        <div className="chips">
          {/* "Not set" and an explicit "Unknown" are different answers (SC22) and read differently. */}
          <ContextChip label="Jurisdiction" value={context.jurisdiction === undefined ? 'Not set' : jurisdictionLabel(context.jurisdiction)} unknown={context.jurisdiction === 'unknown'} onEdit={() => setEditing(editing === 'jurisdiction' ? null : 'jurisdiction')} />
          <ContextChip label="Stage" value={context.stage === undefined ? 'Not set' : stageLabel(context.stage)} unknown={context.stage === 'unknown'} onEdit={() => setEditing(editing === 'stage' ? null : 'stage')} />
        </div>
        <p className="section__caption">
          Unknown is a valid answer and is never asked about twice. A field that is not set may be asked about once. The planner never assumes personal status or IP rights.
        </p>
        {editing === 'jurisdiction' ? (
          <ContextEditor<Jurisdiction>
            field="Jurisdiction"
            legend="Where is the business based?"
            help="Support routes differ by state or territory. Choose Unknown to see national routes only without being asked again."
            options={JURISDICTIONS}
            value={context.jurisdiction}
            onSave={(v) => saveContext({ jurisdiction: v })}
            onCancel={() => setEditing(null)}
          />
        ) : null}
        {editing === 'stage' ? (
          <ContextEditor<Stage>
            field="Stage"
            legend="How far along is it?"
            help="Stage is recorded with your question. Supported fictional Idea and Prototype routes can differ; other stages use a limited default route."
            options={STAGES}
            value={context.stage}
            onSave={(v) => saveContext({ stage: v })}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </section>

      <section className="section" aria-labelledby="results-heading" aria-busy={pending}>
        <h2 id="results-heading" className="section__title" tabIndex={-1} ref={resultsRef}>
          {pending ? 'Working on your question' : failure ? 'The planner could not answer' : envelope?.status === 'clarification' ? 'One detail first' : envelope?.status === 'insufficient_evidence' ? 'No answer from the evidence' : answer ? 'Your next steps' : 'Your next steps will appear here'}
        </h2>

        {pending ? (
          <div className="waiting" role="status" aria-live="polite">
            <span className="waiting__bar" aria-hidden="true" />
            <span>Asking the planner. The answer will show the sources and dates it rests on.</span>
          </div>
        ) : null}

        {!pending && failure ? (
          <LimitPanel
            kind={failure.kind}
            title={failure.title}
            body={failure.retryAfterSeconds ? `${failure.body} The service suggests waiting about ${failure.retryAfterSeconds} seconds.` : failure.body}
            draft={failure.draft}
            actionLabel={failure.action}
            onAction={() => {
              if (failure.kind === 'outside') textareaRef.current?.focus();
              else void submit(question, context);
            }}
            secondaryLabel="Change my context"
            onSecondary={() => setEditing('jurisdiction')}
          />
        ) : null}

        {!pending && !failure && !envelope ? (
          <p className="empty">Ask a question above, or start from a task. Answers show up to three next steps, the sources and dates behind each, what the planner could not resolve, and what comes first.</p>
        ) : null}

        {stale && result ? (
          <p className="stale" role="status">
            <strong>Stale</strong>
            <span>
              Showing your earlier answer {result.context.stage === undefined ? 'with no stage selected' : `for the ${stageLabel(result.context.stage)} stage`} to &ldquo;{result.question}&rdquo; from {result.askedAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}. This is not an updated answer for your current context (Stage: {context.stage === undefined ? 'Not set' : stageLabel(context.stage)}; Jurisdiction: {context.jurisdiction === undefined ? 'Not set' : jurisdictionLabel(context.jurisdiction)}).
            </span>
          </p>
        ) : null}

        {!pending && envelope?.status === 'clarification' && envelope.clarification ? (
          <ClarificationPrompt
            question={envelope.clarification.question}
            why={envelope.clarification.why}
            options={envelope.clarification.options.filter((o) => o.value !== 'unknown').map((o) => o.label)}
            onConfirm={(label) => {
              const opt = envelope.clarification?.options.find((o) => o.label === label);
              if (opt && envelope.clarification?.field === 'jurisdiction') saveContext({ jurisdiction: opt.value as Jurisdiction });
            }}
            onUnknown={() => {
              if (envelope.clarification?.field === 'jurisdiction') saveContext({ jurisdiction: 'unknown' });
            }}
          />
        ) : null}

        {!pending && envelope?.status === 'insufficient_evidence' ? (
          <LimitPanel
            kind="outside"
            title="The evidence does not cover that question"
            body={envelope.unresolved_conditions[0]?.text ?? 'The fixture corpus holds no evidence for this question, so the planner gives no answer rather than a guess.'}
            actionLabel="Change my question"
            onAction={() => textareaRef.current?.focus()}
            secondaryLabel="Start from a task"
            onSecondary={() => document.getElementById('ask-heading')?.scrollIntoView({ block: 'start' })}
          />
        ) : null}

        {!pending && envelope && answer ? (
          <div className="results">
            <div className="results__main">
              <p className="section__caption">
                Answer context — Stage: {result?.context.stage === undefined ? 'Not set' : stageLabel(result.context.stage)} · Jurisdiction: {result?.context.jurisdiction === undefined ? 'Not set' : jurisdictionLabel(result.context.jurisdiction)}
              </p>
              <p className="summary">{answer.summary}</p>
              {service ? <StatusNotice status={service.status} detail={service.detail} /> : null}
              {answer.actions.length ? (
                <div className="cards">
                  {answer.actions.map((a, i) => {
                    const ev = evidenceFor(a, envelope);
                    return (
                      <div key={a.action_id} className={selectedAction?.action_id === a.action_id ? 'card card--selected' : 'card'}>
                        <NextStepCard
                          title={a.title}
                          why={a.why}
                          evidence={ev}
                          door={a.next_door ?? undefined}
                          emphasis={i === 0 ? 'primary' : 'secondary'}
                          onInspect={() => {
                            setSelected({ kind: 'action', id: a.action_id });
                            requestAnimationFrame(focusEvidence);
                          }}
                        />
                        {selectedAction && selectedItem && a.action_id === selectedAction.action_id ? (
                          <EvidencePanel ref={evidenceInlineRef} placement="inline" item={selectedItem} envelope={envelope} sources={sources} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty">No action is recommended today. The conditions below say why.</p>
              )}
              {/* Local editorial help is deliberately separate from sourced claims and excerpts. */}
              <details className="terms-help">
                <summary>Terms in plain language</summary>
                <div className="section">
                  <p className="section__caption">Editorial explanation — not a source excerpt or an eligibility check.</p>
                  <p><strong>Commercialisation</strong> means turning an idea or research into a product or service people can use or buy. A university commercialisation office can help check the route and IP questions; this does not establish IP ownership or eligibility.</p>
                  <p><strong>Matched contribution</strong> means funding or other resources an applicant may need to provide alongside support. Whether it applies, what qualifies and how much are not established here; check the relevant guidelines.</p>
                </div>
              </details>
              {envelope.unresolved_conditions.length ? (
                <section className="section" aria-labelledby="conditions-heading">
                  <h3 id="conditions-heading" className="section__title" style={{ fontSize: 17, lineHeight: '24px' }}>
                    What the planner could not resolve
                  </h3>
                  <ul className="conditions">
                    {envelope.unresolved_conditions.map((c) => (
                      <li key={c.condition_id} className="conditions__item">
                        <span className="conditions__heading">{CONDITION_HEADINGS[c.reason]}</span>
                        <span>{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
            <aside className="results__aside">
              {selectedAction && selectedItem ? <EvidencePanel ref={evidenceAsideRef} placement="aside" item={selectedItem} envelope={envelope} sources={sources} /> : null}
              <section className="section" aria-labelledby="sequence-heading">
                <h2 id="sequence-heading" className="section__title">
                  What comes first
                </h2>
                {nodes && nodes.length ? (
                  <>
                    <PrerequisiteMap nodes={nodes} />
                    <div className="section" aria-label="How to read these steps">
                      <p className="section__caption"><strong>Requirement:</strong> A source-stated requirement says what must be in place before applying. Keep its dates and qualifiers in view.</p>
                      <p className="section__caption"><strong>Preparation:</strong> A suggested preparation step helps you get ready; its place in this list is not an extra eligibility rule. Steps marked &ldquo;Suggested next step&rdquo; are editorial sequencing, not a documented requirement.</p>
                      <p className="section__caption">For example, customer-interest evidence can appear in both: the requirement is to have it, and the preparation step is to gather it. That overlap is not a source disagreement.</p>
                    </div>
                    {/* Every step's evidence is reachable, including steps no action card cites. */}
                    <ul className="step-evidence" aria-label="Evidence for each step">
                      {answer.prerequisite_sequence!.map((step) => {
                        const open = selectedStep?.position === step.position;
                        return (
                          <li key={step.position}>
                            <button
                              type="button"
                              className="step-evidence__toggle"
                              aria-expanded={open}
                              aria-label={`${open ? 'Hide' : 'Show'} evidence for step ${step.position}: ${step.label}`}
                              onClick={() => {
                                setSelected(open ? null : { kind: 'step', position: step.position });
                                if (!open) requestAnimationFrame(focusEvidence);
                              }}
                            >
                              Evidence for step {step.position}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {selectedStep && selectedItem ? <EvidencePanel ref={evidenceStepRef} placement="step" item={selectedItem} envelope={envelope} sources={sources} /> : null}
                  </>
                ) : service ? (
                  <p className="section__caption">The prerequisite sequence is left out rather than guessed while the graph is unavailable.</p>
                ) : (
                  <p className="section__caption">No prerequisite sequence applies to this question.</p>
                )}
              </section>
            </aside>
          </div>
        ) : null}

        {!pending && envelope ? (
          <p className="footer-line">
            <span>{envelope.statement}</span>
            <span>corpus {envelope.corpus_version}</span>
            <span>as of {longDate(envelope.as_of)}</span>
            <span>responder {envelope.responder}</span>
            <span>request {envelope.request_id}</span>
          </p>
        ) : null}
      </section>
    </main>
  );
}
