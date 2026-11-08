// Facilitator-owned runner. No product changes, secrets, public fault endpoint or expected results.
const {chromium}=require('../../../../../node_modules/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../../../..');
const executablePath=process.env.OZ_VERIFY_CHROME;
if(!executablePath)throw Error('OZ_VERIFY_CHROME must identify a local Chrome for Testing binary');
const sessions=new Map();
const esc=x=>String(x??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const append=(file,row)=>fs.appendFileSync(path.join(root,file),JSON.stringify(row)+'\n');
async function prepare(q){
 if(!/^[a-z0-9-]+$/.test(q.session)||sessions.has(q.session))throw Error('Invalid/duplicate session');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'oz-verifier-'+q.session+'-'));
 const ext=path.join(__dirname,'zoom-extension');
 const c=await chromium.launchPersistentContext(profile,{executablePath,headless:true,viewport:null,ignoreDefaultArgs:['--disable-extensions'],args:['--window-size=1280,887','--disable-extensions-except='+ext,'--load-extension='+ext]});
 c.setDefaultTimeout(8000);
 const sw=c.serviceWorkers()[0]||await c.waitForEvent('serviceworker');
 const p=c.pages()[0]||await c.newPage();
 const s={id:q.session,c,sw,p,home:p,n:0,profile,zoom:q.zoom||1,theme:q.theme||'light',popupEvents:[]};sessions.set(s.id,s);
 await c.addInitScript(t=>localStorage.setItem('osb-theme',t),s.theme);
 const corpus=JSON.parse(fs.readFileSync(path.join(repo,'apps/api/fixtures/corpus.json')));
 const sources=new Map(corpus.sources.map(x=>[x.canonical_url,x]));
 await c.route('**/*',async route=>{
  const u=route.request().url();if(!new URL(u).hostname.endsWith('.invalid'))return route.continue();
  const source=sources.get(u);
  const body=source?'<!doctype html><html lang="en"><title>'+esc(source.title)+'</title><body style="font:18px/1.7 system-ui;max-width:70ch;padding:32px;margin:auto"><p>LOCAL FICTIONAL PUBLISHER FIXTURE — not a live program or advice.</p><h1>'+esc(source.title)+'</h1><p>'+esc(source.publisher)+'</p><p>Version '+esc(source.source_version_date)+' · verified '+esc(source.last_verified_at)+'</p><article>'+esc(source.text)+'</article></body></html>':'<h1>LOCAL FICTIONAL SOURCE UNAVAILABLE</h1>';
  append('publisher.jsonl',{at:new Date().toISOString(),session:s.id,url:u,source_id:source?.id,status:source?200:404});
  await route.fulfill({status:source?200:404,contentType:'text/html; charset=utf-8',body});
 });
 c.on('page',pop=>{s.p=pop;s.popupEvents.push({at:new Date().toISOString(),event:'popup-created'});pop.on('close',()=>{s.p=s.home})});
 p.on('response',async r=>{if(r.url().endsWith('/api/bff/query'))append('queries.jsonl',{session:s.id,at:new Date().toISOString(),http:r.status(),request:JSON.parse(r.request().postData()||'{}'),response:await r.json().catch(()=>null)})});
 await p.goto('http://127.0.0.1:3140/',{waitUntil:'networkidle'});
 s.zoomReadback=await sw.evaluate(async value=>{const tabs=await chrome.tabs.query({});const t=tabs.find(t=>t.url?.startsWith('http://127.0.0.1:3140'));await chrome.tabs.setZoom(t.id,value);return {tab:t.id,zoom:await chrome.tabs.getZoom(t.id)}} ,s.zoom);
 append('setup.jsonl',{session:s.id,at:new Date().toISOString(),profile,sha:'0a7d9a6d1184e46042a299d44e0e1d54b8c8cf60',browser:c.browser()?.version(),zoom:s.zoomReadback,theme:s.theme,method:'chrome.tabs.setZoom/getZoom; native viewport null; no CSS zoom or deviceScale emulation'});
 return snapshot(s,{op:'prepared'});
}
async function snapshot(s,action){
 await s.p.waitForLoadState('domcontentloaded').catch(()=>{});await s.p.waitForTimeout(150);
 const p=s.p;const geometry=await p.evaluate(()=>{const e=document.activeElement,r=e?.getBoundingClientRect(),st=e?getComputedStyle(e):null;return {focus:{tag:e?.tagName,id:e?.id,label:e?.getAttribute('aria-label'),text:e?.textContent?.trim().slice(0,180),value:e?.value,focusVisible:e?.matches(':focus-visible'),outline:st?.outline,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null},viewport:{innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,scrollX,scrollY},theme:document.documentElement.dataset.theme}});
 const text=await p.locator('body').innerText();
 const n=++s.n,file=`${s.id}-${String(n).padStart(3,'0')}.png`;
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const cdp=await s.c.newCDPSession(p);const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:false,captureBeyondViewport:false});await cdp.detach();fs.writeFileSync(path.join(root,'evidence',file),Buffer.from(shot.data,'base64'));
 const row={session:s.id,step:n,at:new Date().toISOString(),action,url:p.url(),pages:s.c.pages().map(p=>p.url()),text,...geometry,zoom:s.zoomReadback,evidence:'evidence/'+file,popupEvents:s.popupEvents};append('traces.jsonl',row);return row;
}
async function run(q){
 if(q.op==='prepare')return prepare(q);
 const s=sessions.get(q.session);if(!s)throw Error('session not prepared');
 if(q.op==='close'){await s.c.close();return {closed:true}}
 if(q.op==='snapshot')return snapshot(s,q);
 if(q.op==='key'){
  // Browser-chrome keyboard adapter: headless cannot dispatch OS tab shortcuts. Only tab close/return is adapted; DOM keyboard uses real input.
  if(q.key==='Meta+w'||q.key==='Control+w'){
   if(s.p===s.home)throw Error('refuse to close journey tab');
   const url=s.p.url();await s.sw.evaluate(async url=>{const t=(await chrome.tabs.query({})).find(t=>t.url===url);if(!t)throw Error('popup not found');await chrome.tabs.remove(t.id)},url);s.p=s.home;await s.home.bringToFront();q={...q,adapter:'chrome.tabs.remove: browser tab close; not physical OS keystroke'};
  }else await s.p.keyboard.press(q.key);
 }else if(q.op==='type')await s.p.keyboard.type(q.text);
 else throw Error('only snapshot/key/type/close allowed; no pointer or DOM focus');
 return snapshot(s,q);
}
http.createServer(async(req,res)=>{let raw='';for await(const d of req)raw+=d;try{const q=JSON.parse(raw);res.setHeader('content-type','application/json');res.end(JSON.stringify(await run(q)))}catch(e){append('driver-errors.jsonl',{at:new Date().toISOString(),request:raw,error:e.message});res.statusCode=500;res.end(JSON.stringify({error:e.message}))}}).listen(3959,'127.0.0.1',()=>console.log('Verifier keyboard driver on loopback 3959'));
