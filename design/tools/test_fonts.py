"""Font failures must stop sign-off; fixed specimens protect intended-font wrapping."""
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
import unittest
from playwright.sync_api import sync_playwright
from fonts import font_css, offline_page, verify_fonts


class FontTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modules = Path(os.environ.get('OSB_RENDER_NODE_MODULES', Path(__file__).parent / 'node_modules'))
        cls.css = font_css(cls.modules)
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'), args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def page(self, body, css=None, requests=None):
        page = offline_page(self.browser, viewport={'width': 390, 'height': 844})
        self.addCleanup(page.close)
        if requests is not None:
            page.on('request', lambda request: requests.append(request.url))
        page.set_content('<style>' + (self.css if css is None else css) + '</style>' + body)
        return page

    def test_missing_required_font_file_fails_before_rendering(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / '@fontsource-variable/fraunces'
            shutil.copytree(self.modules / '@fontsource-variable/fraunces', target)
            (target / 'files/fraunces-latin-full-normal.woff2').unlink()
            with self.assertRaisesRegex(ValueError, 'missing required face'):
                font_css(tmp)

    def test_package_version_mismatch_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / '@fontsource-variable/fraunces'
            target.mkdir(parents=True)
            (target / 'package.json').write_text(json.dumps({'version': '0.0.0'}))
            with self.assertRaisesRegex(ValueError, 'expected 5.3.0'):
                font_css(tmp)

    def test_heading_and_body_wrap_with_painted_custom_fonts_offline(self):
        requests = []
        page = self.page('<h1 style="margin:0;width:300px;font:600 28px/34px Fraunces">Clarify your IP position before applying</h1>'
                         '<p style="margin:0;width:300px;font:400 17px/26px Atkinson Hyperlegible">Ask your university contact before chasing a named program. Check who owns the prototype and what needs confirming.</p>', requests=requests)
        evidence = verify_fonts(page)
        self.assertEqual(evidence['text_runs'], 2)
        self.assertEqual(page.locator('h1,p').evaluate_all('(es)=>es.map(e=>e.getBoundingClientRect().height)'), [102, 104])
        self.assertEqual(page.locator('#osb-font-probe').count(), 0)
        self.assertEqual([r for r in requests if r.startswith(('http:', 'https:'))], [])

    def test_missing_bold_face_cannot_silently_match_regular(self):
        css = re.sub(r'@font-face\s*\{[^}]*font-family: \'Atkinson Hyperlegible\';[^}]*font-weight: 700;[^}]*\}', '', self.css)
        with self.assertRaisesRegex(ValueError, 'required face did not load: Atkinson Hyperlegible 700'):
            verify_fonts(self.page('<b style="font-family:Atkinson Hyperlegible">Bold</b>', css))

    def test_loaded_font_with_unsupported_glyph_cannot_pass(self):
        with self.assertRaisesRegex(ValueError, 'FONT (fallback|required face)'):
            verify_fonts(self.page('<p style="font:400 17px Atkinson Hyperlegible">Founder 漢</p>'))

    def test_corrupt_font_bytes_fail_in_browser(self):
        css = re.sub(r'data:font/woff2;base64,[A-Za-z0-9+/=]+', 'data:font/woff2;base64,AAAA', self.css)
        with self.assertRaises(Exception):
            verify_fonts(self.page('<p style="font:400 17px Atkinson Hyperlegible">Founder</p>', css))


if __name__ == '__main__':
    unittest.main()
