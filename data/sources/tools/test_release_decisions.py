import copy
import json
from pathlib import Path
import unittest

import release_decisions as rd

ROOT = Path(__file__).resolve().parents[1]
GOOD_URL = 'https://github.com/nissan/oz-startup-brain/issues/28#issuecomment-6799999999'


class _Base(unittest.TestCase):
    """Structural checks; semantic authorization still requires review of the linked record."""
    def setUp(self):
        self.doc = json.loads((ROOT / 'release/decisions.json').read_text())
        # Counterexamples start from an explicitly undecided fixture, independent of live owner selections.
        for decision in list(self.doc['global_decisions'].values()) + [v for s in self.doc['sources'] for v in s['decisions'].values()]:
            for key in decision:
                decision[key] = None
        self.m = json.loads((ROOT / 'article-bibliography.json').read_text())
        self.p = json.loads((ROOT / 'rights-evidence.json').read_text())['policies']
        self.attempts = {}
        for name in self.m['audit']['retrievals']:
            for a in json.loads((ROOT / name).read_text())['attempts']:
                self.attempts.setdefault(a['source_id'], []).append(a)

    def errors(self, doc=None):
        return rd.validate(doc or self.doc, self.m, self.p, self.attempts)

    def owner(self, d, selected):
        d.update(selected=selected, decided_by='Nissan (owner)', decided_on='2026-11-09', record_url=GOOD_URL)

    def src(self, doc, sid):
        return next(r for r in doc['sources'] if r['source_id'] == sid)


class ReleaseDecisionTests(_Base):
    def test_committed_record_has_policy_decisions_but_no_release_or_human_signoff(self):
        committed = json.loads((ROOT / 'release/decisions.json').read_text())
        self.assertEqual([], self.errors(committed))
        self.assertEqual((12, 34, 26, 26), rd.pending_summary(committed))
        self.assertTrue(all(s['decisions']['release_inclusion']['selected'] in ('defer', 'exclude') for s in committed['sources']))
        self.assertEqual((34, 34, 26, 26), rd.pending_summary(self.doc))

    def test_a_properly_recorded_owner_decision_passes(self):
        d = copy.deepcopy(self.doc)
        d['global_decisions']['queensland_retrieval_route'].update(selected='permission_request', decided_by='Nissan (owner)', decided_on='2026-11-09', record_url=GOOD_URL)
        self.assertEqual([], self.errors(d))

    def test_invented_or_unattributed_decisions_fail(self):
        cases = {
            'no record': dict(selected='paraphrase'),
            'agent decides': dict(selected='paraphrase', decided_by='Claude', decided_on='2026-11-09', record_url=GOOD_URL),
            'not a GitHub record': dict(selected='paraphrase', decided_by='Nissan (owner)', decided_on='2026-11-09', record_url='https://example.com/ok'),
            'impossible date': dict(selected='paraphrase', decided_by='Nissan (owner)', decided_on='2026-11-31', record_url=GOOD_URL),
            'unlisted option': dict(selected='scrape_everything', decided_by='Nissan (owner)', decided_on='2026-11-09', record_url=GOOD_URL),
            'metadata without decision': dict(decided_by='Nissan (owner)'),
        }
        for label, patch in cases.items():
            with self.subTest(label=label):
                d = copy.deepcopy(self.doc)
                self.src(d, 'src_7d73188025be')['decisions']['use'].update(patch)
                self.assertTrue(self.errors(d), label)

    def test_fact_checks_need_a_named_person_date_and_target(self):
        for checker in ('Claude', 'Codex run x', 'Loki (OpenClaw)', 'GPT-6.1', 'review bot', None):
            with self.subTest(checker=checker):
                d = copy.deepcopy(self.doc)
                self.src(d, 'src_96ad709aa550')['fact_checks'][0].update(result='confirmed', checked_by=checker, checked_on='2026-11-09', checked_against='live_page')
                self.assertTrue(any('named person' in e for e in self.errors(d)))
        d = copy.deepcopy(self.doc)
        c = self.src(d, 'src_96ad709aa550')['fact_checks'][0]
        c.update(result='confirmed', checked_by='Nissan Dookeran', checked_on='2026-11-09', checked_against='sv_' + '0' * 20)
        self.assertTrue(any('checked_against' in e for e in self.errors(d)))
        c.update(checked_against='sv_87c9b944493e4b99b654')
        self.assertEqual([], self.errors(d))

    def test_inclusion_requires_reviewed_version_decisions_and_confirmed_checks(self):
        d = copy.deepcopy(self.doc)
        rec = lambda sid: self.src(d, sid)
        owner = dict(decided_by='Nissan (owner)', decided_on='2026-11-09', record_url=GOOD_URL)
        rec('src_8db3776594ab')['decisions']['release_inclusion'].update(selected='include', **owner)
        rec('src_03aaa6584d27')['decisions']['release_inclusion'].update(selected='include', **owner)
        errors = self.errors(d)
        self.assertTrue(any('src_8db3776594ab: only a reviewed' in e for e in errors))
        self.assertTrue(any('src_03aaa6584d27: inclusion needs use' in e for e in errors))
        self.assertTrue(any('src_03aaa6584d27: inclusion needs every fact check' in e for e in errors))

    def test_source_text_stays_out(self):
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_9ba1bc6b991a')['fact_checks'][0]['excerpt'] = 'copied text'
        self.assertTrue(any('source text' in e for e in self.errors(d)))
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_9ba1bc6b991a')['fact_checks'][0]['note'] = 'x' * 401
        self.assertTrue(any('longer than' in e for e in self.errors(d)))

    def test_record_stays_consistent_with_the_manifest(self):
        d = copy.deepcopy(self.doc)
        d['sources'] = d['sources'][1:]
        self.assertTrue(any('exactly once' in e for e in self.errors(d)))
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_8db3776594ab')['retrieval']['state'] = 'reviewed_version'
        self.assertTrue(any('disagrees' in e for e in self.errors(d)))
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_7d73188025be')['url'] = 'https://business.gov.au/elsewhere'
        self.assertTrue(any('identity' in e for e in self.errors(d)))


