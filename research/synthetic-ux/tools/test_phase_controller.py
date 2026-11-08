"""Regression tests for the facilitator-only phase controller (#42).

The mechanics tests drive the real controller against fake_service.py stand-ins, so they need no
build and run in the persona-pack CI job. The browser test runs the real built web and API through
browser_check.py; it is skipped unless OZSB_PHASE_BROWSER=1, the build exists and Python Playwright is
installed (CI's persona-pack job has none of these, so CI never claims a browser result).
"""
from __future__ import annotations

import importlib.util
import json
import os
import socket
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent / 'phase-controller'
sys.path.insert(0, str(HERE))
import controller as C  # noqa: E402
import phasectl  # noqa: E402

FAKE = [sys.executable, str(HERE / 'fake_service.py')]


def free_port() -> int:
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


class ProbeExpectations(unittest.TestCase):
    ok_answer = {'status': 'answer', 'retrieval_mode': 'fixture', 'answer': {'prerequisite_sequence': [{'position': 1}]}, 'warnings': [{'code': 'fixture_corpus'}]}
    graph = {'status': 'answer', 'retrieval_mode': 'fixture_passages_only', 'answer': {'prerequisite_sequence': None}, 'warnings': [{'code': 'graph_unavailable'}]}

    def test_each_phase_accepts_only_its_own_response(self):
        cases = {
            'none': (200, self.ok_answer, {}),
            'vector_timeout': (504, {'error': {'code': 'retrieval_timeout'}}, {}),
            'budget_exhausted': (429, {'error': {'code': 'budget_exhausted'}}, {'retry-after': '3600'}),
            'graph_unavailable': (200, self.graph, {}),
        }
        for phase in C.PHASES:
            for other, response in cases.items():
                with self.subTest(phase=phase, response=other):
                    self.assertEqual(C.check_probe(phase, *response)[0], phase == other)

    def test_graph_degradation_is_not_interchangeable_with_errors(self):
        self.assertFalse(C.check_probe('graph_unavailable', 200, {**self.graph, 'answer': {'prerequisite_sequence': [{'position': 1}]}}, {})[0])
        self.assertFalse(C.check_probe('graph_unavailable', 200, {**self.graph, 'warnings': []}, {})[0])
        self.assertFalse(C.check_probe('budget_exhausted', 429, {'error': {'code': 'budget_exhausted'}}, {})[0], 'Retry-After is required')
        self.assertFalse(C.check_probe('budget_exhausted', 429, {'error': {'code': 'concurrency_limited'}}, {'retry-after': '1'})[0])
        self.assertFalse(C.check_probe('vector_timeout', 504, None, {})[0])

    def test_unknown_phase_is_rejected(self):
        with self.assertRaises(C.ControllerError):
            C.check_probe('down', 200, {}, {})
        with self.assertRaises(C.ControllerError):
            C.api_env({}, 3000, '[]', 'down')


class Environments(unittest.TestCase):
    def test_api_env_uses_existing_guards_and_drops_caller_overrides(self):
        caller = {'PATH': '/bin', 'VERCEL': '1', 'NODE_ENV': 'production', 'OZSB_HARNESS_ENV': 'prod', 'OZSB_HARNESS_AS_OF': 'x',
                  'OZSB_DEV_KEYS_FILE': 'k.json', 'OZSB_API_KEY': 'stray'}
        env = C.api_env(caller, 3999, '[]', 'vector_timeout')
        self.assertEqual(env['OZSB_HARNESS_CONTROLS'], 'enabled')
        self.assertEqual(env['OZSB_HARNESS_ENV'], 'isolated-local-test')
        self.assertEqual(env['OZSB_HOST'], '127.0.0.1')
        self.assertEqual(env['OZSB_HARNESS_FAULT'], 'vector_timeout')
        self.assertEqual(env['PORT'], '3999')
        for k in ('VERCEL', 'NODE_ENV', 'OZSB_HARNESS_AS_OF', 'OZSB_DEV_KEYS_FILE', 'OZSB_API_KEY'):
            self.assertNotIn(k, env)
        self.assertEqual(env['PATH'], '/bin')

    def test_web_env_carries_the_key_but_no_harness_setting(self):
        env = C.web_env({'OZSB_HARNESS_FAULT': 'vector_timeout', 'OZSB_HARNESS_CONTROLS': 'enabled'}, 3999, 'ozsb_x_y')
        self.assertEqual(env, {'OZSB_API_BASE_URL': 'http://127.0.0.1:3999', 'OZSB_API_KEY': 'ozsb_x_y'})

    def test_key_matches_the_registry_digest(self):
        import hashlib
        raw, registry = C.make_key()
        record = json.loads(registry)[0]
        self.assertTrue(raw.startswith(f"ozsb_{record['key_id']}_"))
        self.assertEqual(record['digest_sha256'], hashlib.sha256(raw.encode()).hexdigest())
        self.assertNotIn(raw, registry)

    def test_ports_are_validated(self):
        for web, api in ((80, 3000), (3000, 3000), (3000, 70000)):
            with self.assertRaises(C.ControllerError):
                C.PhaseController(web, api)


