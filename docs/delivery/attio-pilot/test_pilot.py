import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import pilot


class PilotTests(unittest.TestCase):
    def record(self):
        return dict(version=1, run_id="test", role="builder", agent="Codex", model="unknown",
                    issue_url="https://github.com/nissan/oz-startup-brain/issues/10",
                    base_sha="a" * 40, head_sha="b" * 40, catalog_sha256="c" * 64,
                    lesson_ids=["OSB-001"], capabilities=["local Python"],
                    context_disclosure="builder test fixture, not real verification",
                    checks=[dict(name="synthetic", kind="command", command="example only",
                                 status="pass", exit_code=0, observation="test data only",
                                 evidence=["fixture://not-real-evidence"])],
                    visual=dict(status="not-applicable", reason="tool-only test fixture"),
                    remaining=[], next_action="review evidence", cleanup="no services started")

    def test_catalog_sources_exist(self):
        catalog, digest = pilot.load_catalog()
        self.assertEqual(len(digest), 64)
        self.assertEqual(len(catalog["lessons"]), 8)

    def test_scope_and_unmatched_paths(self):
        catalog, _ = pilot.load_catalog()
        lessons, unmatched = pilot.select_lessons(["apps/web/src/components/Journey.tsx", "new-area/x.py"], catalog)
        ids = {l["id"] for l in lessons}
        self.assertIn("OSB-005", ids)
        self.assertNotIn("OSB-008", ids)
        self.assertEqual(unmatched, ["new-area/x.py"])

    def test_prefix_component_boundary_and_exact_file(self):
        catalog, _ = pilot.load_catalog()
        lessons, unmatched = pilot.select_lessons(["apps/web-other/x", "package.json"], catalog)
        self.assertNotIn("OSB-005", {l["id"] for l in lessons})
        self.assertIn("OSB-003", {l["id"] for l in lessons})
        # The general apps lesson matches, but the apps/web-only lesson must not.
        self.assertEqual(unmatched, [])

    def test_paths_reject_escape_and_control(self):
        for value in ["../secret", "/etc/passwd", "x/../../y", "a\nb", "a\\b", ".", ""]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                pilot.path_value(value)

    def test_empty_scope_rejected(self):
        catalog, _ = pilot.load_catalog()
        with self.assertRaises(ValueError):
            pilot.select_lessons([], catalog)

    def test_valid_structure_never_approves(self):
        result = pilot.validate_handoff(self.record(), "b" * 40)
        self.assertTrue(result["structurally_valid"])
        self.assertEqual(result["acceptance_decision"], "not-evaluated")

    def test_wrong_head_and_role_rejected(self):
        with self.assertRaises(ValueError):
            pilot.validate_handoff(self.record(), "d" * 40)
        record = self.record()
        record["role"] = "synthetic-actor"
        with self.assertRaises(ValueError):
            pilot.validate_handoff(record, "b" * 40)

    def test_fabricated_pass_bookkeeping_rejected(self):
        for change in [{"exit_code": 1}, {"exit_code": False}, {"evidence": []}]:
            record = self.record()
            record["checks"][0].update(change)
            with self.subTest(change=change), self.assertRaises(ValueError):
                pilot.validate_handoff(record, "b" * 40)

    def test_unrun_is_valid_but_visible(self):
        record = self.record()
        record["checks"][0].update(status="not-run", exit_code=None, evidence=[], observation="browser unavailable")
        record["remaining"] = ["browser check"]
        result = pilot.validate_handoff(record, "b" * 40)
        self.assertEqual(result["nonpassing_checks"], ["synthetic"])
        self.assertEqual(result["acceptance_decision"], "not-evaluated")

    def test_duplicate_checks_and_missing_visual_reason(self):
        record = self.record()
        record["checks"].append(copy.deepcopy(record["checks"][0]))
        with self.assertRaises(ValueError):
            pilot.validate_handoff(record, "b" * 40)
        record = self.record()
        record["visual"]["reason"] = ""
        with self.assertRaises(ValueError):
            pilot.validate_handoff(record, "b" * 40)

    def test_template_is_not_evidence(self):
        data = json.loads((pilot.HERE / "handoff.template.json").read_text())
        with self.assertRaises(ValueError):
            pilot.validate_handoff(data, "b" * 40)

    def test_real_git_rename_delete_spaces(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root, stderr=subprocess.DEVNULL).decode().strip()
            git("init")
            git("config", "user.name", "Test")
            git("config", "user.email", "test@example.invalid")
            (root / "old name.txt").write_text("same content\n")
            (root / "deleted.txt").write_text("deleted\n")
            git("add", ".")
            git("commit", "-m", "base")
            base = git("rev-parse", "HEAD")
            (root / "old name.txt").rename(root / "new name.txt")
            (root / "deleted.txt").unlink()
            git("add", "-A")
            git("commit", "-m", "head")
            head = git("rev-parse", "HEAD")
            with patch.object(pilot, "ROOT", root):
                self.assertEqual(sorted(pilot.git_paths(base, head)), ["deleted.txt", "new name.txt", "old name.txt"])

    def test_bad_git_ref_rejected_before_execution(self):
        with self.assertRaises(ValueError):
            pilot.git_paths("--output=/tmp/bad", "b" * 40)

    def test_cli_actor_role_rejected(self):
        result = subprocess.run(["python3", str(pilot.HERE / "pilot.py"), "context", "--role", "synthetic-actor", "--path", "apps/web"], capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(b"OSB-001", result.stdout)


if __name__ == "__main__":
    unittest.main()
