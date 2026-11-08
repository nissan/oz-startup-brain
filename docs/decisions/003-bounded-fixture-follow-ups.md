# ADR 003: bounded fixture follow-ups (#45)

Status: revised proposal after Claude review of `f8a61c4`; independent re-review pending.
Review response: P2-1 uses the conservative generic-route guard below; P2-2 has an explicit lifecycle table. Runtime implementation has not started.
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
client starts sending the new optional field. Old clients send no antecedent; recognised subject-dependent follow-ups still abstain safely when it is absent.

The thin BFF validates and forwards this field without interpreting it. The API
continues returning its existing answer, clarification or insufficient-evidence
envelope. A continued answer identifies its subject using authored topic data
(`subject_label`), never by reflecting `previous_question` into API-authored prose.
Keep currency-sensitive summaries and qualifiers intact. Missing/ambiguous
antecedents use `insufficient_evidence` with a `not_in_evidence` condition,
`field: "subject"`, and explicit text asking the founder to name the round or
locality. The generic evidence heading may remain; the visible condition must
explain that the subject needs restating, not imply that no source exists.

## Resolution policy to review

1. Store the bounded complete follow-up phrases and subject labels as authored
   fixture topic data in `corpus.json`, with a corpus-version bump. Normalise
   case, whitespace and terminal punctuation. Exact registered phrases may
   resolve against their compatible prior topic; they are not general NLU.
2. Identify explicit subjects from the authored round/locality inventory. A new
   question naming a subject uses that subject, not an inherited one. Multiple
   incompatible named subjects abstain rather than selecting the first topic.
   Unsupported new subjects must not silently inherit a prior subject.
3. A recognised follow-up resolves only against its compatible, unambiguous
   prior standalone topic: A2 or Gympie. Missing, incompatible, ambiguous or
   itself-anaphoric antecedents abstain and ask for an explicit subject.
4. **Conservative guard (Claude option a):** when a prior question resolves
   unambiguously to A2 or Gympie, and an unnamed current question would select
   generic support, abstain and ask which round/place is intended. Do not quietly
   replace the A2 topic or Gympie caveat. This protects paraphrases without
   pretending to understand them. It applies before generic support clarification.
   Other standalone, non-generic questions ignore the antecedent.
5. Recompute from the current corpus, clock and explicit `confirmed_context`.
   Preserve Unknown/unset and the locality limitation; never replay an answer.
6. Only one preceding question is sent. A second consecutive recognised
   anaphoric follow-up abstains because its preceding question is itself
   anaphoric. Unrecognised multi-turn paraphrases remain a disclosed fixture
   limitation, not a continuity pass. Any broader history/NLU needs a new decision.
7. Provide an explicit **Start a new question** action that clears the prior
   question and active request, invalidates pending responses, clears draft,
   answer/failure/evidence selection and focuses the textarea. Keep confirmed
   stage/jurisdiction choices. The next submission omits `previous_question`.
   This lets a founder intentionally request generic support after Gympie
   without triggering the guard; it is UI state reset, not UI topic matching.

The direct-answer path remains phrase-bound. The guard deliberately abstains on
unnamed generic paraphrases rather than guessing. Verification must report the
registered phrases and paraphrase probes separately. A future live responder
needs its own design; these rules and actor fixtures stay out of production data.

## Browser lifecycle and failure behavior

Use two bounded in-memory records: `eligibleQuestion` (at most one question from
the latest accepted answer) and `activeRequest` (question, optional antecedent,
confirmed context and generation). This is request metadata, not an accumulating
history. No local/session storage, cookies, URL parameters or new question logs.

Only an `answer` response supplies a future antecedent. A fresh submission
snapshots the current eligible question, then consumes/clears eligibility while
pending. Only the latest generation may change either record. Validation errors
before dispatch do not consume it. The following table is normative:

