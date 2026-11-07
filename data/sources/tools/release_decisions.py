#!/usr/bin/env python3
"""Validates release/decisions.json, the pending owner decisions and human fact checks for #28.

It fails closed on invented approval:
- a decision may hold a value only with Nissan's dated GitHub decision record;
- a fact check may hold a result only with a named human checker and a date;
- an agent cannot be the checker.
It also keeps source text out of the record, and keeps the record consistent with the manifest.
Standard library only.
"""
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


def validate(doc, manifest, policies):
    errors = []
    if doc.get('format_version') != '1':
        errors.append('format_version must be 1')
    for path, key, value in walk(doc):
        if key in SOURCE_TEXT_KEYS:
            errors.append(f'{path}: source text is not kept in this record')
        if isinstance(value, str) and len(value) > MAX_TEXT:
            errors.append(f'{path}: text longer than {MAX_TEXT} characters; keep passages out of the repository')
    options = doc.get('options', {})
    for name, d in doc.get('global_decisions', {}).items():
        errors += check_decision(f'global/{name}', d, options.get(name, {}))
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
        if r['rights_policy_candidate'] not in policy_ids:
            errors.append(f'{sid}: unknown rights policy')
        ret = r['retrieval']
        if ret['state'] not in STATES or ret['source_version_id'] != s['source_version_id'] or (ret['state'] == 'reviewed_version') != (s['source_version_id'] is not None):
            errors.append(f'{sid}: retrieval state disagrees with the manifest')
        for kind, d in r['decisions'].items():
            errors += check_decision(f'{sid}/{kind}', d, options.get(kind, {}))
        for i, c in enumerate(r['fact_checks']):
            name = f'{sid}/fact_check[{i}]'
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
        inc = r['decisions']['release_inclusion']['selected']
        if inc == 'include':
            if ret['state'] != 'reviewed_version':
                errors.append(f'{sid}: only a reviewed retrieved version can be included in a release')
            if any(r['decisions'][k]['selected'] is None for k in ('use', 'retention', 'attribution')):
                errors.append(f'{sid}: inclusion needs use, retention and attribution decisions first')
            if any(c['result'] != 'confirmed' for c in r['fact_checks']):
                errors.append(f'{sid}: inclusion needs every fact check confirmed')
    return errors


def load_and_validate(root=ROOT):
    path = root / 'release/decisions.json'
    if not path.exists():
        return []
    manifest = json.loads((root / 'article-bibliography.json').read_text())
    policies = json.loads((root / manifest['audit']['rights_evidence']).read_text())['policies']
    return validate(json.loads(path.read_text()), manifest, policies)


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
