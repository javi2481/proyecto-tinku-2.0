# Design: Producción de Contenido Pedagógico

## Technical Approach

5 commits, parallelizable with supabase-schema (commits 1-3 are offline YAML/scripts, commit 4-5 need DB). YAML is the source of truth — versioned in Git, DB is seeded from YAML. Exercise generation via OpenRouter (Claude Haiku 4.5), human review required before seeding. Quality validation runs as automated checks in the pipeline.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| AD-01 | YAML as source of truth | `seeds/*.yml` versioned in Git | DB-first | Git gives diff, review, rollback. DB is a derived artifact. Content changes are PRs, not migrations. |
| AD-02 | LLM-generated exercises, human-reviewed | OpenRouter → JSON → review → seed | Manual creation or DB-first | Scale: 25 concepts × ~15 exercises = 375+. LLM generates 30/concept, reviewer keeps 20-25. Human QA is mandatory, never trust LLM output directly (REQ-EG-005). |
| AD-03 | Exercise states: generated → pending_review → approved → seeded | Directory-based state machine | DB status column | Simple, auditable, no DB dependency for generation. `exercises_raw/`, `exercises_rejected/`, `exercises_approved/` clearly separate states. |
| AD-04 | Seed idempotency via UPSERT on `exercise_id` | Deterministic `exercise_id` from concept+index | Random UUIDs | Re-running seed doesn't duplicate. Deterministic IDs enable idempotent re-seeds. |
| AD-05 | Validation module: `src/lib/exercise-validation.ts` | Zod schema + heuristic checks | Manual-only review | Automated checks catch structural errors (missing fields, wrong types), duplicate distractors, numeric answer verification. Human review catches pedagogical quality. |
| AD-06 | Characters rotate per concept plan | `characters_to_use` list in concept YAML | Random or single character | Ensures diversity and no single character dominates. Validation enforces ≤15% per character. |
| AD-07 | Contexts use fictitious prices | Explicit note in YAML and prompt template | Real Argentine prices | TINKU.md mandate: prices become stale. Fictitious round numbers keep content evergreen. |

## Data Flow

```
seeds/concepts.yml ──→ generate_exercises.ts ──→ OpenRouter API
seeds/characters.yml ─┘                              │
seeds/contexts.yml ──┘                               │
prompts/exercise-generation.md ──→ compose prompt     │
                                                      ▼
                                              exercises_raw/{concept_id}/
                                                      │
                                         review_exercises.ts (CLI)
                                                      │
                                    ┌─────────────────┼──────────────────┐
                                    ▼                                    ▼
                          exercises_approved/                exercises_rejected/
                                    │
                         seed_exercises.ts (UPSERT)
                                    │
                                    ▼
                            Supabase `exercises` table
```

## File Structure

```
seeds/
├── islands.yml                        -- 2 islands with metadata
├── regions.yml                        -- 6 regions with unlock order
├── concepts.yml                       -- 25 concepts with prereqs, difficulty, type_distribution
├── characters.yml                      -- 10 characters with metadata
├── contexts.yml                        -- 8+ Argentine contexts
├── exercises_raw/                      -- LLM-generated, pending review
│   └── {concept_id}/
│       └── batch_{timestamp}.json
├── exercises_approved/                 -- Reviewed and approved
│   └── {concept_id}/
│       └── approved.json
└── exercises_rejected/                 -- Rejected with reason
    └── {concept_id}/
        └── rejected.json

scripts/
├── generate_exercises.ts              -- Reads YAML plan, calls OpenRouter, saves raw
├── review_exercises.ts                -- CLI: approve/edit/reject exercises
└── seed_exercises.ts                  -- UPSERT approved exercises to Supabase

prompts/
└── exercise-generation.md             -- Prompt template with placeholders

src/lib/
└── exercise-validation.ts             -- Zod schemas + heuristic validators

tests/unit/
└── exercise-validation.test.ts        -- Unit tests for validation logic
```

## Interfaces / Contracts

### Exercise JSON Schema (generated output)