| Event | Request / antecedent behavior | Next eligibility |
| --- | --- | --- |
| Standalone answer | Keep its submitted request snapshot | Its own submitted question |
| Follow-up answer | Keep its original question and antecedent for re-asks | The submitted follow-up itself, not an older root; this bounds chaining |
| Clarification shown | Retain the active snapshot; do not promote unanswered text | None |
| Clarification answered | Re-ask the snapshotted question/antecedent with updated confirmed context | Only a resulting answer makes its submitted question eligible |
| Insufficient evidence / abstention | Keep editable draft and the active request for explicit context re-asks | None; do not revive an older answer |
| Network/API failure | Keep failed request snapshot and existing stale display | None |
| Retry button, or retyped identical failed question | Reuse failed question/antecedent, with current explicit context; identity is trimmed question equality, not inferred intent | Only on accepted answer |
| Different question after failure | New submission without the older successful antecedent | Only on accepted answer |
| Context edit, unchanged draft | Re-ask active snapshot question/antecedent with edited context | Only on accepted answer |
| Context edit, edited draft | Same snapshot re-ask; preserve unsent draft without submitting it, clearly distinguish the answered question from the draft | Only on accepted answer; next explicit Ask submits the draft |
| Context edit while pending | Same snapshot and antecedent, new context and generation | Older response has no effect |
| New Ask supersedes pending request | No pending question becomes an antecedent; capture only eligible committed state (already consumed) | Only latest accepted answer |
| Start a new question / reload | Clear request metadata; explicit reset also invalidates in-flight responses | None |

A context change and clarification answer use the **snapshotted question**, unlike
today's `saveContext` behavior that re-asks the textarea draft. The request's
antecedent is never replaced by its own follow-up during a retry or re-ask.
An answer reached through clarification is eligible as its original submitted
question. The existing stale-answer display may remain after failure, but is not
a source of conversational eligibility. Verify all rows through browser tests.

The API-authored subject/abstention and the new reset control require actual
rendered inspection on desktop/phone in both themes, including keyboard focus
and the edited-draft/context-reask state. No client-side subject resolver.

## Validation and handoff

| Boundary | Required evidence |
| --- | --- |
| Contract | Optional field accepted; blank/oversize/wrong-type/extra fields rejected; old request and response consumers still work; frozen/current-main compatibility passes |
| API | Exact T03/T05 reproductions fail before and pass after; sourced/editorial/unknown distinctions and locality caveat retained; explicit Unknown/unset/stage not inferred |
| Scope escape | A2 to B1; Gympie to explicit new generic question; unrelated AI/patent query; off-topic/B1/missing/ambiguous antecedent; consecutive follow-ups; paraphrases below abstain rather than generic support |
| BFF | Real API process verifies forwarding and unchanged credential boundary; both strings at 2,000 Unicode code points including four-byte characters; escaped-control-character payload exceeding 16 KiB gets 413 with request-size copy rather than blaming question length |
| Browser | Every lifecycle row above, including retyped retry, edited draft plus context/clarification, explicit reset, and superseded responses |
| Visual | Before/after captures and inspected summaries/limits at 390 and 1280 CSS pixels, both themes; no clipping or misleading stale announcement |
| Independent acceptance | Claude reviews exact design/code head; separate OpenAI/OpenClaw verifier runs pinned candidate and merged-build checks; fresh actors are isolated from this document |

Required paraphrase probes include “What is the next useful place to check?”,
“Show me the next useful place to check for my area”, “Which step is required
now?” and “Can you help me see which step is required and which is a suggestion?”.
After a compatible prior answer these must abstain under the generic-route guard.
Also cover stale-clock A2 recomputation (no current eligibility claim), no
antecedent text echoed in summaries, whitespace-only antecedent rejected before
budget admission, and a single budget/concurrency admission per request. Keep
failed-before evidence and do not convert bounded abstentions into actor passes.

Implementation ownership: Codex owns affected `apps/`, `packages/`, generated API
artifacts and scoped documentation. No dependency/lockfile change is expected.
Claude owns `data/sources/` under #28. The verification lane owns distinct evidence
directories, with product defects returned to Codex. #10 waits for this contract
work to settle. Use `Refs #45`; do not close it until independent review, targeted
verification and the required fresh-actor evidence have been recorded.
