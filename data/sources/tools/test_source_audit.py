import copy
import json
from pathlib import Path
import socket
import unittest
from unittest.mock import patch

import source_audit as audit
from extract_fixture import extract
from fetch_metadata import digest_body, probe, public_url, MAX_BYTES

ROOT = Path(__file__).resolve().parents[1]


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.m = audit.read(ROOT/'article-bibliography.json')
        self.o = audit.read(ROOT/self.m['audit']['web_observations'])['observations']
        self.p = audit.read(ROOT/'rights-evidence.json')['policies']

    def errors(self):
        return audit.validate(self.m,self.o,self.p)

    def test_committed_inventory_and_report(self):
        self.assertEqual([],self.errors())
        self.assertEqual((ROOT/'audits/2026-11-06-inventory.md').read_text(),audit.report(self.m))
        self.assertEqual(0,audit.summary(self.m)['ingestion_approved'])

    def test_missing_and_duplicate_records(self):
        self.m['sources'].pop()
        self.assertTrue(self.errors())
        self.m['sources'].append(copy.deepcopy(self.m['sources'][0]))
        self.assertIn('duplicate source ID',self.errors())

    def test_changed_discovery_url_is_rejected(self):
        self.m['sources'][0]['url']='https://example.com/changed'
        self.assertIn('discovery identities changed',self.errors())

    def test_missing_classification(self):
        self.m['sources'][0]['source_class']='unclassified'
        self.assertTrue(self.errors())

    def test_unknown_jurisdiction(self):
        self.m['sources'][0]['jurisdiction']=['Australia probably']
        self.assertTrue(self.errors())

    def test_rights_without_policy(self):
        s=self.m['sources'][4]
        s['rights_status']='conditional_licence_identified'
        self.assertTrue(any('rights asserted' in e for e in self.errors()))

    def test_licence_does_not_approve_ingestion(self):
        self.m['sources'][0]['disposition']='approved_for_ingestion'
        self.assertTrue(any('cannot grant' in e for e in self.errors()))

    def test_cached_observation_not_raw_or_verified(self):
        s=self.m['sources'][0]
        s['last_verified_at']='2026-11-06'
        s['fetched_at']='2026-11-06'
        self.assertTrue(any('not factual' in e for e in self.errors()))
        self.assertTrue(any('not a raw' in e for e in self.errors()))

    def test_http_status_not_invented(self):
        self.o[0]['http_status']=200
        self.assertTrue(any('masquerade' in e for e in self.errors()))

    def test_failure_requires_reason(self):
        o=next(o for o in self.o if o['outcome']=='tool_error')
        o['failure_detail']=None
        self.assertTrue(any('missing failure' in e for e in self.errors()))

    def test_real_calendar_dates(self):
        self.m['sources'][0]['published_at']='2026-02-30'
        self.assertTrue(any('invalid published_at' in e for e in self.errors()))

    def test_missing_observation(self):
        self.o.pop()
        self.assertTrue(self.errors())

    def test_owner_decision_not_fabricated(self):
        self.m['audit']['owner_decision']='approved'
        self.assertTrue(self.errors())

    def test_direct_attempts_cover_inventory(self):
        attempts=audit.read(ROOT/self.m['audit']['direct_attempts'])['attempts']
        self.assertEqual([],audit.validate_attempts(self.m,attempts))
        attempts.pop()
        self.assertTrue(audit.validate_attempts(self.m,attempts))

    def test_failed_attempt_cannot_create_version(self):
        attempts=audit.read(ROOT/self.m['audit']['direct_attempts'])['attempts']
        attempts[0]['source_version_id']='invented'
        self.assertTrue(any('failure cannot' in e for e in audit.validate_attempts(self.m,attempts)))


class ExtractionTests(unittest.TestCase):
    def test_expected_sections_tables_and_qualifiers(self):
        actual=extract((ROOT/'fixtures/fictional-program.html').read_text(),'https://fixture.invalid/harbour')
        self.assertEqual(audit.read(ROOT/'fixtures/fictional-program.expected.json'),actual)
        table=next(b for b in actual['blocks'] if b['kind']=='table')
        self.assertTrue(table['rows'][0][0]['header'])
        self.assertIn('only if condition R',table['rows'][2][1]['text'])
        self.assertTrue(actual['blocks'][3]['text'].startswith('* Condition R'))
        self.assertNotIn('declare this open',json.dumps(actual))
        self.assertNotIn('Apply now',json.dumps(actual))

    def test_reject_real_url(self):
        with self.assertRaises(ValueError):extract('<p>text</p>','https://example.com/')

    def test_reject_unclosed_table(self):
        with self.assertRaises(ValueError):extract('<table><tr><td>x</td></tr>','https://fixture.invalid/')


class TransportTests(unittest.TestCase):
    def test_new_observation_new_version_even_same_content(self):
        a=digest_body(b'fixture','src_1','2026-11-06T00:00:00Z')
        b=digest_body(b'fixture','src_1','2026-11-07T00:00:00Z')
        self.assertEqual(a[0],b[0]);self.assertNotEqual(a[1],b[1])

    def test_local_or_credential_urls_rejected(self):
        for u in ['http://example.com','https://localhost','https://user:secret@example.com','https://x.invalid','https://example.com:8443']:
            with self.subTest(u=u), self.assertRaises(ValueError):public_url(u)

    @patch('fetch_metadata.socket.getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))])
    def test_private_dns_rejected(self,unused):
        with self.assertRaises(ValueError):public_url('https://example.com/')

    @patch('fetch_metadata.public_url',side_effect=socket.gaierror())
    def test_dns_failure_has_no_version(self,unused):
        r=probe({'source_id':'src_1','url':'https://example.com/'})
        self.assertEqual('transport_error',r['outcome'])
        for k in ['source_version_id','raw_content_sha256','fetched_at','last_verified_at']:
            self.assertIsNone(r[k])

    @patch('fetch_metadata.public_url',return_value='https://example.com/')
    @patch('fetch_metadata.build_opener')
    def test_oversized_response_not_hashed(self,opener,unused):
        response=opener.return_value.open.return_value.__enter__.return_value
        response.status=200;response.url='https://example.com/'
        response.headers={'Content-Type':'text/html'}
        response.read.return_value=b'x'*(MAX_BYTES+1)
        r=probe({'source_id':'src_1','url':'https://example.com/'})
        self.assertEqual('size_limit',r['outcome'])
        self.assertIsNone(r['source_version_id'])

    @patch('fetch_metadata.public_url',return_value='https://example.com/')
    @patch('fetch_metadata.build_opener')
    def test_success_retains_no_body_or_verification(self,opener,unused):
        response=opener.return_value.open.return_value.__enter__.return_value
        response.status=200;response.url='https://example.com/'
        response.headers={'Content-Type':'text/html'};response.read.return_value=b'fixture'
        r=probe({'source_id':'src_1','url':'https://example.com/'})
        self.assertEqual('http_body_received',r['outcome'])
        self.assertIsNotNone(r['source_version_id'])
        self.assertIsNone(r['last_verified_at']);self.assertIsNone(r['snapshot_location'])
        self.assertNotIn('body',r)

if __name__=='__main__':unittest.main()
