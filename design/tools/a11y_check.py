#!/usr/bin/env python3
"""Keyboard, computed-semantics and zoom pass over the design system and mock-ups.

    python3 design/tools/a11y_check.py <node_modules> <report.md>

Opens every page that render.py draws (component previews and artboards; both themes) in headless
Chromium and records three kinds of evidence, kept separate in the report because they establish
different things:

1. Keyboard (real input): the page is tabbed through with actual Tab presses from the document,
   then back with Shift+Tab. The trace of active elements is compared with the controls that are
   meant to be reachable (focusable, enabled, visible, not tabindex=-1): every intended control is
   reached, in document order, nothing unintended is reached, the sequence returns to the document
   (no trap), and Shift+Tab retraces it. At every real Tab stop the focus ring is read from computed
   style and must be the ochre token.
2. Computed semantics (browser accessibility representation): roles and accessible names come
   from Playwright's ARIA snapshot of the page, i.e. the browser's own name computation, not DOM
   text. An interactive role without a computed name is a failure; status/alert regions are listed.
   This is what assistive technology is given; it is still not a screen-reader session and must not
   be described as what any particular screen reader announces.
3. Structural (DOM) checks, labelled as such: table captions and row headers, the prerequisite
   map's list equivalent, img alt, inline SVG labelling, aria-pressed, lang, heading start, and
   button target size on phone boards.

Artboards are also opened at 200 % (half the CSS viewport at device scale 2) and their scroll
extents recorded; a fixed-size artboard scrolls horizontally by construction, so reflow is a check
for the implemented fluid page, not these exports.

Exit 1 only on a failure. No screen reader or assistive-technology user is involved.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

OCHRE = {"light": (154, 77, 31), "dark": (240, 162, 109)}
INTERACTIVE_ROLES = {"button", "link", "textbox", "checkbox", "radio", "combobox", "listbox", "slider", "switch", "spinbutton", "menuitem", "tab", "searchbox"}

MARK_JS = """() => {
  const sel = 'a[href], button, input, textarea, select, [tabindex]';
  let n = 0;
  const intended = [];
  for (const el of document.querySelectorAll(sel)) {
    el.setAttribute('data-a11y', String(n));
    const ti = el.getAttribute('tabindex');
    const visible = el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    if (!el.disabled && visible && ti !== '-1') intended.push(n);
    n++;
  }
  return intended;
}"""

ACTIVE_JS = """() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { idx: 'body' };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { idx: el.getAttribute('data-a11y') || 'other', tag: el.tagName.toLowerCase(),
           outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor,
           h: Math.round(r.height), w: Math.round(r.width) };
}"""

STRUCT_JS = """() => {
  const q = s => [...document.querySelectorAll(s)];
  return {
    tables: q('table').map(t => ({ caption: !!t.querySelector('caption'), rowHeaders: t.querySelectorAll('th[scope=row]').length, colHeaders: t.querySelectorAll('th[scope=col]').length })),
    imgsNoAlt: q('img').filter(i => i.getAttribute('alt') === null).length,
    svgRoleImgNoLabel: q('svg[role=img]').filter(s => !s.getAttribute('aria-label')).length,
    svgUnlabelled: q('svg').filter(s => s.getAttribute('aria-hidden') !== 'true' && s.getAttribute('role') !== 'img').length,
    pressed: q('[aria-pressed]').map(e => (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30) + '=' + e.getAttribute('aria-pressed')),
    mapsWithoutList: q('.osb-map').filter(m => !m.querySelector('ol, ul')).length,
    fakeControls: q('div[onclick], span[onclick], div[role=button], span[role=button]').length,
    headings: q('h1, h2, h3, h4').map(h => h.tagName.toLowerCase()),
    lang: document.documentElement.lang || '',
  };
}"""

ZOOM_JS = "() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight })"

SNAPSHOT_LINE = re.compile(r'^\s*- (?:\'?)([a-z]+)(?:\s+"((?:[^"\\]|\\.)*)")?')


def rgb(s):
    try:
        return tuple(int(x) for x in s[s.index('(') + 1:s.index(')')].split(',')[:3])
    except Exception:
        return None


def focused_name(page):
    """Computed role and name of the focused element, from the browser's ARIA snapshot."""
    try:
        snap = page.locator(':focus').aria_snapshot(timeout=2000)
    except Exception:
        return "?", ""
    m = SNAPSHOT_LINE.match(snap.splitlines()[0]) if snap else None
    return (m.group(1), m.group(2) or "") if m else ("?", "")


