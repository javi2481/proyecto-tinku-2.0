# Design: ari-personalities

## Technical Approach

Monolithic tutor with dynamic prompt composition. The system prompt is assembled at request time: `ari-base.md` (shared identity) + personality fragment (`quipu.md` or `tinku.md`) based on student's active island. All mutations via Server Actions. OpenRouter for LLM calls with 3-tier fallback. Cache in Supabase table keyed by concept+situation hash. Budget tracked per student per day. Guardrails are regex/rule-based filters, not ML — input validation before LLM call, output validation after.

The contract `{studentContext, conceptContext, question} → {response, needsFollowUp, suggestedAction}` is designed for clean extraction to multi-agent in Ola 3+.

## Architecture Decisions

### AD-01: Prompt composition via filesystem, not database

**Choice**: Prompts stored as `/prompts/*.md` files, loaded at build time (or server start) and cached in-memory. Composition: `ari-base.md` + personality file concatenated with `\n\n---\n\n`.
**Alternatives**: Prompts in database (harder to version, harder to review), prompts hardcoded in TypeScript (requires deployment to iterate)
**Rationale**: REQ-AT-01 explicitly requires `.md` files versioned in Git. Markdown is reviewable by pedagogues, iterable without code changes, and Git-trackable.

### AD-02: OpenRouter 3-tier fallback: Haiku → GPT-4o-mini → Gemini Flash → generic fallback

**Choice**: Primary: Claude Haiku 4.5 (`anthropic/claude-4.5-haiku`). Fallback 1: GPT-4o-mini (`openai/gpt-4o-mini`). Fallback 2: Gemini 2.5 Flash (`google/gemini-2.5-flash`). If all fail: return hardcoded generic response.
**Alternatives**: Single model (fragile), round-robin (unpredictable quality), local model (insufficient quality for socratic tutoring)
**Rationale**: REQ-AT-10 specifies this fallback chain. Haiku 4.5 offers best cost/quality ratio for socratic tutoring. Each fallback degrades gracefully.

### AD-03: Cache in Supabase table, not Redis or KV

**Choice**: `ari_response_cache` table with key = `hash(conceptId + situation)`, TTL = 7 days checked via `created_at` column. Query: `SELECT * FROM ari_response_cache WHERE key = $1 AND created_at > now() - interval '7 days'`.
**Alternatives**: Redis (adds infra dependency), Vercel KV (vendor lock-in), in-memory (no persistence across deployments)
**Rationale**: Supabase is already in the stack. A cache table is simple, RLS-compatible, and adds zero infrastructure. 7-day TTL keeps response quality fresh enough.

### AD-04: Budget tracking in dedicated table with daily reset

**Choice**: `ari_budget_tracking(student_id, date, cost_usd, tokens_input, tokens_output)` with UPSERT on `(student_id, date)`. Before each call, check `cost_usd < 0.10`. At midnight AR time, a new row is created.
**Alternatives**: Counter in `app_events` (too general), in-memory counter (lost on restart), per-request aggregation (slow)
**Rationale**: Dedicated table enables simple queries, RLS policies, and audit trail. Daily reset happens naturally because each day gets a new row.

### AD-05: Guardrails as rule-based filters, NOT ML models

**Choice**: Input validation: regex-based topic check against allowed pedagogical topics. Output validation: keyword blocklist + length check. Both are simple functions in `src/lib/ari/guardrails.ts`.
**Alternatives**: LLM-based guardrails (adds latency + cost), external moderation APIs (adds dependency), no guardrails (unsafe for kids)
**Rationale**: REQ-AT-07 specifies simple rules. For Ola 1 this is sufficient. LLM guardrails can be evaluated for Ola 2+ if evasion becomes common.

### AD-06: Ari appears after 2 consecutive failures, non-intrusive banner (not modal)

**Choice**: Exercise component tracks consecutive failures in Zustand. After 2 failures, dispatches `ari-store.showContextualTrigger()`. Ari appears as a subtle banner at the bottom, not a blocking modal. Student can dismiss without penalty.
**Alternatives**: Modal pop-up (interrupts flow), email to parent (too delayed), always-visible chat (clutter)
**Rationale**: REQ-ACU-03 mandates non-intrusive. Banner format respects the student's agency while making help discoverable.

