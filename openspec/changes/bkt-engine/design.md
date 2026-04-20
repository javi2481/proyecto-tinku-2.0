# Design: bkt-engine

## Technical Approach

4 commits atómicos: tipos → funciones puras BKT → Server Action attemptExercise → migración Supabase. Las funciones BKT son puras (sin I/O), fáciles de unit testear. El Server Action orquesta lectura/escritura Supabase + llama funciones puras. Migración al final para no bloquear dev.

Refs: specs `project-bootstrap` (MOD — migration), `adaptive-engine` (ADD). Proposal `bkt-engine`.

## Architecture Decisions

### AD-01: BKT Simplificado 3 Parámetros — Funciones Puras Separadas de I/O

**Choice**: Motor BKT como funciones puras en `lib/adaptive/engine.ts` que reciben parámetros y retornan resultados. Sin side effects. Sin Supabase calls dentro del engine. Server Action `attemptExercise` orquesta I/O y llama funciones puras.
**Alternatives**: (a) Engine como clase con estado — difícil de testear, acoplado a Supabase. (b) Engine que llama Supabase directamente — side effects ocultos, imposible unit test sin mock.
**Rationale**: Funciones puras = unit tests sin mocks. BKT es TD mathematics — separarlo de I/O es Clean Architecture básico. El Server Action es el único lugar con side effects.

### AD-02: BKT Update Formula — Empirical Simplification

**Choice**: Fórmula simplificada:
```
// Acierto (wasCorrect = true)
p_known = p_known + learn_rate * (1 - p_known)
// Clamp to [0, 1]

// Error (wasCorrect = false)
p_known = (p_known * (1 - slip)) / ((p_known * (1 - slip)) + ((1 - p_known) * guess))
// Clamp to [0, 1]

// Mastery threshold: p_known >= 0.85 → status = 'mastered'
// Degradation: 3+ consecutive errors at mastered → p_known = 0.7, status = 'in_progress'
```
**Alternatives**: (a) BKT formal 4-parámetro con P(L₀) — overkill para Ola 1 con pocos datos. (b) Simple ratio correct/total — no adapta, no distingue entre instante y tendencia.
**Rationale**: Fórmula empírica inspirada en BKT que se comporta bien con pocos datos. `learn_rate` y `slip`/`guess` permiten calibrar por concepto en el futuro. El `p_known` clamp previene overflow/underflow.

### AD-03: Exercise Selection — ZPD Bandas + Anti-repeat

**Choice**: Banda de `p_known` → dificultad: `< 0.3 → easy`, `0.3–0.7 → medium`, `0.7–0.85 → hard`, `≥ 0.85 → null (mastered)`. Dentro de cada banda, selección aleatoria exluyendo último ejercicio respondido. Fallback a banda adyacente si no hay ejercicios disponibles.
**Alternatives**: (a) Selección determinista secuencia — no adapta, todos ven lo mismo. (b) Thompson sampling — overkill para beta cerrada.
**Rationale**: Zonas de ZPD del proposal son simples y efectivas. Aleatorio dentro de la banda previene repetición. Fallback a banda adyacente cubre edge case de falta de ejercicios.

### AD-04: XP Computation — Pure Function with Multipliers

**Choice**: `computeXp(difficulty, attemptNumber, usedHint)` — pure function. Base XP = 10. Multiplier: difficulty (easy 1x, medium 1.5x, hard 2x) × attempt penalty (1st 1x, 2nd 0.5x) × hint penalty (with hint 0.33x). Mastery bonus (50 XP) computed separately in Server Action.
**Alternatives**: (a) XP como tabla lookup — menos flexible para ajustes. (b) XP en frontend — hackeable, inseguro.
**Rationale**: Pure function = fácil de testear, imposible de hackear (server-side). Los multipliers coinciden con TINKU.md §9.2.

### AD-05: Server Action `attemptExercise` — Orquestador con Steps Explícitos

**Choice**:
```ts
async function attemptExercise(exerciseId: string, answer: StudentAnswer): Promise<AttemptResult> {
  // 1. Auth check — throw if no session
  // 2. Validate exercise exists and belongs to concept
  // 3. Check answer (correct/incorrect or participation for socioemotional)
  // 4. getCurrentPKnown — read from Supabase
  // 5. updatePKnown — compute new p_known (pure function)
  // 6. computeXp — pure function
  // 7. Write attempt record to student_exercise_attempts
  // 8. Update student_concept_state in Supabase
  // 9. Check mastery → side effects (phase 1.8)
  // 10. pickNextExercise — pure function with Supabase query for exercises
  // 11. Return AttemptResult { correct, xpEarned, pKnown, mastered, nextExercise }
}
```
**Alternatives**: (a) Múltiples Server Actions por paso — overhead de red, transacciones parciales. (b) RPC de Supabase — pierde type safety, difícil de testear.
**Rationale**: Un Server Action orquesta todo en una transacción lógica. Menos round-trips. Los pasos 4-6 son funciones puras testeables independientemente. Auth check explícito previene datos corruptos.

