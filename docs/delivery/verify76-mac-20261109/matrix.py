import urllib.request,json,subprocess,time
from pathlib import Path
root=Path(__file__).parent

def run(src):
 r=json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:3958',data=src.encode()),timeout=50))
 if not r['ok']:raise RuntimeError(r['error'])
 return r.get('value')
def menu(item):
 p=subprocess.run(['osascript','-e',f'tell application "System Events" to tell (first application process whose unix id is 27690) to click menu item "{item}" of menu "View" of menu bar 1'],capture_output=True,text=True,timeout=8)
 with (root/'menu.jsonl').open('a') as f:f.write(json.dumps({'item':item,'exit':p.returncode,'out':p.stdout,'err':p.stderr})+'\n')
 if p.returncode:raise RuntimeError(p.stderr)

for mode,theme in [('desktop100','dark'),('desktop200','light'),('desktop200','dark'),('phone100','light'),('phone100','dark')]:
 name=mode+'-'+theme
 try:
  run("await page.goto('http://127.0.0.1:3110');await page.evaluate(t=>localStorage.setItem('osb-theme',t),"+json.dumps(theme)+");await page.reload();return true;")
  menu('Actual Size')
  if mode=='desktop200':
   for _ in range(5):menu('Zoom In')
  if mode=='phone100':run("await page.setViewportSize({width:390,height:844});return true;")
  geo=run("return await page.evaluate(()=>({innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth}));")
  assert geo['dpr']==(2 if mode=='desktop200' else 1),geo
  if mode.startswith('desktop'):assert geo['innerWidth']==(720 if mode=='desktop200' else 1440),geo
  src="""
const assert=require('assert');const notes=[];
await page.getByLabel('Your question').fill('What should I do next for support?');await page.getByRole('button',{name:'Ask the planner',exact:true}).click();await page.getByRole('button',{name:'Queensland',exact:true}).click();await page.locator('#results-heading').filter({hasText:'Your next steps'}).waitFor();
await page.getByRole('button',{name:/Stage: Not set/}).click();await page.getByRole('radio',{name:'Working prototype',exact:true}).focus();await page.keyboard.press('Space');await page.getByRole('button',{name:'Save stage',exact:true}).click();await page.getByRole('button',{name:/Stage: Working prototype/}).waitFor();
await page.waitForTimeout(200);
const summary=await page.locator('.summary').innerText(),footer=await page.locator('.footer-line').innerText();
const triggers=page.getByRole('article').getByRole('button',{name:'Show supporting passage',exact:true});const panel=page.locator('.evidence-panel:visible');
await triggers.first().focus();await page.keyboard.press('Enter');await panel.locator('h2').evaluate(e=>new Promise(r=>{const f=()=>document.activeElement===e?r():requestAnimationFrame(f);f()}));
const close=panel.getByRole('button',{name:'Close evidence',exact:true});await close.scrollIntoViewIfNeeded();const rect=await close.boundingBox();assert(rect.width>0&&rect.x>=0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));notes.push({check:'open-close-layout',rect});
const cdp=await context.newCDPSession(page);let shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false,captureBeyondViewport:false});fs.writeFileSync(OUT+'-open.png',Buffer.from(shot.data,'base64'));
await page.getByLabel('Your question').focus();await page.keyboard.press('Escape');assert(await panel.count()===1);notes.push({check:'outside-escape-retains',pass:true});
await triggers.first().focus();await page.keyboard.press('Enter');await panel.locator('h2').evaluate(e=>new Promise(r=>{const f=()=>document.activeElement===e?r():requestAnimationFrame(f);f()}));await page.keyboard.press('Tab');assert(await close.evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');assert(await page.locator('.evidence-panel').count()===0);assert(await triggers.first().evaluate(e=>e===document.activeElement));notes.push({check:'close-enter-first-focus',pass:true});
shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false,captureBeyondViewport:false});fs.writeFileSync(OUT+'-closed.png',Buffer.from(shot.data,'base64'));await cdp.detach();
await triggers.nth(1).focus();await page.keyboard.press('Enter');await panel.locator('h2').evaluate(e=>new Promise(r=>{const f=()=>document.activeElement===e?r():requestAnimationFrame(f);f()}));const link=panel.locator('.osb-source a').first();await link.focus();const pp=page.waitForEvent('popup');await page.keyboard.press('Enter');const pop=await pp;await pop.waitForLoadState('domcontentloaded').catch(()=>{});notes.push({check:'source-popup',url:pop.url(),title:await pop.title().catch(()=>''),note:'Unintercepted fictional.invalid navigation; failure is not publisher validation'});await pop.close();await page.bringToFront();await link.focus();await page.keyboard.press('Escape');assert(await page.locator('.evidence-panel').count()===0);assert(await triggers.nth(1).evaluate(e=>e===document.activeElement));assert(await page.locator('.summary').innerText()===summary);assert(await page.locator('.footer-line').innerText()===footer);assert(await page.getByLabel('Your question').inputValue()==='What should I do next for support?');notes.push({check:'different-action-source-return-escape-state',pass:true});
const step=page.getByRole('button',{name:/^Show evidence for step 2: Suggested next step: check IP ownership$/});await step.focus();await page.keyboard.press('Enter');const sp=page.locator('.evidence-panel--step');assert((await sp.innerText()).includes('Excerpt not shown: this source is not cleared'));await page.keyboard.press('Escape');assert(await sp.count()===1);await page.getByRole('button',{name:/^Hide evidence for step 2: Suggested next step: check IP ownership$/}).focus();await page.keyboard.press('Enter');await sp.waitFor({state:'hidden'});assert(await sp.count()===0);notes.push({check:'prerequisite-toggle-rights',pass:true});
return {notes,geometry:await page.evaluate(()=>({innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth}))};
""".replace('OUT',json.dumps(str(root/name)))
  result=run(src);result.update(condition=name,initial_geometry=geo,status='scoped-primed-pass',screen_reader='not-run',input='Playwright input/focus; OS browser-menu zoom, not human or fresh actor')
  (root/(name+'.json')).write_text(json.dumps(result,indent=2));print(name,'PASS',geo,flush=True)
 except Exception as e:
  (root/(name+'-failure.json')).write_text(json.dumps({'condition':name,'error':str(e),'status':'failed-or-incomplete'},indent=2));print(name,'STOP',str(e),flush=True);raise
