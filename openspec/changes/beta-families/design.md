# Design: Beta Families — Apertura a 5 Familias (Phase 1.12)

## Technical Approach

Activate privacy compliance (Ley 26.061) before inviting external families. The transition from "documented but inactive" (Phase 1.11) to "active in code" requires: versioned consent schema, anonymization cron job, audit logging triggers, and data portability endpoint. After compliance is live and tested, onboarding 5 families via WhatsApp (Javier personal, no bot). Observability extends with privacy-compliance events. Exit criteria evaluated via structured Ola 1 retrospective.

Maps to specs: `privacy-compliance` (REQ-01 through REQ-06), `onboarding-support` (REQ-01 through REQ-04), `observability` (modified: privacy events), `production-deployment` (modified: consent/env vars, export endpoints), `ola1-retrospective` (REQ-01 through REQ-05 — documentation + structured process).

## Architecture Decisions

| # | Decision | Choice | Alternatives Considered | Rationale |
|---|----------|--------|------------------------|-----------|
| AD-01 | Consent storage | Supabase table `consent_versions` with INSERT-only policy | JSON file per consent, encrypted blob in user metadata | Spec REQ-01 requires immutable versioned records with parent_id, student_id, consent_text_hash, consent_version. Relational table supports querying, auditing, and version checks. INSERT-only via RLS enforces immutability. |
| AD-02 | Anonymization execution | Supabase `pg_cron` daily job | Vercel cron (`next/server` route), external scheduler | pg_cron runs inside database where data lives — no network hop, no latency, atomic. Supabase supports pg_cron natively. |
| AD-03 | Anonymization preview notification | Supabase `pg_net` extension calling PostHog + Resend email | Vercel cron polling, Supabase Edge Function | pg_net allows the cron job to make HTTP calls directly from SQL. Simpler architecture: one cron job handles preview (28 days) + execution (30 days). |
| AD-04 | Audit logging mechanism | Supabase triggers (AFTER INSERT/UPDATE/DELETE) on student tables | Application-level logging in every Server Action | Triggers guarantee every access is logged regardless of code path. Cannot be bypassed by a developer forgetting to call a log function. INSERT-only table with no UPDATE/DELETE policy enforces immutability (matches spec REQ-03). |
| AD-05 | Data export format | Server Action generating JSON response (streamed) | API route `/api/privacy/export`, Supabase Edge Function | Per project rules (AGENTS.md): mutations via Server Actions, NOT /api/*. Export is a mutation (creates audit log), so it goes in a Server Action. JSON format per spec REQ-04. |
| AD-06 | Consent integration in registration | Consent step as final step in parent onboarding flow (Server Action) | Separate /consent page, middleware redirect | Spec REQ-01 mandates consent before child code generation. Makes it part of the registration Server Action flow — atomic: create student → log consent → generate code. If consent fails, code is not generated. |
| AD-07 | Consent version update gate | Middleware check on parent routes | Server Component check on layout level | Middleware is the right place — intercepts all parent route navigations and checks if `latest_consent_version > accepted_version`. Redirects to consent update screen if behind. Matches spec: "parent MUST accept before child continues." |
| AD-08 | Zero advertising enforcement | Code review + lint rule (no ad SDK imports) | Runtime UI scanner, automated dependency audit | For 5 families, code review suffices. Add a lint/ESLint rule forbidding `adsbygoogle`, `fbq`, or known ad SDK imports. Privacy policy (spec REQ-06) is the contractual document. |
| AD-09 | Onboarding tracking | Lightweight external tracker (spreadsheet/Notion) | In-app database table | Spec REQ-03 explicitly says "NOT in the app database." Javier tracks 5 families — spreadsheet is sufficient and more flexible for qualitative notes. |
| AD-10 | Retrospective framework | Document in `docs/ola1-retrospective.md` | Notion template, app-generated report | Ola 1 retrospective is a one-time exercise. Markdown in repo is version-controlled and permanent. |
| AD-11 | PostHog privacy event additions | Extend `trackEvent()` discriminated union with 6 new event types | Separate `trackPrivacyEvent()` function | Per spec, all events go through the same allowlist mechanism. Adding to the existing type is cleaner and enforces the same rejection logic for unknown events. |

## Data Model

### `consent_versions` (new table)

```
consent_versions
├── id              UUID PK DEFAULT gen_random_uuid()
├── parent_id       UUID NOT NULL REFERENCES auth.users(id)
├── student_id      UUID NOT NULL REFERENCES students(id)
├── consent_text_hash TEXT NOT NULL  -- SHA-256 of consent text
├── consent_version TEXT NOT NULL     -- semver e.g. "1.0.0"
├── accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
├── ip_address      INET             -- from request headers
── RLS: INSERT only (no UPDATE, no DELETE)
── UNIQUE(parent_id, student_id, consent_version)
```

### `data_access_logs` (new table)

```
data_access_logs
├── id              UUID PK DEFAULT gen_random_uuid()
├── accessor_id     UUID NOT NULL       -- parent user ID or system
├── accessor_role   TEXT NOT NULL        -- 'padre' | 'sistema'
├── student_id      UUID NOT NULL REFERENCES students(id)
├── table_name      TEXT NOT NULL        -- e.g. 'students', 'student_concept_state'
├── operation       TEXT NOT NULL        -- 'read' | 'write' | 'export' | 'export_denied'
├── accessed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
── RLS: INSERT only (no UPDATE, no DELETE)
── INDEX on (student_id, accessed_at)
── INDEX on (accessor_id, accessed_at)
```

### Migration: `students` anonymization support

```
students (existing table modifications)
├── + anonymized      BOOLEAN NOT NULL DEFAULT false
├── + last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now()
── When anonymized=true: name='Anónimo', avatar_url=null, student_code invalidated
```

### `pg_cron` job: `anonymize_inactive_students`

```sql
-- Runs daily at 03:00 UTC
-- 1. Notify parents 2 days before (at 28 days inactive)
-- 2. Anonymize students at 30+ days inactive
```

## Data Flow

### Consent Flow

```
Parent registers child → [consent screen in rioplatense Spanish]
  │
  ├── Parent accepts → acceptConsent(parentId, studentId, version)
  │     ├── INSERT consent_versions
  │     ├── trackEvent("consent_accepted")
  │     └── Generate student_code (only after consent recorded)
  │
  └── Parent declines → Block registration (no code generated)

Parent login (existing) → Middleware check:
  accepted_version < current_version?
    ├── Yes → Redirect to consent update screen
    │         └── acceptConsent with new version → INSERT new record
    └── No  → Continue to dashboard
```

### Anonymization Flow

```
[Daily pg_cron at 03:00 UTC]
  │
  ├── Find students WHERE last_active_at < now() - interval '28 days'
  │     └── Send preview email via pg_net → Resend
  │     └── trackEvent("anonymization_preview_sent")
  │
  └── Find students WHERE last_active_at < now() - interval '30 days'
        └── UPDATE students SET
        │     name = 'Anónimo',
        │     avatar_url = NULL,
        │     anonymized = true,
        │     student_code = invalidated
        └── Mark parent association as anonymized: true
        └── trackEvent("anonymization_triggered")
        └── pedagogical data (p_known, xp, level) PRESERVED for aggregates
```

### Data Export Flow

```
Parent clicks "Exportar datos" → exportChildData(studentId) Server Action
  │
  ├── Verify parent owns student (RLS check)
  │     └── Not owned? → INSERT data_access_logs(operation='export_denied') → Return 403
  │
  └── Owned? → Compile JSON:
        ├── profile (student data, anonymized fields excluded)
        ├── pedagogical_state (student_concept_state)
        ├── exercise_history (student_exercise_attempts)
        ├── gamification (levels, coins, missions)
        ├── ari_conversations
        └── consent_history
      → INSERT data_access_logs(operation='export')
      → trackEvent("data_export_requested")
      → Return JSON response as download
```

### Audit Logging Flow

```
Every read/write on student data tables (triggers):
  students, student_concept_state, student_exercise_attempts,
  student_levels, student_coins
  │
  └── AFTER INSERT/UPDATE/DELETE trigger → INSERT data_access_logs
        └── accessor_role = 'sistema' (for Server Actions)
        └── accessor_role = 'padre' (for parent dashboard views)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXXX_consent_versions.sql` | Create | `consent_versions` table + RLS (INSERT only) + unique constraint |
| `supabase/migrations/XXXX_data_access_logs.sql` | Create | `data_access_logs` table + RLS (INSERT only) + indexes |
| `supabase/migrations/XXXX_students_anonymization.sql` | Create | Add `anonymized` + `last_active_at` columns to `students` + update `last_active_at` trigger on student activity |
| `supabase/migrations/XXXX_audit_triggers.sql` | Create | AFTER INSERT/UPDATE/DELETE triggers on student tables that INSERT into `data_access_logs` |
| `supabase/migrations/XXXX_pg_cron_anonymization.sql` | Create | pg_cron job for daily anonymization check + pg_net extension for email calls |
| `src/lib/privacy/consent.ts` | Create | `acceptConsent()`, `getCurrentConsentVersion()`, `checkConsentUpdate()` Server Actions |
| `src/lib/privacy/anonymize.ts` | Create | `getAnonymizationCandidates()`, `previewAnonymization()` — called by cron or admin |
| `src/lib/privacy/export.ts` | Create | `exportChildData(studentId)` Server Action — compiles JSON, logs, returns download |
| `src/lib/privacy/audit.ts` | Create | Client helpers for reading audit logs (parent view) |
| `src/lib/posthog.ts` | Modify | Extend `TinkuEvent` union with 6 privacy events (consent_accepted, consent_updated, data_access, data_export_requested, anonymization_triggered, anonymization_preview_sent) |
| `src/lib/sentry.ts` | Modify | Add privacy action names to Sentry tagging |
| `src/app/(auth)/register/consent/page.tsx` | Create | Consent screen component in rioplatense Spanish |
| `src/app/(parent)/settings/consent/page.tsx` | Create | Consent version update screen |
| `src/app/(parent)/dashboard/[studentId]/export/page.tsx` | Create | Data export download button |
| `src/app/privacy/page.tsx` | Create | Privacy policy page (rioplatense Spanish) |
| `src/middleware.ts` | Modify | Add consent version check for parent routes — redirect if behind |
| `src/app/layout.tsx` | Modify | No new providers (Sentry + PostHog already in from 1.11) |
| `.env.example` | Modify | Add `CONSENT_VERSION`, `ANONYMIZATION_INACTIVITY_DAYS`, `ANONYMIZATION_PREVIEW_DAYS`, `NEXT_PUBLIC_PRIVACY_POLICY_URL`, `RESEND_API_KEY` |
| `docs/privacy-policy.md` | Create | Privacy policy in rioplatense Spanish per spec REQ-06 |
| `docs/parental-consent.md` | Create | Consent document template (rioplatense Spanish) |
| `docs/onboarding-guide.md` | Create | WhatsApp onboarding guide for Javier (rioplatense Spanish) |
| `docs/ola1-retrospective.md` | Create | Ola 1 retrospective template with Go/No-Go framework |
| `docs/observation-protocol.md` | Modify (if exists from 1.11) | No changes — 1.12 observation uses same protocol |

## Interfaces / Contracts

### `acceptConsent(parentId, studentId, consentVersion)`

```typescript
// src/lib/privacy/consent.ts
interface ConsentRecord {
  id: string;
  parent_id: string;
  student_id: string;
  consent_text_hash: string;
  consent_version: string;
  accepted_at: Date;
  ip_address: string | null;
}

async function acceptConsent(
  parentId: string,
  studentId: string,
  consentVersion: string
): Promise<ConsentRecord>;
// throws if parent doesn't own student
// inserts into consent_versions
// tracks consent_accepted event
// returns immutable record
```

### `exportChildData(studentId)`

```typescript
// src/lib/privacy/export.ts
interface StudentDataExport {
  profile: StudentProfile;
  pedagogical_state: StudentConceptState[];
  exercise_history: StudentExerciseAttempt[];
  gamification: {
    levels: StudentLevel[];
    coins: StudentCoin[];
    missions: StudentMission[];
  };
  ari_conversations: AriConversation[];
  consent_history: ConsentRecord[];
}

async function exportChildData(studentId: string): Promise<StudentDataExport>;
// throws 403 if parent doesn't own student
// logs export in data_access_logs
// tracks data_export_requested event
```

### Extended `TinkuEvent` (privacy additions)

```typescript
type TinkuEvent =
  // ... existing events from 1.11 ...
  | { event: "consent_accepted"; properties: { parent_id: string; student_id: string; consent_version: string } }
  | { event: "consent_updated"; properties: { parent_id: string; student_id: string; old_version: string; new_version: string } }
  | { event: "data_access"; properties: { accessor_id: string; accessor_role: string; student_id: string; table_name: string; operation: string } }
  | { event: "data_export_requested"; properties: { parent_id: string; student_id: string; export_format: string } }
  | { event: "anonymization_triggered"; properties: { student_id: string; days_inactive: number } }
  | { event: "anonymization_preview_sent"; properties: { parent_id: string; student_id: string; days_until_anonymization: number } };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `acceptConsent()` — valid consent recorded, immutable, version check | Vitest: mock Supabase, verify INSERT called, verify UPDATE throws |
| Unit | `acceptConsent()` — blocks if parent doesn't own student | Vitest: verify throws 403 |
| Unit | `exportChildData()` — returns all data categories | Vitest: mock Supabase queries for each table, verify JSON structure has all required keys |
| Unit | `exportChildData()` — blocks unauthorized parent | Vitest: verify throws 403 + logs `export_denied` |
| Unit | PostHog allowlist rejects unknown privacy events | Vitest: `trackEvent({ event: "random_privacy_event" })` → warning + no capture |
| Unit | Consent middleware redirects when version behind | Vitest: mock middleware, verify redirect to consent update |
| Integration | Anonymization SQL — 30-day inactive students get PII wiped | Vitest/Supabase: INSERT inactive student, run anonymization SQL, verify PII fields overwritten |
| Integration | Anonymization is irreversible — original PII not recoverable | Vitest: verify overwrite, not soft-delete |
| Integration | Audit triggers fire on every student table access | Vitest: INSERT/UPDATE/DELETE on student tables, verify `data_access_logs` entry created |
| Integration | pg_cron job registered and executable | Manual: verify cron in Supabase dashboard, test with `SELECT cron.run()` |
| Integration | Consent version update flow — blocked until accepted | Playwright: parent login with old consent → verify redirect to consent screen → accept → verify dashboard access |
| E2E | Full registration with consent — end to end | Playwright: parent registers → accepts consent → child code generated → child logs in |
| E2E | Data export — end to end | Playwright: parent clicks export → receives JSON with all categories |
| E2E | Privacy policy accessible at `/privacy` | Playwright: navigate to `/privacy` → verify content in rioplatense Spanish |

## Migration / Rollout

1. **Phase 1 — Compliance infrastructure**: Deploy migrations (consent, audit, anonymization tables + triggers). Verify RLS policies block unauthorized access.
2. **Phase 2 — Consent flow**: Implement consent UI + Server Actions + middleware check. Test with Javier's own family first.
3. **Phase 3 — Anonymization cron**: Configure pg_cron + pg_net for email notifications. Test with a test student record.
4. **Phase 4 — Export endpoint**: Implement `exportChildData` + UI button. Verify all data categories present.
5. **Phase 5 — Onboarding**: Javier onboards 5 families via WhatsApp. Track in external tracker.
6. **Phase 6 — Feedback + Retrospective**: 3+ weeks of feedback collection. Write retrospective with Go/No-Go.
7. **Rollback**: Feature flag via `CONSENT_VERSION` env var — if set to empty, consent check is skipped (for emergency). Anonymization can be paused by disabling pg_cron entry. Registration of new families can be blocked via PostHog feature flag.

## Open Questions

- [ ] Resend account provisioned for anonymization preview emails? Need `RESEND_API_KEY`.
- [ ] pg_cron and pg_net extensions enabled on Supabase project? Need to verify with Supabase dashboard or support.
- [ ] Legal review of consent text — does the initial version (1.0.0) need lawyer sign-off, or is Javier's self-draft sufficient for Ola 1?
- [ ] Should `last_active_at` be updated on every student action (exercise attempt, island enter, etc.) or only on session start? Spec says "30 consecutive days of inactivity" — every action is more accurate but higher write volume. Recommendation: update on session_start only for Ola 1 (10 kids), iterate for Ola 2.