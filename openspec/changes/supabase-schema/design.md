# Design: Supabase Schema Tri-lateral con RLS

## Technical Approach

4 sequential commits, each leaving the tree green: (1) identity tables + RLS, (2) catalog tables + seeds, (3) student state tables + triggers/indexes + RLS, (4) TypeScript type generation + integration tests. Strict TDD: write RLS isolation tests BEFORE closing each migration. Each commit is independently verifiable via `pnpm test`.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| AD-01 | `users` extends `auth.users` | FK `users.id → auth.users.id` | Separate `users` with own PK | Preserves Supabase Auth lifecycle. Trigger auto-creates `public.users` row on signup. PK = auth UID, no collision. |
| AD-02 | `student_codes` separate from `students` | Dedicated table with UNIQUE 6-char code | Code column on `students` | Codes can regenerate without mutating `students`. UNIQUE constraint is clean. Mirrors proposal §key-decisions. |
| AD-03 | PostgreSQL ENUMs for restricted values | `user_role`, `island_id`, `concept_mastery_status`, `exercise_type`, `mission_type`, `mission_status` | Check constraints or string validation app-side | DB-level type safety. Readable queries. Supabase schema gen includes enums. |
| AD-04 | BKT fields in `student_concept_state` | Inline columns `p_known`, `attempts`, `last_seen`, `learn_rate`, `slip`, `guess` | JSONB blob | Motor BKT (Phase 1.6) needs per-field queries and indexes. JSONB would require indexing each access. |
| AD-05 | `app_events` as generic analytics table | `user_id + event_type + JSONB payload + created_at` | PostHog SDK or separate event tables | Zero external dependency for MVP. JSONB gives schema flexibility. Retention via pg_cron later. |
| AD-06 | RLS enforcement from migration 1 | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in every CREATE TABLE | Add RLS later | TINKU.md §12.3 mandate. Prevents accidental data leaks from day 1. |
| AD-07 | Trigger: auth.users → public.users auto-insert | `AFTER INSERT ON auth.users` function | App-side insertion after signUp | Guarantees sync even if signup bypasses our Server Action (e.g. OAuth flows). Single source of truth. |
| AD-08 | Trigger: student → student_levels auto-insert | `AFTER INSERT ON students` function | App-side creation in registerChild | Prevents orphan students without level row. Data integrity at DB level. |

## Data Model

### Migration 001 — Identity Tables

```
auth.users (Supabase managed)
  │
  ├─1:1→ public.users
  │        id        UUID PK FK → auth.users.id
  │        role      user_role ENUM (parent, admin) DEFAULT 'parent'
  │        full_name  TEXT
  │        avatar    TEXT
  │        created_at TIMESTAMPTZ DEFAULT now()
  │        updated_at TIMESTAMPTZ DEFAULT now()
  │
  ├─1:N→ public.students
  │        id        UUID PK DEFAULT gen_random_uuid()
  │        parent_id UUID FK → users.id ON DELETE CASCADE
  │        name      TEXT NOT NULL
  │        date_of_birth DATE
  │        grade     SMALLINT (1-7)
  │        avatar    TEXT
  │        has_seen_welcome BOOLEAN DEFAULT false
  │        created_at TIMESTAMPTZ DEFAULT now()
  │        updated_at TIMESTAMPTZ DEFAULT now()
  │
  └─1:1→ public.student_codes
           code       CHAR(6) PK  -- charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
           student_id UUID FK → students.id ON DELETE CASCADE
           created_at TIMESTAMPTZ DEFAULT now()
```

### Migration 002 — Catalog Tables

```
public.islands
  id           island_id ENUM PK ('numeros', 'amigos')
  name         TEXT NOT NULL
  description  TEXT
  theme_color  TEXT
  nap_alignment TEXT
  created_at   TIMESTAMPTZ DEFAULT now()

public.regions
  id          UUID PK DEFAULT gen_random_uuid()
  island_id   island_id ENUM FK → islands.id
  name        TEXT NOT NULL
  description TEXT
  "order"     SMALLINT NOT NULL  -- unlock order
  created_at  TIMESTAMPTZ DEFAULT now()

public.concepts
  id               UUID PK DEFAULT gen_random_uuid()
  region_id        UUID FK → regions.id
  name             TEXT NOT NULL
  description      TEXT
  difficulty_range SMALLINT[]  -- [min, max] e.g. {1,3}
  province_coin    TEXT NOT NULL
  nap_alignment    TEXT
  type_distribution JSONB  -- {"mcq":0.4, "numeric_input":0.25, ...}
  created_at       TIMESTAMPTZ DEFAULT now()

public.concept_prerequisites
  concept_id       UUID FK → concepts.id ON DELETE CASCADE
  prerequisite_id  UUID FK → concepts.id ON DELETE CASCADE
  PRIMARY KEY (concept_id, prerequisite_id)

public.exercises
  id             UUID PK DEFAULT gen_random_uuid()
  concept_id     UUID FK → concepts.id
  exercise_type  exercise_type ENUM
  prompt         TEXT NOT NULL
  correct_answer JSONB NOT NULL
  distractors    JSONB  -- null for non-MCQ
  hint           TEXT
  character_id   TEXT  -- references characters.yml
  context_id     TEXT  -- references contexts.yml
  difficulty     SMALLINT
  source         TEXT DEFAULT 'generated_v1'
  approved       BOOLEAN DEFAULT false
  created_at     TIMESTAMPTZ DEFAULT now()
  updated_at     TIMESTAMPTZ DEFAULT now()
```

