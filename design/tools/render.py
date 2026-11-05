#!/usr/bin/env python3
"""Render the design-system component previews and the mock-up artboards to PNG, outside the Claude viewer.

Usage (from the repository root):
    npm install --prefix /tmp/osb-render react@18.3.1 react-dom@18.3.1
    python3 design/tools/render.py /tmp/osb-render/node_modules design/exports

Besides writing PNGs, the script runs a geometric bounds check on every artboard in both
themes: each button, link, input, textarea, paragraph and heading must lie inside the
artboard frame recorded in mockups/canvas.json. Any overflow is printed as
"BOUNDS <artboard> <theme>: <TAG> '<text>' bottom=<px> right=<px>" and the script exits 1.
Component previews are rendered full-page and are not bounds-checked.

Requires Python 3, Playwright (`pip install playwright`) and a Chromium or Chrome binary
(set CHROME=/path/to/chrome if it is not at /usr/bin/google-chrome).
Google Fonts are not fetched; the fallback faces in tokens.json are used, so glyph shapes
differ from the hosted artifact while colours, layout and copy are identical.
The artboard renderer is a minimal stand-in for the Design canvas runtime: it resolves
`{{hole}}` attributes from `renderVals()` and mounts each `<x-import>` with React. It does
not implement `<sc-for>`, `<sc-if>` or events; the committed artboards use none of them.
"""
import glob, os, re, sys

if len(sys.argv) != 3:
    sys.exit(__doc__)
NODE_MODULES, OUT = sys.argv[1], sys.argv[2]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS, MOCK = os.path.join(ROOT, "system"), os.path.join(ROOT, "mockups")
os.makedirs(os.path.join(OUT, "components"), exist_ok=True)
os.makedirs(os.path.join(OUT, "mockups"), exist_ok=True)

react = open(os.path.join(NODE_MODULES, "react/umd/react.production.min.js")).read()
react_dom = open(os.path.join(NODE_MODULES, "react-dom/umd/react-dom.production.min.js")).read()
tokens = open(os.path.join(DS, "tokens.css")).read()
bundle_css = open(os.path.join(DS, "components/bundle.css")).read()
bundle_js = open(os.path.join(DS, "components/bundle.js")).read()
HEAD = (f'<meta charset="utf-8"><script>{react}</script><script>{react_dom}</script>'
        f'<style>{tokens}</style><style>{bundle_css}</style><script>{bundle_js}</script>')
SHIM = r"""
<script>
(function(){
 const kebab=s=>s.replace(/-([a-z])/g,(m,c)=>c.toUpperCase());
 const scr=document.querySelector('script[type="text/x-dc"]');
 let vals={};
 if(scr){ (0,eval)(scr.textContent+'\n;window.__C=Component;'); const inst=new window.__C(); vals=inst.renderVals?inst.renderVals():{}; }
 const get=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],vals);
 document.querySelectorAll('x-import').forEach(el=>{
   const comp=el.getAttribute('component-from-global-scope').split('.').reduce((o,k)=>o[k],window);
   const props={};
   for(const a of el.attributes){ if(a.name==='component-from-global-scope'||a.name==='style') continue;
     let v=a.value; const h=v.match(/^\{\{\s*([\w.$]+)\s*\}\}$/); if(h) v=get(h[1]); props[kebab(a.name)]=v; }
   const children=el.textContent.trim()||undefined;
   const host=document.createElement('span'); host.style.display='contents';
   el.replaceWith(host); ReactDOM.createRoot(host).render(React.createElement(comp,props,children));
 });
})();
</script>"""
pages = []  # (name, width, height-or-None, html, bounds_checked)
for pv in sorted(glob.glob(os.path.join(DS, "components/*/preview.html"))):
    name = pv.split(os.sep)[-2]
    src = open(pv).read()
    style = "".join(re.findall(r"<style>(.*?)</style>", src, re.S))
    body = re.search(r"<body>(.*?)</body>", src, re.S).group(1)
    for theme in ("light", "dark"):
        pages.append((f"components/{name}-{theme}", 720, None,
                      f'<!doctype html><html data-theme="{theme}"><head>{HEAD}<style>{style}</style></head><body>{body}</body></html>', False))
sizes = {}
import json
canvas = json.load(open(os.path.join(MOCK, "canvas.json")))
for ab in sorted(glob.glob(os.path.join(MOCK, "*.dc.html"))):
    name = os.path.basename(ab)[:-len(".dc.html")]
    board = canvas["boards"].get(os.path.basename(ab), {})
    src = open(ab).read()
    helm = re.search(r"<helmet>(.*?)</helmet>", src, re.S).group(1)
    hstyle = "".join(re.findall(r"<style>(.*?)</style>", helm, re.S))
    inner = re.search(r"</helmet>(.*?)</x-dc>", src, re.S).group(1)
    script = re.search(r'(<script type="text/x-dc"[^>]*>.*?</script>)', src, re.S).group(1)
    for theme in ("light", "dark"):
        pages.append((f"mockups/{name}-{theme}", board.get("w", 1280), board.get("h", 900),
                      f'<!doctype html><html data-theme="{theme}"><head>{HEAD}<style>{hstyle}</style><script>class DCLogic{{}}</script></head><body>{inner}{script}{SHIM}</body></html>', True))

BOUNDS_JS = """([w, h]) => {
  const out = [];
  for (const el of document.querySelectorAll('button, a, input, textarea, select, p, h1, h2, h3, h4')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom > h + 0.5 || r.right > w + 0.5 || r.top < -0.5 || r.left < -0.5) {
      out.push(el.tagName + " '" + (el.textContent || '').trim().slice(0, 40).replace(/\\s+/g, ' ') + "' bottom=" + Math.round(r.bottom) + " right=" + Math.round(r.right));
    }
  }
  return out;
}"""

from playwright.sync_api import sync_playwright
errors, overflow = {}, []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
    for name, w, h, html, check in pages:
        page = browser.new_page(viewport={"width": w, "height": h or 400})
        logs = []
        page.on("pageerror", lambda e: logs.append(str(e)[:200]))
        page.set_content(html)
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(OUT, name + ".png"), full_page=(h is None))
        if logs:
            errors[name] = logs
        if check:
            for item in page.evaluate(BOUNDS_JS, [w, h]):
                overflow.append(f"BOUNDS {name}: {item}")
        page.close()
    browser.close()
for line in overflow:
    print(line)
print("rendered", len(pages), "pages;", "page errors:", errors or "none", "; bounds overflow:", len(overflow))
if errors or overflow:
    sys.exit(1)
