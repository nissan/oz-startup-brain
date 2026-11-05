Feature: Bounded task-intent decisions inside the NestJS workflow
  Proposed acceptance specifications for ADR 002; no implementation tests have run.
  These component/evaluation scenarios complement the founder and API scenarios.

  @DEC01 @US16 @O5 @O7
  Scenario: Keep classification off without decision credentials
    Given decision mode is off and no decision-provider credential exists
    When a valid request without an explicit task is classified
    Then the frozen rules baseline selects its allowed route
    And no decision-provider call or decision charge occurs

  @DEC02 @US16 @O1
  Scenario: Preserve an explicit task and confirmed Unknown
    Given the request has a validated task_intent field of comparison
    And the jurisdiction was deliberately confirmed as Unknown
    When task classification runs
    Then comparison is selected without a paid decision call
    And Unknown is unchanged and is not asked again

  @DEC03 @US16 @O5
  Scenario: Shadow decisions cannot change the selected route
    Given the live workflow remains off
    And an approved offline replay input has a baseline route of lookup
    When a shadow candidate recommends prerequisite
    Then the report records the disagreement without changing a live request
    And shadow cost is charged only to its admitted evaluation budget

  @DEC04 @US16 @O1
  Scenario Outline: Fall back without a provider cascade
    Given enabled mode has budget admission and a still-live request
    When the adapter yields "<result>"
    Then the selected route remains the frozen baseline route
    And a specific fallback code is recorded
    And no retry or second model call is started for classification
    Examples:
      | result                       |
      | low probability or margin    |
      | unclear or tied top choices  |
      | provider refusal             |
      | timeout or unavailable       |
      | invalid label or distribution |
      | no approved calibration      |
      | missing distribution         |
      | input exceeds bounded size   |

  @DEC05 @US16 @O3 @O4
  Scenario: Accept a candidate only inside the deterministic workflow
    Given an admitted prerequisite candidate passes the frozen probability and margin policy
    When the application selects that intent
    Then only allowlisted parameterised graph queries may run for known entities
    And graph unavailability yields the existing labelled passage fallback
    And source rights, dates, evidence checks and curator approval requirements remain enforced

  @DEC06 @US16 @O7
  Scenario: Ignore public attempts to control decision configuration
    Given a caller supplies a provider, threshold or enabled-mode override in a query or header
    When NestJS validates the request
    Then only server-resolved decision configuration can be used
    And input text cannot change scopes, quotas, allowed queries or confirmed context

  @DEC07 @US16 @O7
  Scenario: Preserve accounting and cancellation boundaries
    Given optional decision usage has its own reservation linked to an admitted baseline request
    When the request is cancelled after the decision provider may have incurred charges
    Then cancellation reaches the adapter and no fallback paid work starts
    And unknown usage is settled conservatively exactly once
    And a late usage report adjusts that settlement at most once
    And lease expiry does not release the monetary reservation

  @DEC08 @US16 @O5
  Scenario: Reject activation without evidence and a rollback plan
    Given a candidate has only fixture results or inconclusive held-out gates
    When enabled mode is proposed for a release
    Then activation is rejected and off mode remains the default
    And the release records the missing report, policy or owner approval

  @DEC09 @US16 @O1 @O7
  Scenario: Optional decisions cannot consume the baseline allowance
    Given baseline work is admitted but optional decision work cannot be reserved
    When classification runs
    Then no decision call starts and the baseline proceeds within its reservation
    And if baseline admission itself fails no paid workflow starts

  @DEC10 @US16 @O5
  Scenario: Keep calibration and evaluation independent
    Given decision thresholds and prompts were frozen using development and validation cases
    When the held-out experiment is reported
    Then test labels were not used to retune the policy
    And candidate models did not supply authoritative labels or judge their own answers
    And retrieval, generation and corpus configuration differences are disclosed
    And unavailable arms and fallback cases retain explicit counts
