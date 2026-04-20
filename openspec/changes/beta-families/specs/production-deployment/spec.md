# Delta Spec: production-deployment (MODIFIED)

## Capability

`production-deployment` — Extension of the production deployment capability from testing-adjustment (Phase 1.11) to support privacy-compliance features: consent-related env vars, data access audit endpoints, and data export endpoints.

## MODIFIED Requirements

### Requirement: Environment Variables Management

Production environment variables MUST be configured in Vercel with no secrets in the repository. This requirement is EXTENDED with privacy-compliance env vars.

(Previously: Only Sentry and PostHog env vars were listed.)

#### Scenario: Production env vars configured

- **Given** the Vercel project settings
- **When** environment variables are reviewed
- **Then** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, and `SENTRY_AUTH_TOKEN` MUST be set in Vercel's production environment
- **And** `SUPABASE_SERVICE_ROLE_KEY` MUST be set in Vercel (server-only, no `NEXT_PUBLIC_` prefix)
- **And** `.env.local` MUST NOT be committed to git

#### Scenario: Privacy-compliance env vars configured

- **Given** the beta-families phase with privacy compliance active
- **When** environment variables are reviewed
- **Then** `CONSENT_VERSION` MUST be set (e.g., `"1.0.0"`)
- **And** `ANONYMIZATION_INACTIVITY_DAYS` MUST be set (default: `"30"`)
- **And** `ANONYMIZATION_PREVIEW_DAYS` MUST be set (default: `"2"`)
- **And** `NEXT_PUBLIC_PRIVACY_POLICY_URL` MUST point to the `/privacy` route
- **And** `RESEND_API_KEY` MUST be set for parent notification emails (anonymization preview, weekly reports)

### Requirement: Data Export Server Action

A Server Action SHALL be added to enable parents to request and download a full export of their child's data.

(Previously: No export functionality existed.)

#### Scenario: Parent requests child data export

- **Given** a parent authenticated in the parent dashboard
- **When** the parent invokes the `exportChildData(studentId)` Server Action
- **Then** the action MUST verify that the parent owns the student (via RLS policy check)
- **And** the action MUST compile all student data into a JSON structure per `privacy-compliance` REQ-04 spec
- **And** the action MUST return a downloadable URL or stream the JSON response directly
- **And** the action MUST log the export in `data_access_logs` with `operation = 'export'`

#### Scenario: Parent cannot export another parent's child data

- **Given** a parent trying to export data for a student they do not own
- **When** the Server Action is invoked
- **Then** it MUST return a 403 Forbidden error
- **And** the attempt MUST be logged in `data_access_logs` with `operation = 'export_denied'`

## ADDED Requirements

### REQ-NEW: Consent Server Action Endpoints

Server Actions for consent management SHALL be available in the registration and settings flows.

- **RFC 2119**: SHALL / MUST

#### Scenario: Consent acceptance recorded via Server Action

- **Given** a parent accepting consent for a child
- **When** the `acceptConsent(parentId, studentId, consentVersion)` Server Action is invoked
- **Then** a record MUST be inserted into `consent_versions` table
- **And** the record MUST contain: `parent_id`, `student_id`, `consent_version`, `consent_text_hash`, `accepted_at`
- **And** the child's `student_code` MUST be generated only after consent is recorded

#### Scenario: Consent version check on login

- **Given** a parent whose accepted consent version is behind the current version
- **When** they log in or navigate to the dashboard
- **Then** the app MUST redirect them to the consent update flow
- **And** they MUST accept the new version before their child can continue using the app