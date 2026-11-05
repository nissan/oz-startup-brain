#!/usr/bin/env python3
"""Generate design/system/tokens.css from design/system/tokens.json, or check that it matches.

    python3 design/tools/tokens_css.py          # rewrite tokens.css from tokens.json
    python3 design/tools/tokens_css.py --check  # exit 1 if tokens.css differs from what tokens.json produces

tokens.json is the source (it is the design-system artifact's token file); tokens.css is the
compiled form that the component previews and the mock-ups load. The two must agree, so CI runs
the check and a re-export regenerates the file. The output format is fixed here so that the check
is byte-exact; change it deliberately and regenerate.
"""
import json
import os
import sys

SYSTEM = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "system")
JSON_PATH = os.path.normpath(os.path.join(SYSTEM, "tokens.json"))
CSS_PATH = os.path.normpath(os.path.join(SYSTEM, "tokens.css"))


def render(tokens):
    themes = [t["id"] for t in tokens["color"]["themes"]]
    colours = tokens["color"]["tokens"]
    out = [f"/* {tokens['name']} — generated from tokens.json */"]
    for theme in themes:
        selector = ':root, [data-theme="light"]' if theme == themes[0] else f'[data-theme="{theme}"]'
        out.append(selector + " {")
        for token in colours:
            out.append(f"  --{token['name']}: {token['value'][theme]};")
        out.append("}")
    out.append(":root {")
    for token in tokens["spacing"]["tokens"]:
        out.append(f"  --{token['name']}: {token['value']};")
    for token in tokens["radius"]["tokens"]:
        out.append(f"  --{token['name']}: {token['value']};")
    for key, stack in tokens["type"]["families"].items():
        out.append(f"  --font-{key}: {stack};")
    out.append("}")
    for group in tokens["type"]["groups"]:
        family = f"var(--font-{group['family']})"
        for style in group["styles"]:
            parts = [f"font-family: {family}", f"font-size: {style['fontSize']}",
                     f"line-height: {style['lineHeight']}", f"font-weight: {style['fontWeight']}"]
            if style.get("letterSpacing"):
                parts.append(f"letter-spacing: {style['letterSpacing']}")
            out.append(f".{style['name']} {{ {'; '.join(parts)}; }}")
    return "\n".join(out) + "\n"


def main(argv):
    with open(JSON_PATH, encoding="utf-8") as f:
        expected = render(json.load(f))
    if "--check" in argv:
        with open(CSS_PATH, encoding="utf-8") as f:
            actual = f.read()
        if actual != expected:
            exp_lines, act_lines = expected.splitlines(), actual.splitlines()
            for i, (a, b) in enumerate(zip(act_lines, exp_lines), 1):
                if a != b:
                    print(f"tokens.css line {i} differs from tokens.json:\n  css : {a}\n  json: {b}")
                    break
            else:
                print(f"tokens.css has {len(act_lines)} lines; tokens.json produces {len(exp_lines)}")
            print("FAIL tokens-css: regenerate with python3 design/tools/tokens_css.py")
            return 1
        print(f"PASS tokens-css: tokens.css matches tokens.json ({len(expected.splitlines())} lines)")
        return 0
    with open(CSS_PATH, "w", encoding="utf-8") as f:
        f.write(expected)
    print(f"wrote {CSS_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
