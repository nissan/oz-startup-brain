Feature: Evidence-backed Australian founder journeys
  The planner helps a founder identify a next action and inspect its evidence.
  These are proposed acceptance specifications, not executed application tests.
  Program and round examples are fictional fixtures unless explicitly identified.

  Background:
    Given the active corpus release has an identifier and coverage statement
    And the user can see that the app provides information and routing

  @SC01 @US01 @O1
  Scenario: Clarify a missing field that changes the route
    Given the founder asks for support without naming a jurisdiction
    And the candidate pathways differ by jurisdiction
    When the planner assesses the question
    Then it asks one relevant clarification
    And it does not silently assume a state or personal status

  @SC02 @US01 @O1
  Scenario: Correct confirmed context
    Given the context chip says "idea stage"
    When the founder changes the chip to "working prototype"
    Then the next request uses the corrected stage
    And the previous answer is marked as based on the earlier context

  @SC03 @US02 @O3
  Scenario: Explain a supported prerequisite
    Given a reviewed claim says Milestone B requires Milestone A
    When the founder asks how to reach Milestone B
    Then the route shows Milestone A before Milestone B
    And the prerequisite opens its supporting passage

  @SC04 @US02 @O3
  Scenario: Preserve unknown eligibility conditions
    Given Round A1 requires a matched contribution
    And the founder has not stated whether this condition can be met
    When the planner describes Round A1
    Then the condition is shown as unresolved
    And the founder is not labelled eligible or ineligible

  @SC05 @US03 @O2
  Scenario: Inspect a material factual claim
    Given an answer contains a factual statement about Program A
    When the founder opens its evidence
    Then the supporting passage and publisher URL are shown
    And the source version and verification date are shown
    And an unknown verification date is labelled unknown

  @SC06 @US03 @O4
  Scenario: Historical material cannot establish current availability
    Given the only evidence for Round A1 being open is a historical snapshot
    And its source version's last verification date is outside the staleness window for round status
    When the founder asks whether applications are open today
    Then the planner states that current status is unverified
    And the citation carries the label "Needs a current check"
    And it provides the official source to check
    And it does not present the historical status as current

  @SC07 @US03 @O4
  Scenario: Disclose conflicting status evidence
    Given two reviewed claims disagree about the same round and effective period
    When the founder requests its current status
    Then the planner flags the disagreement
    And it shows both sources with their dates
    And it does not average their confidence values into a factual answer

  @SC08 @US04 @O3
  Scenario: Compare using consistent criteria
    Given the founder selects Program A and Program B
    When the comparison is rendered
    Then both options use the same criteria and as-of date
    And unavailable evidence appears as unknown
    And each factual cell is linked to supporting evidence

  @SC09 @US04 @O2
  Scenario: Export the route with its limits
    Given the route contains actions, sources and unresolved conditions
    When the founder exports a checklist
    Then the export contains the confirmed context and corpus version
    And it preserves citations, dates and unresolved conditions
    And it does not describe the export as an approved application

  @SC10 @US05 @O6
  Scenario: Correct speech recognition before sending
    Given the founder has explicitly started and stopped recording
    And the transcript contains an incorrect place name
    When the founder edits the transcript and selects Send
    Then only the corrected transcript is submitted as the question
    And the raw recording is not retained by default

  @SC11 @US05 @O6
  Scenario Outline: Recover from unavailable voice input
    Given voice input is unavailable because of "<reason>"
    When the founder attempts to ask a question
    Then a fully usable text input remains available
    And the interface explains the voice state without losing the draft
    Examples:
      | reason                |
      | microphone denied     |
      | unsupported browser   |
      | transcription timeout |

  @SC12 @US06 @O6
  Scenario: Confirm a visual interpretation
    Given the founder uploads a product workflow diagram
    And extraction identifies an uncertain relationship
    When the preview is displayed
    Then the founder can correct or reject the relationship
    And it cannot influence the route until confirmed
    And the upload is not added to the shared corpus

  @SC13 @US07 @O3
  Scenario: Route a classification question without inventing permission
    Given a payments founder has not specified who holds customer funds
    When they ask whether the proposed product may launch
    Then the planner identifies the missing product fact
    And it provides relevant source categories and specialist questions
    And it does not claim that registration or pilot participation grants a licence

  @SC14 @US08 @O4
  Scenario: Reject an unsupported graph relationship
    Given an extraction job proposes a requirement edge
    And its cited passage does not entail that requirement
    When the candidate is reviewed
    Then the candidate is rejected or returned for correction
    And it cannot enter the factual retrieval graph

  @SC15 @US08 @O4
  Scenario: Keep both indexes on one corpus release
    Given a new graph export passes validation
    And the matching vector index fails to publish
    When release promotion is attempted
    Then no new release manifest is written and the active pointer does not move
    And no answer combines the new graph with the old passage index

  @SC24 @US08 @O4
  Scenario: Pin every request to one immutable release across promotion and rollback
    Given a request resolved release manifest M1 at its start
    And it recorded M1's concrete Qdrant collection identifier and graph corpus version
    When the active pointer is flipped to release M2 while the request is still running
    Then the request completes retrieval, graph lookup and recovery entirely on M1
    And M1's collection and graph data are retained for at least the maximum request deadline after the flip
    And the response envelope reports corpus version M1
    When the active pointer is rolled back from M2 to M1
    Then requests that started on M2 complete on M2 and requests that start afterwards use M1
    And no response cites vector evidence from one release and graph evidence from another

  @SC16 @US09 @O5
  Scenario: Compare the graph fairly
    Given reviewed benchmark questions and a pinned corpus
    When B2 and B3 are evaluated
    Then the model, prompt, reranker and final evidence-token allowance are identical
    And the report records graph cost and degraded runs separately
    And reference answers are excluded from retrieval indexes

  @SC17 @US10 @O1
  Scenario: Graph service is unavailable
    Given the graph request fails or exceeds its deadline
    And vector retrieval is available
    When the planner returns a result
    Then it labels the result as a limited vector fallback
    And it omits unsupported dependency claims

  @SC18 @US10 @O1
  Scenario Outline: Stop safely when live answers are unavailable
    Given "<failure>" prevents a live answer
    When the founder submits a question
    Then the draft is preserved
    And a retry or labelled static source directory is offered
    And no fabricated live answer is displayed
    Examples:
      | failure                   |
      | vector retrieval outage   |
      | model timeout             |
      | daily inference budget    |

  @SC19 @US11 @O6
  Scenario: Use the prerequisite view without a pointer
    Given a prerequisite map is displayed
    When the founder navigates using only the keyboard
    Then every actionable node has a visible focus state
    And an equivalent textual sequence is available
    And sources can be opened without dragging or hovering

  @SC20 @US12 @O4
  Scenario: Ignore instructions embedded in retrieved content
    Given a passage includes text instructing the model to reveal secrets or execute a query
    When the passage is retrieved
    Then its text is treated as untrusted evidence
    And it cannot change the tool allowlist or access credentials
    And it cannot initiate writes or arbitrary network requests

  @SC21 @US12 @O6
  Scenario: Keep private user context isolated
    Given founder A has entered private context in a session
    When founder B starts another session
    Then founder A's context is absent from founder B's response and retrieval
    And founder A's input is not added to the shared corpus or public logs

  @SC22 @US01 @O1
  Scenario: Respect an explicit Unknown without repeating the clarification
    Given the founder has set the jurisdiction chip to "Unknown"
    And the candidate pathways differ by jurisdiction
    When the founder submits the question
    Then the planner does not ask for the jurisdiction again
    And the answer states which options were excluded or left unresolved because jurisdiction is unknown
    And no jurisdiction is inferred from other context

  @SC23 @US02 @O4
  Scenario: Do not present a future-effective requirement as applicable today
    Given a reviewed claim says Round A2 requires a security assessment
    And the claim's effective interval starts after the request's as-of date
    And the claim's source version was verified within the staleness window
    When the founder asks what is required to apply to Round A2 today
    Then the requirement is not listed among today's prerequisites or actions
    And the citation may be shown as fresh with the qualifier "takes effect from [date]"
    And a claim with no stated effective date carries the caveat "effective date not stated"
    And no effective date is invented