### Migration 003 — Student State & Analytics Tables

```
public.student_concept_state
  student_id  UUID FK → students.id ON DELETE CASCADE
  concept_id  UUID FK → concepts.id ON DELETE CASCADE
  p_known     DECIMAL(5,4) DEFAULT 0.0
  attempts    SMALLINT DEFAULT 0
  last_seen   TIMESTAMPTZ
  learn_rate  DECIMAL(5,4) DEFAULT 0.1
  slip        DECIMAL(5,4) DEFAULT 0.1
  guess       DECIMAL(5,4) DEFAULT 0.2
  mastery     concept_mastery_status ENUM DEFAULT 'not_started'
  PRIMARY KEY (student_id, concept_id)

public.student_exercise_attempts
  id           UUID PK DEFAULT gen_random_uuid()
  student_id   UUID FK → students.id ON DELETE CASCADE
  exercise_id  UUID FK → exercises.id
  is_correct   BOOLEAN NOT NULL
  attempt_number SMALLINT
  time_ms      SMALLINT
  hint_used    BOOLEAN DEFAULT false
  created_at   TIMESTAMPTZ DEFAULT now()

public.student_levels
  student_id UUID FK → students.id ON DELETE CASCADE PRIMARY KEY
  level      SMALLINT DEFAULT 1
  xp         INTEGER DEFAULT 0
  title      TEXT DEFAULT 'Explorador Novato'
  updated_at TIMESTAMPTZ DEFAULT now()

public.student_coins
  id          UUID PK DEFAULT gen_random_uuid()
  student_id  UUID FK → students.id ON DELETE CASCADE
  province    TEXT NOT NULL  -- province identifier
  earned_at   TIMESTAMPTZ DEFAULT now()

public.student_ship_parts
  id          UUID PK DEFAULT gen_random_uuid()
  student_id  UUID FK → students.id ON DELETE CASCADE
  part_type   TEXT NOT NULL  -- sail, flag, paint, figurehead, lantern
  earned_at   TIMESTAMPTZ DEFAULT now()

public.missions
  id           UUID PK DEFAULT gen_random_uuid()
  title        TEXT NOT NULL
  description  TEXT
  mission_type mission_type ENUM ('daily', 'weekly', 'exploratory', 'creative')
  xp_reward    SMALLINT
  created_at   TIMESTAMPTZ DEFAULT now()

public.student_missions
  id           UUID PK DEFAULT gen_random_uuid()
  student_id   UUID FK → students.id ON DELETE CASCADE
  mission_id   UUID FK → missions.id
  status       mission_status ENUM ('active', 'completed', 'expired')
  completed_at TIMESTAMPTZ
  created_at   TIMESTAMPTZ DEFAULT now()

public.ari_conversations
  id          UUID PK DEFAULT gen_random_uuid()
  student_id  UUID FK → students.id ON DELETE CASCADE
  island_id   island_id ENUM
  concept_id  UUID FK → concepts.id
  message     TEXT NOT NULL
  response    TEXT NOT NULL
  model_used  TEXT
  tokens_used SMALLINT
  created_at  TIMESTAMPTZ DEFAULT now()

public.app_events
  id          UUID PK DEFAULT gen_random_uuid()
  user_id     UUID FK → auth.users(id)
  event_type  TEXT NOT NULL
  payload     JSONB DEFAULT '{}'
  created_at  TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_student_codes_student_id ON student_codes(student_id);
CREATE INDEX idx_student_concept_state_student ON student_concept_state(student_id);
CREATE INDEX idx_student_concept_state_concept ON student_concept_state(concept_id);
CREATE INDEX idx_student_exercise_attempts_student ON student_exercise_attempts(student_id, exercise_id);
CREATE INDEX idx_student_levels_student ON student_levels(student_id);
CREATE INDEX idx_exercises_concept ON exercises(concept_id, exercise_type);
CREATE INDEX idx_concepts_region ON concepts(region_id);
CREATE INDEX idx_regions_island ON regions(island_id);
CREATE INDEX idx_app_events_user_type ON app_events(user_id, event_type);
CREATE INDEX idx_ari_conversations_student ON ari_conversations(student_id, created_at DESC);
```

### RLS Policies

