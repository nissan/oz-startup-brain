import copy
import json
from pathlib import Path
import unittest

import retrieval_request as rr

ROOT = Path(__file__).resolve().parents[1]


class RetrievalRequestTests(unittest.TestCase):
    def setUp(self):
        self.m = json.loads((ROOT/'article-bibliography.json').read_text())
        self.requests = sorted((ROOT/'retrieval-requests').glob('*.json'))
        self.r = json.loads(self.requests[0].read_text())

    def test_committed_requests_are_valid(self):
        self.assertTrue(self.requests)
        for path in self.requests:
            with self.subTest(path=path.name):
                req = json.loads(path.read_text())
                self.assertEqual([], rr.check(req, self.m))
                self.assertEqual(path.stem, req['run_id'])

    def test_rejections(self):
        out_of_scope = next(s['source_id'] for s in self.m['sources'] if not s['shortlist_tier'])
        cases = {
            'shortlisted': lambda r: r.update(sources=[out_of_scope]),
            'distinct': lambda r: r.update(sources=r['sources'][:1]*2),
            'PEM public key': lambda r: r['snapshot_recipient'].update(public_key_pem='not a key'),
            'private key': lambda r: r.update(note='-----BEGIN PRIVATE KEY-----'),
            'run_id': lambda r: r.update(run_id='anything'),
            'transport': lambda r: r.update(transport='socks'),
        }
        for needle, mutate in cases.items():
            with self.subTest(needle=needle):
                r = copy.deepcopy(self.r); mutate(r)
                self.assertTrue(any(needle in e for e in rr.check(r, self.m)), needle)

    def test_pending_until_log_committed(self):
        self.assertEqual(ROOT/'audits'/f"{self.r['run_id']}.json", rr.log_path(self.r['run_id']))


if __name__ == '__main__':
    unittest.main()
