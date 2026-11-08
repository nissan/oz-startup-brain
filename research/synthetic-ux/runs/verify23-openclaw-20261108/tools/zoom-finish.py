"""Primed keyboard regression on actual Chrome tab zoom, not a synthetic actor."""
import json,urllib.request,re,sys
from pathlib import Path
root=Path(__file__).resolve().parent.parent
sid='zoom-'+sys.argv[1]+'-r2';theme=sys.argv[1]
def do(op,**kw):
 q=dict(session=sid,op=op,**kw)
 r=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3959',data=json.dumps(q).encode())))
 return r
def key(k):return do('key',key=k)
def tabto(pattern,back=False):
 for _ in range(65):
  r=key('Shift+Tab' if back else 'Tab');f=r['focus'];label=f.get('label') or f.get('id') or f.get('text') or (('radio:'+str(f.get('value'))) if f.get('tag')=='INPUT' else '')
  if re.search(pattern,label):return r
 raise RuntimeError('Keyboard target not reached: '+pattern)
def note(name,r):
 with (root/'reports'/'zoom-checkpoints.jsonl').open('a') as f:f.write(json.dumps(dict(session=sid,checkpoint=name,step=r['step'],evidence=r['evidence'],focus=r['focus'],viewport=r['viewport'],zoom=r['zoom']))+'\n')
 print(name,r['step'],r['focus'].get('label') or r['focus'].get('text'),flush=True)
try:
 tabto('^question$');key('Meta+a');do('type',text='What does round A2 require today?');r=key('Control+Enter');assert 'Round A2' in r['text'];note('a2-answer-cards',r)
 tabto('Show evidence for step 1:');r=key('Enter');assert r['focus']['id']=='evidence-heading-step';note('step-evidence-open',r)
 r=key('Tab');assert r['focus']['tag']=='A';r=key('Enter');assert 'LOCAL FICTIONAL PUBLISHER FIXTURE' in r['text'];note('publisher-popup',r)
 r=key('Meta+w');assert r['url']=='http://127.0.0.1:3140/';note('publisher-return',r)
 tabto('Hide evidence for step 1:',back=True);r=key('Enter');assert 'For Step 1:' not in r['text'];note('step-evidence-closed',r)
 r=do('snapshot');assert r['viewport']['scrollWidth']<=r['viewport']['innerWidth'];note('final-no-horizontal-overflow',r)
 (root/'reports'/f'{sid}-result.json').write_text(json.dumps({'status':'passed-scoped-primed','theme':theme,'final_step':r['step'],'screen_reader':False},indent=2))
except Exception as e:
 (root/'reports'/f'{sid}-result.json').write_text(json.dumps({'status':'failed-or-incomplete','error':str(e)},indent=2));raise
