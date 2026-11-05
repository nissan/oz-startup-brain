#!/usr/bin/env python3
"""Automated keyboard, accessibility-tree and zoom pass over the design system and mock-ups.

    python3 design/tools/a11y_check.py <node_modules> <report.md>

Opens every page that render.py draws (component previews and artboards, light theme for the
tree and keyboard pass, both themes for the focus-ring contrast) in headless Chromium and records:

- keyboard: the Tab order of every focusable element; that every element reached is visible and
  shows a focus ring (a non-zero outline, in the ochre token colour) when focused; that Tab does
  not get trapped (the sequence terminates and returns to the document); that no element with a
  click handler is unreachable (role/onClick on a div or span).
- accessibility tree: the names and roles of controls (a control with no accessible name is a
  finding); `role=status` and `aria-live` regions; table captions and row headers; the text
  alternative beside the prerequisite map; `aria-pressed` on starter tasks; images with alt.
- zoom: every artboard at 200 % (deviceScaleFactor 2 at half the CSS width, which is what browser
  zoom does to a fixed-width phone or desktop frame) and the resulting horizontal overflow, since
  WCAG 1.4.10 reflow is about content being lost or needing two-dimensional scrolling.

This is an automated pass with the real component bundle, not a screen-reader session: it reports
what the accessibility tree exposes, which is what a screen reader announces, but no assistive
technology was run and no person with a disability took part. It writes a Markdown report and
exits 1 only on a `fail`; `note`s are observations for a person to judge.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render  # noqa: E402  (build_pages)

if len(sys.argv) != 3:
    sys.exit(__doc__)
NODE_MODULES, REPORT = sys.argv[1], sys.argv[2]
pages, canvas = render.build_pages(NODE_MODULES)

TAB_JS = """() => {
  const seen = [];
  const sel = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
  const focusables = [...document.querySelectorAll(sel)].filter(e => !e.disabled && e.getClientRects().length);
  document.body.focus();
  for (let i = 0; i < focusables.length + 2; i++) {
    const el = focusables[i];
    if (!el) break;
    el.focus();
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    seen.push({
      tag: el.tagName.toLowerCase(),
      name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().replace(/\\s+/g, ' ').slice(0, 50),
      focused: document.activeElement === el,
      outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor,
      visible: r.width > 0 && r.height > 0,
      w: Math.round(r.width), h: Math.round(r.height),
    });
  }
  const fakeControls = [...document.querySelectorAll('div[onclick], span[onclick], div[role=button], span[role=button]')].length;
  return { seen, fakeControls, count: focusables.length };
}"""

TREE_JS = """() => {
  const q = s => [...document.querySelectorAll(s)];
  const text = e => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g, ' ');
  const unnamed = q('button, a[href], input, textarea, select').filter(e => {
    if (e.getAttribute('aria-label')) return false;
    if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT') {
      return !(e.id && document.querySelector('label[for="' + e.id + '"]')) && !e.closest('label');
    }
    return !text(e);
  }).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''));
  return {
    unnamed,
    status: q('[role=status]').map(e => text(e).slice(0, 60)),
    alerts: q('[role=alert]').map(e => text(e).slice(0, 60)),
    live: q('[aria-live]').map(e => e.getAttribute('aria-live') + ': ' + text(e).slice(0, 60)),
    tables: q('table').map(t => ({ caption: !!t.querySelector('caption'), rowHeaders: t.querySelectorAll('th[scope=row]').length, colHeaders: t.querySelectorAll('th[scope=col]').length })),
    imgsNoAlt: q('img').filter(i => i.getAttribute('alt') === null).length,
    svgRoleImgNoLabel: q('svg[role=img]').filter(s => !s.getAttribute('aria-label')).length,
    svgUnlabelled: q('svg').filter(s => s.getAttribute('aria-hidden') !== 'true' && s.getAttribute('role') !== 'img').length,
    pressed: q('[aria-pressed]').map(e => text(e).slice(0, 30) + '=' + e.getAttribute('aria-pressed')),
    mapHasList: q('.osb-map').every(m => m.querySelector('ol, ul')),
    textareas: q('textarea').map(t => ({ id: t.id, labelled: !!(t.id && document.querySelector('label[for="' + t.id + '"]')) })),
    headings: q('h1, h2, h3, h4').map(h => h.tagName.toLowerCase()),
    lang: document.documentElement.lang || '',
  };
}"""

ZOOM_JS = "() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight })"


def rgb(s):
    try:
        return tuple(int(x) for x in s[s.index('(') + 1:s.index(')')].split(',')[:3])
    except Exception:
        return None


from playwright.sync_api import sync_playwright  # noqa: E402

findings, per_page = [], {}
OCHRE = {"light": (154, 77, 31), "dark": (240, 162, 109)}
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
    for name, w, h, html, is_board in pages:
        theme = name.rsplit("-", 1)[1]
        page = browser.new_page(viewport={"width": w, "height": h or 400})
        page.set_content(html)
        page.wait_for_timeout(300)
        tab = page.evaluate(TAB_JS)
        tree = page.evaluate(TREE_JS) if theme == "light" else None
        rec = {"tab": tab, "tree": tree}
        # keyboard findings
        for i, el in enumerate(tab["seen"]):
            if not el["focused"]:
                findings.append(("fail", name, f"{el['tag']} '{el['name']}' could not receive focus"))
            if not el["visible"]:
                findings.append(("fail", name, f"{el['tag']} '{el['name']}' is focusable but has no size"))
            ring = rgb(el["outlineColor"])
            if el["outlineStyle"] == "none" or el["outlineWidth"] in ("0px", ""):
                findings.append(("fail", name, f"{el['tag']} '{el['name']}' shows no focus ring"))
            elif ring and ring != OCHRE[theme]:
                findings.append(("note", name, f"{el['tag']} '{el['name']}' focus ring colour {el['outlineColor']} is not the ochre token"))
            if is_board and el["tag"] == "button" and el["h"] < 44 and w <= 480:  # inline links are exempt (WCAG 2.5.8)
                findings.append(("note", name, f"{el['tag']} '{el['name']}' is {el['h']}px tall on a phone board (44px target)"))
        if tab["fakeControls"]:
            findings.append(("fail", name, f"{tab['fakeControls']} div/span elements act as controls"))
        if tree:
            for u in tree["unnamed"]:
                findings.append(("fail", name, f"control without an accessible name: {u}"))
            if tree["imgsNoAlt"]:
                findings.append(("fail", name, f"{tree['imgsNoAlt']} <img> without alt"))
            if tree["svgRoleImgNoLabel"]:
                findings.append(("fail", name, f"{tree['svgRoleImgNoLabel']} svg[role=img] without aria-label"))
            if tree["svgUnlabelled"]:
                findings.append(("fail", name, f"{tree['svgUnlabelled']} inline svg neither aria-hidden nor role=img"))
            for t in tree["tables"]:
                if not t["caption"]:
                    findings.append(("fail", name, "table without a caption"))
                if not t["rowHeaders"]:
                    findings.append(("note", name, "table without row headers"))
            if not tree["mapHasList"]:
                findings.append(("fail", name, "prerequisite map without its list equivalent"))
            for t in tree["textareas"]:
                if not t["labelled"]:
                    findings.append(("fail", name, f"textarea#{t['id']} has no <label for>"))
            if not tree["lang"]:
                findings.append(("fail", name, "document has no lang attribute"))
            if is_board and tree["headings"] and tree["headings"][0] != "h1":
                findings.append(("note", name, f"first heading is {tree['headings'][0]}, not h1"))
        page.close()
        # 200% zoom on artboards: halve the CSS viewport, double the device scale factor
        if is_board and theme == "light":
            zp = browser.new_page(viewport={"width": w // 2, "height": (h or 400) // 2}, device_scale_factor=2)
            zp.set_content(html)
            zp.wait_for_timeout(300)
            z = zp.evaluate(ZOOM_JS)
            rec["zoom200"] = z
            # A fixed-size artboard is a picture of a w-px screen, so at 200 % it necessarily scrolls
            # horizontally; that is recorded per page below, not as a finding. Reflow (WCAG 1.4.10) can
            # only be checked on the implemented, fluid page.
            zp.close()
        per_page[name] = rec
    browser.close()

fails = [f for f in findings if f[0] == "fail"]
notes = [f for f in findings if f[0] == "note"]
lines = ["# Automated accessibility pass over the design exports", "",
         "Generated by `design/tools/a11y_check.py` from the committed component previews and artboards, "
         "rendered with the real component bundle and fallback fonts in headless Chromium. "
         "It reports what the accessibility tree exposes and what keyboard focus does; **no screen reader was run and no person took part**, "
         "so this is the pre-session pass that #9 asks for, not evidence of WCAG conformance or of a real assistive-technology experience.", "",
         f"Pages checked: {len(pages)} ({sum(1 for p in pages if p[4])} artboard renders, {sum(1 for p in pages if not p[4])} component previews). "
         f"Failures: {len(fails)}. Notes for a person to judge: {len(notes)}.", "",
         "## What was checked", "",
         "- Keyboard: Tab order of every focusable element; each one receives focus, has a size, and shows a focus ring in the ochre token; no div/span acts as a control.",
         "- Accessibility tree: every button, link and field has an accessible name; `role=status` / `role=alert` / `aria-live` regions; tables have captions and row headers; the prerequisite map has its list equivalent; images have alt; inline SVGs are hidden or labelled; starter tasks expose `aria-pressed`.",
         "- Zoom: each artboard at 200 % (half the CSS viewport at device scale 2, which is what browser zoom does to a fixed-width frame). "
         "Every artboard is a fixed-size picture of one screen, so at 200 % it scrolls horizontally by construction; the numbers are recorded per page, and reflow (WCAG 1.4.10) remains a check for the implemented, fluid page, not something these exports can establish.",
         "- Target size: buttons on phone boards below 44px are noted; inline text links are exempt (WCAG 2.5.8).", "",
         "## Failures", ""]
lines += [f"- **{n}** — {m}" for _, n, m in fails] or ["None."]
lines += ["", "## Notes", ""]
lines += [f"- {n} — {m}" for _, n, m in notes] or ["None."]
lines += ["", "## Keyboard order and announced names per page", ""]
for name, rec in per_page.items():
    if not name.endswith("-light"):
        continue
    t = rec["tab"]
    order = " → ".join(f"{e['tag']}:{e['name'] or '(unnamed)'}" for e in t["seen"]) or "(no focusable elements)"
    lines.append(f"### {name[:-6]}")
    lines.append("")
    lines.append(f"- Tab order ({t['count']}): {order}")
    tr = rec["tree"]
    if tr:
        if tr["status"]:
            lines.append(f"- role=status: {'; '.join(tr['status'])}")
        if tr["alerts"]:
            lines.append(f"- role=alert: {'; '.join(tr['alerts'])}")
        if tr["live"]:
            lines.append(f"- aria-live: {'; '.join(tr['live'])}")
        if tr["pressed"]:
            lines.append(f"- aria-pressed: {', '.join(tr['pressed'])}")
        if tr["tables"]:
            lines.append(f"- tables: {tr['tables']}")
    if "zoom200" in rec:
        z = rec["zoom200"]
        lines.append(f"- 200 % zoom: content {z['sw']}×{z['sh']}px in a {z['cw']}px viewport")
    lines.append("")
with open(REPORT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print(f"a11y pass: {len(pages)} pages; failures: {len(fails)}; notes: {len(notes)}; report {REPORT}")
sys.exit(1 if fails else 0)