```typescript
// src/lib/exercise-validation.ts
export const ExerciseSchema = z.object({
  exercise_id: z.string().min(1),
  exercise_type: z.enum([
    "mcq", "numeric_input", "h5p_fill_blank",
    "h5p_drag_drop", "h5p_match", "socioemotional_dilemma"
  ]),
  concept_id: z.string().uuid(),
  prompt: z.string().min(10),
  correct_answer: z.unknown(), // type depends on exercise_type
  distractors: z.array(z.string()).optional(),
  hint: z.string().optional(),
  character_id: z.string(),
  context_id: z.string(),
  difficulty: z.number().int().min(1).max(10),
  source: z.literal("generated_v1"),
});

export const McqExerciseSchema = ExerciseSchema.extend({
  exercise_type: z.literal("mcq"),
  distractors: z.array(z.string()).min(2).max(4),
  correct_answer: z.string(),
});

export const NumericExerciseSchema = ExerciseSchema.extend({
  exercise_type: z.literal("numeric_input"),
  correct_answer: z.number(),
  distractors: z.undefined(),
});
```

### Concepts YAML Structure

```yaml
# seeds/concepts.yml — entry example
- id: "num-001"
  region_id: "num-numeracion"
  name: "Conteo hasta 10"
  description: "Contar objetos del 1 al 10"
  difficulty_range: [1, 1]
  province_coin: "🧉"  # Misiones
  nap_alignment: "NAP Matemática 1° grado - Número"
  prerequisites: []  # first concept, no prereqs
  type_distribution:
    mcq: 0.40
    numeric_input: 0.25
    h5p_fill_blank: 0.15
    h5p_drag_drop: 0.10
    h5p_match: 0.10
  characters_to_use: ["lucia", "mateo", "valentina"]
```

### generate_exercises.ts CLI

```bash
npx tsx scripts/generate_exercises.ts \
  --concept num-001 \
  --count 30 \
  --model anthropic/claude-3-haiku-20240307
```

### Prompt Template Contract

`prompts/exercise-generation.md` contains:
- Placeholders: `{character_name}`, `{character_age}`, `{context_name}`, `{context_description}`, `{concept_name}`, `{difficulty_range}`, `{exercise_type}`, `{num_exercises}`
- Instruction: respond in español rioplatense with voseo
- Instruction: no real Argentine prices
- JSON output format specification

## Testing Strategy

| Layer | What | How | Runner |
|-------|------|-----|--------|
| Unit | Exercise JSON schema validation | Zod schema parses valid/invalid JSON fixtures | Vitest |
| Unit | Distractor plausibility check | No duplicate distractors, no trivially wrong options | Vitest |
| Unit | Numeric answer verification | Solve arithmetic in prompt, verify `correct_answer` matches | Vitest |
| Unit | Context coherence check | Flag obvious translations (e.g. "supermarket" → "supermercado") | Vitest |
| Unit | Type distribution validation | Group approved exercises by concept, verify sum ≈ spec % | Vitest |
| Unit | Character balance validation | Count per character, assert none >15% | Vitest |
| Integration | Seed idempotency | Run `seed_exercises.ts` twice, verify no row duplication | Vitest + Supabase |
| Integration | Seed fails gracefully without schema | Run seed without catalog tables, verify explicit error | Vitest |

## Migration / Rollout

No DB schema migration in this change (that's `supabase-schema`). Seeds are idempotent UPSERT.

**Rollback**: `DELETE FROM exercises WHERE source = 'generated_v1';` clears all generated exercises. YAML in Git is thepermanent record — never lost.

**Parallelization**: Commits 1-3 (YAML, scripts, generation) can proceed before `supabase-schema` is complete. Only commit 4-5 (actual seeding) requires the DB schema.

## Commit Plan

1. **`feat(content): add YAML catalogs — islands, regions, concepts, characters, contexts`** — 5 YAML files, 2 islands, 6 regions, 25 concepts, 10 characters, 8+ contexts. No DB dependency.
2. **`feat(content): add exercise generation script via OpenRouter`** — `scripts/generate_exercises.ts` + `prompts/exercise-generation.md`. Reads YAML, calls OpenRouter, saves to `exercises_raw/`.
3. **`feat(content): add exercise review pipeline and seed script`** — `scripts/review_exercises.ts` (CLI) + `scripts/seed_exercises.ts` (UPSERT) + `src/lib/exercise-validation.ts` + unit tests.
4. **`feat(content): generate and review exercises for Isla de los Números (1° grado)`** — Run pipeline for 15 concepts, human review, ~300 approved exercises in `exercises_approved/`.
5. **`feat(content): generate and review exercises for remaining concepts + Isla de los Amigos`** — ~5 partial concepts + 5 socioemotional, ~95 approved. Consolidated seed SQL.