### AD-07: Streaming SSE for responses (MAY requirement, deferred if latency < 1s)

**Choice**: Implement SSE streaming via Server Action → ReadableStream. `<AriChat />` renders response character-by-character with typing effect. If latency is consistently < 1s in practice, streaming can be disabled.
**Alternatives**: Full response then display (user stares at loading state), WebSocket (overkill for request-response)
**Rationale**: REQ-AT-12 marks streaming as MAY. LLM calls typically take 2-5 seconds. SSE provides perceptible progress without WebSocket complexity.

### AD-08: Logging to `ari_conversations` with INSERT-only policy

**Choice**: Every interaction (including cache hits) logged to `ari_conversations` with `cache_hit` flag. RLS: students can read own, parents can read children's, service role can INSERT. No UPDATE or DELETE — append-only audit log.
**Alternatives**: Separate logging service (overkill), log files (no queryability), app_events (too general)
**Rationale**: REQ-AT-06 and REQ-AT-14 require structured logging with RLS. Append-only preserves audit integrity.

## Data Flow

```
Student Exercise Component
  │ (2 consecutive failures trigger)
  ├─→ Zustand ari-store.setContextualTrigger(true)
  │
  └─→ <AriChat /> opens
       └─→ askAri(studentId, conceptId, question)
            │
            1. Auth check (Supabase Auth)
            2. Get student's active island → determine personality
            3. Compose system prompt: ari-base.md + quipu.md|tinku.md
            4. Get student context: level, p_known, recent attempts (from BKT tables)
            5. Validate input: guardrails.validateInput(question)
            6. Check budget: budget.checkDailyCap(studentId)
            7. Check cache: cache.get(conceptId + situationHash)
               └─ cache HIT → return cached, log with cache_hit=true
            8. Call OpenRouter (Haiku → GPT-4o-mini → Gemini Flash)
            9. Validate output: guardrails.validateOutput(response)
           10. Log to ari_conversations
           11. Update budget tracking
           12. Return {response, needsFollowUp, suggestedAction}
```

## Data Model

```sql
CREATE TABLE ari_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  island_id UUID REFERENCES islands(id),
  concept_id UUID REFERENCES concepts(id),
  personality_used TEXT NOT NULL CHECK (personality_used IN ('quipu','tinku','base')),
  input_hash TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  model_used TEXT NOT NULL,
  tokens_input INT NOT NULL,
  tokens_output INT NOT NULL,
  latency_ms INT NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ari_response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL,
  concept_id UUID REFERENCES concepts(id),
  situation_hash TEXT NOT NULL,
  personality TEXT NOT NULL,
  response TEXT NOT NULL,
  needs_follow_up BOOLEAN NOT NULL,
  suggested_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cache_key)
);

CREATE TABLE ari_budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  tokens_input INT NOT NULL DEFAULT 0,
  tokens_output INT NOT NULL DEFAULT 0,
  call_count INT NOT NULL DEFAULT 0,
  UNIQUE(student_id, date)
);
```

## API / Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `askAri(studentId, conceptId, question)` | studentId, conceptId, question: string | `{response, needsFollowUp, suggestedAction}` | Student (own) |
| `getAriHistory(studentId, limit?)` | studentId, limit | `AriConversation[]` | Student (own) or Parent (own children) |
| `getParentAriHistory(parentId, studentId)` | parentId, studentId | `AriConversation[]` | Parent (own children only) |

## Component Tree

```
<ExerciseScreen>
  ├── <ExerciseComponent />          — Tracks consecutive failures in Zustand
  └── <AriProvider>                  — Context: island → personality mapping
       ├── <AriHelpButton />         — Always visible, opens chat
       └── <AriChat />               — Chat panel/bubble, bottom of screen
            ├── <AriMessage />       — Single message bubble
            ├── <AriInput />          — Text input with send button
            └── <AriContextualBanner /> — Non-intrusive banner after 2 failures
```

