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


def read(path):
    return json.loads(Path(path).read_text())


def identity_hash(sources):
    records = [{k:s[k] for k in IDENTITY} for s in sources]
    return hashlib.sha256(json.dumps(records, sort_keys=True, separators=(',', ':'),
                                    ensure_ascii=False).encode()).hexdigest()


def valid_date(value):
    return isinstance(value, str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)) and date.fromisoformat(value)


def validate(manifest, observations, policies):
    """Fail closed: this audit is metadata-only and cannot silently promote a source."""
    errors = []
    def check(condition, message):
        if not condition:
            errors.append(message)
    sources = manifest['sources']
    check(manifest['manifest_version'] == '0.2', 'manifest version must be 0.2')
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
        check(all(s[k] is None for k in ('fetched_at','content_hash','source_version_id')), f'{sid}: provider observation is not a raw version')
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
    check(manifest['audit']['owner_decision'] == 'pending', 'owner jurisdiction decision must remain pending')
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
    lines = ['# Source audit inventory — 6 November 2026', '',
             'Generated by `python data/sources/tools/source_audit.py report`. Do not hand-edit.', '',
             'This is provisional subject/operator classification, not jurisdiction eligibility or live coverage. Provider representations may be cached, sparse, navigation-only or challenges. No raw corpus or verified claims are published here.', '',
             '## Counts', '', '| Measure | Count |', '| --- | ---: |']
    for key in ('discovered','classified','original_snapshots_recovered','raw_versions_retained','ingestion_approved','fact_verified'):
        lines.append(f'| {key} | {ss[key]} |')
    for group in ('observations','shortlist','rights','dispositions'):
        for key,n in ss[group].items():
            lines.append(f'| {group}: {key} | {n} |')
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
    errors = validate(m,o,policies)
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
        print('PASS: 135 identities, classifications, observations, rights and no-promotion boundaries')

if __name__ == '__main__':
    main()
