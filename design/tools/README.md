# Design export validation

## Required visual inspection after validation

A passing renderer is the start of visual review, not visual sign-off. Follow the [visual quality standard](../../docs/ux/visual-quality.md): inspect the results, rank the biggest visual weaknesses, refine them and inspect again. Offline renders with verified intended fonts from pinned local `@fontsource` packages are sanctioned once [#22](https://github.com/nissan/oz-startup-brain/issues/22) lands; until then, typography sign-off requires an actual browser/artifact/build with verified loading and use of those faces, and fallback-font exports leave it incomplete. A CSS font-family declaration or network access alone is not proof. Preserve before/after evidence with version identifiers. Automated geometry and image checks cannot establish polished composition or replace this review.

## Render the exports

The renderer already includes the bounds check added in PR #5 (`542fa5d`). Run from the repository root with Python 3, Playwright, Chromium/Chrome and React 18 installed:

```sh
python -m venv /tmp/osb-render-venv
/tmp/osb-render-venv/bin/pip install playwright==1.51.0
/tmp/osb-render-venv/bin/python -m playwright install chromium
npm install --prefix /tmp/osb-render react@18.3.1 react-dom@18.3.1
export CHROME="$(/tmp/osb-render-venv/bin/python -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()')"
/tmp/osb-render-venv/bin/python design/tools/render.py /tmp/osb-render/node_modules /tmp/osb-render-exports
```

An existing Chrome binary also works: set `CHROME` to its absolute path. The renderer defaults to `/usr/bin/google-chrome`. These commands install local development tools, not hosted services. The documented Playwright version is the version used for the maintenance regression run; upgrade deliberately and rerun the checks.

The renderer resolves the canvas's uploaded assets (`/_blob/<id>` references) through `design/mockups/assets.json` and reports any unmapped image as a page error. It checks the listed controls, paragraphs and headings against fixed `canvas.json` frames in both themes. It reports offending artboards/elements and exits 1 for bounds overflow or page errors. Component previews use full-page screenshots and have no fixed-frame bounds check. This is a targeted export check; it does not inspect every painted pixel, ancestor clipping or every possible text node.

## Regression tests

```sh
OSB_RENDER_NODE_MODULES=/tmp/osb-render/node_modules \
  /tmp/osb-render-venv/bin/python -m unittest discover -s design/tools -p 'test_*.py' -v
```

The tests run the real renderer in temporary copies. They verify all committed boards and component previews, shrink SB3-Route to clip its supporting-passage button, inject a JavaScript error into the artboard, remove an asset mapping from `mockups/assets.json` (unmapped blob ID), delete a mapped brand file (mapped but missing), and move a canvas title note onto an artboard (layout overlap). Every negative case must fail in both themes and name the relevant failure. The working tree and committed PNGs are not modified. Missing dependencies are an error, not a skipped success.

## Continuous integration

`.github/workflows/checks.yml` runs `tokens_css.py --check` and this regression suite on every pull request and on pushes to `main`, rendering into the runner's temp directory; the PNGs under `design/exports/` remain a manual export step and are never written by CI. `design/tools/tokens_css.py` regenerates `design/system/tokens.css` from `tokens.json` (run it after a token change) and `--check` fails if the two disagree.

A successful run, locally or in CI, checks fallback-font export geometry and renderer failure handling only. It does not establish the private hosted artifact's exact font metrics, responsive layouts, keyboard/screen-reader behaviour, accessibility conformance, owner design approval or any founder UX outcome.
