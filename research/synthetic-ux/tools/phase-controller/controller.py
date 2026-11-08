#!/usr/bin/env python3
"""Facilitator-only same-page API phase controller for T14/T15 (#42).

Starts one built Next.js web server and one fixture API process on fixed loopback ports with one
in-memory development key. Afterwards it changes only the API process: on each phase request it
stops the API and starts it again with the same port, the same key and the existing guarded harness
fault (OZSB_HARNESS_CONTROLS=enabled, OZSB_HARNESS_ENV=isolated-local-test, loopback host,
OZSB_HARNESS_FAULT=<phase>). The web process, its origin and any page an actor has open stay up.

Phases are requested through a private Unix socket (directory 0700, socket 0600). There is no browser
parameter, header, HTTP route or TCP listener that can change a phase. Before any phase is reported
ready, the controller sends one authenticated probe straight to the API and checks the expected
status, error code and retrieval mode; a mismatch is reported as not ready so no actor is released.

The raw key exists only in this process's memory and in the two child environments. It is never
printed, logged or written to disk, and the controller checks its own replies, its phase log and the
child output for it.

Usage (repository root, after `npm run build`):
  python research/synthetic-ux/tools/phase-controller/controller.py serve --web-port 3120 --api-port 3920 --log PATH.jsonl
  python research/synthetic-ux/tools/phase-controller/phasectl.py SOCKET phase vector_timeout
See README.md in this directory for the full procedure.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import shutil
import signal
import socket
import stat
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parents[4]
HOST = '127.0.0.1'
PHASES = ('none', 'vector_timeout', 'budget_exhausted', 'graph_unavailable')
# Never forwarded to either child: deployment markers and any harness setting from the caller's shell.
STRIPPED_ENV = ('VERCEL', 'VERCEL_ENV', 'NODE_ENV', 'OZSB_HARNESS_CONTROLS', 'OZSB_HARNESS_ENV', 'OZSB_HARNESS_AS_OF',
                'OZSB_HARNESS_FAULT', 'OZSB_DEV_KEYS', 'OZSB_DEV_KEYS_FILE', 'OZSB_API_KEY', 'OZSB_API_BASE_URL')
PROBE_BODY = {'question': 'prototype support', 'confirmed_context': {'jurisdiction': 'QLD', 'stage': 'prototype'}}


class ControllerError(Exception):
    pass


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def make_key() -> tuple[str, str]:
    """A disposable development key and its registry JSON (digest only), in the API's format."""
    key_id = secrets.token_hex(6)
    raw = f'ozsb_{key_id}_{secrets.token_urlsafe(32)}'
    record = {
        'key_id': key_id, 'consumer_id': 'phase-controller',
        'digest_sha256': hashlib.sha256(raw.encode()).hexdigest(),
        'scopes': ['query:execute', 'sources:read', 'capabilities:read'],
        'created_at': now(), 'expires_at': None, 'revoked_at': None,
    }
    return raw, json.dumps([record])


def base_env(env: dict[str, str]) -> dict[str, str]:
    return {k: v for k, v in env.items() if k not in STRIPPED_ENV}


def api_env(env: dict[str, str], port: int, registry: str, phase: str) -> dict[str, str]:
    if phase not in PHASES:
        raise ControllerError(f'unknown phase {phase!r}; expected one of {", ".join(PHASES)}')
    return {**base_env(env), 'PORT': str(port), 'OZSB_HOST': HOST, 'OZSB_DEV_KEYS': registry,
            'OZSB_HARNESS_CONTROLS': 'enabled', 'OZSB_HARNESS_ENV': 'isolated-local-test', 'OZSB_HARNESS_FAULT': phase}


def web_env(env: dict[str, str], api_port: int, raw_key: str) -> dict[str, str]:
    return {**base_env(env), 'OZSB_API_BASE_URL': f'http://{HOST}:{api_port}', 'OZSB_API_KEY': raw_key}


