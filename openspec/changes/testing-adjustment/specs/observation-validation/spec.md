# Delta Spec: observation-validation (ADDED)

## Capability

`observation-validation` — Pedagogical validation methodology with Javier's 2 children: observation protocol, friction rubric, weekly feedback format, sustained usage tracking, and rapid iteration cycle.

## ADDED Requirements

### REQ-01: Observation Session Protocol

Each child MUST undergo 2 individual observation sessions (Week 1), each following a structured protocol stored in `docs/observation-protocol.md`.

- **RFC 2119**: MUST / SHALL

#### Scenario: Session 1 — First child observation

- **Given** the observation protocol document exists at `docs/observation-protocol.md`
- **When** Session 1 is conducted with Child A (first use of Tinku)
- **Then** Javier MUST observe WITHOUT intervening (unless safety issue)
- **And** the session MUST last 10-20 minutes
- **And** notes MUST be recorded using the friction rubric (REQ-02)

#### Scenario: Session 2 — Second child observation

- **Given** Session 1 is completed and findings recorded
- **When** Session 2 is conducted with Child B (first use of Tinku)
- **Then** the same protocol MUST be followed independently
- **And** observations MUST be recorded separately for each child
- **And** findings from Session 1 MUST NOT bias Session 2 (blind observation)

### REQ-02: Friction Rubric for Observation

Observations SHALL follow a standardized rubric document capturing confusion points, engagement signals, abandonment triggers, and delight moments.

- **RFC 2119**: SHALL / MUST

#### Scenario: Rubric covers four friction categories

- **Given** the friction rubric at `docs/observation-protocol.md`
- **Then** the rubric MUST cover these four categories:
  1. **Confusion** — Where does the child get stuck? What doesn't make sense?
  2. **Engagement** — What captures attention? What makes them smile?
  3. **Abandonment** — When and why does the child want to stop?
  4. **Navigation** — Can the child find their way without adult help?

#### Scenario: Notes format per observation

- **Given** an observation session in progress
- **When** a friction event is observed
- **Then** the note MUST include: timestamp, category, specific UI element, child's action, and observer's interpretation
- **And** notes MUST be stored digitally (Markdown or structured format) within 24 hours of the session

### REQ-03: Sustained Usage Tracking — 2 Weeks at ~10 min/day

After observation sessions, both children SHALL use Tinku for 2 weeks with a target of ~10 minutes per day, tracked via PostHog.

- **RFC 2119**: SHALL / SHOULD

#### Scenario: Daily usage target

- **Given** the sustained usage phase (Week 2-3)
- **When** a child uses Tinku
- **Then** the target session duration SHOULD be approximately 10 minutes
- **And** PostHog MUST capture `session_start` and session duration events
- **And** the app MUST NOT enforce session limits during this phase (voluntary use)

#### Scenario: Continuity tracking

- **Given** the sustained usage phase
- **When** daily usage data is reviewed
- **Then** each child's daily engagement MUST be measurable (days active per week, average session duration)
- **And** voluntary continuation (child returns without being asked) MUST be explicitly noted

### REQ-04: Weekly Feedback with Open Questions

Each week during the observation period, Javier SHALL collect feedback from each child using open-ended questions.

- **RFC 2119**: SHALL / MUST

#### Scenario: Weekly feedback format

- **Given** the end of each observation week
- **When** Javier collects feedback from a child
- **Then** the following questions MUST be asked:
  1. "¿Qué te gustó más esta semana?"
  2. "¿Qué te aburrió o no te gustó?"
  3. "¿Qué cambiarías si pudieras?"
  4. "¿Volverías a entrar mañana?" (yes/no/maybe)
- **And** responses MUST be recorded verbatim (not paraphrased)
- **And** all feedback documents MUST be stored in a private folder (not in the repo)

### REQ-05: Rapid Iteration Based on Observation

Issues discovered during observation MUST be triaged and addressed within defined SLAs.

- **RFC 2119**: MUST / SHALL

#### Scenario: Critical issue — data loss or crash

- **Given** an observation reveals a crash or loss of student progress
- **When** the issue is documented
- **Then** a fix MUST be deployed within 24 hours
- **And** the fix MUST be verified before the next observation session

#### Scenario: UX friction — child confusion or abandonment trigger

- **Given** an observation reveals a UX issue that causes confusion or abandonment
- **When** the issue is documented
- **Then** it MUST be added to the prioritized backlog within 24 hours
- **And** fixes SHOULD be deployed within the same week

#### Scenario: Delight moment — engagement discovery

- **Given** an observation reveals something that delights the child
- **When** the finding is documented
- **Then** it SHOULD be noted as a design validation (not changed)
- **And** it MUST be considered for reinforcement in future iterations

### REQ-06: Pedagogical Progress Observable

At the end of the 2-week observation period, at least 1 concept mastery per child SHOULD be observable via BKT data (p_known ≥ 0.85).

- **RFC 2119**: SHOULD

#### Scenario: Concept mastery verification

- **Given** 2 weeks of sustained usage completed
- **When** student_concept_state data is reviewed for each child
- **Then** each child SHOULD have at least 1 concept with `p_known ≥ 0.85`
- **And** progress MUST be measurable (change in p_known from session start to end)

### REQ-07: Observation Findings Documented

By the end of the observation period, all findings MUST be compiled into a structured report.

- **RFC 2119**: MUST

#### Scenario: Final observation report

- **Given** all observation sessions and weekly feedback completed
- **When** the observation period ends
- **Then** a summary document MUST exist (outside the repo) containing:
  - Per-child friction notes
  - Per-child engagement highlights
  - Consolidated list of priority adjustments
  - Pedagogical progress summary
- **And** the backlog of adjustment issues MUST be created in the project tracker