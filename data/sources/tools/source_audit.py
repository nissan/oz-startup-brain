#!/usr/bin/env python3
"""Offline validation and deterministic coverage report. Python standard library only."""
import argparse
from collections import Counter
from datetime import date, datetime
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CLASSES = {'official_program', 'official_regulation', 'official_statistics', 'operator',
           'operator_case_study', 'research_report', 'media', 'community_opinion'}
JURISDICTIONS = {'AU-FED','AU-NATIONAL','AU-QLD','AU-NSW','AU-VIC','AU-WA','AU-SA',
                 'AU-TAS','AU-ACT','AU-NT','GLOBAL','UNKNOWN','US','GB','SG','AE','HK','VN','EU','NZ'}
DISPOSITIONS = {'awaiting_rights_review','out_of_initial_scope','unavailable','superseded','rejected','approved_for_ingestion'}
RIGHTS = {'unknown','conditional_licence_identified','permission_required','cleared'}
IDENTITY = ('source_id','url','title_as_cited','discovered_via','discovered_on')
DECISION_KEYS = ('pilot_jurisdiction','supporting_scope','decided_on','decided_by','record_url')
DECISION_URL = re.compile(r'https://github\.com/nissan/oz-startup-brain/issues/\d+#issuecomment-\d+')
REPRESENTATIONS = {'source_page','challenge_or_shell','error_page','unrelated_page'}
SNAPSHOT = re.compile(r'snapshot:sv_[a-f0-9]{20}\.body')


def read(path):
    return json.loads(Path(path).read_text())


def identity_hash(sources):
    records = [{k:s[k] for k in IDENTITY} for s in sources]
    return hashlib.sha256(json.dumps(records, sort_keys=True, separators=(',', ':'),
                                    ensure_ascii=False).encode()).hexdigest()


def valid_date(value):
    """True only for a real calendar date written YYYY-MM-DD (2026-02-30 is false, not an exception)."""
    if not (isinstance(value, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)):
        return False
    try:
        return bool(date.fromisoformat(value))
    except ValueError:
        return False