### AD-06: Decay por Ausencia y Forgetting Factor

**Choice**: `getCurrentPKnown` aplica decaimiento temporal: si `last_seen > 30 días`, `p_known = p_known * (0.99 ^ dias_ausencia)`, clamp [0, 0.7]. Si concepto mastered y alumno falla 3+ veces seguidas, degrada a `p_known = 0.7`, `status = 'in_progress'`.
**Alternatives**: (a) Sin decaimiento — concepto mastered se queda masterizado para siempre, poco realista. (b) Dejando de lado forgetting — aceptable para beta cerrada pero crea deuda pedagógica.
**Rationale**: REQ-BKT-08 especifica ambos edge cases. El decaimiento exponencial con 0.99^días es suave pero reconocible. 3 errores consecutivos bajan dominado a en_progreso es consistente con forgetting research.

### AD-07: student_concept_state Migration — RLS desde Día 1

**Choice**: Migración SQL que crea `student_concept_state` con RLS habilitado. Policy: alumno lee/escribe solo sus propios registros (`student_id = auth.uid()`). Columnas: `student_id`, `concept_id`, `p_known` (default 0.0), `attempts`, `correct_count`, `last_seen`, `status` (enum CHECK), `created_at`, `updated_at`. PK compuesta `(student_id, concept_id)`.
**Alternatives**: (a) RLS después — viola TINKU.md §12.3. (b) Policy basada en roles — overkill para Ola 1, solo alumno existe.
**Rationale**: RLS desde día 1 es innegociable. PK compuesta previene duplicados. Enum CHECK en `status` garantiza consistencia con `ConceptState` de TypeScript.

### AD-08: BKT Parameters in JSONB Column of `concepts` Table

**Choice**: La tabla `concepts` (creada en schema change) tiene columna `bkt_params JSONB` con default `{"learn_rate": 0.1, "slip": 0.05, "guess": 0.2}`. El engine lee esta columna y la usa si existe; si null, usa defaults.
**Alternatives**: (a) Tabla separada `concept_bkt_params` — JOIN innecesario para 3 valores. (b) Hardcode en TypeScript — imposible calibrar por concepto sin deploy.
**Rationale**: JSONB es flexible para Ola 1 (todos los conceptos usan defaults) y permite calibración por concepto en Ola 2+ sin migración. El engine fallback a defaults si null.

## Data Flow

```
Alumno responde ejercicio
        │
        ▼
attemptExercise (Server Action)
        │
        ├─ 1. Auth check
        ├─ 2. Validate exercise
        ├─ 3. Check answer
        │
        ├─ 4. getCurrentPKnown(studentId, conceptId)
        │      └─ Read student_concept_state from Supabase
        │         └─ If absent: return 0.0
        │         └─ If last_seen > 30d: apply decay
        │
        ├─ 5. updatePKnown(pKnown, wasCorrect, wasSocioemotional, params)
        │      └─ Pure function (no I/O)
        │
        ├─ 6. computeXp(difficulty, attemptNumber, usedHint)
        │      └─ Pure function (no I/O)
        │
        ├─ 7. Write to student_exercise_attempts
        ├─ 8. Update student_concept_state
        │
        ├─ 9. Check mastery (p_known >= 0.85)
        │
        ├─ 10. pickNextExercise(studentId, conceptId, pKnown)
        │       └─ Query exercises from Supabase filtered by difficulty band
        │
        └─ 11. Return AttemptResult
```

## Data Model

### `student_concept_state` (new table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `student_id` | UUID (FK → auth.users) | — | Part of PK |
| `concept_id` | UUID (FK → concepts) | — | Part of PK |
| `p_known` | FLOAT | 0.0 | Range [0, 1] |
| `attempts` | INTEGER | 0 | Total attempts |
| `correct_count` | INTEGER | 0 | Correct answers |
| `last_seen` | TIMESTAMPTZ | now() | Last attempt timestamp |
| `status` | TEXT | 'locked' | CHECK: locked, available, in_progress, mastered |
| `created_at` | TIMESTAMPTZ | now() | Auto-set |
| `updated_at` | TIMESTAMPTZ | now() | Auto-updated via trigger |

RLS: `student_id = auth.uid()` for SELECT/UPDATE. INSERT via Server Action only.

### `student_exercise_attempts` (uses existing schema table)

| Column | Type | Notes |
|--------|------|-------|
| `student_id` | UUID (FK → auth.users) | |
| `exercise_id` | UUID (FK → exercises) | |
| `concept_id` | UUID (FK → concepts) | Denormalized for query speed |
| `correct` | BOOLEAN | |
| `answer` | JSONB | Student's answer payload |
| `attempt_number` | INTEGER | 1, 2, 3... |
| `used_hint` | BOOLEAN | |
| `xp_earned` | FLOAT | |
| `created_at` | TIMESTAMPTZ | |