def check_probe(phase: str, status: int, body: object, headers: dict[str, str]) -> tuple[bool, dict]:
    """Compare one probe response with what the phase must produce. Returns (ok, summary).

    The summary holds only status, codes and modes: never the request key or answer text.
    """
    b = body if isinstance(body, dict) else {}
    err = b.get('error') if isinstance(b.get('error'), dict) else {}
    answer = b.get('answer') if isinstance(b.get('answer'), dict) else {}
    warnings = [w.get('code') for w in b.get('warnings', []) if isinstance(w, dict)] if isinstance(b.get('warnings'), list) else []
    summary = {
        'http': status,
        'error_code': err.get('code'),
        'answer_status': b.get('status'),
        'retrieval_mode': b.get('retrieval_mode'),
        'prerequisite_sequence': None if 'prerequisite_sequence' not in answer else ('present' if answer['prerequisite_sequence'] else 'omitted'),
        'warning_codes': warnings,
        'retry_after': headers.get('retry-after'),
    }
    if phase == 'none':
        ok = status == 200 and b.get('status') == 'answer' and b.get('retrieval_mode') == 'fixture' and summary['prerequisite_sequence'] == 'present'
    elif phase == 'vector_timeout':
        ok = status == 504 and err.get('code') == 'retrieval_timeout'
    elif phase == 'budget_exhausted':
        ok = status == 429 and err.get('code') == 'budget_exhausted' and bool(headers.get('retry-after'))
    elif phase == 'graph_unavailable':
        ok = (status == 200 and b.get('status') == 'answer' and b.get('retrieval_mode') == 'fixture_passages_only'
              and summary['prerequisite_sequence'] == 'omitted' and 'graph_unavailable' in warnings)
    else:
        raise ControllerError(f'unknown phase {phase!r}')
    return ok, summary