| Table | Policy | Role | Condition |
|-------|--------|------|-----------|
| `users` | "Users read own" | authenticated | `id = auth.uid()` |
| `users` | "Admin read all" | admin | `role = 'admin'` |
| `students` | "Parent sees own children" | authenticated | `parent_id = (SELECT id FROM users WHERE id = auth.uid())` |
| `students` | "Admin sees all" | admin | `true` |
| `student_codes` | "Parent sees own children's codes" | authenticated | via student parent_id |
| `student_concept_state` | "Student sees own" | anonymous+authenticated | `student_id = auth.uid()::uuid OR student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())` |
| `student_exercise_attempts` | "Student sees own" | anonymous+authenticated | same pattern |
| `student_levels` | "Student sees own" | anonymous+authenticated | same pattern |
| `student_coins` | "Student sees own" | anonymous+authenticated | same pattern |
| `student_ship_parts` | "Student sees own" | anonymous+authenticated | same pattern |
| `student_missions` | "Student sees own" | anonymous+authenticated | same pattern |
| `ari_conversations` | "Student sees own" | anonymous+authenticated | same pattern |
| `app_events` | "User sees own" | authenticated | `user_id = auth.uid()` |
| Catalog tables | "Anyone read" | anon+authenticated | `true` (SELECT only) |

## API / Server Actions

Not in this change (Phase 1.4+). This change only provides the data layer.

## File Structure

```
supabase/
├── migrations/
│   ├── 001_users_students.sql          -- identity tables + triggers + RLS
│   ├── 002_catalog.sql                -- catalog tables + enums + seeds
│   └── 003_student_state.sql           -- state tables + triggers + indexes + RLS
├── seeds/
│   ├── seed_islands.sql                -- 2 islands (UPSERT)
│   ├── seed_regions.sql                -- 6 regions (UPSERT)
│   └── seed_concepts.sql              -- 25 concepts + prereqs (UPSERT)
src/lib/supabase/
├── database.types.ts                   -- auto-generated via supabase gen types
├── client.ts                           -- MODIFIED: typed with database.types
├── server.ts                           -- MODIFIED: typed with database.types
└── middleware.ts                        -- MODIFIED: no changes this phase
tests/integration/
├── rls/
│   ├── parent-isolation.test.ts        -- parent A ≠ parent B
│   ├── student-isolation.test.ts       -- student X ≠ student Y
│   └── admin-access.test.ts           -- admin sees all
└── schema/
    ├── referential-integrity.test.ts   -- FK constraints
    ├── unique-constraints.test.ts      -- student_codes.code
    └── enum-constraints.test.ts        -- ENUM validation
```

## Migration Strategy

**Deployment order**: 001 → 002 → 003, verified sequentially. Each migration is idempotent (uses `IF NOT EXISTS`). Seeds use `UPSERT` so re-execution is safe.

**Rollback**: `supabase db reset` restores clean state. Individual migration rollback via `supabase migration repair <version> --status reverted` then manual DROP CASCADE.

**Zero-downtime**: Not required for beta (single dev environment). Production will need blue-green strategy when relevant.

**Type generation**: Run `supabase gen types typescript --project-id rihbkanevxlvisanlvsn > src/lib/supabase/database.types.ts` after all 3 migrations applied.

## Testing Strategy

| Layer | What | How | Runner |
|-------|------|-----|--------|
| Integration | RLS isolation: parent A cannot see parent B's children | Create 2 parent users + children via Supabase client, query as each user | Vitest |
| Integration | RLS isolation: student X cannot see student Y's data | Create 2 students, query `student_concept_state`, `student_exercise_attempts`, `student_levels`, `student_coins` | Vitest |
| Integration | Admin can see all data | Create admin user, query all tables | Vitest |
| Integration | FK constraints prevent orphan inserts | Attempt INSERT without parent row, expect error | Vitest |
| Integration | UNIQUE constraint on `student_codes.code` | Insert duplicate code, expect error | Vitest |
| Integration | ENUM types reject invalid values | Insert invalid `user_role`, `exercise_type`, expect error | Vitest |
| Integration | Trigger `updated_at` auto-updates | UPDATE any row, verify `updated_at` changed | Vitest |
| Integration | Trigger `student_levels` auto-creates | INSERT into `students`, verify `student_levels` row exists | Vitest |
| Integration | Trigger `auth.users → public.users` sync | signUp via Supabase Auth, verify `public.users` row exists with `role='parent'` | Vitest |

## Commit Plan

1. **`feat(schema): add core tables — users, students, student_codes`** — Migration 001 + RLS + triggers (auth.users sync, updated_at). RLS tests for parent isolation.
2. **`feat(schema): add catalog tables — islands, regions, concepts, exercises, concept_prerequisites`** — Migration 002 + ENUM types + seeds (2 islands, 6 regions, 25 concepts). FK/integrity tests.
3. **`feat(schema): add student state tables — concept_state, attempts, levels, coins, ship_parts, missions, ari_conversations, app_events`** — Migration 003 + indexes + triggers. RLS tests for student isolation.
4. **`feat(schema): generate TypeScript helpers and add RLS integration tests`** — `supabase gen types`, typed helpers, full integration suite. Verify `pnpm typecheck` clean.