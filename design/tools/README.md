# Design export validation

## Required visual inspection after validation

A passing renderer is the start of visual review, not visual sign-off. Follow the [visual quality standard](../../docs/ux/visual-quality.md): inspect the results, rank the biggest visual weaknesses, refine them and inspect again. Offline renders use the [pinned-font contract](FONTS.md): local OFL faces, explicit loading and Chromium painted-glyph checks. Missing faces, unsupported weights/styles and fallback glyphs fail the render. A CSS font-family declaration or network access alone is not proof. Preserve before/after evidence with version identifiers. Automated geometry and image checks cannot establish polished composition or replace this review.

## Render the exports

The renderer already includes the bounds check added in PR #5 (`542fa5d`). Run from the repository root with Python 3, Playwright, Chromium/Chrome and React 18 installed:

```sh
python -m venv /tmp/osb-render-venv
/tmp/osb-render-venv/bin/pip install playwright==1.51.0
/tmp/osb-render-venv/bin/python -m playwright install chromium
npm ci --prefix design/tools
export CHROME="$(/tmp/osb-render-venv/bin/python -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()')"
/tmp/osb-render-venv/bin/python design/tools/render.py design/tools/node_modules /tmp/osb-render-exports
```

An existing Chrome binary also works: set `CHROME` to its absolute path. The renderer defaults to `/usr/bin/google-chrome`. These commands install local development tools, not hosted services. The documented Playwright version is the version used for the maintenance regression run; upgrade deliberately and rerun the checks.

The renderer resolves the canvas's uploaded assets (`/_blob/<id>` references) through `design/mockups/assets.json` and reports any unmapped image as a page error. It checks the listed controls, paragraphs and headings against fixed `canvas.json` frames in both themes. It reports offending artboards/elements and exits 1 for bounds overflow or page errors. Component previews use full-page screenshots and have no fixed-frame bounds check. This is a targeted export check; it does not inspect every painted pixel, ancestor clipping or every possible text node.

## Accessibility pass

```sh
/tmp/osb-render-venv/bin/python design/tools/a11y_check.py design/tools/node_modules design/accessibility/automated-pass.md
```

Opens the same pages as the renderer (`render.py` exposes `build_pages()`) and records three separately labelled kinds of evidence: real keyboard input (Tab until the sequence returns to the document, bounded; every intended control reached in document order, nothing meant to be skipped reached, no trap; Shift+Tab retraces; the ochre ring read at each real stop), computed semantics (roles and accessible names from the browser's accessibility representation via Playwright's ARIA snapshot — every interactive role must have a computed name; `status`/`alert` regions listed) and structural DOM checks (captions, row headers, the map's list equivalent, alt and SVG labelling, `aria-pressed`, `lang`, phone target size), plus each artboard at 200 % zoom. It writes the committed report and exits 1 on a failure. `test_a11y_check.py` holds its negative cases: a `tabindex=-1` control is skipped by real Tab, a keyboard trap, a reverse-traversal trap on the first control (Shift+Tab stays on it, or cycles to another control instead of reaching the document — the reverse pass runs on a fresh page because a Chromium page that has already wrapped forward no longer exposes the document stop; a normal page reaches `body`, and a browser that wrapped natively would make this check inconclusive, not a pass), and normal one- and three-control pages exit in both directions and an unreachable control are reported, a missing ring on real keyboard focus is reported, hidden-only text yields no computed name, and `<label for>`/`aria-labelledby` do. No screen reader or assistive-technology user is involved — the snapshot is what assistive technology is given, not what any screen reader announces — and reflow can only be judged on the implemented fluid page.

## Regression tests

```sh
OSB_RENDER_NODE_MODULES=design/tools/node_modules \
  /tmp/osb-render-venv/bin/python -m unittest discover -s design/tools -p 'test_*.py' -v
```

The bounds check covers buttons, links, inputs, paragraphs, headings and also the evidence-state labels and status notices (`.osb-label`, `.osb-status`), which are the elements most likely to be clipped in a narrow rail.

Font regressions also reject missing files, corrupt font data, wrong package versions, absent bold faces and unsupported characters, and protect fixed heading/body wrapping with the intended faces.

The tests run the real renderer in temporary copies. They verify all committed boards and component previews, shrink SB3-Route to clip its supporting-passage button, inject a JavaScript error into the artboard, remove an asset mapping from `mockups/assets.json` (unmapped blob ID), delete a mapped brand file (mapped but missing), and move a canvas title note onto an artboard (layout overlap). Every negative case must fail in both themes and name the relevant failure. The working tree and committed PNGs are not modified. Missing dependencies are an error, not a skipped success.

## Continuous integration

`.github/workflows/checks.yml` runs `tokens_css.py --check` and this regression suite on every pull request and on pushes to `main`, rendering into the runner's temp directory; the PNGs under `design/exports/` remain a manual export step and are never written by CI. `design/tools/tokens_css.py` regenerates `design/system/tokens.css` from `tokens.json` (run it after a token change) and `--check` fails if the two disagree.

A successful run, locally or in CI, verifies pinned intended-font usage, authored export geometry and renderer failure handling. The font verification report is written beside the PNGs. It does not establish the private hosted artifact's exact font metrics, responsive layouts, keyboard/screen-reader behaviour, accessibility conformance, owner design approval or any founder UX outcome.
