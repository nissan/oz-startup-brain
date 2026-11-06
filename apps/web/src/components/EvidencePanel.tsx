'use client';
import { forwardRef } from 'react';
import type { components } from '@ozsb/api-client';
import { SourcePanel } from '@/design-system/generated/bundle';
import { APPLICABILITY_WORDS, claimsFor, longDate, type Action, type Envelope } from '@/lib/present';

type SourceRecord = components['schemas']['SourceRecord'];

interface Props {
  action: Action;
  envelope: Envelope;
  /** The source record for the first supporting citation, once fetched; null while loading; 'unavailable' on failure. */
  source: SourceRecord | null | 'unavailable';
}

/**
 * The evidence behind one next step: the first supporting source in the design system's SourcePanel
 * (publisher, version, verification date, link, rights-gated excerpt) and every claim the step rests
 * on, each with the applicability the API decided and its dated qualifier. Nothing here re-judges
 * freshness or dates; it shows what the envelope says.
 */
export const EvidencePanel = forwardRef<HTMLHeadingElement, Props>(function EvidencePanel({ action, envelope, source }, ref) {
  const claims = claimsFor(action, envelope);
  const first = claims[0];
  const cit = first?.citation;
  const effective = first?.claim.qualifier === 'takes_effect_from' ? first.claim.qualifier_text ?? undefined : undefined;
  return (
    <section className="evidence-panel" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className="evidence-panel__heading" tabIndex={-1} ref={ref}>
        Evidence for: {action.title}
      </h2>
      {cit ? (
        <SourcePanel
          title={cit.title}
          publisher={cit.publisher}
          url={cit.canonical_url}
          sourceVersionDate={longDate(cit.source_version_date)}
          verifiedAt={longDate(cit.last_verified_at) ?? null}
          state={first.claim.evidence_state}
          effectiveFrom={effective}
          excerpt={source && source !== 'unavailable' && source.excerpt ? source.excerpt : undefined}
        />
      ) : (
        <p className="section__caption">No source is attached to this step.</p>
      )}
      {source === null && cit ? (
        <p className="section__caption" role="status">
          Loading the source excerpt…
        </p>
      ) : null}
      {source === 'unavailable' ? (
        <p className="section__caption" role="status">
          The source record could not be loaded; the citation above is still from the answer.
        </p>
      ) : null}
      <h3 className="section__title" style={{ fontSize: 17, lineHeight: '24px' }}>
        What this step rests on
      </h3>
      <ol className="claims">
        {claims.map(({ claim, citation }) => (
          <li key={claim.claim_id} className="claims__item">
            <span>{claim.text}</span>
            <span className="claims__meta">
              <span className="claims__qualifier">{claim.qualifier_text ?? APPLICABILITY_WORDS[claim.applicability]}</span>
              {claim.valid_from ? <span>from {longDate(claim.valid_from)}</span> : null}
              {claim.valid_to ? <span>until {longDate(claim.valid_to)}</span> : null}
              <span>{claim.assertion_kind === 'editorial' ? 'editorial sequencing' : 'stated by the source'}</span>
              {citation ? <span>{citation.publisher}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
});
