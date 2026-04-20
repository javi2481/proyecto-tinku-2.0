# Delta Spec: observability (MODIFIED)

## Capability

`observability` — Extension of Sentry + PostHog observability from testing-adjustment (Phase 1.11) to add privacy-compliance event tracking: consent events, data access events, and data export events.

## MODIFIED Requirements

### Requirement: PostHog Event Schema

The event schema for Tinku product analytics SHALL be explicitly defined. Events not in the schema MUST NOT be tracked. This requirement is EXTENDED with privacy-compliance events.

(Previously: Schema included session_start, exercise_attempt, concept_mastered, island_enter, ari_invoke, parent_dashboard_view.)

#### Scenario: Event schema defined with privacy events

- **Given** the PostHog tracking module `src/lib/posthog.ts`
- **Then** the event schema MUST include all existing events PLUS the following new events:

| Event | Properties | Actor | Phase |
|-------|-----------|-------|-------|
| `session_start` | `student_code`, `island_id` | alumno | 1.11 |
| `exercise_attempt` | `student_code`, `concept_id`, `exercise_id`, `correct`, `difficulty`, `attempt_number` | alumno | 1.11 |
| `concept_mastered` | `student_code`, `concept_id`, `p_known`, `xp_gained` | alumno | 1.11 |
| `island_enter` | `student_code`, `island_id` | alumno | 1.11 |
| `ari_invoke` | `student_code`, `island_id`, `concept_id`, `personality`, `budget_remaining` | alumno | 1.11 |
| `parent_dashboard_view` | `parent_id`, `student_count` | padre | 1.11 |
| `consent_accepted` | `parent_id`, `student_id`, `consent_version` | padre | 1.12 |
| `consent_updated` | `parent_id`, `student_id`, `old_version`, `new_version` | padre | 1.12 |
| `data_access` | `accessor_id`, `accessor_role`, `student_id`, `table_name`, `operation` | sistema/padre | 1.12 |
| `data_export_requested` | `parent_id`, `student_id`, `export_format` | padre | 1.12 |
| `anonymization_triggered` | `student_id`, `days_inactive` | sistema | 1.12 |
| `anonymization_preview_sent` | `parent_id`, `student_id`, `days_until_anonymization` | sistema | 1.12 |

#### Scenario: Untracked events rejected

- **Given** a developer attempting to track an event not in the schema
- **When** the event name is not in the defined list
- **Then** the tracking function MUST log a warning in development mode
- **And** MUST NOT send the event to PostHog in any environment

## ADDED Requirements

### REQ-NEW: Anonymization Event Tracking

PostHog SHALL track anonymization lifecycle events for audit and monitoring purposes.

- **RFC 2119**: SHALL / MUST

#### Scenario: Anonymization preview event tracked

- **Given** a parent notification sent 2 days before anonymization
- **When** the email is dispatched
- **Then** PostHog MUST capture `anonymization_preview_sent` with `parent_id`, `student_id`, and `days_until_anonymization`
- **And** the event actor MUST be `sistema`

#### Scenario: Anonymization execution event tracked

- **Given** the anonymization cron job executing on a student inactive for 30+ days
- **When** the anonymization process completes
- **Then** PostHog MUST capture `anonymization_triggered` with `student_id` and `days_inactive`
- **And** the event MUST confirm that PII was permanently overwritten