def validate(manifest, observations, policies, retrievals=None):
    """Fail closed: no source can be promoted silently. A retrieved version enters the manifest only
    with a matching retrieval-log record and a representation review; rights clearance, ingestion
    approval and factual verification stay out of reach of this audit."""
    errors = []
    def check(condition, message):
        if not condition:
            errors.append(message)
    sources = manifest['sources']
    check(manifest['manifest_version'] == '0.3', 'manifest version must be 0.3')
    check(len(sources) == manifest['source_count'] == 135, 'expected all 135 discovery records')
    check(len({s['source_id'] for s in sources}) == len(sources), 'duplicate source ID')
    check(len({s['url'] for s in sources}) == len(sources), 'duplicate discovery URL')
    check(identity_hash(sources) == manifest['audit']['discovery_identity_sha256'], 'discovery identities changed')
    oi = {o['source_id']:o for o in observations}
    pi = {p['policy_id']:p for p in policies}
    check(len(oi) == len(observations) == len(sources), 'missing/duplicate observation')
    check(set(oi) == {s['source_id'] for s in sources}, 'observation inventory mismatch')
    check(len(pi) == len(policies), 'duplicate rights policy')
    for s in sources:
        sid = s['source_id']
        check(bool(re.fullmatch(r'src_[a-f0-9]{12}', sid)), f'{sid}: invalid ID')
        u = urlsplit(s['url'])
        check(u.scheme == 'https' and bool(u.hostname) and not u.username and not u.password,
              f'{sid}: non-public URL shape')
        check(bool(s['publisher']) and s['source_class'] in CLASSES, f'{sid}: publisher/class missing')
        check(s['source_role'] == s['source_class'], f'{sid}: legacy source_role drift')
        check(bool(s['jurisdiction']) and set(s['jurisdiction']) <= JURISDICTIONS, f'{sid}: jurisdiction invalid')
        check(len(set(s['jurisdiction'])) == len(s['jurisdiction']), f'{sid}: repeated jurisdiction')
        check(s['classification_status'] == 'provisional' and bool(s['classification_basis']), f'{sid}: missing classification limits')
        check(s['disposition'] in DISPOSITIONS and bool(s['disposition_reason']), f'{sid}: disposition incomplete')
        check(s['shortlist_tier'] in (None, 'core', 'reserve'), f'{sid}: invalid shortlist tier')
        check(s['rights_status'] in RIGHTS, f'{sid}: rights status invalid')
        if s['rights_evidence_id'] is not None:
            p = pi.get(s['rights_evidence_id'])
            check(p is not None, f'{sid}: missing rights evidence')
            if p:
                check(s['rights_status'] == p['status'], f'{sid}: rights evidence/status drift')
                check(bool(p['url']) and bool(p['assessment']) and bool(p['application_evidence']), f'{sid}: incomplete rights evidence')
        else:
            check(s['rights_status'] == 'unknown', f'{sid}: rights asserted without evidence')
        if s['shortlist_tier']:
            check(s['disposition'] == 'awaiting_rights_review', f'{sid}: shortlist promotion not authorised')
        check(s['disposition'] != 'approved_for_ingestion' and s['rights_status'] != 'cleared', f'{sid}: metadata audit cannot grant ingestion clearance')
        for key in ('published_at', 'source_updated_at', 'valid_from', 'valid_to', 'metadata_reviewed_on'):
            value = s[key]
            if value is not None:
                try:
                    check(bool(valid_date(value)), f'{sid}: invalid {key}')
                except (ValueError, TypeError):
                    errors.append(f'{sid}: invalid {key}')
        check(s['last_verified_at'] is None and s['verification_method'] is None, f'{sid}: fetch is not factual verification')
        version_fields = [s[k] for k in ('fetched_at','content_hash','source_version_id')]
        if all(v is None for v in version_fields):
            check(s['version_review'] is None, f'{sid}: version review without a retrieved version')
        else:
            check(all(v is not None for v in version_fields), f'{sid}: incomplete retrieved version (provider observation is not a raw version)')
            check(s['shortlist_tier'] is not None, f'{sid}: only shortlisted sources are retrieved for review')
            rec = (retrievals or {}).get(s['source_version_id'])
            check(rec is not None and rec['source_id'] == sid and rec['outcome'] == 'http_body_received'
                  and rec['raw_content_sha256'] == s['content_hash'] and rec['fetched_at'] == s['fetched_at'],
                  f'{sid}: version not backed by a retrieval-log record (provider observation is not a raw version)')
            r = s['version_review']
            check(isinstance(r, dict) and r.get('representation') == 'source_page' and bool(r.get('reviewer'))
                  and bool(r.get('note')) and bool(valid_date(r.get('reviewed_on'))),
                  f'{sid}: retrieved version needs a representation review showing the source page')
        check(s['canonical_url'] is None, f'{sid}: canonical identity needs independent review')
        check(s['original_research_snapshot_available'] is False, f'{sid}: historical snapshot not recovered')
        o = oi.get(sid)
        if o:
            check(o['requested_url'] == s['url'], f'{sid}: observation URL mismatch')
            check(o['outcome'] in ('representation_available','empty_representation','tool_error'), f'{sid}: unknown observation result')
            check(s['fetch_status'] == o['outcome'], f'{sid}: fetch outcome drift')
            check(s['observed_redirect_url'] == o['reported_final_url'], f'{sid}: redirect evidence drift')
            check(s['fetch_observation_id'] == sid+'@'+o['observed_on']+'-web', f'{sid}: observation ID drift')
            check(o['http_status'] is None and o['raw_content_sha256'] is None and o['snapshot_location'] is None,
                  f'{sid}: provider result cannot masquerade as raw HTTP')
            check(o['outcome'] != 'tool_error' or bool(o['failure_detail']), f'{sid}: missing failure detail')
            check(o['outcome'] != 'empty_representation' or o['reported_line_count'] == 0, f'{sid}: inconsistent empty result')
            check(o['outcome'] != 'representation_available' or isinstance(o['reported_line_count'], int) and o['reported_line_count'] > 0,
                  f'{sid}: inconsistent available result')
    d = manifest['audit']['owner_decision']
    check(isinstance(d, dict) and all(d.get(k) for k in DECISION_KEYS) and d['pilot_jurisdiction'] in JURISDICTIONS
          and bool(DECISION_URL.fullmatch(d['record_url'])) and bool(valid_date(d['decided_on'])),
          'owner jurisdiction decision must be a dated record linked to its GitHub decision comment')
    for key in ('original_snapshots_recovered','ingestion_approved','human_fact_verified'):
        check(manifest['audit'][key] == 0, f'{key}: no such evidence established')
    return errors


def validate_attempts(manifest, attempts):
    errors = []
    expected = {s['source_id']:s['url'] for s in manifest['sources']}
    if len(attempts) != len(expected) or {r['source_id'] for r in attempts} != set(expected):
        errors.append('direct attempt inventory mismatch')
    for r in attempts:
        sid = r['source_id']
        if expected.get(sid) != r['requested_url']:
            errors.append(f'{sid}: direct attempt URL mismatch')
        try:
            timestamp = datetime.fromisoformat(r['attempted_at'])
            if timestamp.tzinfo is None:
                raise ValueError('timezone missing')
        except (ValueError, TypeError):
            errors.append(f'{sid}: invalid attempt timestamp')
        if r['outcome'] not in ('transport_error','http_error','size_limit','empty_body','http_body_received'):
            errors.append(f'{sid}: invalid transport outcome')
        if r['last_verified_at'] is not None or r['snapshot_location'] is not None:
            errors.append(f'{sid}: probe cannot verify or retain corpus')
        if r['outcome'] != 'http_body_received':
            if not r['failure_reason'] or any(r[k] is not None for k in ('source_version_id','raw_content_sha256','fetched_at')):
                errors.append(f'{sid}: failure cannot create a source version')
        elif not (r['source_version_id'] and r['fetched_at'] and re.fullmatch(r'[a-f0-9]{64}',r['raw_content_sha256'] or '')):
            errors.append(f'{sid}: received body needs hash and version time')
    return errors