def keyboard_pass(page, theme, phone=False):
    """Real Tab / Shift+Tab trace. Returns (findings, trace) where trace is a list of
    (role, name, idx) at each forward Tab stop."""
    findings = []
    intended = page.evaluate(MARK_JS)
    limit = len(intended) + 3
    page.evaluate("() => { document.activeElement && document.activeElement.blur(); document.body.focus(); }")
    trace, seen = [], []
    for _ in range(limit):
        page.keyboard.press("Tab")
        a = page.evaluate(ACTIVE_JS)
        if a["idx"] == "body":
            break
        if a["idx"] == "other":
            findings.append(("fail", f"Tab reached an element that is not a marked control ({a.get('tag')})"))
            break
        idx = int(a["idx"])
        role, name = focused_name(page)
        trace.append((role, name, idx))
        if seen and idx == seen[-1]:
            findings.append(("fail", f"keyboard trap: Tab stays on {role} '{name}'"))
            break
        seen.append(idx)
        ring = rgb(a["outlineColor"])
        if a["outlineStyle"] == "none" or a["outlineWidth"] in ("0px", ""):
            findings.append(("fail", f"{role} '{name}' shows no focus ring on keyboard focus"))
        elif ring and ring != OCHRE[theme]:
            findings.append(("note", f"{role} '{name}' focus ring colour {a['outlineColor']} is not the ochre token"))
        if phone and a.get("tag") == "button" and a["h"] < 44:
            findings.append(("note", f"button '{name}' is {a['h']}px tall on a phone board (44px target)"))
    else:
        findings.append(("fail", f"Tab did not return to the document within {limit} presses: keyboard trap or unbounded sequence"))
    if seen != intended:
        missing = [i for i in intended if i not in seen]
        extra = [i for i in seen if i not in intended]
        if missing:
            findings.append(("fail", f"{len(missing)} intended control(s) never reached by Tab (data-a11y {missing})"))
        if extra:
            findings.append(("fail", f"Tab reached control(s) meant to be skipped (data-a11y {extra})"))
        if not missing and not extra and seen != intended:
            findings.append(("fail", f"Tab order differs from document order: {seen} vs {intended}"))
    # Focus is back on the document; Shift+Tab must now retrace the forward order and return to it.
    if seen and not any(f[0] == "fail" for f in findings):
        back = []
        for _ in range(len(seen)):
            page.keyboard.press("Shift+Tab")
            a = page.evaluate(ACTIVE_JS)
            if a["idx"] in ("body", "other"):
                break
            back.append(int(a["idx"]))
        if back != list(reversed(seen)):
            findings.append(("fail", f"Shift+Tab does not retrace Tab: {back} vs {list(reversed(seen))}"))
    return findings, trace


def semantics_pass(page):
    """Computed roles/names from the browser's ARIA snapshot of the whole page."""
    findings, regions = [], {"status": [], "alert": []}
    snap = page.locator("body").aria_snapshot(timeout=5000)
    unnamed, lines = [], snap.splitlines()
    for i, line in enumerate(lines):
        m = SNAPSHOT_LINE.match(line)
        if not m:
            continue
        role, name = m.group(1), m.group(2)
        if role in INTERACTIVE_ROLES and not name:
            unnamed.append(role)
        if role in regions:
            # A region's content is either inline after the colon or on the following, deeper-indented lines.
            indent = len(line) - len(line.lstrip())
            text = line.split(":", 1)[1].strip() if ":" in line and not line.rstrip().endswith(":") else ""
            j = i + 1
            while not text and j < len(lines) and (len(lines[j]) - len(lines[j].lstrip())) > indent:
                text = re.sub(r"^\s*- (?:text: )?", "", lines[j]).strip().strip('"')
                j += 1
            text = (text or name or "").replace("list:", "(list)").strip().strip('"')[:60]
            if text and text not in regions[role]:
                regions[role].append(text)
    for role in unnamed:
        findings.append(("fail", f"{role} without a computed accessible name"))
    return findings, regions, snap


def structural_pass(page, is_board):
    findings = []
    s = page.evaluate(STRUCT_JS)
    for t in s["tables"]:
        if not t["caption"]:
            findings.append(("fail", "table without a caption"))
        if not t["rowHeaders"]:
            findings.append(("note", "table without row headers"))
    if s["imgsNoAlt"]:
        findings.append(("fail", f"{s['imgsNoAlt']} <img> without alt"))
    if s["svgRoleImgNoLabel"]:
        findings.append(("fail", f"{s['svgRoleImgNoLabel']} svg[role=img] without aria-label"))
    if s["svgUnlabelled"]:
        findings.append(("fail", f"{s['svgUnlabelled']} inline svg neither aria-hidden nor role=img"))
    if s["mapsWithoutList"]:
        findings.append(("fail", "prerequisite map without its list equivalent"))
    if s["fakeControls"]:
        findings.append(("fail", f"{s['fakeControls']} div/span elements act as controls"))
    if not s["lang"]:
        findings.append(("fail", "document has no lang attribute"))
    if is_board and s["headings"] and s["headings"][0] != "h1":
        findings.append(("note", f"first heading is {s['headings'][0]}, not h1"))
    return findings, s


