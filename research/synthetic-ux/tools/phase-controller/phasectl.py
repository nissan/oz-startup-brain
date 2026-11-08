#!/usr/bin/env python3
"""Client for the facilitator-only phase controller (#42). Talks only to its private Unix socket.

  python phasectl.py SOCKET phase {none,vector_timeout,budget_exhausted,graph_unavailable}
  python phasectl.py SOCKET status
  python phasectl.py SOCKET stop

Prints the controller's JSON reply. Exit status is 0 only when the reply says ok; a phase is ready
for an actor only on exit 0 (the controller has probed the API and found the expected response).
"""
from __future__ import annotations

import json
import socket
import sys

PHASES = ('none', 'vector_timeout', 'budget_exhausted', 'graph_unavailable')


def request(sock_path: str, message: dict, timeout: float = 180.0) -> dict:
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        s.connect(sock_path)
        s.sendall(json.dumps(message).encode() + b'\n')
        buf = b''
        while b'\n' not in buf:
            chunk = s.recv(65536)
            if not chunk:
                break
            buf += chunk
    return json.loads(buf.decode() or '{"ok": false, "error": "no reply"}')


def main(argv: list[str]) -> int:
    usage = __doc__.strip().split('\n\n')[1]
    if len(argv) < 2 or argv[1] not in ('phase', 'status', 'stop') or (argv[1] == 'phase') != (len(argv) == 3):
        print(usage, file=sys.stderr)
        return 2
    if argv[1] == 'phase' and argv[2] not in PHASES:
        print(f'unknown phase {argv[2]!r}; expected one of {", ".join(PHASES)}', file=sys.stderr)
        return 2
    message = {'op': argv[1], **({'phase': argv[2]} if argv[1] == 'phase' else {})}
    try:
        reply = request(argv[0], message)
    except OSError as e:
        print(json.dumps({'ok': False, 'error': f'cannot reach controller socket: {e}'}))
        return 1
    print(json.dumps(reply, indent=2))
    return 0 if reply.get('ok') else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
