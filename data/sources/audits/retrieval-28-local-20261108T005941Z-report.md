# Local Queensland retrieval — retrieval-28-local-20261108T005941Z

Refs #28. Owner-authorised local retrieval and evidence collection only ([decision](https://github.com/nissan/oz-startup-brain/issues/28#issuecomment-6715324855)). Claude retains source-review ownership; Codex retains #45. This is retrieval-operator verification, not independent source review or human factual confirmation.

## Identity

- Base: `080573c9a5e4cfc3c87dd492349b2585532f2d3f` (fresh origin/main).
- Branch: `retrieval/28-local-20394-20261108`; isolated clean worktree.
- Python: 3.15.2 (local; CI uses Python 3.12).
- Run: `retrieval-28-local-20261108T005941Z`; tool 0.3; direct HTTPS with the existing honest User-Agent.
- Exact published head/tree are recorded in the PR handoff rather than embedded in their own commit.

## Outcomes

| Source | HTTP | Bytes | Representation assessment |
| --- | --- | ---: | --- |
| Ignite Ideas Fund (`src_8db3776594ab`) | 200 | 39940 | Program-page HTML; not an empty application shell or detected challenge |
| Ignite+ (`src_5dcbf23541e6`) | 200 | 36855 | Program-page HTML; not an empty application shell or detected challenge |
| Ignite Spark (`src_d1313206eafa`) | 200 | 36194 | Program-page HTML; not an empty application shell or detected challenge |

Each requested discovery URL followed normal redirects to its corresponding `innovation.qld.gov.au` program URL (exact final URLs in the log). One script invocation, one attempt per source; no explicit redirect-target retries, cookies, identity spoofing, proxy rotation or challenge bypass. Historical 403 results remain unchanged.

Private representation inspection: each saved body has a main region, one matching program heading, multiple content headings and substantive paragraphs. The Ideas/Spark bodies contain application and eligibility material; Ignite+ contains program/support material rather than an application form. None contains the inspected visible denial/human-verification/challenge markers. This is a bounded static HTML assessment, not a browser rendering or a factual/rights review. HTTP 200 alone was not used as the acceptance criterion.

All three snapshot SHA-256 hashes and byte sizes were independently recomputed from saved bytes and match the log. The log-derived source version IDs identify fetched representations only; none is promoted to a reviewed manifest version. Bodies remain private outside the repository; no passages or private filesystem paths are included here.

## Commands

From the repository root (the operator supplied an outside-repository private snapshot directory):

```sh
ozsb_run_id="retrieval-28-local-20261108T005941Z"
python3 data/sources/tools/fetch_metadata.py --network --transport direct \
  --run-id "$ozsb_run_id" --snapshot-dir "$ozsb_snapshot_dir" \
  --source-id src_8db3776594ab --source-id src_5dcbf23541e6 \
  --source-id src_d1313206eafa \
  --output "data/sources/audits/$ozsb_run_id.json"
python3 data/sources/tools/source_audit.py validate
python3 data/sources/tools/source_audit.py report --check
python3 -m unittest discover -s data/sources/tools -p 'test_*.py'
```

The new, unregistered log was validated **directly**, not merely through the ordinary validator:

```python
import json, sys
from pathlib import Path
sys.path.insert(0, 'data/sources/tools')
import source_audit
manifest = json.loads(Path('data/sources/article-bibliography.json').read_text())
filename = 'audits/retrieval-28-local-20261108T005941Z.json'
log = json.loads((Path('data/sources') / filename).read_text())
assert source_audit.validate_retrieval_log(manifest, log, filename) == []
```

Results: direct new-log validation PASS; ordinary source validation PASS; generated report drift check PASS; source tests **68/68 PASS**. The ordinary validator still reports only the two previously registered runs/four reviewed versions; this new log intentionally remains unregistered. The test suite emitted a non-failing HTTPError ResourceWarning from an existing fixture test. No new application or visual checks are claimed; visual gate N/A (metadata/report only).

## Next / unresolved gates

Claude: review representation/provenance and decide whether/how to promote these fetched representations in a separate source-review PR. Rights/attribution exceptions, factual currency and human checks remain unverified. The named human reviewer/date for the prioritised federal checks remains unassigned. No manifest, release decision, release gate, ingestion, deployment, merge, #58/#51 or UX-archive change is included.

Access was not blocked during this run, so no department request is needed and none was sent.