class CodexReview57Regressions(_Base):
    """Codex review of PR #57 (8 November 2026): each case returned [] at ed3cb68."""

    def test_self_added_option_cannot_be_selected(self):
        d = copy.deepcopy(self.doc)
        d['options']['use']['scrape_everything'] = 'added by editor'
        self.owner(self.src(d, 'src_7d73188025be')['decisions']['use'], 'scrape_everything')
        errors = self.errors(d)
        self.assertTrue(any('fixed decision values' in e for e in errors))
        self.assertTrue(any('not one of the listed options' in e for e in errors))
        d = copy.deepcopy(self.doc)
        d['options']['surprise'] = {}
        self.assertTrue(any('fixed decision values' in e for e in self.errors(d)))

    def test_deleting_fact_checks_cannot_unlock_inclusion(self):
        d = copy.deepcopy(self.doc)
        r = self.src(d, 'src_03aaa6584d27')
        for k, v in (('use', 'paraphrase'), ('retention', 'private_snapshot_until_recheck'), ('attribution', 'policy_prescribed'), ('release_inclusion', 'include')):
            self.owner(r['decisions'][k], v)
        r['fact_checks'] = []
        errors = self.errors(d)
        self.assertTrue(any('inventory differs' in e for e in errors))
        self.assertTrue(any('at least one fact check' in e for e in errors))
        self.assertTrue(any('inclusion needs every fact check' in e for e in errors))

    def test_deleting_decisions_fails(self):
        d = copy.deepcopy(self.doc)
        d['global_decisions'] = {}
        self.assertTrue(any('global_decisions must be exactly' in e for e in self.errors(d)))
        d = copy.deepcopy(self.doc)
        del self.src(d, 'src_96ad709aa550')['decisions']['retention']
        self.assertTrue(any('decisions must be exactly' in e for e in self.errors(d)))

    def test_duplicated_or_reworded_checks_fail(self):
        d = copy.deepcopy(self.doc)
        r = self.src(d, 'src_96ad709aa550')
        r['fact_checks'].append(copy.deepcopy(r['fact_checks'][0]))
        errors = self.errors(d)
        self.assertTrue(any('unique' in e for e in errors) and any('inventory differs' in e for e in errors))
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_96ad709aa550')['fact_checks'][0]['check'] = 'Anything is fine.'
        self.assertTrue(any('inventory differs' in e for e in self.errors(d)))

    def test_wrong_but_existing_policy_fails(self):
        d = copy.deepcopy(self.doc)
        self.src(d, 'src_8db3776594ab')['rights_policy_candidate'] = 'business_gov'
        self.assertTrue(any("must be 'qld_detsi'" in e for e in self.errors(d)))

    def test_the_two_no_version_states_follow_the_retrieval_logs(self):
        for sid, wrong in (('src_8db3776594ab', 'shell_not_promoted'), ('src_f164f71e6364', 'blocked_403')):
            with self.subTest(sid=sid):
                d = copy.deepcopy(self.doc)
                self.src(d, sid)['retrieval']['state'] = wrong
                self.assertTrue(any('retrieval logs' in e for e in self.errors(d)))
        self.assertEqual('blocked_403', rd.expected_state(next(s for s in self.m['sources'] if s['source_id'] == 'src_8db3776594ab'), self.attempts['src_8db3776594ab']))
        self.assertEqual('shell_not_promoted', rd.expected_state(next(s for s in self.m['sources'] if s['source_id'] == 'src_f164f71e6364'), self.attempts['src_f164f71e6364']))
        self.assertIsNone(rd.expected_state({'source_version_id': None}, []))


if __name__ == '__main__':
    unittest.main()
