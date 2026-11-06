# Corpus, provenance and ontology

## Evidence recovery

The public article was fetched on 5 November 2026 and its article-body external links were deduplicated by exact URL. The resulting [135-record manifest](../data/sources/article-bibliography.json) records discovery, not successful retrieval. Navigation links outside the article were excluded. The [Stage 1 audit](../data/sources/audit-report.md) adds provisional classifications, provider-reported redirects and explicit dispositions for all 135 records; canonical identity and content equivalence still need review.

The original raw research archive is not pursued (accepted decision 9). Build from fresh fetches; do not claim historical completeness. A newly fetched document is a new source version, even if its URL matches the old bibliography. Keep discovery, provider observations, successful raw fetches, retained original snapshots, rights approvals and factual verification counts separate. Provider extracts may be cached and do not establish raw snapshot/version evidence. See [the audit tooling](../data/sources/README.md).

For every cited source, record an explicit disposition: approved for ingestion, awaiting rights review, unavailable, superseded, out of initial scope, or rejected with reason. This provides an eventual path to cover the full source inventory without pretending that every link can legally or technically be copied.

## Source classes

| Class | Use | Limits |
| --- | --- | --- |
| Official program, legislation or regulator material | Primary support for the claims it actually governs | Publication, commencement, application-round and verification dates are different |
| Program operator or community page | Primary support for its own offerings and contact route | Marketing does not establish comparative effectiveness or regulatory permission |
| Research / ecosystem report | Attributed findings with methodology and reporting period | Different reports are not automatically comparable |
| Founder Journey Planner article | Interpretation, routing hypothesis and discovery index | Historical and derivative; not independent corroboration of its citations |
| X and other community discussion | Demand discovery, language, misconceptions and attributed opinion | Engagement never substitutes for factual evidence |

Rights checks are per source. Public accessibility alone does not grant redistribution rights. Store licence/terms URL, permitted use, attribution and retention policy. Distribute full content only when permitted; otherwise publish retrieval recipes, metadata and appropriate excerpts. Keep X material separate from the factual corpus until permitted use and provenance are established.

## Versioned records

`SourceDocument`: source_id, canonical_url, publisher, title, source_class, jurisdiction, published_at, fetched_at, content_hash, rights_status, extraction_version.

`SourceVersion`: source_version_id, source_id, snapshot_location, valid_from/valid_to when known, last_verified_at, verification_method, reviewer, supersedes_version_id, fetch_failure_reason.

`Passage`: passage_id, source_version_id, section_path, page/paragraph offsets, text_hash, text, table_headers, embedding_model/dimension, corpus_version. Preserve table headings and footnotes; do not split a numeric condition from its qualifier.

`Claim`: claim_id, subject_id, predicate, object_id or typed_literal, qualifiers, evidence_passage_ids, evidence_spans, assertion_kind, review_status, extraction_model/prompt_version, reviewer, valid_from/valid_to, last_verified_at, corpus_version.

Dates may be null and must remain unknown rather than invented. A fetch timestamp is not a human verification timestamp. An older source can still support a historical statement while being unsuitable for an answer about an open round today.

## Proposed ontology v0.1

Use a small controlled property graph shaped by competency questions. Claim records carry provenance; do not hide conflicting evidence in a single overwritten edge.

| Node type | Purpose |
| --- | --- |
| Organisation | Program owner, community, regulator or adviser category; named people are unnecessary for MVP |
| Program | Stable identity of a support offering |
| ProgramRound | Time-bounded intake/status and criteria; distinct from the program |
| Jurisdiction | Federal/state/territory/overseas scope |
| FounderPathway / Stage / Sector | Routing vocabulary, never inferred personal identity |
| Requirement | A condition to check, with AND/OR grouping and exceptions |
| Milestone / Resource | A next-step objective or useful resource |
| SourceVersion / Passage / Claim | Evidence, extracted assertions and review state |

| Predicate | Allowed subject → object | Qualification rule |
| --- | --- | --- |
| OPERATES | Organisation → Program | Direct source evidence required |
| HAS_ROUND | Program → ProgramRound | Round identity and dates required where available |
| AVAILABLE_IN | ProgramRound → Jurisdiction | Preserve exclusions and geographic conditions |
| HAS_REQUIREMENT | ProgramRound → Requirement | Retain rule grouping, thresholds and exceptions |
| TARGETS_STAGE / TARGETS_SECTOR | Program → Stage / Sector | Source scope must support the claim |
| PROVIDES_RESOURCE | Organisation → Resource | Do not infer endorsement from a hyperlink |
| BEFORE | Milestone → Milestone | Distinguish a sourced prerequisite from editorial sequencing |
| SUPPORTED_BY | Claim → Passage | Exact evidence span, not merely a URL |
| SUPERSEDES / CONFLICTS_WITH | Claim → Claim | Preserve both claims and effective dates |

ProgramRound status is a dated claim with values open, closed, paused, upcoming or unknown. It is not a permanent property of the program. Requirements can be nested boolean groups; the absence of an edge does not establish ineligibility. A person is never labelled ELIGIBLE_FOR solely because their embeddings match a program description.

