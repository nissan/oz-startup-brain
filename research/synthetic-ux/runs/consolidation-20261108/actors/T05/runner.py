from playwright.sync_api import sync_playwright
import json, pathlib, datetime, subprocess, time, os, signal
out=pathlib.Path('/workspace/scratch/7094013efcad/fresh-followup/T05')
server=subprocess.Popen(['/root/.npm/_npx/f9021511a0a31a8f/node_modules/.bin/node','apps/web/e2e/serve.mjs','3187','3987','none'],cwd='<merged-worktree>',stdout=open(out/'server-output.txt','w'),stderr=subprocess.STDOUT,start_new_session=True)
time.sleep(3)
p=sync_playwright().start()
browser=p.chromium.launch(executable_path='/tmp/chromium',headless=True,args=['--no-sandbox'])
context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
failures=['Initial runner navigation: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3187/; no app interaction; parent notified.']
def route(r):
    if r.request.url.startswith('http://127.0.0.1:3187/') or r.request.url.startswith('data:') or r.request.url.startswith('blob:'): r.continue_()
    else:
        failures.append('Blocked out-of-origin request: '+r.request.url)
        r.abort()
context.route('**/*',route)
page=context.new_page()
page.on('pageerror', lambda e: failures.append('Page error: '+str(e)))
page.goto('http://127.0.0.1:3187/',wait_until='networkidle')
(out/'environment.json').write_text(json.dumps({'runner':'Python Playwright','playwright_version':__import__('importlib.metadata').metadata.version('playwright'),'browser':'Chromium','browser_version':browser.version,'viewport':{'width':390,'height':844},'device_scale_factor':1,'zoom':'100% (default)','mobile':'synthetic mobile emulation, not real device','context':'fresh isolated context','timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()},indent=2))
def snap(name):
    page.screenshot(path=str(out/(name+'.png')),full_page=True)
    t=page.locator('body').inner_text()
    (out/(name+'.txt')).write_text(t)
    (out/'failures.json').write_text(json.dumps(failures,indent=2))
    print(t,flush=True)
snap('01-initial')
while True:
    command=input('COMMAND> ')
    if command=='quit': break
    try:
        exec(command)
    except Exception as e:
        failures.append(type(e).__name__+': '+str(e))
        (out/'failures.json').write_text(json.dumps(failures,indent=2))
        print('FAILURE:',str(e),flush=True)
context.close();browser.close();p.stop();os.killpg(server.pid,signal.SIGTERM)