def port_open(port: int) -> bool:
    """True while something holds the loopback port, judged by whether it can be bound (as the next
    API would need), not by connecting: a listener with a full backlog can refuse or time out a connect."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((HOST, port))
        except OSError:
            return True
        return False


def http_get(url: str, timeout: float = 2.0) -> int:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


class PhaseController:
    """Owns the two child processes and the private control socket. The commands are injectable so
    the restart, readiness and cleanup mechanics can be tested without a build."""

    def __init__(self, web_port: int, api_port: int, log_path: Path | None = None,
                 api_cmd: list[str] | None = None, web_cmd: list[str] | None = None, web_cwd: Path | None = None,
                 env: dict[str, str] | None = None, ready_timeout: float = 30.0, web_ready_path: str = '/'):
        for p in (web_port, api_port):
            if not 1024 <= p <= 65535:
                raise ControllerError('ports must be in 1024–65535')
        if web_port == api_port:
            raise ControllerError('web and API ports must differ')
        self.web_port, self.api_port = web_port, api_port
        self.api_cmd = api_cmd or ['node', str(ROOT / 'apps/api/dist/src/main.js')]
        self.web_cmd = web_cmd or ['node', str(ROOT / 'node_modules/next/dist/bin/next'), 'start', '--port', str(web_port), '--hostname', HOST]
        self.web_cwd = web_cwd or ROOT / 'apps/web'
        self.env = dict(os.environ if env is None else env)
        self.ready_timeout = ready_timeout
        self.web_ready_path = web_ready_path
        self.log_path = log_path
        self._raw_key, self._registry = make_key()
        self.key_id = json.loads(self._registry)[0]['key_id']
        self.private_dir = Path(tempfile.mkdtemp(prefix='ozsb-phase-'))  # mkdtemp creates it 0700
        os.chmod(self.private_dir, 0o700)
        self.socket_path = self.private_dir / 'control.sock'
        self.api: subprocess.Popen | None = None
        self.web: subprocess.Popen | None = None
        self.phase: str | None = None
        self.api_starts = 0
        self._lock = threading.Lock()
        self._server: socket.socket | None = None
        self._stopping = threading.Event()
        self._outputs: list[Path] = []

    # ---- child processes -------------------------------------------------------------------
    def _spawn(self, name: str, cmd: list[str], env: dict[str, str], cwd: Path | None) -> subprocess.Popen:
        out = self.private_dir / f'{name}.log'
        if out not in self._outputs:
            self._outputs.append(out)
        fh = os.fdopen(os.open(out, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600), 'ab')
        try:
            return subprocess.Popen(cmd, env=env, cwd=cwd, stdin=subprocess.DEVNULL, stdout=fh, stderr=subprocess.STDOUT, start_new_session=True)
        finally:
            fh.close()

    @staticmethod
    def _signal_group(pgid: int, sig: int) -> bool:
        """Signals the process group this controller created (start_new_session makes the child's PID its
        group ID). Returns False once no member of that group exists. Never targets a process by port."""
        try:
            os.killpg(pgid, sig)
            return True
        except ProcessLookupError:
            return False
        except PermissionError:  # not ours to signal: report as still present, never escalate elsewhere
            return True

    @classmethod
    def _terminate(cls, proc: subprocess.Popen | None, grace: float = 10.0) -> None:
        """Stops the whole owned process group, including members that outlive an exited leader:
        SIGTERM, then SIGKILL after `grace` seconds, then a bounded wait for the group to disappear."""
        if proc is None:
            return
        pgid = proc.pid

        def gone() -> bool:
            proc.poll()  # reap the leader so a zombie leader does not count as a live member
            return proc.returncode is not None and not cls._signal_group(pgid, 0)

        if gone():
            return
        for sig, wait in ((signal.SIGTERM, grace), (signal.SIGKILL, 5.0)):
            cls._signal_group(pgid, sig)
            deadline = time.monotonic() + wait
            while time.monotonic() < deadline:
                if gone():
                    return
                time.sleep(0.05)

    def _wait(self, what: str, ready: Callable[[], bool], proc: subprocess.Popen) -> None:
        deadline = time.monotonic() + self.ready_timeout
        while True:
            if proc.poll() is not None:
                raise ControllerError(f'{what} exited during startup with status {proc.returncode}')
            try:
                if ready():
                    return
            except (OSError, urllib.error.URLError):
                pass
            if time.monotonic() > deadline:
                raise ControllerError(f'{what} was not ready within {self.ready_timeout:g} s')
            time.sleep(0.15)

    def probe(self) -> tuple[int, object, dict[str, str]]:
        req = urllib.request.Request(f'http://{HOST}:{self.api_port}/v1/queries', data=json.dumps(PROBE_BODY).encode(), method='POST',
                                     headers={'content-type': 'application/json', 'accept': 'application/json', 'x-api-key': self._raw_key})
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read() or b'null'), {k.lower(): v for k, v in r.headers.items()}
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                body = json.loads(raw or b'null')
            except ValueError:
                body = None
            return e.code, body, {k.lower(): v for k, v in e.headers.items()}

    def _start_api(self, phase: str) -> None:
        env = api_env(self.env, self.api_port, self._registry, phase)
        deadline = time.monotonic() + self.ready_timeout
        while port_open(self.api_port):  # the previous API (or something else) still holds the port
            if time.monotonic() > deadline:
                raise ControllerError(f'API port {self.api_port} is still in use')
            time.sleep(0.1)
        self.api = self._spawn('api', self.api_cmd, env, ROOT)
        self.api_starts += 1
        self._wait('API', lambda: http_get(f'http://{HOST}:{self.api_port}/health/live') == 200, self.api)

    def set_phase(self, phase: str) -> dict:
        if phase not in PHASES:
            raise ControllerError(f'unknown phase {phase!r}; expected one of {", ".join(PHASES)}')
        with self._lock:
            web_pid = self.web.pid if self.web else None
            if self.web is None or self.web.poll() is not None:
                raise ControllerError('web process is not running; stop and start a new session')
            self._terminate(self.api)
            self.phase = None
            self._start_api(phase)
            status, body, headers = self.probe()
            ok, summary = check_probe(phase, status, body, headers)
            self.phase = phase if ok else None
            web_same = self.web.poll() is None and self.web.pid == web_pid
            result = {'ok': ok and web_same, 'op': 'phase', 'phase': phase, 'api_pid': self.api.pid, 'api_starts': self.api_starts,
                      'web_pid': self.web.pid, 'web_preserved': web_same, 'api_port': self.api_port, 'key_id': self.key_id, 'probe': summary}
            if not ok:
                result['reason'] = 'probe did not match the expected response for this phase; do not release an actor'
            self._log({'event': 'phase', **result})
            return result

    def start(self, first_phase: str = 'none') -> dict:
        if port_open(self.web_port):
            raise ControllerError(f'web port {self.web_port} is already in use')
        if port_open(self.api_port):
            raise ControllerError(f'API port {self.api_port} is already in use')
        self._start_api(first_phase)
        status, body, headers = self.probe()
        ok, summary = check_probe(first_phase, status, body, headers)
        if not ok:
            raise ControllerError(f'initial {first_phase} probe did not match: {json.dumps(summary)}')
        self.phase = first_phase
        self.web = self._spawn('web', self.web_cmd, web_env(self.env, self.api_port, self._raw_key), self.web_cwd)
        self._wait('web', lambda: http_get(f'http://{HOST}:{self.web_port}{self.web_ready_path}') == 200, self.web)
        result = {'ok': True, 'op': 'start', 'phase': first_phase, 'socket': str(self.socket_path), 'web_url': f'http://{HOST}:{self.web_port}/',
                  'api_port': self.api_port, 'api_pid': self.api.pid, 'web_pid': self.web.pid, 'key_id': self.key_id, 'probe': summary}
        self._log({'event': 'start', **result})
        return result

    def status(self) -> dict:
        return {'ok': True, 'op': 'status', 'phase': self.phase, 'api_pid': self.api.pid if self.api else None,
                'api_running': bool(self.api and self.api.poll() is None), 'api_starts': self.api_starts,
                'web_pid': self.web.pid if self.web else None, 'web_running': bool(self.web and self.web.poll() is None),
                'api_port': self.api_port, 'web_port': self.web_port, 'key_id': self.key_id}

    # ---- secrecy checks ------------------------------------------------------------------------
    def key_leaks(self) -> list[str]:
        """Files this controller wrote or captured that contain the raw key (expected: none)."""
        paths = list(self._outputs) + ([self.log_path] if self.log_path else [])
        token = self._raw_key.encode()
        return [p.name for p in paths if p.exists() and token in p.read_bytes()]

    def _log(self, record: dict) -> None:
        line = json.dumps({'at': now(), **record}, sort_keys=True)
        if self._raw_key in line:
            raise ControllerError('refusing to write a log line that contains the raw key')
        if self.log_path:
            self.log_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.log_path, 'a', encoding='utf-8') as fh:
                fh.write(line + '\n')

    # ---- control socket ------------------------------------------------------------------------
    def handle(self, line: str) -> dict:
        try:
            msg = json.loads(line)
            if not isinstance(msg, dict):
                raise ValueError
        except ValueError:
            return {'ok': False, 'error': 'expected one JSON object per line'}
        op = msg.get('op')
        try:
            if op == 'phase':
                return self.set_phase(str(msg.get('phase')))
            if op == 'status':
                return self.status()
            if op == 'stop':
                self._stopping.set()
                return {'ok': True, 'op': 'stop'}
            return {'ok': False, 'error': f'unknown op {op!r}; expected phase, status or stop'}
        except ControllerError as e:
            self._log({'event': 'error', 'op': op, 'error': str(e)})
            return {'ok': False, 'op': op, 'error': str(e)}

    def _reply(self, conn: socket.socket, reply: dict) -> None:
        text = json.dumps(reply)
        if self._raw_key in text:
            text = json.dumps({'ok': False, 'error': 'reply withheld: it contained the raw key'})
        conn.sendall(text.encode() + b'\n')

    def open_socket(self) -> None:
        old = os.umask(0o177)
        try:
            srv = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            srv.bind(str(self.socket_path))
        finally:
            os.umask(old)
        os.chmod(self.socket_path, 0o600)
        srv.listen(4)
        srv.settimeout(0.5)
        self._server = srv

    def serve_forever(self) -> None:
        assert self._server is not None
        while not self._stopping.is_set():
            if self.web is not None and self.web.poll() is not None:
                self._log({'event': 'web_exited', 'status': self.web.returncode})
                break
            try:
                conn, _ = self._server.accept()
            except socket.timeout:
                continue
            except OSError:  # the socket was closed by stop()
                break
            with conn:
                conn.settimeout(120)
                buf = b''
                try:
                    while b'\n' not in buf:
                        chunk = conn.recv(4096)
                        if not chunk:
                            break
                        buf += chunk
                        if len(buf) > 4096:
                            break
                    if buf.strip():
                        self._reply(conn, self.handle(buf.split(b'\n', 1)[0].decode('utf-8', 'replace')))
                except OSError:
                    continue

    def stop(self) -> dict:
        self._stopping.set()
        self._terminate(self.api)
        self._terminate(self.web)
        if self._server is not None:
            self._server.close()
        leaks = self.key_leaks()
        deadline = time.monotonic() + 5
        while (port_open(self.api_port) or port_open(self.web_port)) and time.monotonic() < deadline:
            time.sleep(0.1)
        api_free, web_free = not port_open(self.api_port), not port_open(self.web_port)
        # Success needs no key in any output and both fixed ports released for the next session. A port
        # still held after the owned groups are gone belongs to something else: report it, never kill it.
        result = {'ok': not leaks and api_free and web_free, 'op': 'cleanup', 'raw_key_found_in': leaks,
                  'api_port_free': api_free, 'web_port_free': web_free}
        self._log({'event': 'cleanup', **result})
        shutil.rmtree(self.private_dir, ignore_errors=True)
        self._raw_key = ''
        return result


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('serve', help='start web + API and accept phase requests on a private socket')
    s.add_argument('--web-port', type=int, required=True)
    s.add_argument('--api-port', type=int, required=True)
    s.add_argument('--log', type=Path, help='append phase records (no key, no answer text) to this JSONL file')
    s.add_argument('--ready-timeout', type=float, default=60.0)
    args = ap.parse_args(argv)
    for built in (ROOT / 'apps/api/dist/src/main.js', ROOT / 'apps/web/.next/BUILD_ID'):
        if not built.exists():
            print(json.dumps({'ok': False, 'error': f'missing {built.relative_to(ROOT)}; run `npm run build` first'}), flush=True)
            return 2
    ctl = PhaseController(args.web_port, args.api_port, log_path=args.log, ready_timeout=args.ready_timeout)

    def on_signal(signum, _frame):
        ctl._stopping.set()
    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, on_signal)
    code = 0
    try:
        ctl.open_socket()
        print(json.dumps(ctl.start()), flush=True)
        ctl.serve_forever()
        if ctl.web is not None and ctl.web.poll() is not None:
            print(json.dumps({'ok': False, 'error': f'web process exited with status {ctl.web.returncode}'}), flush=True)
            code = 1
    except ControllerError as e:
        print(json.dumps({'ok': False, 'error': str(e)}), flush=True)
        code = 1
    finally:
        result = ctl.stop()
        print(json.dumps(result), flush=True)
        if not result['ok']:
            code = code or 3
    return code


if __name__ == '__main__':
    sys.exit(main())
