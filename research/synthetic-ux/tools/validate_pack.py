"""Validate preparation metadata and review checkpoints; runs no UX sessions."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
CHECKPOINT = ROOT / 'facilitator/scenario-review.json'


class ValidationError(ValueError):
    """An actionable preparation error, not an application test failure."""


def require(condition, rule, detail):
    if not condition:
        raise ValidationError(f'{rule}: {detail}')


def read(name):
    path = ROOT / name
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as error:
        raise ValidationError(f'input: {path.relative_to(REPO)}: {error}') from error


def indexed(rows, label):
    result = {}
    for row in rows:
        ident = row['id']
        require(ident not in result, 'unique-id', f'{label}: duplicate {ident}')
        result[ident] = row
    return result


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def review_inputs(tasks):
    # Hash whole feature files deliberately: Background, Examples and tags can
    # change the meaning of a scenario without changing its ID or step text.
    features = {
        p.relative_to(REPO).as_posix(): digest(p.read_text(encoding='utf-8'))
        for p in sorted((REPO / 'features').glob('*.feature'))
    }
    scopes = {}
    for tid, task in tasks.items():
        fields = {k: task[k] for k in ('observation_scope', 'observes', 'related')}
        fields['variants'] = [
            {k: v[k] for k in ('id', 'observes', 'related')}
            for v in task['variants']
        ]
        scopes[tid] = digest(json.dumps(fields, sort_keys=True, ensure_ascii=False))
    return {'features': features, 'task_scopes': scopes}


def check_review(inputs):
    saved = read('facilitator/scenario-review.json')
    require(saved.get('schema_version') == 1 and bool(saved.get('review_note', '').strip()),
            'scenario-review', 'checkpoint needs schema_version 1 and a review note')
    for group, current in inputs.items():
        previous = saved.get(group, {})
        changed = sorted(k for k in current.keys() | previous.keys()
                         if current.get(k) != previous.get(k))
        require(not changed, 'scenario-review',
                f'{group} changed: {", ".join(changed)}. Review the feature diff against '
                'observes/related and observation_scope, then explicitly record the review '
                'with --record-scenario-review "what was checked". See tools/README.md.')


def validate(check_checkpoint=True):
    ap = indexed(read('actor/personas.json')['profiles'], 'actor profiles')
    at = indexed(read('actor/tasks.json')['tasks'], 'actor tasks')
    fp = indexed(read('facilitator/personas.json')['profiles'], 'facilitator profiles')
    ft = indexed(read('facilitator/tasks.json')['tasks'], 'facilitator tasks')
    caps = indexed(read('facilitator/capabilities.json')['capabilities'], 'capabilities')
    require(set(ap) == set(fp) and len(ap) == 8, 'profile-set', 'actor/facilitator IDs must match and contain 8 profiles')
    require(set(at) == set(ft) and len(at) == 16, 'task-set', 'actor/facilitator IDs must match and contain 16 tasks')
    task_fields = {'id', 'persona', 'title', 'brief', 'follow_up', 'mode'}
    persona_fields = {'id', 'name', 'role', 'context', 'starting_facts', 'surface', 'disclosure_boundary', 'autonomy', 'knowledge', 'preferences', 'goal'}
    for tid, task in at.items():
        require(set(task) == task_fields, 'actor-boundary', f'{tid}: unexpected/missing fields {sorted(set(task) ^ task_fields)}')
        require(task['persona'] in ap, 'actor-persona', f'{tid}: unknown profile {task["persona"]}')
    for pid, profile in ap.items():
        require(set(profile) == persona_fields, 'actor-boundary', f'{pid}: unexpected/missing traits {sorted(set(profile) ^ persona_fields)}')
    actor_text = '\n'.join(p.read_text(encoding='utf-8') for p in (ROOT / 'actor').glob('*.json'))
    require(not re.search(r'\b(?:SC\d+|API\d+|F\d{2})\b', actor_text), 'actor-boundary', 'actor JSON contains scenario or fixture IDs')
    for word in ['fixture_id', 'required_capabilities', 'observation_scope', 'Rejects a reversed arrow', 'Will set a field']:
        require(word not in actor_text, 'actor-boundary', f'actor JSON contains facilitator/oracle text: {word}')
    guide = (ROOT / 'facilitator/evaluator-guide.md').read_text(encoding='utf-8')
    feature_text = '\n'.join(p.read_text(encoding='utf-8') for p in (REPO / 'features').glob('*.feature'))
    require(bool(feature_text), 'feature-files', 'run in a checkout containing features/*.feature')
    scenario_ids = set(re.findall(r'@(SC\d+|API\d+)\b', feature_text))
    outcome_ids = set(re.findall(r'@(O\d+)\b', feature_text))
    used, variants = set(), []
    preparation_states = {'not_run', 'blocked_pending_test_controls', 'blocked_pending_fixture'}
    for pid, profile in fp.items():
        require(len(profile['tasks']) == 2, 'profile-tasks', f'{pid}: expected two tasks')
        require(set(profile['tasks']) == {tid for tid, t in at.items() if t['persona'] == pid}, 'profile-tasks', f'{pid}: assigned tasks disagree with actor records')
    for tid, task in ft.items():
        require(at[tid]['persona'] == task['persona'], 'task-persona', f'{tid}: actor/facilitator profiles differ')
        require(set(task['outcomes']) <= outcome_ids, 'outcome-reference', f'{tid}: unknown IDs {sorted(set(task["outcomes"]) - outcome_ids)}')
        require(task['fixture_id'] in guide, 'fixture-reference', f'{tid}: {task["fixture_id"]} absent from evaluator guide')
        require(bool(task['observation_scope'].strip()), 'observation-scope', f'{tid}: a bounded observation scope is required')
        require(set(task['observes']) == {s for v in task['variants'] for s in v['observes']}, 'variant-coverage', f'{tid}: parent observes must equal the variant union')
        for record in [task, *task['variants']]:
            rid = record['id']
            require(record['initial_status'] in preparation_states, 'readiness', f'{rid}: invalid preparation state {record["initial_status"]}')
            require(set(record['observes']).isdisjoint(record['related']), 'coverage-boundary', f'{rid}: observes and related overlap')
            unknown = set(record['observes'] + record['related']) - scenario_ids
            require(not unknown, 'scenario-reference', f'{rid}: unknown IDs {sorted(unknown)}')
            used.update(record['required_capabilities'])
        variants.extend(v['id'] for v in task['variants'])
    require(len(variants) == len(set(variants)) == 20, 'variant-set', 'expected 20 unique named variants')
    require(used == set(caps) and len(caps) == 22, 'capability-set', f'expected 22 definitions; missing={sorted(used - set(caps))}, unused={sorted(set(caps) - used)}')
    for cid, cap in caps.items():
        require(cap['delivery_stage'] in {'1A', '1B', '2', '3', '4', '5'}, 'capability-stage', f'{cid}: invalid delivery stage')
        require(cap['kind'] in {'ui', 'artifact', 'runner', 'fixture'}, 'capability-kind', f'{cid}: invalid kind')
        require(bool(cap['presence_evidence'] and cap['contract_mapping'] and cap['when_absent']), 'capability-evidence', f'{cid}: presence evidence, contract mapping and absent outcomes are required')
    for tid, sid in [('T01', 'SC01'), ('T05', 'SC18')]:
        require(sid not in ft[tid]['observes'], 'coverage-exclusion', f'{tid}: cannot observe {sid}')
    require(not ft['T11']['observes'], 'coverage-exclusion', 'T11: documentation browsing cannot prove API scenarios')
    require(any(v['id'] == 'T15-graph' and 'SC17' in v['observes'] for v in ft['T15']['variants']), 'graph-variant', 'T15-graph must observe the visible SC17 fallback')
    for tids, expected in [(['T02', 'T03', 'T15'], 'blocked_pending_test_controls'), (['T06', 'T08'], 'blocked_pending_fixture')]:
        for tid in tids:
            require(ft[tid]['initial_status'] == expected, 'readiness', f'{tid}: expected {expected}')
    inputs = review_inputs(ft)
    if check_checkpoint:
        check_review(inputs)
    for path in ROOT.rglob('*.md'):
        for target in re.findall(r'\]\(([^)]+)\)', path.read_text(encoding='utf-8')):
            if re.match(r'[a-z]+:', target):
                continue
            target = target.split('#')[0]
            if target:
                if not check_checkpoint and (path.parent / target).resolve() == CHECKPOINT:
                    continue  # The explicit record command creates this generated file below.
                require((path.parent / target).exists(), 'document-link', f'{path.relative_to(REPO)}: missing {target}')
    delivery = (REPO / 'docs/06-delivery.md').read_text(encoding='utf-8')
    for phrase in ['Fixture-mode test controls', 'as_of', 'vector_timeout', 'budget_exhausted', 'graph_unavailable', 'development credential mode', 'public deployment']:
        require(phrase in delivery, 'delivery-prerequisite', f'docs/06-delivery.md is missing {phrase!r}')
    require(read('facilitator/tasks.json')['status'] == 'prepared_not_executed', 'preparation-status', 'facilitator tasks must remain prepared_not_executed')
    return inputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--record-scenario-review', metavar='NOTE', help='after reviewing scenario/scope diffs, record their hashes and a meaningful review note')
    args = parser.parse_args()
    try:
        if args.record_scenario_review is not None:
            require(bool(args.record_scenario_review.strip()), 'scenario-review', 'provide a nonempty review note')
            inputs = validate(check_checkpoint=False)
            CHECKPOINT.write_text(json.dumps({'schema_version': 1, 'review_note': args.record_scenario_review, **inputs}, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
            print('Recorded scenario/scope review checkpoint. Hashes detect change; they do not prove semantic agreement.')
        else:
            validate()
        print('PASS: 8 profiles, 16 tasks, 20 variants, 22 capability IDs; preparation boundaries, readiness, coverage, links and scenario review checkpoint checked. No UX sessions executed.')
    except (ValidationError, OSError, KeyError, TypeError, AttributeError) as error:
        label = '' if isinstance(error, ValidationError) else 'input/schema: '
        print(f'FAIL {label}{error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
