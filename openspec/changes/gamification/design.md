# Design: gamification

## Technical Approach

Layered architecture: YAML seeds → Supabase tables (RLS from day 1) → Server Actions (all mutations, all calculation server-side) → Zustand store (client cache) → React components. XP is NEVER calculated on the client — the client sends events, the server computes amounts. All pedagogical state lives in Supabase, never in localStorage.

Server Actions are the single source of truth for mutations. Zustand mirrors server state for optimistic UI, but every write goes through a Server Action first.

## Architecture Decisions

### AD-01: XP curve uses diminishing-returns polynomial, not exponential

**Choice**: `xp_for_level(n) = 50 * n^1.3` (rounded to nearest 5)
**Alternatives**: Linear (too slow late), Exponential (demotivating at high levels), Fibonacci (unpredictable jumps)
**Rationale**: Polynomial with exponent 1.3 gives fast early levels (~5 sessions to level 10) and sustained but achievable late game (~1 school year to level 50). Values are parametrized in `seeds/levels.yml` so tuning requires zero code changes.

### AD-02: Title-to-level mapping in seed, not hardcoded

**Choice**: `seeds/levels.yml` contains 50 entries, each with `{level, xp_required, title, ship_asset_id}`. Title ranges (Novato 1-5, etc.) are defined by grouping in the seed.
**Alternatives**: Hardcoded switch/if-else, database table for titles
**Rationale**: Seed is idempotent, version-controlled, and tunable without deployment. Grouping by range keeps 50 entries manageable.

### AD-03: awardXp as atomic Server Action with levelup detection

**Choice**: Single `awardXp(studentId, amount)` Server Action. Uses Supabase RPC (`increment_xp_and_check_level`) for atomicity — increment + level recalculation in a single DB transaction.
**Alternatives**: Client computes amount + server accepts it (trust boundary violation), separate actions for XP and level
**Rationale**: REQ-GE-06 mandates server-side calculation. Atomicity prevents race conditions when two exercises complete simultaneously.

### AD-04: Coin award via UPSERT with UNIQUE constraint

**Choice**: `student_coins` table has `UNIQUE(student_id, coin_id)`. `awardCoin` uses `INSERT ... ON CONFLICT DO NOTHING` and returns `{awarded: false}` silently on duplicate.
**Alternatives**: Check-then-insert (race condition), application-level dedup
**Rationale**: UNIQUE constraint is the only race-condition-proof solution (REQ-CC-03).

### AD-05: Mission rotation seeded by date, not random

**Choice**: Daily missions hash `(student_id, date)` to select from pool. Weekly missions hash `(student_id, week_number)`. Deterministic, no randomness.
**Alternatives**: Random selection (violates deterministic principle), teacher-assigned (Ola 2+)
**Rationale**: Hash-seeded rotation means same user sees same missions each day/week, preventing "refresh to get better missions" gaming.

### AD-06: CelebrationModal lazy-loads Lottie animations

**Choice**: `React.lazy()` + `Suspense` for Lottie components. Only `medium`, `unique`, `maximum` levels use Lottie. `subtle` uses Motion (CSS/Framer) — no modal needed.
**Alternatives**: Preload all Lottie files, static CSS animations only
**Rationale**: REQ-CEL-08 mandates lazy loading. Lottie files are ~50-100KB each; loading all would bloat the initial bundle significantly.

### AD-07: Zustand store mirrors server state, never source of truth

**Choice**: `gamification-store.ts` holds `{level, title, totalXp, coins, activeMissions}` synced from Server Action responses. Optimistic updates allowed on client, server response overrides.
**Alternatives**: Pure Supabase real-time subscriptions (overkill for gamification), no client store (excessive server round-trips)
**Rationale**: REQ-GE-08 requires real-time reflection of level changes. Zustand gives responsive UI while Supabase remains authoritative.

### AD-08: Mission progress computed from real events, not counters

**Choice**: `checkMissionProgress(studentId, eventType, payload)` evaluates active missions against the event type. It queries real data (exercises completed today, concepts mastered this week) rather than incrementing a separate counter.
**Alternatives**: Separate `mission_progress` counter table that increments on events
**Rationale**: Counter tables can drift from reality. Computing from source data ensures accuracy, though we cache the result in `student_missions.progress` for read performance.

## Data Model

```sql
-- levels (seeded from seeds/levels.yml)
CREATE TABLE levels (
  level INT PRIMARY KEY,
  xp_required INT NOT NULL,
  title TEXT NOT NULL,
  ship_asset_id TEXT NOT NULL
);

-- student_levels (per student)
CREATE TABLE student_levels (
  student_id UUID PRIMARY KEY REFERENCES students(id),
  level INT NOT NULL DEFAULT 1,
  total_xp INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT 'Explorador Novato',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- coins (seeded from seeds/coins.yml)
CREATE TABLE coins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  symbol TEXT NOT NULL,
  cultural_fact TEXT NOT NULL,
  concept_id UUID REFERENCES concepts(id)
);

-- student_coins (collection)
CREATE TABLE student_coins (
  student_id UUID REFERENCES students(id),
  coin_id TEXT REFERENCES coins(id),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, coin_id)
);

-- missions (seeded from seeds/missions.yml)
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily','weekly','exploratory','creative')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective JSONB NOT NULL,
  xp_reward INT NOT NULL,
  coin_reward TEXT REFERENCES coins(id),
  ship_part_reward TEXT
);

-- student_missions (tracking)
CREATE TABLE student_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  mission_id UUID REFERENCES missions(id),
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  date_key TEXT NOT NULL, -- 'YYYY-MM-DD' for daily, 'YYYY-WXX' for weekly
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, mission_id, date_key)
);

-- student_ship_parts
CREATE TABLE student_ship_parts (
  student_id UUID REFERENCES students(id),
  ship_part_id TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, ship_part_id)
);
```

