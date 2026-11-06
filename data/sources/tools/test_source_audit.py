import copy
import json
from pathlib import Path
import os
import socket
import tempfile
import unittest
from unittest.mock import patch

import source_audit as audit
from extract_fixture import extract
from fetch_metadata import digest_body, probe, public_url, snapshot_dir_allowed, MAX_BYTES, REPO

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

    def test_owner_decision_is_a_linked_dated_record(self):
        d=self.m['audit']['owner_decision']
        self.assertEqual(('AU-QLD','AU-FED'),(d['pilot_jurisdiction'],d['supporting_scope']))
        for key,value in (('record_url',None),('record_url','https://example.com/decision'),('decided_on','2026-11-31'),('pilot_jurisdiction','Queensland-ish')):
            with self.subTest(key=key):
                m=copy.deepcopy(self.m);m['audit']['owner_decision'][key]=value
                self.assertTrue(any('owner jurisdiction decision' in e for e in audit.validate(m,self.o,self.p)))

    def test_direct_attempts_cover_inventory(self):
        attempts=audit.read(ROOT/self.m['audit']['direct_attempts'])['attempts']
        self.assertEqual([],audit.validate_attempts(self.m,attempts))
        attempts.pop()
        self.assertTrue(audit.validate_attempts(self.m,attempts))

    def test_failed_attempt_cannot_create_version(self):
        attempts=audit.read(ROOT/self.m['audit']['direct_attempts'])['attempts']
        attempts[0]['source_version_id']='invented'
        self.assertTrue(any('failure cannot' in e for e in audit.validate_attempts(self.m,attempts)))


SHA='a'*64


def retrieval(**over):
    r=dict(source_id='src_8db3776594ab',requested_url='https://advance.qld.gov.au/grants-and-programs/ignite-ideas-fund',
           attempted_at='2026-11-06T11:00:00+00:00',method='https_get_via_configured_proxy',outcome='http_body_received',
           http_status=200,final_url='https://innovation.qld.gov.au/grants-and-programs/ignite-ideas-fund',content_type='text/html',
           raw_content_sha256=SHA,bytes_received=10,source_version_id='sv_'+'1'*20,fetched_at='2026-11-06T11:00:01+00:00',
           last_verified_at=None,snapshot_location='snapshot:sv_'+'1'*20+'.body',failure_reason=None,etag=None,last_modified=None)
    r.update(over);return r


def log(*records):
    return dict(format_version='2',run=dict(run_id='claude-28-test',method='https_get_via_configured_proxy'),attempts=list(records))


class RetrievedVersionTests(unittest.TestCase):
    """0.3: a retrieved version enters the manifest only when a retrieval log backs it and a reviewer
    confirmed the representation is the source page. None of this is clearance or verification."""
    def setUp(self):
        self.m = audit.read(ROOT/'article-bibliography.json')
        self.o = audit.read(ROOT/self.m['audit']['web_observations'])['observations']
        self.p = audit.read(ROOT/'rights-evidence.json')['policies']
        self.s = self.m['sources'][0]
        self.s.update(fetched_at=retrieval()['fetched_at'],content_hash=SHA,source_version_id=retrieval()['source_version_id'],
                      version_review=dict(reviewed_on='2026-11-06',reviewer='Claude claude-28-20261106-2200',representation='source_page',note='Program page with heading and body; not a challenge.'))
        self.records={retrieval()['source_version_id']:retrieval()}

    def errors(self,records=None):
        return audit.validate(self.m,self.o,self.p,self.records if records is None else records)

    def test_backed_and_reviewed_version_passes(self):
        self.assertEqual([],self.errors())
        self.assertIn('`sv_',audit.report(self.m))

    def test_version_without_log_record_rejected(self):
        self.assertTrue(any('not backed' in e for e in self.errors({})))

    def test_hash_or_time_drift_rejected(self):
        self.s['content_hash']='b'*64
        self.assertTrue(any('not backed' in e for e in self.errors()))

    def test_challenge_page_cannot_become_a_version(self):
        self.s['version_review']['representation']='challenge_or_shell'
        self.assertTrue(any('representation review' in e for e in self.errors()))

    def test_unreviewed_version_rejected(self):
        self.s['version_review']=None
        self.assertTrue(any('representation review' in e for e in self.errors()))

    def test_only_shortlisted_sources(self):
        self.s['shortlist_tier']=None;self.s['disposition']='out_of_initial_scope'
        self.assertTrue(any('only shortlisted' in e for e in self.errors()))

    def test_version_still_not_clearance_or_verification(self):
        self.s['rights_status']='cleared'
        self.assertTrue(any('cannot grant' in e for e in self.errors()))
        self.s['rights_status']='conditional_licence_identified';self.s['last_verified_at']='2026-11-06'
        self.assertTrue(any('not factual' in e for e in self.errors()))

    def test_retrieval_log_rules(self):
        self.assertEqual([],audit.validate_retrieval_log(self.m,log(retrieval()),'x'))
        cases={'source text':retrieval(body='<html>'),'snapshot reference':retrieval(snapshot_location='data/snapshots/x.body'),
               'does not match':retrieval(snapshot_location='snapshot:sv_'+'2'*20+'.body'),
               'failure cannot':retrieval(outcome='http_error',http_status=403,failure_reason='HTTP 403',raw_content_sha256=None,source_version_id=None,fetched_at=None),
               'URL mismatch':retrieval(requested_url='https://example.com/'),'cannot verify':retrieval(last_verified_at='2026-11-06'),
               'differs from its run':retrieval(method='direct_https_get')}
        for needle,rec in cases.items():
            with self.subTest(needle=needle):
                self.assertTrue(any(needle in e for e in audit.validate_retrieval_log(self.m,log(rec),'x')),needle)
        self.assertTrue(audit.validate_retrieval_log(self.m,log(retrieval(source_id='src_000000000000')),'x'))
        self.assertTrue(audit.validate_retrieval_log(self.m,log(retrieval(),retrieval()),'x'))
        bad=log(retrieval());bad['format_version']='1'
        self.assertTrue(audit.validate_retrieval_log(self.m,bad,'x'))


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