def validate_retrieval_log(manifest, log, name):
    """A format-2 retrieval of selected sources. Bodies never appear in the log; a snapshot is only a
    reference to a file kept outside git."""
    errors = []
    expected = {s['source_id']:s['url'] for s in manifest['sources']}
    redirects = {s['source_id']:s['observed_redirect_url'] for s in manifest['sources'] if s['observed_redirect_url']}
    run = log.get('run') or {}
    if log.get('format_version') != '2' or not run.get('run_id') or run.get('method') not in ('direct_https_get','https_get_via_configured_proxy'):
        errors.append(f'{name}: retrieval log needs format 2 and a run record')
    ids = [r['source_id'] for r in log['attempts']]
    if len(ids) != len(set(ids)) or not set(ids) <= set(expected):
        errors.append(f'{name}: retrieval sources must be distinct manifest IDs')
    for r in log['attempts']:
        sid = r['source_id']
        if expected.get(sid) != r['requested_url']:
            errors.append(f'{sid}: retrieval URL mismatch')
        if 'target_url' in r and (r['target_url'] != redirects.get(sid) or r.get('target_basis') != 'manifest observed_redirect_url'):
            errors.append(f'{sid}: a redirect target must be the reviewed observed_redirect_url')
        if r['method'] != run.get('method'):
            errors.append(f'{sid}: retrieval method differs from its run')
        if r['last_verified_at'] is not None:
            errors.append(f'{sid}: retrieval cannot verify facts')
        if 'body' in r or 'text' in r:
            errors.append(f'{sid}: retrieval log must not carry source text')
        if r['outcome'] == 'http_body_received':
            if not (r['source_version_id'] and r['fetched_at'] and re.fullmatch(r'[a-f0-9]{64}', r['raw_content_sha256'] or '')):
                errors.append(f'{sid}: received body needs hash and version time')
            if r['snapshot_location'] is not None and not SNAPSHOT.fullmatch(r['snapshot_location']):
                errors.append(f'{sid}: snapshot reference must name a version file outside git')
            if r['snapshot_location'] is not None and r['snapshot_location'] != f"snapshot:{r['source_version_id']}.body":
                errors.append(f'{sid}: snapshot reference does not match its version')
        elif r['snapshot_location'] is not None or not r['failure_reason'] or any(r[k] is not None for k in ('source_version_id','raw_content_sha256','fetched_at')):
            errors.append(f'{sid}: failure cannot create a source version or snapshot')
    return errors


def load_retrievals(root, manifest):
    """Returns (errors, records by version ID) for every retrieval log the manifest lists."""
    errors, records = [], {}
    for name in manifest['audit'].get('retrievals', []):
        log = read(root/name)
        errors += validate_retrieval_log(manifest, log, name)
        for r in log['attempts']:
            if r['source_version_id']:
                records[r['source_version_id']] = r
    return errors, records


def summary(m):
    sources = m['sources']
    return {
        'discovered':len(sources), 'classified':sum(s['source_class'] in CLASSES for s in sources),
        'observations':dict(sorted(Counter(s['fetch_status'] for s in sources).items())),
        'shortlist':dict(sorted(Counter(s['shortlist_tier'] for s in sources if s['shortlist_tier']).items())),
        'dispositions':dict(sorted(Counter(s['disposition'] for s in sources).items())),
        'rights':dict(sorted(Counter(s['rights_status'] for s in sources).items())),
        'original_snapshots_recovered':sum(s['original_research_snapshot_available'] for s in sources),
        'raw_versions_retained':sum(s['source_version_id'] is not None for s in sources),
        'ingestion_approved':sum(s['disposition']=='approved_for_ingestion' for s in sources),
        'fact_verified':sum(s['last_verified_at'] is not None for s in sources),
    }


