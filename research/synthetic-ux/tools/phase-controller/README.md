# Same-page API phase controller (facilitator only)

Purpose: run the T14 and T15 transitions in [the evaluator guide](../../facilitator/evaluator-guide.md) (F14 and F15) reproducibly. The sequence is healthy, then one named fault, then recovery. The actor's page stays mounted throughout, and the task does not change (#42).

**Facilitator material.** Do not show this directory, the socket path, phase names or the replies to a synthetic actor. Actors get only the registered brief and the web URL, as `AGENTS.md` requires.

## What it does

- `controller.py serve` starts two processes on loopback ports you choose:
  - one built Next.js web server;
  - one fixture API, with one disposable development key held only in memory.
- Each phase request touches only the API process. It stops the API and starts it again:
  - with the same port and key;
  - with the existing guarded harness configuration: `OZSB_HARNESS_CONTROLS=enabled`, `OZSB_HARNESS_ENV=isolated-local-test`, a loopback host and `OZSB_HARNESS_FAULT=<phase>`.

  The web process, the origin and the open page are left alone. No product, contract or launcher code changes. `apps/api/src/config.ts` still refuses unsafe combinations at startup.
- Phases are changed only through a private Unix socket: a 0700 temporary directory containing a 0600 socket. There is no browser parameter, header, HTTP route or TCP listener for phases.
- Before a phase is reported ready, the controller sends one authenticated probe straight to the API (`prototype support`, QLD, prototype stage) and checks the expected response:

| Phase | Ready only when the probe returns |
| --- | --- |
| `none` | 200 `answer`, `retrieval_mode: fixture`, prerequisite sequence present |
| `vector_timeout` | 504 `retrieval_timeout` |
| `budget_exhausted` | 429 `budget_exhausted` with `Retry-After` |
| `graph_unavailable` | 200 `answer`, `retrieval_mode: fixture_passages_only`, sequence omitted, `graph_unavailable` warning |

  Graph degradation is a successful passage-only answer. It is not interchangeable with the two error faults, and the checks reject it as either one. A mismatch replies `ok: false` with "do not release an actor".
- Every reply and the optional `--log` JSONL include the API PID and the web PID, the API port, the key ID (never the key) and the probe summary. The summary is status, codes and modes only, with no answer text.
- The raw key is never printed or written to disk. Log lines and replies containing it are refused. At cleanup the child output is scanned for it, and finding it fails cleanup.

## Procedure

From the repository root, after `npm ci` and `npm run build`:

```sh
python research/synthetic-ux/tools/phase-controller/controller.py serve \
  --web-port 3120 --api-port 3920 --log runs/<run>/phases.jsonl
```

The first output line is JSON with `socket` and `web_url`. Keep that terminal private. In a second facilitator terminal, with `SOCK` set to that path:

```sh
CTL=research/synthetic-ux/tools/phase-controller/phasectl.py
python $CTL "$SOCK" status
python $CTL "$SOCK" phase vector_timeout   # exit 0 = probed and ready
```

Run each T15 variant separately, in its own fresh browser context and with its own actor:

1. **Setup.** `phase none`, then exit 0. Open `web_url` and seed the returning Idea-stage state through your setup (not through the actor brief). Record the setup in the run log.
2. **Fault.** `phase vector_timeout`, `phase budget_exhausted` or `phase graph_unavailable`. Release the actor only after exit 0. The actor changes the stage to prototype on the same page.
3. **Recovery.** `phase none`, then exit 0. Retry or resubmit happens on the same page.
4. **Next variant.** Start again at step 1 with a new context and a new actor.

`phase` replies take a few seconds because they wait for the restarted API to be live and probed. Leave the actor idle until the reply arrives. A request made during the restart window gets a transport failure, which is a different condition from the named fault.

Finish with `python $CTL "$SOCK" stop`, or Ctrl-C the controller. Both stop both processes, remove the private directory and print a `cleanup` line. Check that it reports `ok: true`, `raw_key_found_in: []` and both ports free.

## Checks

- `python -m unittest research/synthetic-ux/tools/test_phase_controller.py -v` runs the mechanics tests against [`fake_service.py`](fake_service.py), with no build needed. The persona-pack CI job runs them through the existing `discover`. They cover:
  - each phase in turn, with the web PID kept and the API port and key unchanged;
  - the guarded child environment;
  - probe mismatches;
  - socket and file modes;
  - key secrecy, including a deliberately leaking child;
  - busy ports;
  - web exit;
  - cleanup.
- `OZSB_PHASE_BROWSER=1` with a build and Python Playwright also runs [`browser_check.py`](browser_check.py) through the real web and API. For each of the three variants, on one mounted page, it checks:
  - an Idea answer;
  - the named fault after a prototype stage edit, with the draft kept and an earlier answer labelled `Stale … for the Idea stage … Stage: Working prototype` (graph shows the passage-only notice instead);
  - recovery to a prototype answer with a sequence;
  - one document load and the same in-page marker throughout.

  Run it directly to keep the screenshots: `python research/synthetic-ux/tools/phase-controller/browser_check.py --out <dir>`. PNGs must go through Git LFS if committed.

## Limits

- `budget_exhausted` is the simulated harness fault, not a real ledger state, so 429 in the UI says nothing about budget accounting. Restarting the API also resets the in-process daily allowance; see [build-25-fixture-ui.md](../../facilitator/build-25-fixture-ui.md).
- `browser_check.py` is a primed, scripted regression: it knows the outcomes it asserts. It is not an actor session and establishes no UX outcome. An independent verifier still needs to observe the browser transitions.
- T14 still needs actual 200% browser zoom evidence under #9. This controller does not provide zoom.
- One controller serves one session at a time. A phase is global to its API, so actor sessions sharing a controller must run in series.
