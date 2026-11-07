import copy
import json
from pathlib import Path
import unittest

import release_decisions as rd

ROOT = Path(__file__).resolve().parents[1]
GOOD_URL = 'https://github.com/nissan/oz-startup-brain/issues/28#issuecomment-6799999999'


class ReleaseDecisionTests(unittest.TestCase):
    """The decision record can hold owner decisions and human fact checks, but never invented ones."""
    def setUp(self):
        self.doc = json.loads((ROOT / 'release/decisions.json').read_text())
        self.m = json.loads((ROOT / 'article-bibliography.json').read_text())
        self.p = json.loads((ROOT / 'rights-evidence.json').read_text())['policies']

    def errors(self, doc=None):
        return rd.validate(doc or self.doc, self.m, self.p)

    def src(self, doc, sid):
        return next(r for r in doc['sources'] if r['source_id'] == sid)

    def test_committed_record_is_valid_and_fully_open(self):
        self.assertEqual([], self.errors())
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


if __name__ == '__main__':
    unittest.main()
