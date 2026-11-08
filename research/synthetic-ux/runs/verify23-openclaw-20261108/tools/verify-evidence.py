#!/usr/bin/env python3
"""Read-only evidence hashes, LFS pointers, trace joins and preview order checks.
Use --hydrated to require actual PNG bytes; without it a canonical pointer is checked against the manifest.
"""
import hashlib,json,re,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
m=json.loads((root/'manifest.json').read_text()); counts={'bytes':0,'pointers':0}
for a in m['files']:
 rel=Path(a['path'])
 if rel.is_absolute() or '..' in rel.parts:raise SystemExit('Unsafe path')
 p=root/rel
 if p.is_symlink() or any(x.is_symlink() for x in p.parents):raise SystemExit('Symlink not permitted')
 b=p.read_bytes();ptr=re.fullmatch(rb'version https://git-lfs.github.com/spec/v1\noid sha256:([a-f0-9]{64})\nsize ([0-9]+)\n',b)
 if ptr:
  if '--hydrated' in sys.argv:raise SystemExit('Unhydrated '+str(rel))
  assert ptr[1].decode()==a['sha256'] and int(ptr[2])==a['bytes'];counts['pointers']+=1
 else:
  assert len(b)==a['bytes'] and hashlib.sha256(b).hexdigest()==a['sha256'],str(rel)
  if p.suffix=='.png':assert b.startswith(b'\x89PNG\r\n\x1a\n')
  counts['bytes']+=1
paths={a['path'] for a in m['files']}
traces=[json.loads(l) for l in (root/'traces.jsonl').read_text().splitlines()]
assert len({(x['session'],x['step']) for x in traces})==len(traces)
for x in traces:assert x['evidence'] in paths
previews=[json.loads(l) for l in (root/'reports/preview-checks-r2.jsonl').read_text().splitlines()]
assert len(previews)==96 and len({(x['name'],x['zoom']) for x in previews})==96
for x in previews:
 f=[t.get('idx') for t in x['trace'] if t['key']=='Tab' and t['tag']!='BODY']
 b=[t.get('idx') for t in x['trace'] if t['key']=='Shift+Tab' and t['tag']!='BODY']
 assert f==x['expected'] and b==list(reversed(x['expected']))[1:],x['name']
 assert x['evidence'] in paths
for theme in ['light','dark']:
 result=json.loads((root/f'reports/zoom-{theme}-r2-result.json').read_text());assert result['status']=='passed-scoped-primed'
print(json.dumps({'files':len(m['files']),**counts,'traces':len(traces),'preview_conditions':len(previews),'result':'PASS'},indent=2))
