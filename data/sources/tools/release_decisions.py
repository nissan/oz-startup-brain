#!/usr/bin/env python3
"""Validates release/decisions.json, the pending owner decisions and human fact checks for #28.

What it checks is structural, not semantic:
- every decision and fact check that #28 requires is present;
- decision values come from a fixed list in this file, not from the file being checked;
- a recorded decision carries decided_by "Nissan (owner)", a valid date and a GitHub comment URL;
- a recorded fact check carries a non-agent name, a date and a target;
- inclusion requires a reviewed version, all decisions and confirmed checks;
- licence policy and retrieval state come from the publisher and the retrieval logs;
- long passages and source-text keys are rejected.

What it cannot check: whether a linked comment really authorises the decision, whether a named
person is real, or whether a short string was copied from a source. Human and independent review
remain the semantic gate. Standard library only.
"""
import hashlib
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DECISION_URL = re.compile(r'https://github\.com/nissan/oz-startup-brain/(issues|pull)/\d+#(issuecomment|discussion_r|pullrequestreview)-?\d+')
OWNER = 'Nissan (owner)'
AGENT = re.compile(r'claude|codex|loki|openclaw|kit\b|gpt|copilot|gemini|agent|\bbot\b|llm|model', re.I)
RESULTS = {'confirmed', 'differs', 'not_stated', 'unclear'}
STATES = {'reviewed_version', 'blocked_403', 'shell_not_promoted'}
# Machine values are fixed here, independent of the file being validated; its descriptions may change.
ALLOWED = {
    'use': {'link_only', 'paraphrase', 'licensed_excerpts'},
    'retention': {'hashes_only', 'private_snapshot_until_recheck', 'private_store_for_pipeline'},
    'attribution': {'policy_prescribed'},
    'release_inclusion': {'include', 'exclude', 'defer'},
    'queensland_retrieval_route': {'owner_computer', 'permission_request', 'federal_only_interim', 'change_pilot'},
    'release_scope': {'federal_interim', 'wait_for_queensland'},
}
GLOBAL_DECISIONS = {'queensland_retrieval_route', 'release_scope'}
SOURCE_DECISIONS = {'use', 'retention', 'attribution', 'release_inclusion'}
# Licence policy follows the manifest's publisher (rights-evidence.json), not the editable record.
PUBLISHER_POLICY = {
    'Queensland Government — Innovation (DETSI)': 'qld_detsi',
    'Department of Industry, Science and Resources — business.gov.au': 'business_gov',
}
# The reviewed fact-check inventory: (source_id, check_id, area, check), sorted. Adding, removing,
# duplicating or rewording a check changes this and must be reviewed as a code change.
FACT_CHECK_INVENTORY_SHA256 = 'fcce21108b823d28c4a5d1d1c669bbc376716d67c4e565ec886a73b405791816'
FACT_CHECK_FIELDS = ('check_id', 'area', 'check', 'result', 'checked_by', 'checked_on', 'checked_against', 'note')
SOURCE_TEXT_KEYS = {'excerpt', 'passage', 'quote', 'body', 'snapshot_text', 'content'}
MAX_TEXT = 400


def valid_date(value):
    try:
        return isinstance(value, str) and bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)) and bool(date.fromisoformat(value))
    except ValueError:
        return False


