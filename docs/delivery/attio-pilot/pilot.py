#!/usr/bin/env python3
"""Read-only context selection and handoff linting; no model calls or approvals."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ROLES = {"builder", "reviewer", "verifier", "coordinator"}
SHA = re.compile(r"[0-9a-f]{40}\Z")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def path_value(value):
    require(isinstance(value, str) and bool(value.strip()), "path must be nonempty")
    require(not any(ord(c) < 32 for c in value), "control character in path")
    require("\\" not in value and not value.startswith("/"), "use repository-relative POSIX paths")
    require(".." not in PurePosixPath(value).parts, "parent traversal is not allowed")
    result = str(PurePosixPath(value))
    require(result != ".", "specify a file or directory path")
    return result


def load_catalog():
    raw = (HERE / "lessons.json").read_bytes()
    data = json.loads(raw)
    require(data.get("version") == 1, "unsupported catalog version")
    require(isinstance(data.get("lessons"), list), "lessons must be a list")
    seen = set()
    for lesson in data["lessons"]:
        require(isinstance(lesson, dict), "lesson must be an object")
        for field in ("id", "rule", "counterexample", "check"):
            require(isinstance(lesson.get(field), str) and lesson[field].strip(), f"missing lesson {field}")
        require(lesson["id"] not in seen, "duplicate lesson id")
        seen.add(lesson["id"])
        require(type(lesson.get("always")) is bool, "always must be boolean")
        require(isinstance(lesson.get("prefixes"), list), "prefixes must be a list")
        require(lesson["always"] or lesson["prefixes"], "lesson has no selector")
        for prefix in lesson["prefixes"]:
            path_value(prefix)
        require(isinstance(lesson.get("sources"), list) and lesson["sources"], "sources required")
        for source in lesson["sources"]:
            resolved = (ROOT / path_value(source)).resolve()
            require(resolved.is_relative_to(ROOT) and resolved.is_file(), f"missing or escaped lesson source: {source}")
    return data, hashlib.sha256(raw).hexdigest()


def select_lessons(paths, catalog):
    paths = sorted({path_value(p) for p in paths})
    require(paths, "at least one path is required")
    matched_paths = set()
    selected = []
    for lesson in catalog["lessons"]:
        matches = [p for p in paths if any(
            p == prefix.rstrip("/") or p.startswith(prefix.rstrip("/") + "/")
            for prefix in lesson["prefixes"])]
        matched_paths.update(matches)
        if lesson["always"] or matches:
            selected.append({**lesson, "matched_paths": matches,
                             "selection_reason": "all development roles" if lesson["always"] else "path prefix"})
    return selected, sorted(set(paths) - matched_paths)


def git_paths(base, head):
    require(SHA.fullmatch(base) and SHA.fullmatch(head), "base and head must be full lowercase commit SHAs")
    # No shell evaluation; no rename detection means both old and new paths survive.
    result = subprocess.run(["git", "diff", "--name-only", "-z", "--no-renames", base, head, "--"],
                            cwd=ROOT, check=True, capture_output=True)
    return [p.decode("utf-8") for p in result.stdout.split(b"\0") if p]


def validate_handoff(data, expected_head):
    require(isinstance(data, dict), "handoff must be an object")
    require(SHA.fullmatch(expected_head), "expected head must be a full lowercase commit SHA")
    require(data.get("version") == 1, "unsupported handoff version")
    for field in ("run_id", "agent", "model", "issue_url", "context_disclosure", "next_action", "cleanup"):
        require(isinstance(data.get(field), str) and data[field].strip(), f"missing {field}")
    require(data.get("role") in ROLES, "unsupported development role")
    for field in ("base_sha", "head_sha"):
        require(isinstance(data.get(field), str) and SHA.fullmatch(data[field]), f"invalid {field}")
    require(data["head_sha"] == expected_head, "handoff head does not match expected head")
    for field in ("lesson_ids", "capabilities", "remaining", "checks"):
        require(isinstance(data.get(field), list), f"{field} must be a list")
    for field in ("lesson_ids", "capabilities", "remaining"):
        require(all(isinstance(v, str) and v.strip() for v in data[field]), f"invalid {field} entry")
    require(isinstance(data.get("catalog_sha256"), str) and re.fullmatch(r"[0-9a-f]{64}", data["catalog_sha256"]), "invalid catalog hash")
    require(data["checks"], "record at least one performed or unrun check")
    names = set()
    for check in data["checks"]:
        require(isinstance(check, dict), "check must be an object")
        for field in ("name", "kind", "status", "observation"):
            require(isinstance(check.get(field), str) and check[field].strip(), f"missing check {field}")
        require(check["name"] not in names, "duplicate check name")
        names.add(check["name"])
        require(check["kind"] in {"command", "manual"}, "unknown check kind")
        require(check["status"] in {"pass", "fail", "blocked", "not-run"}, "unknown check status")
        refs = check.get("evidence")
        require(isinstance(refs, list) and all(isinstance(r, str) and r.strip() for r in refs), "evidence must be a list of references")
        if check["status"] in {"pass", "fail"}:
            require(refs, "performed check requires evidence references")
        if check["kind"] == "command":
            require(isinstance(check.get("command"), str) and check["command"].strip(), "command text required")
            code = check.get("exit_code")
            if check["status"] == "pass":
                require(type(code) is int and code == 0, "passing command must have exit_code 0")
            elif check["status"] == "fail":
                require(type(code) is int and code != 0, "failed command must have nonzero exit_code")
            else:
                require(code is None, "unrun/blocked command must use null exit_code; record an attempted failure separately")
        else:
            require(check.get("exit_code") is None, "manual check has no exit_code")
    require(isinstance(data.get("visual"), dict), "visual record required")
    require(data["visual"].get("status") in {"performed", "pending", "not-applicable"}, "invalid visual status")
    require(isinstance(data["visual"].get("reason"), str) and data["visual"]["reason"].strip(), "visual reason required")
    return {"structurally_valid": True, "acceptance_decision": "not-evaluated",
            "head_sha": expected_head, "checks": len(data["checks"]),
            "nonpassing_checks": [c["name"] for c in data["checks"] if c["status"] != "pass"],
            "remaining": data["remaining"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="operation", required=True)
    context = sub.add_parser("context")
    context.add_argument("--role", required=True, choices=sorted(ROLES))
    context.add_argument("--path", action="append", default=[])
    context.add_argument("--base")
    context.add_argument("--head")
    validate = sub.add_parser("validate")
    validate.add_argument("file", type=Path)
    validate.add_argument("--head", required=True)
    args = parser.parse_args()
    try:
        if args.operation == "context":
            require(bool(args.base) == bool(args.head), "supply both base and head")
            require(not (args.path and args.base), "use paths OR a commit pair")
            paths = git_paths(args.base, args.head) if args.base else args.path
            catalog, digest = load_catalog()
            lessons, unmatched = select_lessons(paths, catalog)
            result = {"role": args.role, "base_sha": args.base, "head_sha": args.head,
                      "catalog_sha256": digest, "lessons": lessons, "unmatched_paths": unmatched,
                      "notice": "Supplement to mandatory instructions; not a permission boundary or complete risk analysis."}
        else:
            result = validate_handoff(json.loads(args.file.read_text()), args.head)
        print(json.dumps(result, indent=2))
        return 0
    except (ValueError, OSError, subprocess.CalledProcessError, UnicodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
