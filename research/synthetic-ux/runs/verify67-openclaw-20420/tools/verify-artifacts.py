#!/usr/bin/env python3
"""Verify committed-cohort byte hashes or canonical LFS OID/size joins."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'manifest.json').read_text())
for a in m['artifacts']:
 p=root/a['path']; b=p.read_bytes()
 if b.startswith(b'version https://git-lfs.github.com/spec/v1\n'):
  assert b.decode()==f"version https://git-lfs.github.com/spec/v1\noid sha256:{a['sha256']}\nsize {a['bytes']}\n",a['path']
 else: assert len(b)==a['bytes'] and hashlib.sha256(b).hexdigest()==a['sha256'],a['path']
 subprocess.run(['git','ls-files','--error-unmatch',str(p)],check=True,stdout=subprocess.DEVNULL)
print(f"PASS {len(m['artifacts'])} tracked artifact joins (byte or canonical pointer mode)")
