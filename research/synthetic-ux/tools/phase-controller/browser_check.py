#!/usr/bin/env python3
"""Primed browser check of the phase controller (#42): one mounted page per T15 variant.

For each variant (vector_timeout, budget_exhausted, graph_unavailable) this opens ONE page, gets an
Idea-stage answer while the API is healthy, asks the controller for the named fault, edits the stage
to Working prototype on the same page, asks the controller for `none`, then recovers on the same page.
It asserts that the page never navigated or reloaded, that the web process and API port/key stayed
the same, and that draft, stale-answer and answer-context labelling are what F14/F15 need.

This is a scripted regression of the controller and the existing UI, not an actor session: it knows
the expected outcomes and clicks them. It establishes no UX outcome.

  python research/synthetic-ux/tools/phase-controller/browser_check.py --out DIR [--web-port 3121 --api-port 3921]

Needs `npm run build` and Python Playwright with Chromium. Writes DIR/report.json and per-step PNGs
(do not commit the PNGs without Git LFS). Exit status 0 only when every assertion passed.
"""
from __future__ import annotations

import argparse
import json
import re
import secrets
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from phasectl import request  # noqa: E402

QUESTION = 'What should I do next for support?'
VARIANTS = ('vector_timeout', 'budget_exhausted', 'graph_unavailable')


