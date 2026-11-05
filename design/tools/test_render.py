"""Exercise the real renderer on isolated copies, including failure cases."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

DESIGN = Path(__file__).resolve().parents[1]


class RenderRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modules = Path(os.environ.get('OSB_RENDER_NODE_MODULES', '/tmp/osb-render/node_modules')).resolve()
        if not (cls.modules / 'react/umd/react.production.min.js').is_file():
            raise RuntimeError('Install React 18 dependencies and set OSB_RENDER_NODE_MODULES; see design/tools/README.md')

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.design = self.root / 'design'
        for folder in ('system', 'mockups'):
            shutil.copytree(DESIGN / folder, self.design / folder)
        (self.design / 'tools').mkdir()
        shutil.copy(DESIGN / 'tools/render.py', self.design / 'tools/render.py')

    def render(self):
        return subprocess.run([sys.executable, str(self.design / 'tools/render.py'),
                               str(self.modules), str(self.root / 'exports')],
                              capture_output=True, text=True, timeout=180)

    def only_route(self):
        # Keep failures fast while using the actual component bundle and artboard.
        for source in (self.design / 'mockups').glob('*.dc.html'):
            if source.name != 'SB3-Route.dc.html':
                source.unlink()
        for preview in (self.design / 'system/components').glob('*/preview.html'):
            preview.unlink()

    def test_all_committed_boards_and_component_previews_render(self):
        result = self.render()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('page errors: none ; bounds overflow: 0', result.stdout)
        boards = json.loads((self.design / 'mockups/canvas.json').read_text())['boards']
        for source in boards:
            for theme in ('light', 'dark'):
                png = self.root / 'exports/mockups' / (source.removesuffix('.dc.html') + f'-{theme}.png')
                self.assertTrue(png.is_file(), png)

    def test_clipped_recovery_control_fails_in_both_themes(self):
        self.only_route()
        path = self.design / 'mockups/canvas.json'
        canvas = json.loads(path.read_text())
        canvas['boards']['SB3-Route.dc.html']['h'] = 600
        path.write_text(json.dumps(canvas))
        result = self.render()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        for theme in ('light', 'dark'):
            self.assertIn(f"BOUNDS mockups/SB3-Route-{theme}: BUTTON 'Show supporting passage'", result.stdout)
        self.assertIn('bottom=', result.stdout)

    def test_javascript_error_fails_in_both_themes(self):
        self.only_route()
        path = self.design / 'mockups/SB3-Route.dc.html'
        text = path.read_text()
        self.assertIn('renderVals() {', text)
        path.write_text(text.replace('renderVals() {', 'renderVals() { throw new Error("injected-render-failure");', 1))
        result = self.render()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn('injected-render-failure', result.stdout)
        for theme in ('light', 'dark'):
            self.assertIn(f'mockups/SB3-Route-{theme}', result.stdout)


if __name__ == '__main__':
    unittest.main()