class ProxyTransportTests(unittest.TestCase):
    @patch('fetch_metadata.socket.getaddrinfo',side_effect=socket.gaierror())
    def test_proxy_transport_does_not_resolve_locally(self,unused):
        self.assertEqual('https://example.com/',public_url('https://example.com/',resolve=False))
        with self.assertRaises(socket.gaierror):public_url('https://example.com/')

    def test_shape_checks_still_apply_without_resolution(self):
        for u in ['http://example.com','https://localhost','https://x.internal','https://10.0.0.1/','https://[::1]/','https://example.com:8443']:
            with self.subTest(u=u), self.assertRaises(ValueError):public_url(u,resolve=False)

    @patch.dict(os.environ,{'HTTPS_PROXY':'','https_proxy':''})
    def test_proxy_transport_needs_a_configured_proxy(self):
        r=probe({'source_id':'src_1','url':'https://example.com/'},'configured-proxy')
        self.assertEqual('transport_error',r['outcome']);self.assertIsNone(r['source_version_id'])

    @patch.dict(os.environ,{'HTTPS_PROXY':'http://proxy.test:3128'})
    @patch('fetch_metadata.build_opener')
    def test_snapshot_written_once_and_referenced_by_version(self,opener):
        response=opener.return_value.open.return_value.__enter__.return_value
        response.status=200;response.url='https://example.com/'
        response.headers={'Content-Type':'text/html','ETag':'"e1"','Last-Modified':'Thu, 05 Nov 2026 00:00:00 GMT'}
        response.read.return_value=b'<html>fixture</html>'
        with tempfile.TemporaryDirectory() as d:
            r=probe({'source_id':'src_1','url':'https://example.com/'},'configured-proxy',Path(d))
            self.assertEqual('https_get_via_configured_proxy',r['method'])
            self.assertEqual(f"snapshot:{r['source_version_id']}.body",r['snapshot_location'])
            self.assertEqual(b'<html>fixture</html>',(Path(d)/f"{r['source_version_id']}.body").read_bytes())
            self.assertEqual('"e1"',r['etag']);self.assertNotIn('body',r);self.assertIsNone(r['last_verified_at'])

    @patch.dict(os.environ,{'HTTPS_PROXY':'http://proxy.test:3128'})
    @patch('fetch_metadata.build_opener')
    def test_failed_response_writes_no_snapshot(self,opener):
        response=opener.return_value.open.return_value.__enter__.return_value
        response.status=200;response.url='https://example.com/';response.headers={};response.read.return_value=b''
        with tempfile.TemporaryDirectory() as d:
            r=probe({'source_id':'src_1','url':'https://example.com/'},'configured-proxy',Path(d))
            self.assertEqual('empty_body',r['outcome']);self.assertIsNone(r['snapshot_location']);self.assertEqual([],list(Path(d).iterdir()))

    def test_snapshot_folder_must_be_ignored_or_outside_repo(self):
        self.assertFalse(snapshot_dir_allowed(REPO/'data'/'sources'))
        self.assertTrue(snapshot_dir_allowed(REPO/'data'/'snapshots'/'source28'))
        with tempfile.TemporaryDirectory() as d:
            self.assertTrue(snapshot_dir_allowed(Path(d)))

if __name__=='__main__':unittest.main()
