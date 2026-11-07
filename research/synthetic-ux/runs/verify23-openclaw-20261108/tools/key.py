#!/usr/bin/env python3
"""Keyboard adapter client; invocation: key.py SESSION OP [VALUE]."""
import json,sys,urllib.request
session,op=sys.argv[1:3]
q={'session':session,'op':op}
if op=='key': q['key']=sys.argv[3]
if op=='type':q['text']=sys.argv[3]
if op=='prepare':q.update(theme=sys.argv[3] if len(sys.argv)>3 else 'light',zoom=float(sys.argv[4]) if len(sys.argv)>4 else 1)
r=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3959',data=json.dumps(q).encode(),headers={'content-type':'application/json'})))
# Full observations persist in traces.jsonl. Compact focus on every key; full text only when requested.
if op in ['snapshot','prepare'] or (op=='key' and sys.argv[3] not in ['Tab','Shift+Tab']):print(json.dumps(r))
else:print(json.dumps({k:r[k] for k in ['step','focus','url','pages','viewport','evidence'] if k in r}))
