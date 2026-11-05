"""Validate preparation metadata and coverage boundaries; runs no UX sessions."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]

def read(name):
    return json.loads((ROOT / name).read_text())

def indexed(rows):
    result = {row['id']: row for row in rows}
    assert len(result) == len(rows), 'Duplicate ID'
    return result

def main():
    ap = indexed(read('actor/personas.json')['profiles'])
    at = indexed(read('actor/tasks.json')['tasks'])
    fp = indexed(read('facilitator/personas.json')['profiles'])
    ft = indexed(read('facilitator/tasks.json')['tasks'])
    caps = indexed(read('facilitator/capabilities.json')['capabilities'])
    assert set(ap) == set(fp) and len(ap) == 8
    assert set(at) == set(ft) and len(at) == 16
    assert all(set(t) == {'id', 'persona', 'title', 'brief', 'follow_up', 'mode'} for t in at.values())
    allowed = {'id', 'name', 'role', 'context', 'starting_facts', 'surface', 'disclosure_boundary', 'autonomy', 'knowledge', 'preferences', 'goal'}
    assert all(set(p) == allowed for p in ap.values()), 'Unexpected actor trait/oracle field'
    actor_text = '\n'.join(p.read_text() for p in (ROOT / 'actor').glob('*.json'))
    assert not re.search(r'\b(?:SC\d+|API\d+|F\d{2})\b', actor_text), 'Actor metadata leak'
    assert not any(s in actor_text for s in ['fixture_id', 'required_capabilities', 'observation_scope', 'Rejects a reversed arrow', 'Will set a field'])
    guide = (ROOT / 'facilitator/evaluator-guide.md').read_text()
    feature_text = '\n'.join(p.read_text() for p in (REPO / 'features').glob('*.feature'))
    assert feature_text, 'Run in a checkout containing the repository feature files'
    scenario_ids = set(re.findall(r'@(SC\d+|API\d+)', feature_text))
    outcome_ids = set(re.findall(r'@(O\d+)', feature_text))
    used = set()
    variants = []
    preparation_states = {'not_run', 'blocked_pending_test_controls', 'blocked_pending_fixture'}
    for pid, p in fp.items():
        assert len(p['tasks']) == 2
        assert set(p['tasks']) == {tid for tid, t in at.items() if t['persona'] == pid}
    for tid, t in ft.items():
        assert at[tid]['persona'] == t['persona']
        assert t['initial_status'] in preparation_states
        assert set(t['outcomes']) <= outcome_ids
        assert t['fixture_id'] in guide
        assert t['observation_scope']
        assert set(t['observes']).isdisjoint(t['related'])
        assert set(t['observes'] + t['related']) <= scenario_ids
        assert set(t['observes']) == {s for v in t['variants'] for s in v['observes']}
        used.update(t['required_capabilities'])
        for v in t['variants']:
            variants.append(v['id'])
            assert v['initial_status'] in preparation_states
            assert set(v['observes'] + v['related']) <= scenario_ids
            assert set(v['observes']).isdisjoint(v['related'])
            used.update(v['required_capabilities'])
    assert len(variants) == len(set(variants)) == 20
    assert used == set(caps) and len(caps) == 22
    for c in caps.values():
        assert c['delivery_stage'] in {'1A', '1B', '2', '3', '4', '5'}
        assert c['kind'] in {'ui', 'artifact', 'runner', 'fixture'}
        assert c['presence_evidence'] and c['contract_mapping'] and c['when_absent']
    assert 'SC01' not in ft['T01']['observes']
    assert 'SC18' not in ft['T05']['observes']
    assert not ft['T11']['observes']
    assert 'SC17' in next(v for v in ft['T15']['variants'] if v['id'] == 'T15-graph')['observes']
    for tid in ['T02', 'T03', 'T15']:
        assert ft[tid]['initial_status'] == 'blocked_pending_test_controls'
    for tid in ['T06', 'T08']:
        assert ft[tid]['initial_status'] == 'blocked_pending_fixture'
    for p in ROOT.rglob('*.md'):
        for target in re.findall(r'\]\(([^)]+)\)', p.read_text()):
            if re.match(r'[a-z]+:', target):
                continue
            target = target.split('#')[0]
            if target:
                assert (p.parent / target).exists(), (p, target)
    delivery = (REPO / 'docs/06-delivery.md').read_text()
    assert all(x in delivery for x in ['Fixture-mode test controls', 'as_of', 'vector_timeout', 'budget_exhausted', 'graph_unavailable', 'development credential mode', 'public deployment'])
    assert read('facilitator/tasks.json')['status'] == 'prepared_not_executed'
    print('PASS: 8 profiles, 16 tasks, 20 variants, 22 capability IDs; actor boundaries, readiness, coverage, links and delivery prerequisites checked. No UX sessions executed.')

if __name__ == '__main__':
    main()