def run(out: Path, web_port: int, api_port: int) -> dict:
    from playwright.sync_api import expect, sync_playwright

    out.mkdir(parents=True, exist_ok=True)
    log = out / 'phases.jsonl'
    ctl = subprocess.Popen([sys.executable, str(HERE / 'controller.py'), 'serve', '--web-port', str(web_port), '--api-port', str(api_port), '--log', str(log)],
                           stdout=subprocess.PIPE, text=True)
    report: dict = {'web_port': web_port, 'api_port': api_port, 'variants': {}, 'ok': False}
    started: dict = {}
    try:
        started = json.loads(ctl.stdout.readline())
        if not started.get('ok'):
            raise AssertionError(f'controller did not start: {started}')
        sock, web_url = started['socket'], started['web_url']
        report['start'] = {k: started[k] for k in ('phase', 'api_pid', 'web_pid', 'api_port', 'key_id')}

        def phase(name: str) -> dict:
            reply = request(sock, {'op': 'phase', 'phase': name})
            assert reply.get('ok'), f'phase {name} not ready: {reply}'
            assert reply['web_pid'] == started['web_pid'] and reply['web_preserved'], 'web process changed'
            assert reply['api_port'] == api_port and reply['key_id'] == started['key_id'], 'API port or key changed'
            return {k: reply[k] for k in ('phase', 'api_pid', 'api_starts', 'web_pid', 'probe')}

        with sync_playwright() as p:
            browser = p.chromium.launch()
            for variant in VARIANTS:
                steps: list[dict] = []
                ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, device_scale_factor=1)
                page = ctx.new_page()
                navigations: list[str] = []  # includes same-document (history) navigations
                loads: list[str] = []  # full document loads only
                page.on('framenavigated', lambda f: f == page.main_frame and navigations.append(f.url))
                page.on('load', lambda pg: loads.append(pg.url))
                report['variants'][variant] = {'ok': False, 'steps': steps, 'navigations': navigations, 'document_loads': loads}
                steps.append({'step': 'healthy before load', **phase('none')})
                page.goto(web_url)
                mount = secrets.token_hex(8)
                page.evaluate('m => { window.__phaseMount = m; }', mount)

                # 1. Idea-stage answer while healthy.
                page.get_by_role('button', name=re.compile('Stage: Not set')).click()
                page.locator('.context-editor__option', has_text=re.compile('^Idea$')).click()
                page.get_by_role('button', name='Save stage').click()
                page.get_by_label('Your question').fill(QUESTION)
                page.get_by_role('button', name='Ask the planner').click()
                page.get_by_role('button', name='Queensland', exact=True).click()
                expect(page.locator('#results-heading')).to_have_text('Your next steps')
                expect(page.get_by_text(re.compile('Answer context — Stage: Idea'))).to_be_visible()
                idea_first = page.get_by_role('article').first.get_by_role('heading').first.inner_text()
                page.screenshot(path=str(out / f'{variant}-1-idea-healthy.png'), full_page=True)
                steps.append({'step': 'idea answer', 'first_action': idea_first})

                # 2. Named fault, then a prototype-stage edit on the same page.
                steps.append({'step': 'fault', **phase(variant)})
                page.get_by_role('button', name=re.compile('Stage: Idea')).click()
                page.locator('.context-editor__option', has_text=re.compile('^Working prototype$')).click()
                page.get_by_role('button', name='Save stage').click()
                expect(page.locator('#results-heading')).not_to_have_text('Working on your question')
                if variant == 'graph_unavailable':
                    expect(page.locator('#results-heading')).to_have_text('Your next steps')
                    expect(page.get_by_text('Graph unavailable: passage evidence only')).to_be_visible()
                    expect(page.get_by_role('img', name=re.compile('Prerequisite sequence'))).to_have_count(0)
                    expect(page.get_by_text(re.compile('Answer context — Stage: Working prototype'))).to_be_visible()
                    expect(page.locator('.stale')).to_have_count(0)
                else:
                    expect(page.locator('#results-heading')).to_have_text('The planner could not answer')
                    title = 'Source retrieval did not finish' if variant == 'vector_timeout' else 'Today’s query allowance is used up'
                    expect(page.get_by_text(title)).to_be_visible()
                    expect(page.get_by_text('Your draft, kept')).to_be_visible()
                    expect(page.get_by_label('Your question')).to_have_value(QUESTION)
                    stale = page.locator('.stale')
                    expect(stale).to_contain_text('Stale')
                    expect(stale).to_contain_text('for the Idea stage')
                    expect(stale).to_contain_text('Stage: Working prototype')
                page.screenshot(path=str(out / f'{variant}-2-fault-prototype.png'), full_page=True)
                steps.append({'step': 'fault observed on mounted page', 'heading': page.locator('#results-heading').inner_text()})

                # 3. Recovery on the same page.
                steps.append({'step': 'recover', **phase('none')})
                if variant == 'graph_unavailable':
                    page.get_by_role('button', name='Ask the planner').click()
                else:
                    page.get_by_role('button', name=re.compile('^Try again')).click()
                expect(page.locator('#results-heading')).to_have_text('Your next steps')
                expect(page.locator('.stale')).to_have_count(0)
                expect(page.get_by_text(re.compile('Answer context — Stage: Working prototype'))).to_be_visible()
                expect(page.get_by_role('img', name=re.compile('Prerequisite sequence'))).to_be_visible()
                proto_first = page.get_by_role('article').first.get_by_role('heading').first.inner_text()
                assert proto_first != idea_first, 'prototype route did not differ from the idea route'
                page.screenshot(path=str(out / f'{variant}-3-recovered.png'), full_page=True)
                steps.append({'step': 'recovered', 'first_action': proto_first})

                same_mount = page.evaluate('() => window.__phaseMount') == mount
                assert same_mount, 'page was reloaded or replaced'
                assert len(loads) == 1, f'{len(loads)} document loads: {loads}'
                assert all(u.startswith(web_url) for u in navigations), f'left the origin: {navigations}'
                report['variants'][variant].update({'ok': True, 'same_mounted_page': same_mount})
                ctx.close()
            browser.close()
        report['ok'] = all(v['ok'] for v in report['variants'].values()) and len(report['variants']) == len(VARIANTS)
    except Exception as e:  # recorded, then re-raised as a failing exit status
        report['error'] = f'{type(e).__name__}: {e}'
    finally:
        try:
            if not started.get('socket'):
                raise OSError('no control socket')
            request(started['socket'], {'op': 'stop'}, timeout=30)
        except Exception:
            ctl.terminate()
        try:
            rest = ctl.communicate(timeout=60)[0]
        except subprocess.TimeoutExpired:
            ctl.kill()
            rest = ctl.communicate()[0]
        lines = [json.loads(x) for x in rest.splitlines() if x.strip().startswith('{')]
        cleanup = next((x for x in reversed(lines) if x.get('op') == 'cleanup'), None)
        report['cleanup'] = cleanup
        report['ok'] = bool(report['ok'] and cleanup and cleanup['ok'] and cleanup['api_port_free'] and cleanup['web_port_free'])
        (out / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--web-port', type=int, default=3121)
    ap.add_argument('--api-port', type=int, default=3921)
    a = ap.parse_args()
    report = run(a.out, a.web_port, a.api_port)
    print(json.dumps({'ok': report['ok'], 'error': report.get('error'), 'report': str(a.out / 'report.json')}))
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    sys.exit(main())