def report(m):
    ss = summary(m)
    d = m['audit']['owner_decision']
    lines = ['# Source audit inventory — 6 November 2026', '',
             'Generated by `python data/sources/tools/source_audit.py report`. Do not hand-edit.', '',
             'This is provisional subject/operator classification, not jurisdiction eligibility or live coverage. Provider representations may be cached, sparse, navigation-only or challenges. No raw corpus or verified claims are published here.', '',
             '## Counts', '', '| Measure | Count |', '| --- | ---: |']
    for key in ('discovered','classified','original_snapshots_recovered','raw_versions_retained','ingestion_approved','fact_verified'):
        lines.append(f'| {key} | {ss[key]} |')
    for group in ('observations','shortlist','rights','dispositions'):
        for key,n in ss[group].items():
            lines.append(f'| {group}: {key} | {n} |')
    lines += ['', f"Owner decision: pilot jurisdiction {d['pilot_jurisdiction']} with {d['supporting_scope']} sources, decided by {d['decided_by']} on {d['decided_on']} ([record]({d['record_url']})).", '']
    versions = [s for s in m['sources'] if s['source_version_id']]
    lines += ['## Retrieved versions', '',
              'Each retrieved version is a fetched representation that a reviewer confirmed is the source page. It is not rights clearance, ingestion approval or factual verification. Snapshots are kept outside git; only hashes are committed.', '']
    if versions:
        lines += ['| Source ID | Version | Fetched (UTC) | SHA-256 | Representation review |', '| --- | --- | --- | --- | --- |']
        for s in versions:
            r = s['version_review']
            lines.append(f"| `{s['source_id']}` | `{s['source_version_id']}` | {s['fetched_at']} | `{s['content_hash'][:16]}…` | {r['reviewed_on']}, {r['reviewer']}: {r['note']} |")
    else:
        lines.append('None yet.')
    lines += ['', '## Provisional jurisdiction coverage', '',
              'Multi-jurisdiction records count in each applicable row; rows are not additive. AU-NATIONAL means Australian operator/context, not federal authority or all-state service eligibility. Every live/approved count is zero.', '',
              '| Jurisdiction | Discovery records | Shortlisted | Approved ingestion |', '| --- | ---: | ---: | ---: |']
    for j in sorted(JURISDICTIONS):
        subset = [s for s in m['sources'] if j in s['jurisdiction']]
        lines.append(f'| {j} | {len(subset)} | {sum(bool(s["shortlist_tier"]) for s in subset)} | 0 |')
    lines += ['', '## Shortlist for review', '', 'See [the decision report](../audit-report.md) for priority, rights conditions and exit gates.', '',
              '| Tier | Source | Scope | Rights triage | Purpose / next check |', '| --- | --- | --- | --- | --- |']
    for tier in ('core','reserve'):
        for s in m['sources']:
            if s['shortlist_tier'] == tier:
                lines.append(f'| {tier} | [{s["title_as_cited"]}]({s["url"]}) | {", ".join(s["jurisdiction"])} | {s["rights_status"]} | {s["disposition_reason"]} |')
    lines += ['', '## Complete disposition inventory', '',
              '| Source ID / cited title | Publisher | Class / scope | Observation | Disposition / reason |',
              '| --- | --- | --- | --- | --- |']
    for s in m['sources']:
        lines.append(f'| `{s["source_id"]}` [{s["title_as_cited"]}]({s["url"]}) | {s["publisher"]} | {s["source_class"]}; {", ".join(s["jurisdiction"])} | {s["fetch_status"]} | {s["disposition"]}: {s["disposition_reason"]} |')
    return '\n'.join(lines)+'\n'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=('validate','summary','report'))
    p.add_argument('--root', type=Path, default=ROOT)
    p.add_argument('--check', action='store_true', help='Check generated report without writing')
    args = p.parse_args()
    m = read(args.root/'article-bibliography.json')
    o = read(args.root/m['audit']['web_observations'])['observations']
    policies = read(args.root/m['audit']['rights_evidence'])['policies']
    retrieval_errors, retrievals = load_retrievals(args.root, m)
    errors = retrieval_errors + validate(m,o,policies,retrievals)
    attempts = read(args.root/m['audit']['direct_attempts'])['attempts']
    errors += validate_attempts(m,attempts)
    if errors:
        raise SystemExit('\n'.join(errors))
    if args.command == 'summary':
        print(json.dumps(summary(m),indent=2))
    elif args.command == 'report':
        target = args.root/'audits/2026-11-06-inventory.md'
        text = report(m)
        if args.check:
            if target.read_text() != text:
                raise SystemExit('Generated inventory is stale')
            print('PASS: generated inventory matches')
        else:
            target.write_text(text)
            print(target)
    else:
        print(f"PASS: 135 identities, classifications, observations, rights, owner decision, {len(m['audit'].get('retrievals', []))} retrieval log(s), {sum(s['source_version_id'] is not None for s in m['sources'])} reviewed version(s) and no-promotion boundaries")

if __name__ == '__main__':
    main()
