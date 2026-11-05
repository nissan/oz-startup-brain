"""Regression checks for diagnostics and stale semantic-review inputs."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[3]
PACK = Path('research/synthetic-ux')


class PackValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        for directory in ('research', 'features', 'docs', 'evaluation', 'data'):
            if (REPO / directory).exists():
                shutil.copytree(REPO / directory, self.repo / directory)
        shutil.copy(REPO / 'README.md', self.repo / 'README.md')

    def run_validator(self, *args, optimized=False):
        return subprocess.run([sys.executable, *(['-O'] if optimized else []),
                               str(self.repo / PACK / 'tools/validate_pack.py'), *args],
                              text=True, capture_output=True, timeout=15)

    def change_json(self, name, mutate):
        path = self.repo / PACK / name
        data = json.loads(path.read_text())
        mutate(data)
        path.write_text(json.dumps(data, indent=2) + '\n')

    def assert_failure(self, result, *messages):
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertNotIn('Traceback', result.stderr)
        for message in messages:
            self.assertIn(message, result.stderr)

    def test_current_pack_passes_normally_and_optimized(self):
        for optimized in (False, True):
            result = self.run_validator(optimized=optimized)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_actor_metadata_leak_names_rule_and_task_even_optimized(self):
        self.change_json('actor/tasks.json', lambda d: d['tasks'][0].update(fixture_id='F01'))
        for optimized in (False, True):
            self.assert_failure(self.run_validator(optimized=optimized), 'actor-boundary', 'T01', 'fixture_id')

    def test_missing_capability_names_missing_id(self):
        removed = []
        self.change_json('facilitator/capabilities.json', lambda d: removed.append(d['capabilities'].pop()['id']))
        self.assert_failure(self.run_validator(), 'capability-set', removed[0])

    def test_existing_scenario_id_does_not_hide_changed_steps(self):
        path = self.repo / 'features/founder-journeys.feature'
        path.write_text(path.read_text().replace('Then it asks one relevant clarification', 'Then it assumes a jurisdiction'))
        self.assert_failure(self.run_validator(), 'scenario-review', 'features/founder-journeys.feature')

    def test_background_change_requires_review(self):
        path = self.repo / 'features/founder-journeys.feature'
        path.write_text(path.read_text().replace('coverage statement', 'coverage claim'))
        self.assert_failure(self.run_validator(), 'scenario-review', 'features/founder-journeys.feature')

    def test_scope_change_requires_explicit_review(self):
        self.change_json('facilitator/tasks.json', lambda d: d['tasks'][0].update(observation_scope='Changed scope for review.'))
        self.assert_failure(self.run_validator(), 'scenario-review', 'T01')
        result = self.run_validator('--record-scenario-review', 'Test-only acknowledgement of changed scope; not a semantic verdict.')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.run_validator().returncode, 0)

    def test_checkpoint_cannot_bypass_actor_boundary(self):
        self.change_json('actor/tasks.json', lambda d: d['tasks'][0].update(fixture_id='F01'))
        self.assert_failure(self.run_validator('--record-scenario-review', 'Attempted update'), 'actor-boundary')

    def test_missing_checkpoint_and_bad_json_are_actionable(self):
        path = self.repo / PACK / 'facilitator/scenario-review.json'
        path.unlink()
        self.assert_failure(self.run_validator(), 'input:', 'scenario-review.json')
        path.write_text('{')
        self.assert_failure(self.run_validator(), 'input:', 'scenario-review.json')


if __name__ == '__main__':
    unittest.main()
