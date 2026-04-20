# Delta Spec: ola1-retrospective (ADDED)

## Capability

`ola1-retrospective` — Framework for Ola 1 retrospective: Go/No-Go decision criteria based on ROADMAP.md §2.2, retrospective document template, and structured decision process for advancing to Ola 2.

## ADDED Requirements

### REQ-01: Go/No-Go Criteria Defined

The Ola 1 exit decision MUST be evaluated against the explicit criteria from ROADMAP.md §2.2, adapted for the beta-families context.

- **RFC 2119**: MUST

#### Scenario: All exit criteria evaluated

- **Given** the Ola 1 exit criteria from ROADMAP.md §2.2
- **Then** EACH of the following MUST be explicitly evaluated and documented:

| Criterion | Measurement |
|-----------|------------|
| App works end-to-end on mid-range Android | LCP ≤ 3s verified, 60fps in Phaser, zero critical errors |
| Content sufficient | Isla Numeros: 20+ concepts with 15+ exercises each; Isla Amigos: 3-5 concepts with 6+ exercises each |
| Gamification functional | Levels 1-50, coin collection, daily/weekly missions, Ari with Quipu/Tinkú personalities |
| Validation with testers | 2 children of Javier used app for 2+ weeks with positive feedback and observable pedagogical progress |
| Observability operational | Errors captured in Sentry, product events tracked in PostHog |
| 5 families onboarded | ≥10 kids with measurable weekly usage (PostHog data) |
| Privacy compliance active | Consent versioned, anonymization at 30 days, audit logs, data portability operational |
| Zero critical errors | Sentry error rate < 0.5% during beta period |

#### Scenario: Each criterion has a clear Pass/Fail verdict

- **Given** the evaluation of all exit criteria
- **Then** each criterion MUST have an explicit Pass/Fail verdict
- **And** a criterion that is partially met MUST be marked as "Partial" with an explanation
- **And** "Partial" counts as Fail for the Go decision

### REQ-02: Retrospective Document Template

A retrospective document MUST be created using a structured template that captures findings honestly.

- **RFC 2119**: MUST / MUST NOT

#### Scenario: Retrospective document exists

- **Given** `docs/ola1-retrospective.md`
- **Then** it MUST contain the following sections:
  1. **Go/No-Go Decision** — explicit verdict with criteria scores
  2. **What Worked** — features and decisions that delivered value
  3. **What Didn't Work** — features and decisions that fell short
  4. **What We Learned** — observations, surprises, validated/invalidated assumptions
  5. **Quantitative Metrics** — usage data, error rates, pedagogical progress
  6. **Qualitative Feedback** — parent and child feedback verbatim
  7. **Adjustments for Ola 2** — prioritized changes based on lessons
- **And** the document MUST be written honestly — inflating results is explicitly forbidden per TINKU.md §6.1

#### Scenario: Retrospective rate-limits self-praise

- **Given** the retrospective document
- **Then** the "What We Learned" section MUST include at least 2 things that surprised the team or invalidated an assumption
- **And** the document MUST NOT be purely positive — discomfort with honest findings is expected

### REQ-03: Go/No-Go Decision Framework

The decision to advance to Ola 2 MUST be made explicitly, not assumed.

- **RFC 2119**: MUST / SHALL NOT

#### Scenario: Go decision criteria

- **Given** all exit criteria evaluated
- **When** ALL criteria are marked as Pass
- **Then** a Go decision for Ola 2 MAY be made
- **And** the decision MUST be documented with date and responsible person

#### Scenario: No-Go decision criteria

- **Given** all exit criteria evaluated
- **When** ANY criterion is marked as Fail
- **Then** a No-Go decision MUST be made
- **And** the team SHALL NOT proceed to Ola 2
- **And** specific remediation actions MUST be defined for each Fail criterion with estimated timelines

#### Scenario: Conditional Go decision

- **Given** all exit criteria evaluated
- **When** one or more criteria are marked as "Partial" but no criterion is a hard Fail
- **Then** the team MAY make a Conditional Go decision
- **And** the conditions MUST specify what Partial criteria need to become Pass, and by what date
- **And** if conditions are not met by the specified date, the decision reverts to No-Go

### REQ-04: Family Feedback Collection

Weekly feedback from the 5 beta families MUST be collected via a structured WhatsApp group format.

- **RFC 2119**: MUST / SHALL

#### Scenario: WhatsApp feedback group

- **Given** the 5 families participating in the beta
- **Then** Javier SHALL create a WhatsApp group for structured weekly feedback
- **And** each week, Javier MUST send 4-5 open questions to the group:
  1. "¿Qué le gustó a tu hijo esta semana?"
  2. "¿Qué le aburrió o frustró?"
  3. "¿Cuánto tiempo usó la app aproximadamente?"
  4. "¿Volvería a entrar mañana tu hijo?"
  5. "¿Qué cambiarías si pudieras?"
- **And** responses MUST be collected and documented in the retrospective tracker

#### Scenario: Minimum feedback collection period

- **Given** the beta-families phase
- **Then** feedback MUST be collected for a minimum of 3 weeks per family
- **And** at least 3 out of 5 families MUST provide weekly feedback consistently
- **And** families that don't respond for 2 consecutive weeks MUST be personally followed up by Javier

### REQ-05: Error Monitoring at Scale

With 10+ kids in production, Sentry alerts and response time tracking MUST be configured for the increased load.

- **RFC 2119**: MUST / SHALL

#### Scenario: Sentry alert threshold for beta scale

- **Given** Sentry project settings updated for the beta-families phase
- **Then** alert rules MUST be configured for:
  - Error rate > 0.5% of sessions
  - Any unhandled exception in Server Actions
  - Response time P95 > 3 seconds for any critical route
- **And** alerting channel MUST be configured (Slack webhook or email)

#### Scenario: Response time tracking

- **Given** PostHog performance monitoring enabled
- **Then** Page Load time (LCP) and Server Action response times MUST be tracked
- **And** weekly reports on P50 and P95 response times MUST be reviewed by the team