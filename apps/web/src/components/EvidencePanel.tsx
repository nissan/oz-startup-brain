'use client';
import { forwardRef } from 'react';
import type { components } from '@ozsb/api-client';
import { Button, SourcePanel } from '@/design-system/generated/bundle';
import { claimKindView, claimsFor, excerptRepeatsClaim, longDate, type Envelope } from '@/lib/present';

type SourceRecord = components['schemas']['SourceRecord'];

interface Props {
  /** One of today's actions or one prerequisite step: a title and the claims it rests on. */
  item: { title: string; claim_ids: string[] };
  envelope: Envelope;
  /** Fetched source records by source ID: a record, null while loading, or 'unavailable' on failure. */
  sources: Record<string, SourceRecord | null | 'unavailable'>;
  /** aside: beside the cards on wide screens; inline: under the selected card on narrow ones; step: under the prerequisite list. */
  placement: 'aside' | 'inline' | 'step';
  /** Action evidence can close without changing the answer. Prerequisite steps keep their toggle. */
  onDismiss?: () => void;
}

/**
 * The evidence behind one action or prerequisite step: every distinct supporting source in the
 * design system's SourcePanel (publisher, version, verification date, link, rights-gated excerpt),
 * then every claim with the applicability the API decided and its dates. Nothing here re-judges
 * freshness or dates; it shows what the envelope says.
 */
export const EvidencePanel = forwardRef<HTMLHeadingElement, Props>(function EvidencePanel({ item, envelope, sources, placement, onDismiss }, ref) {
  const claims = claimsFor(item, envelope);
  const citations = new Map(envelope.citations.map((c) => [c.citation_id, c]));
  // Distinct citations in claim order, each with the first claim that uses it (for its evidence state and qualifier).
  const seen = new Set<string>();
  const panels = claims.flatMap(({ claim }) =>
    claim.citation_ids
      .map((id) => citations.get(id))
      .filter((c): c is NonNullable<typeof c> => !!c && !seen.has(c.source_id) && (seen.add(c.source_id), true))
      .map((citation) => ({ citation, claim })),
  );
  return (
    <section
      className={`evidence-panel evidence-panel--${placement}`}
      aria-labelledby={`evidence-heading-${placement}`}
      onKeyDown={(event) => {
        if (onDismiss && event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          onDismiss();
        }
      }}
    >
      <div className="evidence-panel__header">
        <h2 id={`evidence-heading-${placement}`} className="evidence-panel__heading" tabIndex={-1} ref={ref}>
          Evidence
        </h2>
        {onDismiss ? <Button variant="secondary" onClick={onDismiss}>Close evidence</Button> : null}
      </div>
      <p className="evidence-panel__for">
        For <strong>{item.title}</strong>
        {panels.length > 1 ? ` · ${panels.length} sources` : null}
      </p>
      {panels.length ? (
        panels.map(({ citation, claim }) => {
          const record = sources[citation.source_id];
          const excerpt = record && record !== 'unavailable' && record.excerpt ? record.excerpt : undefined;
          // The claim list below prints this passage in full, so the truncated copy is not shown twice (#73).
          const repeated = excerptRepeatsClaim(excerpt, claims.map((c) => c.claim.text));
          return (
            <div key={citation.source_id} className={repeated ? 'evidence-panel__source evidence-panel__source--passage-below' : 'evidence-panel__source'} data-source-id={citation.source_id}>
              <SourcePanel
                title={citation.title}
                publisher={citation.publisher}
                url={citation.canonical_url}
                sourceVersionDate={longDate(citation.source_version_date)}
                verifiedAt={longDate(citation.last_verified_at) ?? null}
                state={claim.evidence_state}
                effectiveFrom={claim.qualifier === 'takes_effect_from' ? claim.qualifier_text ?? undefined : undefined}
                excerpt={excerpt}
              />
              {repeated ? <p className="section__caption">The source passage is shown in full under &ldquo;What this rests on&rdquo;.</p> : null}
              {record === null || record === undefined ? (
                <p className="section__caption" role="status">
                  Loading the source record…
                </p>
              ) : null}
              {record === 'unavailable' ? (
                <p className="section__caption" role="status">
                  The source record could not be loaded; the citation above is still from the answer.
                </p>
              ) : null}
            </div>
          );
        })
      ) : (
        <p className="section__caption">No source is attached to this item.</p>
      )}
      <h3 className="section__title" style={{ fontSize: 17, lineHeight: '24px' }}>
        What this rests on
      </h3>
      <ol className="claims">
        {claims.map(({ claim, citation }) => {
          const view = claimKindView(claim);
          return (
            <li key={claim.claim_id} className={claim.assertion_kind === 'editorial' ? 'claims__item claims__item--editorial' : 'claims__item'}>
              <span className="claims__kind">{view.kind}</span>
              <span>{claim.text}</span>
              <span className="claims__meta">
                <span className="claims__qualifier">{view.timing}</span>
                {claim.valid_from ? <span>from {longDate(claim.valid_from)}</span> : null}
                {claim.valid_to ? <span>until {longDate(claim.valid_to)}</span> : null}
                {view.note ? <span>{view.note}</span> : null}
                {citation ? <span>{citation.publisher}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
});