## File Structure

```
prompts/
  ari-base.md                         — Shared identity: socratic, rioplatense, no direct answers
  quipu.md                             — Math personality: serene, andean metaphors, logic
  tinku.md                             — Socioemotional personality: warm, reflective, empathetic
src/lib/ari/
  prompt-builder.ts                     — Loads + composes ari-base.md + personality fragment
  guardrails.ts                         — validateInput(), validateOutput() — rule-based filters
  cache.ts                              — get(), set() — Supabase-backed cache
  budget.ts                              — checkDailyCap(), trackCost() — budget enforcement
  models.ts                             — OpenRouter client, fallback chain config
  types.ts                              — AriResponse, AriConversation types
src/app/actions/
  ari.ts                                — askAri, getAriHistory, getParentAriHistory
src/components/ari/
  AriChat.tsx                           — Main chat component
  AriHelpButton.tsx                     — Persistent help button
  AriMessage.tsx                        — Message bubble (student or Ari)
  AriInput.tsx                          — Chat input
  AriContextualBanner.tsx               — Non-intrusive post-failure banner
src/stores/
  ari-store.ts                          — Zustand: isOpen, messages, isLoading, personality, contextualTrigger
supabase/migrations/
  xxx_ari_tables.sql                    — ari_conversations, ari_response_cache, ari_budget_tracking + RLS
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `prompt-builder.ts` — correct composition based on island | Vitest |
| Unit | `guardrails.ts` — input validation (off-topic rejection) and output validation (blocklist) | Vitest |
| Unit | `budget.ts` — daily cap enforcement, reset logic | Vitest |
| Unit | `cache.ts` — key generation, TTL check, hit/miss | Vitest |
| Unit | `models.ts` — fallback chain (mock OpenRouter responses and failures) | Vitest |
| Integration | `askAri` full flow: auth → prompt → cache miss → LLM → validate → log → return | Vitest + mocked OpenRouter |
| Integration | `askAri` cache hit flow: returns cached, logs with cache_hit=true | Vitest |
| Integration | Budget cap exceeded: returns fallback generic response | Vitest |
| Component | `<AriChat />` renders messages, sends input | RTL + Vitest |
| Component | `<AriContextualBanner />` appears after 2 failures | RTL + Vitest |
| E2E | Student gets stuck → Ari appears → help button works → conversation logged | Playwright |

## Commit Plan

1. `feat(ari): add prompt files — ari-base.md, quipu.md, tinku.md` — Prompts only, no code
2. `feat(ari): add Supabase migration for ari tables + RLS` — Tables + policies
3. `feat(ari): add prompt-builder — composes system prompt from files` — `prompt-builder.ts` + tests
4. `feat(ari): add guardrails — input and output validation` — `guardrails.ts` + tests
5. `feat(ari): add cache module — Supabase-backed response cache` — `cache.ts` + tests
6. `feat(ari): add budget tracking — daily cap per student` — `budget.ts` + tests
7. `feat(ari): add OpenRouter client with 3-tier fallback` — `models.ts` + tests
8. `feat(ari): add askAri Server Action — full orchestration flow` — `ari.ts` + tests
9. `feat(ari): add Zustand ari-store for client state` — `ari-store.ts`
10. `feat(ari): add AriChat, AriHelpButton, AriMessage, AriInput components` — UI
11. `feat(ari): add AriContextualBanner — trigger after 2 failures` — Integration with exercise flow
12. `feat(ari): add parent audit view — read-only conversation history` — Parent dashboard integration
13. `test(ari): add E2E tests for Ari conversation flow` — Playwright

## Open Questions

- [ ] OpenRouter model IDs need verification against current availability (Claude Haiku 4.5, GPT-4o-mini, Gemini 2.5 Flash)
- [ ] Input validation topic list: need pedagogical team to define allowed topic patterns
- [ ] Output validation keyword blocklist: needs content safety review before production
- [ ] SSE streaming: marked as MAY — implement only if latency testing shows > 1s average response time