class ControllerMechanics(unittest.TestCase):
    """The real controller, with fake API/web children."""

    def make(self, **env) -> C.PhaseController:
        self.web_port, self.api_port = free_port(), free_port()
        self.log = Path(tempfile.mkdtemp()) / 'phases.jsonl'
        ctl = C.PhaseController(self.web_port, self.api_port, log_path=self.log, api_cmd=[*FAKE, 'api'],
                                web_cmd=[*FAKE, 'web', str(self.web_port)], web_cwd=HERE, env={**os.environ, **env}, ready_timeout=15)
        self.addCleanup(lambda: ctl.private_dir.exists() and ctl.stop())
        return ctl

    def ask(self, ctl: C.PhaseController, msg: dict) -> dict:
        return phasectl.request(str(ctl.socket_path), msg, timeout=60)

    def serve(self, ctl: C.PhaseController):
        import threading
        ctl.open_socket()
        start = ctl.start()
        t = threading.Thread(target=ctl.serve_forever, daemon=True)
        t.start()
        return start, t

    def test_phase_cycle_restarts_only_the_api_on_the_same_port_and_key(self):
        ctl = self.make()
        start, t = self.serve(ctl)
        self.assertTrue(start['ok'])
        pids = {start['api_pid']}
        for phase in ('vector_timeout', 'none', 'budget_exhausted', 'none', 'graph_unavailable', 'none'):
            with self.subTest(phase=phase):
                r = self.ask(ctl, {'op': 'phase', 'phase': phase})
                self.assertTrue(r['ok'], r)
                self.assertEqual(r['phase'], phase)
                self.assertEqual(r['web_pid'], start['web_pid'])
                self.assertTrue(r['web_preserved'])
                self.assertEqual((r['api_port'], r['key_id']), (self.api_port, start['key_id']))
                self.assertNotIn(r['api_pid'], pids, 'a new API process per phase')
                pids.add(r['api_pid'])
        status = self.ask(ctl, {'op': 'status'})
        self.assertEqual((status['phase'], status['api_starts'], status['web_running']), ('none', 7, True))
        self.assertEqual(self.ask(ctl, {'op': 'stop'}), {'ok': True, 'op': 'stop'})
        t.join(10)
        cleanup = ctl.stop()
        self.assertEqual(cleanup, {'ok': True, 'op': 'cleanup', 'raw_key_found_in': [], 'api_port_free': True, 'web_port_free': True})
        self.assertFalse(ctl.private_dir.exists())
        events = [json.loads(x)['event'] for x in self.log.read_text().splitlines()]
        self.assertEqual(events, ['start'] + ['phase'] * 6 + ['cleanup'])

    def test_api_child_receives_the_guarded_harness_env(self):
        ctl = self.make()
        self.serve(ctl)
        self.assertTrue(self.ask(ctl, {'op': 'phase', 'phase': 'budget_exhausted'})['ok'])
        api_log = (ctl.private_dir / 'api.log').read_text()
        self.assertIn('fault=budget_exhausted controls=enabled env=isolated-local-test host=127.0.0.1', api_log)

    def test_mismatched_probe_is_not_ready(self):
        ctl = self.make(FAKE_WRONG_RESPONSE='vector_timeout')
        self.serve(ctl)
        r = self.ask(ctl, {'op': 'phase', 'phase': 'vector_timeout'})
        self.assertFalse(r['ok'])
        self.assertIn('do not release an actor', r['reason'])
        self.assertIsNone(self.ask(ctl, {'op': 'status'})['phase'])
        self.assertTrue(self.ask(ctl, {'op': 'phase', 'phase': 'none'})['ok'], 'a later phase can still recover')

    def test_socket_is_private_and_rejects_bad_requests(self):
        ctl = self.make()
        self.serve(ctl)
        self.assertEqual(stat.S_IMODE(os.stat(ctl.private_dir).st_mode), 0o700)
        self.assertEqual(stat.S_IMODE(os.stat(ctl.socket_path).st_mode), 0o600)
        self.assertTrue(stat.S_ISSOCK(os.stat(ctl.socket_path).st_mode))
        for name in ('api.log', 'web.log'):
            self.assertEqual(stat.S_IMODE(os.stat(ctl.private_dir / name).st_mode), 0o600)
        self.assertFalse(self.ask(ctl, {'op': 'phase', 'phase': 'down'})['ok'])
        self.assertFalse(self.ask(ctl, {'op': 'reload'})['ok'])
        with socket.socket(socket.AF_UNIX) as s:
            s.connect(str(ctl.socket_path))
            s.sendall(b'not json\n')
            self.assertFalse(json.loads(s.recv(4096))['ok'])

    def test_control_channel_is_a_unix_socket_only(self):
        """The controller's only listener is AF_UNIX; phases cannot be reached over TCP/HTTP."""
        ctl = self.make()
        self.serve(ctl)
        self.assertEqual(ctl._server.family, socket.AF_UNIX)

    def test_replies_and_log_never_contain_the_raw_key(self):
        ctl = self.make()
        start, _ = self.serve(ctl)
        raw = ctl._raw_key
        replies = [start] + [self.ask(ctl, {'op': 'phase', 'phase': p}) for p in C.PHASES] + [self.ask(ctl, {'op': 'status'})]
        self.assertNotIn(raw, json.dumps(replies))
        self.assertNotIn(raw, self.log.read_text())
        self.assertEqual(ctl.key_leaks(), [])

    def test_log_and_reply_guards_refuse_the_raw_key(self):
        ctl = self.make()
        with self.assertRaises(C.ControllerError):
            ctl._log({'event': 'oops', 'detail': ctl._raw_key})
        self.assertFalse(self.log.exists(), 'nothing written')

        class Conn:
            sent = b''

            def sendall(self, data):
                Conn.sent += data
        ctl._reply(Conn(), {'ok': True, 'detail': ctl._raw_key})
        self.assertNotIn(ctl._raw_key.encode(), Conn.sent)
        self.assertIn(b'reply withheld', Conn.sent)

    def test_a_child_that_prints_the_key_fails_cleanup(self):
        ctl = self.make(FAKE_LEAK_KEY='1')
        self.serve(ctl)
        cleanup = ctl.stop()
        self.assertFalse(cleanup['ok'])
        self.assertEqual(cleanup['raw_key_found_in'], ['web.log'])
        self.assertNotIn('ozsb_', self.log.read_text(), 'the phase log names the file, never the key')

    def test_busy_port_refuses_to_start(self):
        ctl = self.make()
        with socket.socket() as s:
            s.bind(('127.0.0.1', self.web_port))
            s.listen(1)
            with self.assertRaises(C.ControllerError):
                ctl.start()

    def test_web_exit_is_reported_instead_of_restarting_it(self):
        ctl = self.make()
        self.serve(ctl)
        ctl._terminate(ctl.web)
        with self.assertRaisesRegex(C.ControllerError, 'web process is not running'):
            ctl.set_phase('vector_timeout')


