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

    def test_comment_and_whitespace_only_feature_edits_do_not_require_review(self):
        path = self.repo / 'features/api-access.feature'
        text = path.read_text()
        lines = text.splitlines()
        lines.insert(1, '# reviewer note: formatting only')
        lines[3] = lines[3] + '   '
        path.write_text('\n'.join(lines) + '\n\n\n')
        result = self.run_validator()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_one_word_background_change_still_requires_review(self):
        path = self.repo / 'features/founder-journeys.feature'
        text = path.read_text()
        self.assertIn('Background:', text)
        head, tail = text.split('Background:', 1)
        tail = tail.replace('coverage statement', 'coverage claim', 1)
        path.write_text(head + 'Background:' + tail)
        self.assert_failure(self.run_validator(), 'scenario-review', 'features/founder-journeys.feature')

    def test_table_cell_inner_whitespace_still_counts(self):
        path = self.repo / 'features/api-access.feature'
        text = path.read_text()
        self.assertIn('| "lookup"       | 200         | explicit         |', text)
        path.write_text(text.replace('| "lookup"       | 200         | explicit         |', '| "lookup"       | 200         | explicit  |', 1))
        self.assert_failure(self.run_validator(), 'scenario-review', 'features/api-access.feature')

    def normalised(self, text):
        # The normaliser itself, imported from the validator module (no side effects on import).
        import importlib.util
        spec = importlib.util.spec_from_file_location('validate_pack', self.repo / PACK / 'tools/validate_pack.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.normalised_feature(text)

    DOCSTRING_FEATURE = (
        'Feature: docstrings\n'
        '  Scenario: payload\n'
        '    Given this source text:\n'
        '      {open}\n'
        '      {payload}\n'
        '      {close}\n'
        '    Then it is kept\n'
    )

    def test_docstring_payload_changes_change_the_hash(self):
        for opener, closer in (('"""', '"""'), ('"""markdown', '"""'), ('```', '```')):
            base = self.DOCSTRING_FEATURE.format(open=opener, close=closer, payload='# retain this source warning\n      text\n\n\n      next')
            variants = {
                'hash-prefixed payload line': base.replace('# retain this source warning', '# different instruction'),
                'repeated blank lines in payload': base.replace('text\n\n\n      next', 'text\n\n      next'),
                'trailing payload whitespace': base.replace('      text\n', '      text   \n'),
            }
            reference = self.normalised(base)
            for label, variant in variants.items():
                self.assertNotEqual(reference, self.normalised(variant), f'{opener}: {label} must change the hash')

    def test_formatting_outside_docstrings_is_still_ignored(self):
        base = self.DOCSTRING_FEATURE.format(open='"""', close='"""', payload='# keep\n      text').replace('  Scenario: payload\n', '  Scenario: payload\n\n')
        reformatted = '# file comment\n' + base.replace('  Scenario: payload\n\n', '  Scenario: payload   \n\n\n\n')
        self.assertEqual(self.normalised(base), self.normalised(reformatted))
        self.assertIn('# keep', self.normalised(base))


if __name__ == '__main__':
    unittest.main()
