# ADR 003: bounded fixture follow-ups (#45)

Status: proposed for independent Claude review before implementation.
Owner dispatch: Nissan, 8 November 2026 (Australia/Sydney).
Builder: Codex, run `codex-45-20261108`.
Base: `0a7d9a6d1184e46042a299d44e0e1d54b8c8cf60` (PR #49 merged).

## Problem and boundaries

[Issue #45](https://github.com/nissan/oz-startup-brain/issues/45) records two
observed fixture failures: an A2 follow-up becomes generic support, and a Gympie
follow-up loses the locality coverage caveat. The API currently matches each
question independently. The BFF forwards only `question` and `confirmed_context`;
the browser retains an answer for display, not conversational scope.

This increment supports one preceding question, not general chat memory. It does
not infer confirmed jurisdiction or stage from either question. Source rights,
claim dates, coverage and route selection remain API responsibilities under
[ADR 001](001-api-first-nestjs.md). No provider, database or persistent session is
introduced. Original synthetic outcomes remain historical evidence.

## Proposed contract

Add optional `previous_question` to `QueryRequest`: an untrusted, nonblank string
of at most 2,000 characters. Existing `question`, context and request-byte limits
continue to apply. Reject invalid input before admission/retrieval. The field is
only a possible antecedent, never an instruction, identity or confirmed fact.

Keep the response contract and frozen v1 baseline unchanged. Its objects and
warning enums are closed: even an optional response field could break existing
validating clients. Regenerate request types/OpenAPI/client and prove compatibility
against both current main and the frozen baseline. Deploy API support before a
client starts sending the new optional field; old clients remain stateless.

The thin BFF validates and forwards this field without interpreting it. The API
continues returning its existing answer, clarification or insufficient-evidence
envelope. A continued answer identifies the retained subject in its summary.
Missing/ambiguous antecedents use the existing insufficient-evidence structure
to ask the founder to name the round or locality, without a generic support route.

## Resolution policy to review

1. Recognise a bounded, explicitly enumerated set of complete follow-up phrases
   after case/whitespace/terminal-punctuation normalisation. Start with the two
   exact registered #45 follow-ups. Do not add broad token triggers such as
   `step`, `area`, `AI`, `prototype` or `university`.
2. An ordinary standalone question uses normal retrieval, ignoring
   `previous_question`. Explicitly naming another round/locality or asking an
   unrelated question must not inherit the old subject.
3. For a registered follow-up, resolve the previous question only against the
   applicable authored topic: A2 for the required/suggested/unknown follow-up;
   Gympie for the unsupported-area/next-place follow-up. An incompatible,
   absent, ambiguous or itself-anaphoric antecedent abstains and requests an
   explicit subject. It must not fall through to generic support.
4. Recompute the answer from current claims, the pinned clock and the current
   explicit `confirmed_context`. Preserve the Gympie coverage limitation;
   preserve Unknown and unset fields. Never replay a cached answer as current.
5. A second consecutive anaphoric follow-up is outside this one-turn increment:
   explicitly request the subject again. Do not silently switch routes. Expanding
   the phrase set or retention depth is a separately reviewed increment.

The narrow phrase policy is deliberate fixture behavior, not a claim of general
language understanding. Review should decide whether this bounded increment is
acceptable before implementation; do not disguise a wider memory feature inside it.

## Browser lifecycle and failure behavior

Keep at most the preceding eligible submitted question in mounted-page memory.
No local/session storage, cookies, URL parameters, analytics or new question logs.
A reload clears it. A deliberate standalone question replaces the antecedent;
an insufficient-evidence result also ends the old chain.

Snapshot the entire request, including its antecedent, at submission. Context
edits, clarification answers and retries reuse that request's antecedent rather
than accidentally treating the follow-up itself as its own prior question.
Maintain the existing request-generation guard so late responses cannot replace
newer context. After a failed request, retry uses the same snapshot; a different
new question must not silently inherit an older successful answer. Preserve the
existing draft/stale-answer behavior.

No new topic selector or hidden UI business matcher is proposed. The API's summary
or abstention explains the scope actually used. These changed visible states still
require real rendered review at desktop/phone sizes in both themes.

## Validation and handoff

| Boundary | Required evidence |
| --- | --- |
| Contract | Optional field accepted; blank/oversize/wrong-type/extra fields rejected; old request and response consumers still work; frozen/current-main compatibility passes |
| API | Exact T03/T05 reproductions fail before and pass after; sourced/editorial/unknown distinctions and locality caveat retained; explicit Unknown/unset/stage not inferred |
| Scope escape | A2 to B1, Gympie to generic support, unrelated AI/patent query, incompatible/missing prior question and consecutive follow-ups never leak stale scope |
| BFF | Real API process verifies field forwarding, body limits and unchanged credential boundary |
| Browser | Exact follow-ups; context edit; clarification/retry snapshot; failed and out-of-order requests; reload clears scope; subsequent standalone query leaves prior topic |
| Visual | Before/after captures and inspected summaries/limits at 390 and 1280 CSS pixels, both themes; no clipping or misleading stale announcement |
| Independent acceptance | Claude reviews exact design/code head; separate OpenAI/OpenClaw verifier runs pinned candidate and merged-build checks; fresh actors are isolated from this document |

Implementation ownership: Codex owns affected `apps/`, `packages/`, generated API
artifacts and scoped documentation. No dependency/lockfile change is expected.
Claude owns `data/sources/` under #28. The verification lane owns distinct evidence
directories, with product defects returned to Codex. #10 waits for this contract
work to settle. Use `Refs #45`; do not close it until independent review, targeted
verification and the required fresh-actor evidence have been recorded.
