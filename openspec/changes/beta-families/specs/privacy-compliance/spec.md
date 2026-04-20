# Delta Spec: privacy-compliance (ADDED)

## Capability

`privacy-compliance` — Versioned parental consent, automatic anonymization after 30 days of inactivity, access audit logs, data portability (parent export), and zero advertising enforcement. Complies with Argentine Ley 26.061 — NOT COPPA, as this is an Argentine product for Argentine kids.

## ADDED Requirements

### REQ-01: Versioned Parental Consent

Parental consent SHALL be explicit, versioned, and required before any child data is collected. Each consent version MUST be stored with full metadata.

- **RFC 2119**: SHALL / MUST / MUST NOT

#### Scenario: Consent required at registration

- **Given** a parent registering a child for the first time
- **When** the parent reaches the child registration step
- **Then** the system MUST display the current consent document in rioplatense Spanish
- **And** the parent MUST actively accept (checkbox + "Acepto" button) — not pre-checked
- **And** registration MUST NOT proceed without consent acceptance
- **And** the consent version identifier MUST be stored in `consent_versions` table

#### Scenario: Consent version tracking

- **Given** the `consent_versions` table in Supabase
- **Then** each record MUST include: `id`, `parent_id`, `student_id`, `consent_text_hash`, `consent_version`, `accepted_at`
- **And** the `consent_version` field MUST be a semver string (e.g., `"1.0.0"`)
- **And** a consent record MUST be immutable once created (no UPDATE, only INSERT)

#### Scenario: Consent version update

- **Given** a new consent version published (e.g., `"1.1.0"`)
- **When** a parent with existing consent logs in
- **Then** the system MUST display the diff between old and new versions
- **And** the parent MUST explicitly accept the new version before the child continues using the app
- **And** the old consent record MUST be preserved (not overwritten)

### REQ-02: Automatic Anonymization After 30 Days of Inactivity

When a student account has been inactive for 30 consecutive days, the system SHALL automatically anonymize PII fields while preserving aggregated pedagogical data.

- **RFC 2119**: SHALL / MUST / MUST NOT

#### Scenario: Anonymization triggered by inactivity

- **Given** a student with `last_active_at` timestamp older than 30 days
- **When** the anonymization cron job runs (daily)
- **Then** the student's PII fields (`name`, `avatar_url`) MUST be replaced with anonymized values
- **And** the `student_code` MUST be invalidated (no longer usable for login)
- **And** the parent's association to this student MUST be marked as `anonymized: true`
- **And** pedagogical data (`p_known`, `xp`, `level`, `concept_progress`) MUST be preserved for aggregated analytics

#### Scenario: Anonymization is irreversible

- **Given** a student record that has been anonymized
- **When** any query attempts to recover the original PII
- **Then** the original PII MUST NOT be recoverable (no reversible encryption)
- **And** the original values MUST be permanently overwritten, not soft-deleted

#### Scenario: Preview before anonymization commit

- **Given** a student scheduled for anonymization (28 days inactive)
- **When** the anonymization preview runs (2 days before execution)
- **Then** the parent MUST receive an email notification: "Tu cuenta lleva 28 días sin actividad. En 2 días anonimizaremos los datos. Si querés conservarlos, ingresá a Tinku."
- **And** if the parent logs in before 30 days, the inactivity timer MUST reset

### REQ-03: Access Audit Logs for Child Data

Every query that accesses a student's personal or pedagogical data MUST be logged with full context.

- **RFC 2119**: MUST / SHALL

#### Scenario: Audit log entry created on data access

- **Given** any read or write operation on `students`, `student_concept_state`, `student_exercise_attempts`, `student_levels`, or `student_coins`
- **When** the operation occurs
- **Then** a record MUST be inserted into `data_access_logs` containing: `id`, `accessor_id`, `accessor_role` (padre/sistema), `student_id`, `table_name`, `operation` (read/write), `accessed_at`
- **And** the log MUST be immutable (INSERT only, no UPDATE/DELETE)

#### Scenario: Parent accessing child data is logged

- **Given** a parent viewing their child's dashboard
- **When** the parent opens `/dashboard/[student-id]`
- **Then** a `data_access_logs` entry MUST be created with `accessor_role = 'padre'` and `operation = 'read'`

#### Scenario: System access is logged

- **Given** a Server Action that processes student data (e.g., exercise attempt)
- **When** the action reads student state
- **Then** a log entry MUST be created with `accessor_role = 'sistema'` and `operation = 'read/write'`

### REQ-04: Data Portability — Parent Export

A parent MUST be able to export ALL data associated with their child in a machine-readable format.

- **RFC 2119**: MUST / SHALL

#### Scenario: Parent requests data export

- **Given** a parent with at least one registered child
- **When** the parent clicks "Exportar datos de mi hijo" in the parent dashboard
- **Then** the system SHALL generate a JSON file containing: student profile, all concept states, all exercise attempts, all coin/level/mission data, and all Ari conversation logs
- **And** the export MUST be available within 5 minutes of request (async generation acceptable)
- **And** the file MUST be downloadable as `{student_code}_export_{date}.json`

#### Scenario: Export includes all data categories

- **Given** the export JSON file
- **Then** it MUST contain these top-level keys: `profile`, `pedagogical_state`, `exercise_history`, `gamification`, `ari_conversations`, `consent_history`
- **And** each category MUST include all records for that student
- **And** no data category MAY be omitted from the export

#### Scenario: Export logged in audit trail

- **Given** a parent downloading their child's data export
- **When** the download completes
- **Then** a `data_access_logs` entry MUST be created with `operation = 'export'` and `accessor_role = 'padre'`

### REQ-05: Zero Advertising, Zero Third-Party Data Sharing

The application MUST NOT display any advertising to students and MUST NOT share any student data with third parties for advertising or commercial purposes.

- **RFC 2119**: MUST NOT / SHALL NOT

#### Scenario: No advertising in student UI

- **Given** a student using any screen in Tinku
- **When** the UI is rendered
- **Then** there MUST NOT be any ad banners, sponsored content, or promotional popups
- **And** there MUST NOT be any third-party tracking pixels or advertising SDKs

#### Scenario: No data sharing with third parties

- **Given** the application's data flow
- **When** student data is transmitted
- **Then** data MUST NOT be sent to any endpoint other than Supabase (storage), OpenRouter (Ari calls), Sentry (errors), and PostHog (anonymized analytics)
- **And** each third-party integration MUST be listed in `docs/privacy-policy.md` with purpose and data shared

### REQ-06: Privacy Policy Document

A privacy policy in rioplatense Spanish MUST be available within the app and referenced at consent time.

- **RFC 2119**: MUST

#### Scenario: Privacy policy accessible

- **Given** the app running in production
- **Then** a privacy policy document MUST be available at `/privacy` route
- **And** it MUST be written in rioplatense Spanish
- **And** it MUST cover: data collected, purposes, retention periods (30-day anonymization), third-party integrations, parental rights (export, deletion), and contact information
- **And** it MUST reference Argentine Ley 26.061 as the applicable legal framework