## API / Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `awardXp(studentId, amount)` | studentId: UUID, amount: number | `{levelUp, newLevel, newTitle, totalXp}` | Student (own) |
| `awardCoin(studentId, coinId)` | studentId: UUID, coinId: string | `{awarded, coinId?, coinName?, culturalFact?}` | Server (BKT trigger) |
| `getActiveMissions(studentId)` | studentId: UUID | `{daily: Mission[], weekly: Mission[], exploratory: Mission[]}` | Student (own) |
| `checkMissionProgress(studentId, eventType, payload)` | studentId, eventType, payload | `{missionsUpdated, missionsCompleted, xpAwarded}` | Student (own) |
| `getGamificationState(studentId)` | studentId: UUID | `{level, title, totalXp, coins, activeMissions}` | Student (own) |

## Component Tree

```
<GameWorld>
  ├── <LevelBadge />           — Shows title + level, subscribes to store
  ├── <MissionsWidget />        — Daily/weekly missions with progress bars
  ├── <CoinCollection />        — 23-coin grid, earned colored / unearned gray
  └── <CelebrationOverlay>
       ├── (subtle) → Motion bounce/tick inline, no modal
       └── (medium/unique/maximum) → <CelebrationModal />
            ├── <LottieAnimation />  — Lazy loaded
            └── <CelebrationContent /> — XP, coin, title change info
```

## File Structure

```
seeds/
  levels.yml                          — 50 levels + titles + ship assets
  coins.yml                           — 23 provincial coins + cultural data
  missions.yml                        — Mission templates by type
src/lib/gamification/
  xp.ts                               — XP curve calculation, event→amount mapping
  levels.ts                           — Level lookup, title resolution
  missions.ts                          — Mission rotation logic, progress evaluation
  celebrations.ts                      — Celebration severity determination
src/app/actions/
  gamification.ts                      — awardXp, awardCoin, getActiveMissions, checkMissionProgress
src/components/gamification/
  LevelBadge.tsx                       — Title + level display
  CoinCollection.tsx                   — 23-coin collection grid
  MissionsWidget.tsx                   — Active missions with progress
  CelebrationModal.tsx                  — Lottie modal for medium+ celebrations
  CelebrationOverlay.tsx               — Orchestrator (severity → subtle or modal)
src/stores/
  gamification-store.ts                — Zustand: level, xp, coins, missions
supabase/migrations/
  xxx_gamification_tables.sql          — All tables + RLS policies
  xxx_gamification_rpc.sql              — increment_xp_and_check_level RPC
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | XP curve calculation, level resolution, title ranges | Vitest: `xp.test.ts`, `levels.test.ts` |
| Unit | Coin dedup (UPSERT logic), mission rotation seeding | Vitest: `coins.test.ts`, `missions.test.ts` |
| Unit | Mission progress evaluation from events | Vitest: `missions.test.ts` |
| Unit | Celebration severity determination | Vitest: `celebrations.test.ts` |
| Integration | `awardXp` atomicity (level up detection) | Vitest + Supabase local |
| Integration | `awardCoin` idempotence (double-award returns `awarded: false`) | Vitest + Supabase local |
| Integration | `checkMissionProgress` → `awardXp` chain | Vitest + Supabase local |
| Component | `<CelebrationModal>` lazy loads Lottie | RTL + Vitest |
| Component | `<CoinCollection>` earned/unearned rendering | RTL + Vitest |
| E2E | Student completes exercise → XP awarded → level up visible | Playwright |

## Commit Plan

1. `feat(gamification): add levels, coins, missions seed YAML files` — Seeds only, no logic
2. `feat(gamification): add Supabase migration for gamification tables + RLS` — Schema + RPC
3. `feat(gamification): add XP curve calculation and level resolution` — `xp.ts`, `levels.ts` + tests
4. `feat(gamification): add awardXp Server Action with atomic levelup detection` — `gamification.ts` + tests
5. `feat(gamification): add awardCoin Server Action with dedup` — + tests
6. `feat(gamification): add mission system — rotation, progress, completion` — `missions.ts` + tests
7. `feat(gamification): add coin collection and mission Server Actions` — `getActiveMissions`, `checkMissionProgress` + tests
8. `feat(gamification): add Zustand gamification store` — `gamification-store.ts`
9. `feat(gamification): add LevelBadge, CoinCollection, MissionsWidget components` — UI components
10. `feat(gamification): add CelebrationModal with lazy Lottie + severity system` — Celebrations
11. `feat(gamification): add ship upgrades — 5 appearances + 5 collectible parts` — `ship-upgrades.ts`, student_ship_parts + tests
12. `feat(gamification): wire gamification into exercise flow` — Integration with BKT + exercise components
13. `test(gamification): add E2E tests for full gamification flow` — Playwright

## Open Questions

- [ ] Exact XP values for seed: need pedagogical team input on "fast early ~5 sessions to level 10"
- [ ] Ship asset IDs: placeholder until design team delivers SVGs
- [ ] Mission pool size: 5 daily types minimum — how many templates per type?