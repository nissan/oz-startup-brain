#!/usr/bin/env python3
"""Test double for the controller's regression tests: stands in for the fixture API or the web server
so restart, readiness, secrecy and cleanup mechanics run without `npm run build`. Not used in a session.

  fake_service.py api   (PORT, OZSB_HARNESS_FAULT, OZSB_DEV_KEYS from the environment)
  fake_service.py web PORT   (OZSB_API_KEY from the environment; FAKE_LEAK_KEY=1 prints it)
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MODE = sys.argv[1]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def send(self, status: int, body: object, headers: dict[str, str] | None = None) -> None:
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('content-type', 'application/json')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header('content-length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if MODE == 'web' and self.path == '/':
            return self.send(200, {'page': 'fake'})
        if MODE == 'api' and self.path == '/health/live':
            return self.send(200, {'status': 'ok'})
        self.send(404, {'error': {'code': 'not_found'}})

    def do_POST(self):
        self.rfile.read(int(self.headers.get('content-length') or 0))
        if MODE != 'api' or self.path != '/v1/queries':
            return self.send(404, {'error': {'code': 'not_found'}})
        digests = {r['digest_sha256'] for r in json.loads(os.environ['OZSB_DEV_KEYS'])}
        if hashlib.sha256((self.headers.get('x-api-key') or '').encode()).hexdigest() not in digests:
            return self.send(401, {'error': {'code': 'unauthenticated'}})
        fault = os.environ.get('OZSB_HARNESS_FAULT', 'none')
        override = os.environ.get('FAKE_WRONG_RESPONSE')
        if override == fault:  # simulate a phase whose probe does not match
            return self.send(200, {'status': 'answer', 'retrieval_mode': 'fixture', 'answer': {'prerequisite_sequence': [1]}, 'warnings': []})
        if fault == 'vector_timeout':
            return self.send(504, {'error': {'code': 'retrieval_timeout'}})
        if fault == 'budget_exhausted':
            return self.send(429, {'error': {'code': 'budget_exhausted', 'retry_after_seconds': 3600}}, {'Retry-After': '3600'})
        graph = fault != 'graph_unavailable'
        self.send(200, {'status': 'answer', 'retrieval_mode': 'fixture' if graph else 'fixture_passages_only',
                        'answer': {'prerequisite_sequence': [{'position': 1}] if graph else None},
                        'warnings': [{'code': 'fixture_corpus'}] + ([] if graph else [{'code': 'graph_unavailable'}])})


if __name__ == '__main__':
    port = int(os.environ['PORT']) if MODE == 'api' else int(sys.argv[2])
    if MODE == 'web' and os.environ.get('FAKE_LEAK_KEY') == '1':
        print(f"debug key={os.environ.get('OZSB_API_KEY')}", flush=True)
    if MODE == 'api':
        print(f"fake api fault={os.environ.get('OZSB_HARNESS_FAULT')} controls={os.environ.get('OZSB_HARNESS_CONTROLS')} "
              f"env={os.environ.get('OZSB_HARNESS_ENV')} host={os.environ.get('OZSB_HOST')}", flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
