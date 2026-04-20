# Delta Spec: observability (ADDED)

## Capability

`observability` — Sentry error tracking (client + server), PostHog analytics with anonymized student events, event tracking schema, and Server Action wrappers for error capture.

## ADDED Requirements

### REQ-01: Sentry Client-Side Error Capture

The application SHALL capture all unhandled JavaScript errors on the client side with source maps for readable stack traces.

- **RFC 2119**: MUST / SHALL

#### Scenario: Unhandled client error captured

- **Given** a student is using the app and a JavaScript error occurs
- **When** the error is unhandled (not caught by try/catch)
- **Then** Sentry MUST capture the error event with full stack trace
- **And** the stack trace MUST be readable (source maps uploaded and applied)
- **And** the Sentry event MUST include the student's `student_id` (or `parent_id` for parent views) as a tag

#### Scenario: Sentry DSN configured

- **Given** the application configuration
- **When** `NEXT_PUBLIC_SENTRY_DSN` is present in environment variables
- **Then** the Sentry SDK MUST initialize on app startup (client-side)
- **And** `Sentry.sourcemaps.uploadToSentry` MUST be configured in `next.config.mjs` for automatic source map uploads during builds

### REQ-02: Sentry Server-Side Error Capture

Server Actions and API routes MUST capture errors server-side with the Sentry Node SDK.

- **RFC 2119**: MUST / SHALL

#### Scenario: Server Action error captured

- **Given** a Server Action that throws an error during execution
- **When** the error propagates
- **Then** Sentry MUST capture the server-side error with full context
- **And** the error MUST include the action name, input parameters (sanitized of PII), and user context

#### Scenario: Sentry Server Action wrapper

- **Given** a Server Action wrapped with the Sentry error boundary
- **When** the action executes successfully
- **Then** the wrapper MUST NOT add overhead measurable by the student (>10ms latency)
- **And** the wrapper MUST return the action's result unchanged

### REQ-03: PostHog Event Tracking — Student Events (Anonymized)

PostHog SHALL track product events for students with anonymized identifiers. No personally identifiable information of students MAY leave the client.

- **RFC 2119**: SHALL / MUST NOT / MAY

#### Scenario: Student event captured with anonymized identity

- **Given** a student performing an action that generates a trackable event
- **When** PostHog captures `session_start`, `exercise_attempt`, `concept_mastered`, or `island_enter`
- **Then** the event MUST include the student's `student_code` (6-character anonymous ID) as the PostHog distinct ID
- **And** MUST NOT include the student's real name, email, or any PII
- **And** PostHog MUST be configured with `capture_pageview: false` (to avoid tracking full URLs with student data)

#### Scenario: Parent events captured with real identity

- **Given** a parent performing an action in the parent dashboard
- **When** PostHog captures dashboard-related events
- **Then** the event MAY use the parent's authenticated user ID as the distinct ID
- **And** the event SHOULD include the parent's role (`padre`)

### REQ-04: PostHog Event Schema

The event schema for Tinku product analytics SHALL be explicitly defined. Events not in the schema MUST NOT be tracked.

- **RFC 2119**: SHALL / MUST NOT

#### Scenario: Event schema defined

- **Given** the PostHog tracking module `src/lib/posthog.ts`
- **Then** the following events MUST be defined with their properties:

| Event | Properties | Actor |
|-------|-----------|-------|
| `session_start` | `student_code`, `island_id` | alumno |
| `exercise_attempt` | `student_code`, `concept_id`, `exercise_id`, `correct`, `difficulty`, `attempt_number` | alumno |
| `concept_mastered` | `student_code`, `concept_id`, `p_known`, `xp_gained` | alumno |
| `island_enter` | `student_code`, `island_id` | alumno |
| `ari_invoke` | `student_code`, `island_id`, `concept_id`, `personality`, `budget_remaining` | alumno |
| `parent_dashboard_view` | `parent_id`, `student_count` | padre |

#### Scenario: Untracked events rejected

- **Given** a developer attempting to track an event not in the schema
- **When** the event name is not in the defined list
- **Then** the tracking function MUST log a warning in development mode
- **And** MUST NOT send the event to PostHog in any environment

### REQ-05: PostHog Lazy-Loaded Post-Hydration

PostHog SDK MUST NOT be included in the initial JavaScript bundle. It SHALL be lazy-loaded after hydration to protect LCP.

- **RFC 2119**: MUST / SHALL

#### Scenario: PostHog not in initial bundle

- **Given** a production build of the application
- **When** the initial JS bundle is analyzed
- **Then** PostHog SDK code MUST NOT be present in the first-loaded chunk
- **And** PostHog MUST load dynamically after the page is interactive

### REQ-06: Sentry Error Rate Alerting

Sentry SHALL be configured with alert rules for production error rates.

- **RFC 2119**: SHALL

#### Scenario: Critical error alerting configured

- **Given** Sentry project settings
- **Then** an alert rule MUST be configured to notify when error rate exceeds 0.5% of sessions
- **And** an alert rule MUST be configured for any unhandled exception in Server Actions
- **And** alerts MUST be delivered to a configured channel (email or Slack webhook)

### REQ-07: Privacy Compliance — Sentín (Ley 26.061)

All observability data for students under 13 MUST comply with Argentine data protection law (Ley 26.061) during the testing phase.

- **RFC 2119**: MUST / SHALL NOT

#### Scenario: Student data anonymization in observability

- **Given** a student under 13 using the app
- **When** any observability event is captured
- **Then** the event MUST NOT contain the student's real name, date of birth, or any PII
- **And** the event MUST use only the anonymous `student_code` (6-char) as identifier
- **And** Sentry and PostHog projects MUST be configured with data retention ≤ 30 days for student-identified events

#### Scenario: Audit log of observability configuration

- **Given** the observability setup
- **Then** a document at `docs/privacy-policy.md` MUST describe what data is collected, for what purpose, retention periods, and how to request deletion per Ley 26.061