class PhasectlCli(unittest.TestCase):
    def test_usage_and_phase_validation(self):
        self.assertEqual(phasectl.main([]), 2)
        self.assertEqual(phasectl.main(['/x', 'phase']), 2)
        self.assertEqual(phasectl.main(['/x', 'phase', 'down']), 2)
        self.assertEqual(phasectl.main(['/x', 'status', 'extra']), 2)

    def test_unreachable_socket_is_not_ok(self):
        self.assertEqual(phasectl.main([str(Path(tempfile.mkdtemp()) / 'missing.sock'), 'status']), 1)


BUILT = (C.ROOT / 'apps/api/dist/src/main.js').exists() and (C.ROOT / 'apps/web/.next/BUILD_ID').exists()


@unittest.skipUnless(os.environ.get('OZSB_PHASE_BROWSER') == '1' and BUILT and importlib.util.find_spec('playwright'),
                     'browser check needs OZSB_PHASE_BROWSER=1, `npm run build` and Python Playwright')
class BrowserCheck(unittest.TestCase):
    def test_three_variants_on_mounted_pages(self):
        out = Path(tempfile.mkdtemp(prefix='phase-browser-'))
        p = subprocess.run([sys.executable, str(HERE / 'browser_check.py'), '--out', str(out),
                            '--web-port', str(free_port()), '--api-port', str(free_port())], capture_output=True, text=True, timeout=900)
        report = json.loads((out / 'report.json').read_text())
        self.assertEqual(p.returncode, 0, report.get('error'))
        self.assertEqual(sorted(report['variants']), sorted(['vector_timeout', 'budget_exhausted', 'graph_unavailable']))
        for v in report['variants'].values():
            self.assertTrue(v['ok'] and v['same_mounted_page'])
            self.assertEqual(len(v['document_loads']), 1)
        self.assertTrue(report['cleanup']['ok'])


if __name__ == '__main__':
    unittest.main()