## Competency questions that justify relationships

1. Who operates a program, and what is the next source or contact to check?
2. Which requirements precede a particular milestone?
3. Which options match a stated jurisdiction, stage and sector, with unresolved conditions shown?
4. Which statement changed between corpus releases, and which routes depend on it?
5. Which candidate route rests on old, disputed or missing evidence?

Each ontology extension must enable a competency question or improve a measured retrieval case. Evaluate edge usefulness, extraction precision and reviewer burden before growing the schema.

## Reasoning and review workflow

1. Sample diverse documents; draft types and candidate predicates from observed content.
2. Extract typed entities and claims with quoted evidence spans. Request short evidence-linked justifications, not hidden chain-of-thought.
3. Resolve aliases using publisher, canonical identifiers and context. Ambiguous merges enter review.
4. Validate type signatures, missing dates, units, negation, exceptions and evidence offsets deterministically.
5. A second verification pass checks whether each asserted relationship is entailed by the cited span. Agreement between model passes is not independent source corroboration.
6. Classify assertions as explicit, derived by an approved rule, editorial suggestion or hypothesis. Only reviewed explicit/approved derived claims support factual answers. Editorial suggestions are labelled recommendations; hypotheses stay out of factual retrieval.
7. Human review is mandatory for regulatory, migration, financial and grant-eligibility assertions, contradictions and schema changes. Initially review all promoted edges to establish a precision baseline.
8. Version the schema, publish a graph diff, run competency tests and release both indexes together.

Example using fictional fixtures: Program A → HAS_ROUND → Round A1 → HAS_REQUIREMENT → Matched contribution. A passage explicitly supports the requirement. This does **not** imply that a founder lacking stated funding is ineligible; the answer asks whether the requirement can be met. Another passage saying the round is closed changes the current route without erasing historical eligibility conditions.

## Freshness policy proposal

Check imminent deadlines and open/paused status weekly, stable program descriptions monthly, and slower-changing ecosystem context quarterly. These are maintainer targets, not guarantees that a source cannot change sooner. Use event-triggered checks when a correction arrives. Stale or failed checks downgrade the answer to unverified status, with a direct official source link. No background automation is configured by this documentation.

## Answer-time currency rule

Check cadences describe when a maintainer intends to look; they do not decide what the founder sees. Currency is computed at answer time from the records, so a missed check cannot leave an old status presented as current:

Two separate tests apply, because freshness (is the evidence recently verified?) and applicability (is the condition in effect at `as_of`?) are independent:

- **Fresh at `as_of`:** `SourceVersion.last_verified_at` is not null and is within the staleness window for the source's class. A passage or claim that is not fresh is labelled "Needs a current check", the answer must link the official source, and a round status or deadline that is not fresh can never be stated as open or closed today (SC06).
- **In effect at `as_of`:** the effective interval contains `as_of`: `valid_from` is null or not later than `as_of`, and `valid_to` is null or later than `as_of`. A claim whose `valid_from` is later than `as_of` is **future-effective**: it may be shown as a dated, fresh citation with the qualifier "takes effect from [date]", but it is never placed among today's prerequisites, requirements or actions, and never used to decide that something is required or available now (SC23). A claim whose `valid_to` is earlier than `as_of` is historical and is shown only as history.
- **Unknown effective dates:** `valid_from` and `valid_to` are null when the source states no commencement or end date. A null `valid_from` is bounded below by `SourceVersion.published_at`: the claim cannot be in effect before the document that supports it existed. A null `valid_to` means open-ended. Where a source class normally states effective dates (legislation, program rounds, regulator guidance) and the claim has none, the citation carries the caveat "effective date not stated" and reviewers are asked to supply one; the claim is still usable if fresh. Dates are never invented to satisfy either test.
- A claim enters the answer as current evidence only if it passes both tests; freshness alone is not applicability, and applicability alone is not freshness.
- When two current claims disagree for the same subject and period, the label is "Sources disagree" and both are shown with dates (SC07).
- Proposed staleness windows: round status, deadlines and intake criteria 14 days; program descriptions, operators and contacts 90 days; ecosystem reports and context 365 days. These are proposals to tune; shorter is safer.
- A fetch timestamp is not a verification timestamp; `fetched_at` never substitutes for `last_verified_at` in this rule.

Both tests are evaluated in the evidence-assembly step of the online workflow and recorded per citation in the response envelope (freshness label, effective interval and any qualifier), so website, API and future MCP clients show identical labels.

## Expectations for prerequisite evidence

Official sources seldom state that one milestone must precede another; the article does. Most reviewed `BEFORE` edges will therefore carry `assertion_kind: editorial` and surface as "Suggested next step", not as sourced requirements. This is correct behaviour, not a defect, but it bounds what the dependency view can show. The prerequisite map must display the assertion kind for every edge, and the Stage 3 edge audit must report sourced and editorial `BEFORE` edges separately.

Entity resolution identifiers: key Organisation nodes by canonical domain plus ABN or ACN where the publisher states one; key Program nodes by operator plus canonical program URL; ProgramRound by program plus the round's own dates or identifier. Ambiguous merges go to review, as above.