def walk(node, path=''):
    if isinstance(node, dict):
        for k, v in node.items():
            yield path + '/' + k, k, v
            yield from walk(v, path + '/' + k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk(v, f'{path}[{i}]')


def check_decision(name, d, allowed):
    errors = []
    fields = ('selected', 'decided_by', 'decided_on', 'record_url')
    if set(d) != set(fields):
        return [f'{name}: decision needs exactly {fields}']
    if d['selected'] is None:
        if any(d[k] is not None for k in fields[1:]):
            errors.append(f'{name}: decision metadata without a decision')
    elif d['selected'] not in allowed:
        errors.append(f'{name}: {d["selected"]!r} is not one of the listed options')
    elif not (d['decided_by'] == OWNER and valid_date(d['decided_on']) and DECISION_URL.fullmatch(d['record_url'] or '')):
        errors.append(f'{name}: a decision needs decided_by "{OWNER}", a date and the GitHub record of the decision')
    return errors


def inventory_digest(doc):
    rows = sorted((r['source_id'], c.get('check_id'), c.get('area'), c.get('check')) for r in doc.get('sources', []) for c in r.get('fact_checks', []))
    return hashlib.sha256(json.dumps(rows, ensure_ascii=False).encode()).hexdigest()


def expected_state(source, attempts):
    """Retrieval state from the manifest version and the committed retrieval logs."""
    if source['source_version_id'] is not None:
        return 'reviewed_version'
    if any(a['outcome'] == 'http_body_received' for a in attempts):
        return 'shell_not_promoted'
    if attempts and all(a['outcome'] == 'http_error' and a['http_status'] == 403 for a in attempts):
        return 'blocked_403'
    return None


def validate(doc, manifest, policies, attempts_by_source=None):
    attempts_by_source = attempts_by_source or {}
    errors = []
    if doc.get('format_version') != '1':
        errors.append('format_version must be 1')
    for path, key, value in walk(doc):
        if key in SOURCE_TEXT_KEYS:
            errors.append(f'{path}: source text is not kept in this record')
        if isinstance(value, str) and len(value) > MAX_TEXT:
            errors.append(f'{path}: text longer than {MAX_TEXT} characters; keep passages out of the repository')
    options = doc.get('options', {})
    if set(options) != set(ALLOWED) or any(set(options[k]) != ALLOWED[k] for k in ALLOWED if k in options):
        errors.append('options must list exactly the fixed decision values (descriptions may change, values may not)')
    globals_ = doc.get('global_decisions', {})
    if set(globals_) != GLOBAL_DECISIONS:
        errors.append(f'global_decisions must be exactly {sorted(GLOBAL_DECISIONS)}')
    for name, d in globals_.items():
        errors += check_decision(f'global/{name}', d, ALLOWED.get(name, set()))
    if inventory_digest(doc) != FACT_CHECK_INVENTORY_SHA256:
        errors.append('fact-check inventory differs from the reviewed one (a check was added, removed, duplicated or reworded)')
    ids = [c.get('check_id') for r in doc.get('sources', []) for c in r.get('fact_checks', [])]
    if len(ids) != len(set(ids)) or any(not i for i in ids):
        errors.append('fact-check IDs must be present and unique')
    core = {s['source_id']: s for s in manifest['sources'] if s['shortlist_tier'] == 'core'}
    seen = [r['source_id'] for r in doc.get('sources', [])]
    if sorted(seen) != sorted(core) or len(seen) != len(set(seen)):
        errors.append('sources must list each core shortlist record exactly once')
    policy_ids = {p['policy_id'] for p in policies}
    for r in doc.get('sources', []):
        sid = r['source_id']
        s = core.get(sid)
        if not s:
            continue
        if (r['url'], r['title_as_cited']) != (s['url'], s['title_as_cited']):
            errors.append(f'{sid}: identity differs from the manifest')
        policy = PUBLISHER_POLICY.get(s['publisher'])
        if policy not in policy_ids or r['rights_policy_candidate'] != policy:
            errors.append(f'{sid}: rights policy must be {policy!r}, the policy for its publisher')
        ret = r['retrieval']
        if ret['state'] not in STATES or ret['source_version_id'] != s['source_version_id'] or ret['state'] != expected_state(s, attempts_by_source.get(sid, [])):
            errors.append(f'{sid}: retrieval state disagrees with the manifest and retrieval logs')
        if set(r['decisions']) != SOURCE_DECISIONS:
            errors.append(f'{sid}: decisions must be exactly {sorted(SOURCE_DECISIONS)}')
        for kind, d in r['decisions'].items():
            errors += check_decision(f'{sid}/{kind}', d, ALLOWED.get(kind, set()))
        if not r['fact_checks']:
            errors.append(f'{sid}: at least one fact check is required')
        for i, c in enumerate(r['fact_checks']):
            name = f'{sid}/fact_check[{i}]'
            if tuple(c) != FACT_CHECK_FIELDS:
                errors.append(f'{name}: fields must be {FACT_CHECK_FIELDS}')
                continue
            if c['result'] is None:
                if any(c[k] is not None for k in ('checked_by', 'checked_on', 'checked_against')):
                    errors.append(f'{name}: check metadata without a result')
                continue
            if c['result'] not in RESULTS:
                errors.append(f'{name}: result must be one of {sorted(RESULTS)}')
            if not c['checked_by'] or AGENT.search(c['checked_by']):
                errors.append(f'{name}: a fact check is recorded by a named person, not an agent')
            if not valid_date(c['checked_on']):
                errors.append(f'{name}: checked_on must be a date')
            if c['checked_against'] not in ('live_page', ret['source_version_id']) or c['checked_against'] is None:
                errors.append(f'{name}: checked_against must be live_page or this record\'s version ID')
        inc = r['decisions'].get('release_inclusion', {}).get('selected')
        if inc == 'include':
            if ret['state'] != 'reviewed_version':
                errors.append(f'{sid}: only a reviewed retrieved version can be included in a release')
            if any(r['decisions'].get(k, {}).get('selected') is None for k in ('use', 'retention', 'attribution')):
                errors.append(f'{sid}: inclusion needs use, retention and attribution decisions first')
            if not r['fact_checks'] or any(c.get('result') != 'confirmed' for c in r['fact_checks']):
                errors.append(f'{sid}: inclusion needs every fact check confirmed')
    return errors


def load_and_validate(root=ROOT):
    path = root / 'release/decisions.json'
    if not path.exists():
        return []
    manifest = json.loads((root / 'article-bibliography.json').read_text())
    policies = json.loads((root / manifest['audit']['rights_evidence']).read_text())['policies']
    attempts = {}
    for name in manifest['audit'].get('retrievals', []):
        for a in json.loads((root / name).read_text())['attempts']:
            attempts.setdefault(a['source_id'], []).append(a)
    return validate(json.loads(path.read_text()), manifest, policies, attempts)


def pending_summary(doc):
    decisions = [d for d in doc['global_decisions'].values()] + [d for r in doc['sources'] for d in r['decisions'].values()]
    checks = [c for r in doc['sources'] for c in r['fact_checks']]
    return sum(d['selected'] is None for d in decisions), len(decisions), sum(c['result'] is None for c in checks), len(checks)


if __name__ == '__main__':
    errors = load_and_validate()
    if errors:
        sys.exit('\n'.join(errors))
    open_d, all_d, open_c, all_c = pending_summary(json.loads((ROOT / 'release/decisions.json').read_text()))
    print(f'PASS: release decisions valid; {open_d}/{all_d} decisions and {open_c}/{all_c} fact checks still open')
