# Design: parent-portal

## Technical Approach

Server Components by default for all dashboard data fetching. No Zustand for data display — data flows directly from Server Action → Server Component → hydrated client for interactive elements only. Layout: sidebar with children list + main area with detail view. Typography: Inter (NOT Andika), shadcn/ui default theme. Deliberate absence of gamified elements.

Parent routes are protected by Supabase Auth + RLS double-verification. The parent sees ONLY their own children — no cross-family data leakage. Weekly reports run via Supabase Edge Function cron (pg_cron or Vercel cron) calling a Server Action that generates + sends via Resend.

Alerts use a background detection mechanism: after each BKT update, a Server Action checks for stagnation and creates `parent_alerts` rows. The parent dashboard reads these with real-time updates via Supabase subscription.

## Architecture Decisions

### AD-01: Server Components for dashboard, "use client" only where needed

**Choice**: `/dashboard` and `/dashboard/[student-id]` are Server Components. Data fetched in `generateMetadata` + page component. Client components only for: sidebar navigation, notification badges, time-limit controls.
**Alternatives**: Full client-side data fetching with Zustand (overkill for read-heavy dashboard), ISR (data must be fresh)
**Rationale**: REQ-PD-01 mandates Server Components by default. Dashboard is read-heavy — no need for client-side state management. Client interactivity is minimal (click child, mark alert read, toggle settings).

### AD-02: Inter font for parent portal, not Andika

**Choice**: `next/font/google` with `Inter` for `/dashboard/*` routes. Andika remains for student-facing routes only.
**Alternatives**: Andika everywhere ( playful in a professional dashboard), system font (lacks polish)
**Rationale**: REQ-PD-06 and REQ-PD-01 explicitly mandate Inter for the parent portal. Andika is for kids. The parent dashboard must feel sober and professional.

### AD-03: RLS + Server Action double-verification for parent-child access

**Choice**: Every Server Action that returns student data does TWO checks: (1) Validate `parentId` via `auth.uid()` matches the requesting user, (2) Query `students WHERE parent_id = parentId AND id = studentId`. RLS policies mirror this at the database level.
**Alternatives**: RLS only (could be bypassed by server-side code), middleware only (too coarse)
**Rationale**: REQ-PD-04 mandates double verification. RLS protects direct DB access; Server Action logic protects API-level access. Belt and suspenders for child data.

### AD-04: Alert detection as post-BKT Server Action, not cron job

**Choice**: After BKT updates `p_known`, the Server Action calls `checkStagnation(studentId, conceptId)`. This immediately creates a `parent_alerts` row if N attempts (default 5) show no improvement. No background cron needed for detection.
**Alternatives**: Cron job scanning all students periodically (expensive, delayed detection), real-time BKT hooks (not available in current stack)
**Rationale**: Checking at BKT-update time is event-driven → immediate alerts, no polling cost. The detection itself is a lightweight query against existing data.

### AD-05: Weekly report via Supabase Edge Function cron + Resend

