"""Regression tests for the blank human fact-check form (#62)."""
import copy
import json
import re
import unittest

import human_checklist as H

DECISIONS = json.loads((H.ROOT / 'release' / 'decisions.json').read_text())
MANIFEST = json.loads((H.ROOT / 'article-bibliography.json').read_text())


class HumanChecklist(unittest.TestCase):
    def test_committed_form_is_current(self):
        self.assertEqual(H.OUT.read_text(), H.render(DECISIONS, MANIFEST))

    def test_form_covers_exactly_the_fifteen_federal_checks_with_versions(self):
        text = H.render(DECISIONS, MANIFEST)
        rows = re.findall(r'^\| `(src_[0-9a-f]{12}/[a-z_]+)` \|', text, re.M)
        expected = [c['check_id'] for s in DECISIONS['sources'] if s['source_id'] in
                    {'src_7d73188025be', 'src_03aaa6584d27', 'src_96ad709aa550', 'src_9ba1bc6b991a'} for c in s['fact_checks']]
        self.assertEqual(rows, expected)
        self.assertEqual(len(rows), 15)
        for vid in ('sv_5c4b6a8ffd94aa780022', 'sv_bd9ea252a09e4ff8262a', 'sv_87c9b944493e4b99b654', 'sv_b1322863d404e0fb62fc'):
            self.assertIn(f'`{vid}`', text)
        for qld in ('src_8db3776594ab', 'src_5dcbf23541e6', 'src_d1313206eafa', 'src_f164f71e6364'):
            self.assertNotIn(qld, text)

    def test_every_answer_cell_is_blank_even_when_results_exist(self):
        recorded = copy.deepcopy(DECISIONS)
        for s in recorded['sources']:
            for c in s['fact_checks']:
                c.update(result='confirmed', checked_by='A Person', checked_on='2026-11-08', checked_against='live_page', note='seen')
        text = H.render(recorded, MANIFEST)
        self.assertEqual(text, H.render(DECISIONS, MANIFEST))
        for row in re.findall(r'^\| `src_.*$', text, re.M):
            self.assertTrue(row.endswith('|  |  |  |  |  |'), row)
        self.assertNotIn('A Person', text)

    def test_version_mismatch_or_wrong_count_is_refused(self):
        bad = copy.deepcopy(MANIFEST)
        next(s for s in bad['sources'] if s['source_id'] == 'src_7d73188025be')['source_version_id'] = 'sv_000000000000000000aa'
        with self.assertRaisesRegex(ValueError, 'disagree on the version'):
            H.render(DECISIONS, bad)
        fewer = copy.deepcopy(DECISIONS)
        next(s for s in fewer['sources'] if s['source_id'] == 'src_96ad709aa550')['fact_checks'].pop()
        with self.assertRaisesRegex(ValueError, 'expected 15 federal checks, found 14'):
            H.render(fewer, MANIFEST)


if __name__ == '__main__':
    unittest.main()
