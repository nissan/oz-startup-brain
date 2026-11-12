// Words-only entry point, as in present.ts: the export never brings the validator into the client.
import { EVIDENCE_STATE_WORDS, SERVICE_STATUS_WORDS } from '@ozsb/contracts/dist/vocabulary';
import {
  claimKindView,
  claimsFor,
  conditionGroups,
  evidenceFor,
  jurisdictionLabel,
  longDate,
  serviceStatus,
  stageLabel,
  type ConditionView,
  type Envelope,
  type Jurisdiction,
  type Stage,
} from './present';

/**
 * The checklist export (SC09, #10): a client-side rendering of one response envelope as plain
 * Markdown. There is no export endpoint (ADR 001), so everything here comes from the envelope and
 * the founder's own question and confirmed context. Evidence and service words come only from the
 * shared vocabulary table, the same one the components use, so a label cannot differ between the
 * page and the export. Nothing is re-judged: states, applicability and dates are the API's.
 */
export interface ExportInput {
  envelope: Envelope;
  /** The founder's own question for this answer; the envelope does not repeat it. */
  question: string;
}

export const EXPORT_DISCLAIMER = 'This checklist is information and routing copied from one answer. It is not an application, an approval, an eligibility decision or advice.';

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

function conditionLines(items: ConditionView[], withHeading: boolean): string[] {
  return items.flatMap((c) => [
    `- ${withHeading ? `**${c.heading}:** ` : ''}${oneLine(c.lead)}`,
    ...c.qualifications.map((q) => `  - ${oneLine(q)}`),
  ]);
}

export function renderChecklist({ envelope, question }: ExportInput): string {
  const answer = envelope.answer;
  // The context the API says it answered for, not whatever the chips show now.
  const context: { stage?: Stage; jurisdiction?: Jurisdiction } = envelope.confirmed_context;
  const out: string[] = [];
  const citations = new Map(envelope.citations.map((c) => [c.citation_id, c]));
  // Sources are numbered in first-use order so every claim line can point at one.
  const sourceNumbers = new Map<string, number>();
  const numberFor = (citationId: string | undefined): number | undefined => {
    const citation = citationId ? citations.get(citationId) : undefined;
    if (!citation) return undefined;
    if (!sourceNumbers.has(citation.citation_id)) sourceNumbers.set(citation.citation_id, sourceNumbers.size + 1);
    return sourceNumbers.get(citation.citation_id);
  };
  const claimLines = (item: { claim_ids: string[] }, indent: string): string[] =>
    claimsFor(item, envelope).map(({ claim }) => {
      const view = claimKindView(claim);
      const refs = claim.citation_ids.map((id) => numberFor(id)).filter((n): n is number => n !== undefined);
      const meta = [
        view.kind,
        view.timing,
        claim.valid_from ? `from ${longDate(claim.valid_from)}` : null,
        claim.valid_to ? `until ${longDate(claim.valid_to)}` : null,
        view.note || null,
      ].filter(Boolean).join('; ');
      return `${indent}- ${oneLine(claim.text)} (${meta})${refs.length ? ` ${refs.map((n) => `[${n}]`).join('')}` : ''}`;
    });

  out.push('# Oz Startup Brain checklist', '');
  out.push(EXPORT_DISCLAIMER, '');
  for (const w of envelope.warnings.filter((x) => x.kind === 'mode')) out.push(oneLine(w.message), '');
  out.push(`- Question: ${oneLine(question)}`);
  out.push(`- Confirmed context: Stage: ${context.stage === undefined ? 'Not set' : stageLabel(context.stage)}; Jurisdiction: ${context.jurisdiction === undefined ? 'Not set' : jurisdictionLabel(context.jurisdiction)}`);
  out.push(`- Corpus version: ${envelope.corpus_version}`);
  out.push(`- As of: ${longDate(envelope.as_of) ?? envelope.as_of}`);
  out.push(`- Responder: ${envelope.responder}; request ${envelope.request_id}`, '');

  const service = serviceStatus(envelope);
  if (service) out.push(`**${SERVICE_STATUS_WORDS[service.status]}.** The prerequisite sequence is left out rather than guessed.`, '');

  if (answer) {
    out.push('## Summary', '', oneLine(answer.summary), '');
    out.push('## Next steps', '');
    if (!answer.actions.length) out.push('No action is recommended today. The conditions below say why.', '');
    for (const action of answer.actions) {
      const ev = evidenceFor(action, envelope);
      out.push(`- [ ] **${oneLine(action.title)}**`);
      out.push(`  - Why: ${oneLine(action.why)}`);
      out.push(`  - Evidence: ${EVIDENCE_STATE_WORDS[ev.state]}${ev.date ? ` ${ev.date}` : ''}${ev.publisher ? `, ${oneLine(ev.publisher)}` : ''}`);
      if (action.next_door) out.push(`  - Next door: ${oneLine(action.next_door)}`);
      out.push('  - Rests on:', ...claimLines(action, '    '));
    }
    if (answer.actions.length) out.push('');

    const sequence = answer.prerequisite_sequence;
    if (sequence?.length) {
      out.push('## What comes first', '');
      for (const step of sequence) {
        const first = claimsFor(step, envelope)[0];
        const date = step.evidence_state === 'checked' ? longDate(first?.citation?.last_verified_at) : undefined;
        out.push(`${step.position}. ${oneLine(step.label)} (${step.assertion_kind === 'editorial' ? 'suggested preparation, not a source requirement' : 'stated by the source'}; ${EVIDENCE_STATE_WORDS[step.evidence_state]}${date ? ` ${date}` : ''})`);
        out.push(...claimLines(step, '   '));
      }
      out.push('');
    }
  } else if (envelope.status === 'insufficient_evidence') {
    out.push('## No answer from the evidence', '', 'The planner gave no answer rather than a guess.', '');
  }

  const groups = conditionGroups(envelope.unresolved_conditions);
  if (groups.unresolved.length) out.push('## What the planner could not resolve', '', ...conditionLines(groups.unresolved, true), '');
  if (groups.future.length) out.push('## Takes effect later', '', ...conditionLines(groups.future, false), '');

  if (sourceNumbers.size) {
    out.push('## Sources', '');
    for (const [citationId, n] of sourceNumbers) {
      const c = citations.get(citationId)!;
      out.push(`[${n}] ${oneLine(c.title)}. ${oneLine(c.publisher)}. Source version ${longDate(c.source_version_date) ?? 'unknown'}; verified ${longDate(c.last_verified_at) ?? 'unknown'}. ${c.canonical_url}`);
    }
    out.push('');
  }
  out.push(oneLine(envelope.statement));
  return out.join('\n') + '\n';
}

/** A stable, safe file name: the corpus version is part of it so two exports are told apart. */
export function checklistFileName(envelope: Envelope): string {
  return `oz-startup-brain-checklist-${envelope.corpus_version.replace(/[^a-z0-9.-]+/gi, '-')}.md`;
}