## API / Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `attemptExercise` | `{ exerciseId: string, answer: StudentAnswer }` | `{ correct, xpEarned, pKnown, mastered, nextExercise }` | Required (student) |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/adaptive/types.ts` | Create | Shared types: GameStore ConceptState, BKT params, AttemptResult, Exercise, Difficulty, StudentAnswer |
| `src/lib/adaptive/engine.ts` | Create | Pure functions: `updatePKnown`, `computeXp`, `pickNextExercise` (query part separate), `applyDecay` |
| `src/lib/adaptive/__tests__/engine.test.ts` | Create | Unit tests: 4 BKT scenarios, XP calculations, decay, mastery threshold, edge cases |
| `src/app/actions/attempt-exercise.ts` | Create | Server Action: auth check → validate → compute → persist → return |
| `src/app/actions/__tests__/attempt-exercise.test.ts` | Create | Integration tests (mocked Supabase) for full flow |
| `supabase/migrations/004_student_concept_state.sql` | Create | Table + RLS + triggers + indexes |
| `seeds/concepts-bkt-params.ts` | Create | Seed data for BKT default params per concept |
| `src/lib/supabase/database.types.ts` | Modify | Regenerate after migration |
| `package.json` | No change | Motor es lógica pura, sin nuevas deps |

## Interfaces / Contracts

```ts
// src/lib/adaptive/types.ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ConceptStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface BKTParams {
  learn_rate: number; // default 0.1
  slip: number;       // default 0.05
  guess: number;       // default 0.2
}

export interface AttemptResult {
  correct: boolean;
  xpEarned: number;
  pKnown: number;
  mastered: boolean;
  nextExercise: Exercise | null;
}

export interface StudentAnswer {
  optionId?: string;      // MCQ
  numericValue?: number;  // NumericInput
  h5pScore?: number;     // H5P
  h5pMaxScore?: number;  // H5P
  optionIds?: string[];  // Socioemotional
  participation?: boolean; // Socioemotional dilemmas
}

// src/lib/adaptive/engine.ts
export function updatePKnown(
  currentPKnown: number,
  wasCorrect: boolean,
  params: BKTParams,
  isSocioemotional?: boolean
): { pKnown: number; mastered: boolean };

export function computeXp(
  difficulty: Difficulty,
  attemptNumber: number,
  usedHint: boolean
): number;

export function pickNextExerciseDifficulty(pKnown: number): Difficulty | null;

export function applyDecay(pKnown: number, daysSinceLastSeen: number): number;

export function checkMasteryDegradation(
  currentStatus: ConceptStatus,
  consecutiveErrors: number
): { pKnown: number; status: ConceptStatus } | null;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `updatePKnown` — 5 escenarios: acierto eleva, error baja, mastery threshold, socioemotional participation, edge cases (p_known=0, p_known=1) | Vitest — pure function, zero mocks |
| Unit | `computeXp` — 4 escenarios: first attempt easy/medium/hard, second attempt, with hint, mastery bonus separate | Vitest — pure function, zero mocks |
| Unit | `pickNextExerciseDifficulty` — 4 bandas de p_known, edge cases (exact thresholds) | Vitest — pure function |
| Unit | `applyDecay` — ausencia 30+ días, ausencia < 30 días, decay floor | Vitest — pure function |
| Unit | `checkMasteryDegradation` — 3+ errores consecutivos degrade mastered to in_progress | Vitest — pure function |
| Integration | `attemptExercise` Server Action — flow completo acierto, flow completo error, alumno no auth | Vitest + mocked Supabase |
| Integration | RLS — alumno lee solo sus registros | Supabase integration test |

## Migration / Rollout

Migration `004_student_concept_state.sql` adds a new table. No existing data to migrate. Applied via `supabase db push`.

Rollback: `DROP TABLE student_concept_state` — no data loss since table is new.

## Commit Plan

1. **`feat(bkt): add adaptive types and pure BKT functions`** — `types.ts`, `engine.ts` with `updatePKnown`, `computeXp`, `pickNextExerciseDifficulty`, `applyDecay`, `checkMasteryDegradation`. Full unit test coverage. Means: `pnpm test` passes all BKT unit tests.

2. **`feat(bkt): add attemptExercise Server Action`** — `attempt-exercise.ts` with full orchestration: auth → validate → compute → persist → return. Integration tests with mocked Supabase. Means: full Server Action flow works.

3. **`feat(schema): add student_concept_state migration with RLS`** — Migration `004_student_concept_state.sql`, seed data for BKT params, regenerate database types. RLS tests. Means: table exists in Supabase, types updated.

4. **`test(bkt): add edge case coverage and integration tests`** — Decay, degradation, consecutive errors, boundary p_known values, socioemotional participation type, all exercise types. Means: all REQ-BKT scenarios covered.

## Open Questions

- [ ] Confirm `student_exercise_attempts` table schema from supabase-schema change — dependency on exact column names
- [ ] Socioemotional participation type in BKT: should `p_known` update use a flat +0.1 per participation regardless of correctness? Need pedagogical confirmation.
- [ ] Should `attemptExercise` return the full `nextExercise` object or just `nextExerciseId`? Frontend (exercise-components) may need full exercise data.