**Choice**: Supabase Edge Function `weekly-report` runs every Sunday 09:00 AR time via `pg_cron`. It queries students with activity, generates report data, renders React Email template, and sends via Resend API.
**Alternatives**: Vercel cron (doesn't work in self-hosted), Next.js API route + external cron trigger, Resend scheduled sends (no template support)
**Rationale**: REQ-WR-01 and REQ-PB-PP-02 specify Edge Function. Supabase pg_cron is reliable and already in the stack. Resend is the transactional email provider specified in the proposal.

### AD-06: React Email for weekly report template

**Choice**: `src/templates/weekly-report.tsx` uses React Email (`@react-email/components`) to generate responsive HTML email. Template renders on the server during Edge Function execution.
**Alternatives**: Plain HTML string templates (hard to maintain), MJML (another template language), Resend built-in templates (limited customization)
**Rationale**: React Email lets us use familiar JSX for templates, share types with the dashboard, and produce responsive HTML. Matches REQ-WR-04.

### AD-07: Parental controls stored in `users` table JSONB column

**Choice**: Add `parental_settings JSONB` column to `users` table (or a `parental_controls` table with one row per parent-student pair). Structure: `{dailyTimeLimitMinutes: 60, allowedHoursStart: "07:00", allowedHoursEnd: "21:00", weeklyReportEnabled: true, stagnationAlertsEnabled: true}`. Defaults are applied server-side when no row exists.
**Alternatives**: Separate table per setting (over-normalaized), environment variables (not per-user), localStorage (not synced, not secure)
**Rationale**: REQ-PC-05 defines a clear contract. A dedicated table with `parent_id + student_id` as key gives clean per-child configuration with RLS. JSONB column over-normalizes would require migrations for every setting change.

### AD-08: Time enforcement in Server Actions, not middleware

**Choice**: Each relevant Server Action (exercise start, mission start, BKT update) calls `checkTimeLimits(studentId)`. This checks: (1) daily usage today vs. daily limit, (2) current time vs. allowed hours. Returns `{allowed: boolean, reason?: 'time_exceeded' | 'outside_hours', message?: string}`.
**Alternatives**: Next.js middleware (can't access Supabase easily), client-side only (trivially bypassed), separate enforcement service (overkill)
**Rationale**: REQ-PC-03 mandates Server Action enforcement. Middleware can't query usage data reliably. Server-side enforcement is authoritative; client shows the friendly message.

## Data Flow

```
[Parent Login] 
  → /dashboard (Server Component)
  → getChildrenSummary(parentId) — Server Action
  → Supabase: SELECT students WHERE parent_id = parentId (RLS enforced)
  → Render child cards

[Parent clicks child]
  → /dashboard/[student-id] (Server Component)
  → getStudentDetail(parentId, studentId) — Server Action
  → Validates parent-child relationship
  → Queries: student_levels, student_concept_state, student_coins, student_missions
  → Render detail view

[Alert detection]
  BKT update → checkStagnation(studentId, conceptId)
  → If p_known unchanged for N attempts → INSERT parent_alerts
  → Parent sees badge on next dashboard load

[Weekly report]
  pg_cron (Sunday 09:00 AR) → Edge Function weekly-report
  → For each parent with active students:
    → Generate report data
    → Render weekly-report.tsx → HTML
    → Send via Resend API
    → Log outcome

[Time enforcement]
  Student starts exercise → Server Action
  → checkTimeLimits(studentId)
  → If not allowed → return {allowed: false, reason, message}
  → Client shows "¡Es hora de descansar! Volvé mañana."
```

## Data Model

```sql
-- parent_alerts
CREATE TABLE parent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  parent_id UUID NOT NULL REFERENCES auth.users(id),
  concept_id UUID REFERENCES concepts(id),
  concept_name TEXT NOT NULL,
  p_known_current DECIMAL(5,4),
  attempts_without_improvement INT NOT NULL,
  suggestion TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- parental_controls (one row per parent-student pair)
CREATE TABLE parental_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id),
  student_id UUID NOT NULL REFERENCES students(id),
  daily_time_limit_minutes INT NOT NULL DEFAULT 60,
  allowed_hours_start TEXT NOT NULL DEFAULT '07:00',
  allowed_hours_end TEXT NOT NULL DEFAULT '21:00',
  weekly_report_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  stagnation_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- student_time_tracking (for daily time limit enforcement)
CREATE TABLE student_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_minutes INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  UNIQUE(student_id, date)
);
```

## API / Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `getChildrenSummary(parentId)` | parentId: UUID | `ChildSummary[]` | Parent (own) |
| `getStudentDetail(parentId, studentId)` | parentId, studentId | `StudentDetail` | Parent (own children) |
| `getParentalControls(parentId, studentId)` | parentId, studentId | `ParentalControls` | Parent (own children) |
| `updateParentalControls(parentId, studentId, config)` | parentId, studentId, `Partial<ParentalControls>` | `{success: boolean}` | Parent (own children) |
| `checkStagnation(studentId, conceptId)` | studentId, conceptId | `AlertCreated \| null` | Internal (BKT trigger) |
| `getParentAlerts(parentId)` | parentId | `ParentAlert[]` | Parent (own) |
| `markAlertRead(alertId)` | alertId | `{success: boolean}` | Parent (own alert) |
| `checkTimeLimits(studentId)` | studentId | `{allowed: boolean, reason?, message?}` | Internal |

## Component Tree

```
<DashboardLayout>                          — Server Component wrapper
  ├── <DashboardSidebar>
  │    ├── <ChildCard />                    — Summary per child (Server Component)
  │    └── <AlertBadge />                   — Number of pending alerts
  └── <DashboardMain>
       ├── /dashboard                       — <ChildrenList> (Server Component)
       │    └── <ChildSummaryCard />         — Per child: level, concepts, time
       ├── /dashboard/[student-id]          — <StudentDetail> (Server Component)
       │    ├── <ConceptsMastered />         — List of mastered (p_known ≥ 0.85)
       │    ├── <ConceptsInProgress />       — List in progress (0.3 < p_known < 0.85)
       │    ├── <ConceptsStuck />            — List stuck (not improving)
       │    ├── <DailyTimeChart />           — Bar chart: time per day, last month
       │    ├── <CoinCollectionPreview />    — Coins earned (read-only)
       │    └── <AriHistory />               — Read-only conversation log
       ├── /dashboard/settings              — <ParentSettings> (Client Component)
       │    ├── <TimeLimitControl />         — Daily limit slider
       │    ├── <AllowedHoursControl />      — Time range picker
       │    └── <NotificationPreferences />  — Weekly report, alerts toggles
       └── <AlertsPanel />                   — List of pending alerts
```

## File Structure

```
src/app/dashboard/
  layout.tsx                            — Inter font wrapper, sidebar layout
  page.tsx                              — Server Component: children list
  [student-id]/
    page.tsx                            — Server Component: student detail
  settings/
    page.tsx                            — Client Component: parental controls
src/app/actions/
  parent.ts                             — getChildrenSummary, getStudentDetail, parental controls actions
src/lib/parent/
  alerts.ts                             — checkStagnation, getParentAlerts, markAlertRead
  reports.ts                            — generateWeeklyReport data aggregation
  controls.ts                           — checkTimeLimits, validateParentChild
src/templates/
  weekly-report.tsx                      — React Email template for weekly report
src/components/dashboard/
  DashboardSidebar.tsx                   — Sidebar with children list + alerts badge
  ChildSummaryCard.tsx                  — Per-child summary card
  ConceptsMastered.tsx                   — List of mastered concepts
  ConceptsInProgress.tsx                 — List of in-progress concepts
  ConceptsStuck.tsx                      — Stuck concepts with suggestion
  DailyTimeChart.tsx                     — Time usage chart (simple bar)
  CoinCollectionPreview.tsx              — Read-only coin collection
  AriHistory.tsx                         — Read-only Ari conversation log
  TimeLimitControl.tsx                   — Daily time limit slider
  AllowedHoursControl.tsx               — Time range picker
  NotificationPreferences.tsx            — Report and alert toggles
  AlertsPanel.tsx                        — Pending alerts list
supabase/functions/
  weekly-report/
    index.ts                            — Edge Function: Sunday cron, generates + sends reports
supabase/migrations/
  xxx_parent_portal_tables.sql           — parent_alerts, parental_controls, student_time_tracking + RLS
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `alerts.ts` — stagnation detection logic (N attempts without improvement) | Vitest |
| Unit | `controls.ts` — time limit enforcement, allowed hours check | Vitest |
| Unit | `reports.ts` — weekly report data aggregation | Vitest |
| Unit | `parent.ts` — Server Action parent-child validation | Vitest with mocked Supabase |
| Integration | RLS policies — parent can only see own children's data | Vitest + Supabase local |
| Integration | `getStudentDetail` — full query chain | Vitest + Supabase local |
| Component | `<ChildSummaryCard>` renders child data | RTL + Vitest |
| Component | `<TimeLimitControl>` saves settings | RTL + Vitest |
| Component | `<AlertsPanel>` shows pending alerts | RTL + Vitest |
| Unit | `weekly-report.tsx` — renders HTML email template | Vitest + React Email |
| E2E | Parent logs in → sees only their children → can't access other children | Playwright |
| E2E | Parent sets time limit → child sees "time to rest" message | Playwright |

## Migration / Rollout

Phase 1: Dashboard + alert detection (no weekly report yet). Parent can see children, gets in-app alerts.
Phase 2: Settings page with parental controls (time limits, notification preferences).
Phase 3: Weekly report Edge Function + Resend integration. Requires Resend domain verification.
Phase 4: Data export endpoint (documented in this change, implemented Ola 2+).

## Commit Plan

1. `feat(parent): add Supabase migration for parent portal tables + RLS` — Tables + policies
2. `feat(parent): add Inter font for dashboard routes` — Layout with Inter font
3. `feat(parent): add getChildrenSummary and getStudentDetail Server Actions` — Data fetching + tests
4. `feat(parent): add dashboard layout with sidebar + Inter font` — Layout component
5. `feat(parent): add /dashboard page — children list with summary cards` — Server Components
6. `feat(parent): add /dashboard/[student-id] — student detail view` — Concepts, time, coins
7. `feat(parent): add stagnation detection — checkStagnation Server Action` — Alert logic + tests
8. `feat(parent): add parent_alerts table + RLS + alert panel component` — Alerts UI
9. `feat(parent): add parental controls — time limits, allowed hours, settings page` — Controls + tests
10. `feat(parent): add time enforcement in exercise Server Actions` — checkTimeLimits integration
11. `feat(parent): add weekly report Edge Function + Resend integration` — Cron + email
12. `feat(parent): add weekly report React Email template` — `weekly-report.tsx`
13. `feat(parent): add Ari history read-only view for parent audit` — Integration with ari-personalities
14. `test(parent): add E2E tests for parent portal` — Playwright

## Open Questions

- [ ] Resend domain verification: needs DNS setup before weekly reports can be sent to real email addresses
- [ ] pg_cron vs. Vercel cron for scheduling: confirm Supabase project tier supports pg_cron
- [ ] Time tracking granularity: currently per-day — need to decide if we track per-session or aggregate
- [ ] Data portability endpoint (export): documented but deferred to Ola 2+ — confirm this is acceptable
- [ ] Consent versioning: documented in proposal as out of scope for Ola 1 — confirm legal requirements are met