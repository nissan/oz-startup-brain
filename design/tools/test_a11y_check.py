"""Negative and positive cases for the accessibility checker's keyboard and semantics passes."""
import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import a11y_check  # noqa: E402

CHROME = os.environ.get("CHROME", "/usr/bin/google-chrome")
TOKENS = (Path(__file__).resolve().parents[1] / "system/tokens.css").read_text()
BUNDLE = (Path(__file__).resolve().parents[1] / "system/components/bundle.css").read_text()


def page_html(body):
    return f'<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><style>{TOKENS}{BUNDLE}</style></head><body>{body}</body></html>'


class A11yCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from playwright.sync_api import sync_playwright
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def open(self, body):
        page = self.browser.new_page(viewport={"width": 600, "height": 400})
        page.set_content(page_html(body))
        page.osb_body = body
        self.addCleanup(page.close)
        return page

    def keyboard(self, page):
        # The reverse pass runs on a new page holding the same document, as run() does.
        return a11y_check.keyboard_pass(page, "light", reopen=lambda: self.open(page.osb_body))

    def test_real_tab_skips_tabindex_minus_one_and_reaches_the_rest_in_order(self):
        page = self.open('<button class="osb osb-btn">First</button><button class="osb osb-btn" tabindex="-1">Skipped by Tab</button>'
                         '<a class="osb-link" href="#x">Link</a><button class="osb osb-btn">Last</button>')
        findings, trace = self.keyboard(page)
        self.assertEqual([f for f in findings if f[0] == "fail"], [], findings)
        self.assertEqual([(r, n) for r, n, _ in trace], [("button", "First"), ("link", "Link"), ("button", "Last")])

    def test_keyboard_trap_is_reported(self):
        page = self.open('<button class="osb osb-btn">Before</button>'
                         '<div id="trap"><button class="osb osb-btn" id="a">Trap A</button><button class="osb osb-btn" id="b">Trap B</button></div>'
                         '<button class="osb osb-btn">After</button>'
                         '<script>document.getElementById("trap").addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault();'
                         ' document.getElementById(document.activeElement.id === "a" ? "b" : "a").focus(); } });</script>')
        findings, trace = self.keyboard(page)
        self.assertTrue(any(f[0] == "fail" and "trap" in f[1].lower() for f in findings), findings)

    def test_reverse_trap_on_the_first_control_is_reported(self):
        page = self.open('<button class="osb osb-btn" id="first">First</button><button class="osb osb-btn">Second</button>'
                         '<script>document.getElementById("first").addEventListener("keydown", e => { if (e.key === "Tab" && e.shiftKey) e.preventDefault(); });</script>')
        findings, trace = self.keyboard(page)
        self.assertEqual([(r, n) for r, n, _ in trace], [("button", "First"), ("button", "Second")])
        self.assertTrue(any(f[0] == "fail" and "does not exit from the first control" in f[1] and "stays on it" in f[1] for f in findings), findings)

    def test_reverse_cycle_between_controls_is_reported(self):
        page = self.open('<button class="osb osb-btn" id="first">First</button><button class="osb osb-btn" id="last">Last</button>'
                         '<script>document.getElementById("first").addEventListener("keydown", e => { if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); document.getElementById("last").focus(); } });</script>')
        findings, trace = self.keyboard(page)
        self.assertEqual([(r, n) for r, n, _ in trace], [("button", "First"), ("button", "Last")])
        self.assertTrue(any(f[0] == "fail" and "does not exit from the first control" in f[1] and "another control" in f[1] for f in findings), findings)

    def test_normal_pages_exit_in_both_directions(self):
        for body in ('<button class="osb osb-btn">Only</button>',
                     '<button class="osb osb-btn">First</button><a class="osb-link" href="#x">Link</a><button class="osb osb-btn">Last</button>'):
            page = self.open(body)
            findings, trace = self.keyboard(page)
            self.assertEqual([f for f in findings if f[0] == "fail"], [], (body, findings))
            self.assertEqual(len(trace), body.count("<button") + body.count("<a "))

    def test_control_that_cannot_be_reached_is_reported(self):
        page = self.open('<button class="osb osb-btn">First</button>'
                         '<button class="osb osb-btn" id="x">Steals focus back</button>'
                         '<script>document.getElementById("x").addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault(); document.body.focus(); } });</script>'
                         '<button class="osb osb-btn">Never reached</button>')
        findings, trace = self.keyboard(page)
        self.assertTrue(any(f[0] == "fail" and "never reached" in f[1] for f in findings), findings)

    def test_missing_focus_ring_is_reported_on_real_keyboard_focus(self):
        page = self.open('<button class="osb osb-btn" style="outline: none">No ring</button>')
        findings, _ = self.keyboard(page)
        self.assertTrue(any(f[0] == "fail" and "no focus ring" in f[1] for f in findings), findings)

    def test_hidden_only_text_gives_no_computed_name(self):
        page = self.open('<button class="osb osb-btn"><span aria-hidden="true">Not an accessible name</span></button>')
        findings, regions, snap = a11y_check.semantics_pass(page)
        self.assertEqual(findings, [("fail", "button without a computed accessible name")], snap)

    def test_label_for_and_aria_labelledby_are_computed_names(self):
        page = self.open('<label for="t">Transcript</label><textarea id="t" class="osb-transcript__text"></textarea>'
                         '<input type="checkbox" id="c"><label for="c">Item one</label>'
                         '<span id="lbl">Open evidence</span><button class="osb-link" aria-labelledby="lbl">x</button>'
                         '<div role="status">Covers: Federal</div>')
        findings, regions, snap = a11y_check.semantics_pass(page)
        self.assertEqual(findings, [], snap)
        self.assertIn('textbox "Transcript"', snap)
        self.assertIn('checkbox "Item one"', snap)
        self.assertIn('button "Open evidence"', snap)
        self.assertEqual(regions["status"], ["Covers: Federal"])


if __name__ == "__main__":
    unittest.main()
