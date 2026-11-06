"""Pinned, offline font CSS and Chromium painted-glyph verification for design exports."""
import base64
import json
from pathlib import Path
import re

# Full Fraunces retains optical sizing rather than freezing the Google Fonts opsz axis.
SOURCES = {
    '@fontsource-variable/fraunces': ['full.css'],
    '@fontsource/atkinson-hyperlegible': ['400.css', '700.css', '400-italic.css'],
    '@fontsource/jetbrains-mono': ['400.css'],
}
FACES = [
    ('Fraunces', 'normal', '600'),
    ('Atkinson Hyperlegible', 'normal', '400'),
    ('Atkinson Hyperlegible', 'normal', '700'),
    ('Atkinson Hyperlegible', 'italic', '400'),
    ('JetBrains Mono', 'normal', '400'),
]


def font_css(node_modules):
    """Use package CSS unicode ranges, but inline only WOFF2; never issue font requests."""
    modules = Path(node_modules)
    pins = json.loads(Path(__file__).with_name('package.json').read_text())['dependencies']
    sheets = []
    for package, files in SOURCES.items():
        root = modules / package
        actual = json.loads((root / 'package.json').read_text())['version']
        if actual != pins[package]:
            raise ValueError(f'FONT {package}: expected {pins[package]}, got {actual}; run npm ci')
        for filename in files:
            css = (root / filename).read_text()
            def embed(match):
                source = re.search(r'url\(([^)]+\.woff2)\)', match.group(0))
                if not source:
                    raise ValueError(f'FONT {package}/{filename}: no WOFF2 source')
                path = root / source[1].strip('"\'')
                if not path.is_file():
                    raise ValueError(f'FONT missing required face: {path}')
                encoded = base64.b64encode(path.read_bytes()).decode()
                return f'src: url(data:font/woff2;base64,{encoded}) format("woff2");'
            css = re.sub(r'src:[^;]+;', embed, css)
            sheets.append(css.replace('Fraunces Variable', 'Fraunces').replace('font-display: swap', 'font-display: block'))
    return '\n'.join(sheets) + '\n* { font-synthesis: none; }'


TEXT_RUNS_JS = r"""() => {
 const runs=[];
 for(const el of document.body.querySelectorAll('*')) {
  const style=getComputedStyle(el), r=el.getBoundingClientRect();
  if(!r.width || !r.height || style.visibility==='hidden' || style.display==='none') continue;
  let text=Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('');
  if(el.matches('input:not([type=checkbox]):not([type=radio]),textarea')) text=el.value || el.placeholder;
  if(!text.trim()) continue;
  const id=String(runs.length); el.setAttribute('data-font-check',id);
  runs.push({id, text, family:style.fontFamily.split(',')[0].replace(/["']/g,'').trim(),
    weight:style.fontWeight, style:style.fontStyle, tag:el.tagName,
    size:style.fontSize, spacing:style.letterSpacing, variation:style.fontVariationSettings,
    optical:style.fontOpticalSizing, transform:style.textTransform,
    variant:style.fontVariant, features:style.fontFeatureSettings});
 }
 return runs;
}"""


def verify_fonts(page):
    """Wait for faces, require supported styles, inspect actual glyph fonts with CDP.

    Visible direct text is inspected in place. Matching text probes additionally cover
    input/textarea shadow text and mixed-content elements without inheriting child styles.
    Probes are removed before measurement/screenshots; SVG paths and generated
    pseudo-element content are outside this direct-text check.
    """
    page.evaluate('async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); }')
    runs = page.evaluate(TEXT_RUNS_JS)
    samples = [dict(family=f, style=s, weight=w, text='Hamburgefontsiv 0123456789', size='17px',
                    spacing='normal', variation='normal', optical='auto', transform='none',
                    variant='normal', features='normal', id=None) for f, s, w in FACES]
    supported = set(FACES)
    for run in runs:
        if (run['family'], run['style'], run['weight']) not in supported:
            raise ValueError(f"FONT unsupported face {run['family']} {run['style']} {run['weight']}: {run['text'][:60]!r}")
    cdp = page.context.new_cdp_session(page)
    cdp.send('DOM.enable')
    cdp.send('CSS.enable')
    counts, painted = {}, set()
    try:
        for run in samples + runs:
            loaded = page.evaluate(r'''async r => {
              const faces = await document.fonts.load(`${r.style} ${r.weight} 17px "${r.family}"`, r.text);
              return faces.length > 0 && faces.every(f=>{
                const weights=f.weight.split(/\s+/).map(Number);
                return f.status==='loaded' && f.style===r.style && Number(r.weight)>=weights[0] && Number(r.weight)<=weights[weights.length-1];
              });
            }''', run)
            if not loaded:
                raise ValueError(f"FONT required face did not load: {run['family']} {run['weight']} {run['style']}")
            page.evaluate('''r => {
              const p=document.createElement('span');p.id='osb-font-probe';p.textContent=r.text;
              Object.assign(p.style,{position:'absolute',left:'-10000px',top:'0',whiteSpace:'pre',
                fontFamily:`"${r.family}"`,fontWeight:r.weight,fontStyle:r.style,fontSize:r.size,
                letterSpacing:r.spacing,fontVariationSettings:r.variation,fontOpticalSizing:r.optical,
                textTransform:r.transform,fontVariant:r.variant,fontFeatureSettings:r.features,
                fontSynthesis:'none'});document.body.append(p);p.getBoundingClientRect();
            }''', run)
            doc = cdp.send('DOM.getDocument')['root']['nodeId']
            selectors = ['#osb-font-probe']
            # CDP reports fonts of child text nodes, including mixed descendants. Probes
            # verify each direct text run; leaf text also supplies in-place evidence.
            if run['id'] is not None and page.locator(f'[data-font-check="{run["id"]}"]').evaluate('(e)=>e.children.length===0 && !e.matches("input,textarea")'):
                selectors.append(f'[data-font-check="{run["id"]}"]')
            for selector in selectors:
                node = cdp.send('DOM.querySelector', {'nodeId': doc, 'selector': selector})['nodeId']
                used = cdp.send('CSS.getPlatformFontsForNode', {'nodeId': node})['fonts']
                used = [f for f in used if f['glyphCount'] > 0]
                if not used or any(not f['isCustomFont'] or f['familyName'].removesuffix(' (Fontations)') not in (run['family'], run['family']+' Variable') for f in used):
                    raise ValueError(f"FONT fallback for {run['family']} {run['weight']} {run['style']} {run['text'][:60]!r}: {used}")
                painted.update((f['familyName'], f['postScriptName']) for f in used)
            key = f"{run['family']} / {run['weight']} / {run['style']}"
            counts[key] = counts.get(key, 0) + 1
            page.locator('#osb-font-probe').evaluate('(e)=>e.remove()')
    finally:
        page.evaluate("() => { document.getElementById('osb-font-probe')?.remove(); document.querySelectorAll('[data-font-check]').forEach(e=>e.removeAttribute('data-font-check')); }")
        cdp.detach()
    return {'text_runs': len(runs), 'verified_faces': counts, 'painted_fonts': sorted(painted)}


def offline_page(browser, **kwargs):
    """No HTTP(S) resources during rendering; dependencies are installed separately."""
    page = browser.new_page(**kwargs)
    page.route(re.compile(r'^https?://'), lambda route: route.abort())
    return page