def run(pages, chrome, report_path):
    from playwright.sync_api import sync_playwright
    findings, per_page = [], {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chrome, args=["--no-sandbox"])
        for name, w, h, html, is_board in pages:
            theme = name.rsplit("-", 1)[1]
            page = browser.new_page(viewport={"width": w, "height": h or 400})
            page.set_content(html)
            page.wait_for_timeout(300)
            kb, trace = keyboard_pass(page, theme, phone=is_board and w <= 480)
            findings += [(lvl, name, msg) for lvl, msg in kb]
            rec = {"trace": trace}
            if theme == "light":
                sem, regions, snap = semantics_pass(page)
                st, struct = structural_pass(page, is_board)
                findings += [(lvl, name, msg) for lvl, msg in sem + st]
                rec.update(regions=regions, struct=struct)
            page.close()
            if is_board and theme == "light":
                zp = browser.new_page(viewport={"width": w // 2, "height": (h or 400) // 2}, device_scale_factor=2)
                zp.set_content(html)
                zp.wait_for_timeout(300)
                rec["zoom200"] = zp.evaluate(ZOOM_JS)
                zp.close()
            per_page[name] = rec
        browser.close()
    write_report(pages, findings, per_page, report_path)
    return findings


def write_report(pages, findings, per_page, report_path):
    fails = [f for f in findings if f[0] == "fail"]
    notes = [f for f in findings if f[0] == "note"]
    L = ["# Automated accessibility pass over the design exports", "",
         "Generated by `design/tools/a11y_check.py` from the committed component previews and artboards, rendered with the real "
         "component bundle and fallback fonts in headless Chromium. Three kinds of evidence are kept apart below: real keyboard "
         "input (Tab / Shift+Tab traces), computed semantics (roles and accessible names from the browser's accessibility "
         "representation, which is what assistive technology is given) and structural DOM checks. **No screen reader was run and no "
         "person took part**; nothing here states what any particular screen reader announces. This is the pre-session pass that "
         "#9 asks for, not evidence of WCAG conformance.", "",
         f"Pages checked: {len(pages)} ({sum(1 for p in pages if p[4])} artboard renders, {sum(1 for p in pages if not p[4])} component "
         f"previews). Failures: {len(fails)}. Notes for a person to judge: {len(notes)}.", "",
         "## What was checked", "",
         "- Keyboard (real input): Tab from the document until it returns there, bounded; every intended control (focusable, enabled, visible, not `tabindex=-1`) reached, in document order, nothing else reached, no trap; Shift+Tab retraces the sequence; the ochre focus ring is read at each real stop.",
         "- Computed semantics: every interactive role has a computed accessible name; `status` and `alert` regions listed from the same snapshot.",
         "- Structural (DOM): table captions and row headers; the prerequisite map's list equivalent; img alt; inline SVG hidden or labelled; no div/span controls; `lang`; `aria-pressed`; button target size on phone boards (inline links exempt, WCAG 2.5.8).",
         "- Zoom: each artboard at 200 % (half the CSS viewport at device scale 2). A fixed-size artboard scrolls horizontally by construction; reflow (WCAG 1.4.10) is a check for the implemented fluid page.", "",
         "## Failures", ""]
    L += [f"- **{n}** — {m}" for _, n, m in fails] or ["None."]
    L += ["", "## Notes", ""]
    L += [f"- {n} — {m}" for _, n, m in notes] or ["None."]
    L += ["", "## Per page: real Tab trace (computed role and name at each stop), regions, structure, zoom", ""]
    for name, rec in per_page.items():
        if not name.endswith("-light"):
            continue
        L.append(f"### {name[:-6]}")
        L.append("")
        order = " → ".join(f"{r}:{n or '(no name)'}" for r, n, _ in rec["trace"]) or "(no reachable controls)"
        L.append(f"- Tab trace ({len(rec['trace'])} stops): {order}")
        reg = rec.get("regions", {})
        for role in ("status", "alert"):
            if reg.get(role):
                L.append(f"- {role}: {'; '.join(reg[role])}")
        st = rec.get("struct", {})
        if st.get("pressed"):
            L.append(f"- aria-pressed: {', '.join(st['pressed'])}")
        if st.get("tables"):
            L.append(f"- tables: {st['tables']}")
        if "zoom200" in rec:
            z = rec["zoom200"]
            L.append(f"- 200 % zoom: content {z['sw']}×{z['sh']}px in a {z['cw']}px viewport")
        L.append("")
    text = "\n".join(line.rstrip() for line in L).rstrip() + "\n"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(text)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    import render
    pages, _canvas = render.build_pages(sys.argv[1])
    found = run(pages, os.environ.get("CHROME", "/usr/bin/google-chrome"), sys.argv[2])
    fails = sum(1 for f in found if f[0] == "fail")
    notes = sum(1 for f in found if f[0] == "note")
    print(f"a11y pass: {len(pages)} pages; failures: {fails}; notes: {notes}; report {sys.argv[2]}")
    sys.exit(1 if fails else 0)
