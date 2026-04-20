# Design: Auth y Onboarding Tri-lateral

## Technical Approach

4 sequential commits: (1) parent auth with email+password and Google OAuth, (2) parent onboarding wizard with child registration and code generation, (3) student auth with anonymous sign-in and code validation, (4) welcome screen, route guards, and integration tests. All mutations are Server Actions (`"use server"`), never `/api/*` routes. Middleware handles auth redirects based on role.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| AD-01 | Student auth: 6-char code + `signInAnonymously()` | Code validates → anonymous session → link to `student_id` | Email/password per student, magic link | TINKU.md §12.4 mandate. Kids 6-12 don't have email. Code from parent is the UX model. |
| AD-02 | Code charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | 32 chars, excludes 0/O/1/I/l | Full alphanumeric, UUID | 32^6 ≈ 1.07B combinations. No visual ambiguity. Collision retry handles edge cases. |
| AD-03 | All mutations as Server Actions | `"use server"` files in `src/lib/auth/` | API routes (`/api/*`) | TINKU.md §12.7 mandate. Server Actions give type safety, no CORS, automatic CSRF. |
| AD-04 | Avatar stored as string identifier | `"avatar_01"` stored in `students.avatar` | Image upload to Supabase Storage | 8-10 pre-made SVGs in `public/avatars/`. No upload complexity for MVP. String → deterministic rendering. |
| AD-05 | Anonymous session → student_id via metadata | `supabase.auth.updateUser({ data: { student_id } })` | Separate sessions table | Leverages Supabase Auth metadata. RLS can join on `auth.jwt() ->> 'student_id'`. No custom session table. |
| AD-06 | Role-based route guard in middleware | Check `users.role` + redirect | Client-side only guards | Server-side is authoritative. Client checks are UX sugar. Middleware is single source of truth (TINKU.md stack). |
| AD-07 | Consent placeholder in UI | Checkbox + link to terms | Full consent system with signature | Ola 1 beta: placeholder. Ola 2: real consent with versioned documents (TINKU.md §5.5). |
| AD-08 | Orphan session cleanup: SHOULD, not MUST | pg_cron or Edge Function (deferred) | Implemented in Phase 1.4 | REQ-SA-005 is SHOULD. Implement as scheduled task later. Phase 1.4 documents the design but defers implementation. |
| AD-09 | Onboarding wizard: 4-step client component | Multi-step form with progress stepper | Single long form | UX research: 3-4 steps max, visible progress. Step 4 triggers Server Action to create student + code atomically. |

## Data Flow

### Parent Registration → Onboarding

```
/auth/register (RegisterForm "use client")
  │
  ├─→ signUp(email, password) [Server Action]
  │     ├─→ supabase.auth.signUp()
  │     ├─→ trigger creates public.users row (role='parent')
  │     └─→ redirect → /onboarding
  │
  └─ Google OAuth
        ├─→ supabase.auth.signInWithOAuth({ provider: 'google' })
        ├─→ callback → /auth/callback
        ├─→ trigger creates public.users row if new
        └─→ redirect → /onboarding (first) or /dashboard (returning)
```

### Onboarding Wizard → Student Code

```
/onboarding (OnboardingWizard "use client")
  │
  Step 1: child name
  Step 2: date_of_birth + grade
  Step 3: avatar selection
  Step 4: confirmation → registerChild() [Server Action]
            ├─→ INSERT into students (parent_id, name, date_of_birth, grade, avatar)
            ├─→ trigger creates student_levels row
            ├─→ generate 6-char code (retry on collision, max 5 attempts)
            ├─→ INSERT into student_codes (code, student_id)
            └─→ return { code: "JKL-MNP", student_id }
```

### Student Login Flow

```
/auth/student-login (CodeInput "use client")
  │
  └─→ loginStudent(code) [Server Action]
        ├─→ SELECT student_id FROM student_codes WHERE code = ?
        ├─→ if not found → error "Código no válido"
        ├─→ supabase.auth.signInAnonymously()
        ├─→ supabase.auth.updateUser({ data: { student_id } })
        ├─→ check students.has_seen_welcome
        └─→ redirect → /welcome (first) or /world (returning)
```

### Middleware Route Guards

```
middleware.ts
  │
  ├─→ No auth + protected route → /auth/login
  ├─→ Parent auth + /world or /welcome → /dashboard (or 403)
  ├─→ Student auth + /dashboard → /world (or 403)
  ├─→ Parent auth + / → /dashboard
  ├─→ Student auth + / → /world
  └─→ Public routes (/auth/*, /) → pass through
```

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                 -- LoginForm component
│   │   ├── register/
│   │   │   └── page.tsx                 -- RegisterForm component
│   │   ├── student-login/
│   │   │   └── page.tsx                 -- CodeInput component
│   │   ├── callback/
│   │   │   └── route.ts                -- OAuth callback handler
│   │   └── layout.tsx                   -- Auth layout (no sidebar)
│   ├── (parent)/
│   │   ├── dashboard/
│   │   │   └── page.tsx                 -- Dashboard placeholder
│   │   ├── onboarding/
│   │   │   └── page.tsx                 -- OnboardingWizard
│   │   └── layout.tsx                   -- Parent layout
│   ├── (student)/
│   │   ├── world/
│   │   │   └── page.tsx                 -- World placeholder
│   │   ├── welcome/
│   │   │   └── page.tsx                 -- Welcome screen
│   │   └── layout.tsx                   -- Student layout
│   └── (public)/
│       ├── page.tsx                     -- Landing page
│       └── layout.tsx                   -- Public layout
├── lib/
│   ├── auth/
│   │   ├── actions.ts                   -- signUp, signIn, signOut, registerChild, loginStudent
│   │   ├── student-code.ts              -- generateCode(), validateCode(), CODE_CHARSET
│   │   └── types.ts                     -- Action input/output types (Zod schemas)
│   └── supabase/
│       ├── client.ts                    -- MODIFIED: typed, add getClientSession()
│       ├── server.ts                    -- MODIFIED: typed, add getServerSession()
│       ├── middleware.ts                 -- MODIFIED: auth redirect logic
│       └── database.types.ts            -- From Phase 1.2 (supabase gen types)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                -- "use client" - shadcn/ui Button, Input, Card
│   │   ├── RegisterForm.tsx             -- "use client" - shadcn/ui form components
│   │   ├── OnboardingWizard.tsx         -- "use client" - multi-step wizard
│   │   ├── CodeInput.tsx                -- "use client" - 6-char visual input
│   │   ├── AvatarPicker.tsx             -- "use client" - 8-10 avatar grid selection
│   │   └── LogoutButton.tsx             -- "use client" - signOut trigger
│   └── ui/                              -- shadcn/ui additions
│       ├── button.tsx                   -- Already exists or new
│       ├── input.tsx
│       ├── card.tsx
│       ├── label.tsx
│       └── select.tsx
public/
└── avatars/
    ├── avatar_01.svg                    ── 8-10 pre-made avatars
    ├── avatar_02.svg
    └── ...
middleware.ts                             ── MODIFIED: role-based redirects
tests/
└── integration/
    └── auth/
        ├── parent-flow.test.ts          -- Register → login → onboarding → get code
        ├── student-flow.test.ts         -- Enter code → anonymous sign-in → see world
        └── role-isolation.test.ts       -- Parent can't see student routes, vice versa
```

## Interfaces / Contracts

### Server Actions (`src/lib/auth/actions.ts`)

```typescript
// signUp
export async function signUp(formData: {
  email: string;
  password: string;
}): Promise<{ success: true } | { error: string }>

// signIn
export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<{ success: true } | { error: string }>

// signOut
export async function signOut(): Promise<void>

// registerChild — called from onboarding step 4
export async function registerChild(formData: {
  name: string;
  dateOfBirth: string;
  grade: number;
  avatar: string;
}): Promise<{ success: true; code: string; studentId: string } | { error: string }>

// loginStudent — called from CodeInput
export async function loginStudent(code: string): Promise<
  { success: true; studentId: string; hasSeenWelcome: boolean } | { error: string }
>
```

### Student Code Module (`src/lib/auth/student-code.ts`)

```typescript
export const CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const MAX_CODE_RETRY = 5;

export function generateCode(): string;
export async function validateCode(code: string, supabase: SupabaseClient): Promise<string | null>;
// Returns student_id or null if code doesn't exist
```

### Zod Schemas (`src/lib/auth/types.ts`)

```typescript
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterChildSchema = z.object({
  name: z.string().min(2),
  dateOfBirth: z.string().date(),
  grade: z.number().int().min(1).max(7),
  avatar: z.string().min(1), // e.g. "avatar_03"
});

export const CodeInputSchema = z.object({
  code: z.string().length(6).regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/),
});
```

## Testing Strategy

| Layer | What | How | Runner |
|-------|------|-----|--------|
| Unit | `generateCode()` produces valid 6-char codes from charset | Generate 1000 codes, assert length=6, regex match, charset only | Vitest |
| Unit | `generateCode()` no ambiguous characters | Assert no 0, O, 1, I, l in 1000 generated codes | Vitest |
| Unit | Zod schemas validate/reject input | Valid/invalid SignUpSchema, RegisterChildSchema, CodeInputSchema | Vitest |
| Unit | Server Actions with mocked Supabase | Mock `supabase.auth.signUp`, test success/error paths | Vitest |
| Integration | Parent flow end-to-end | Register → login → registerChild → get code → verify code in DB | Vitest + Supabase |
| Integration | Student flow end-to-end | Enter code → anonymous sign-in → session linked to student_id | Vitest + Supabase |
| Integration | Role isolation | Parent token → cannot access /world; Student token → cannot access /dashboard | Vitest + Supabase |
| Integration | Middleware redirects | Unauthenticated → /auth/login; Parent → /dashboard; Student → /world | Vitest |
| Integration | Code collision handling | Insert code, generate same code → retry succeeds | Vitest + Supabase |

## Migration / Rollout

No DB migration in this change (depends on Phase 1.2 schema). Requires `supabase-schema` completed.

**Supabase Dashboard configuration required** (not code):
- Enable Email provider (already default)
- Enable Google OAuth provider (requires Google Cloud Console setup)
- Configure `SITE_URL` and redirect URLs
- Enable anonymous sign-ins (requires toggle in Supabase Auth settings)

**Rollback**:
- Auth broken → Disable Google OAuth in Dashboard. Email/password still works.
- Onboarding broken → `SKIP_ONBOARDING=true` env var bypasses wizard for testing.
- Student login broken → Hardcode test code for manual testing.
- Total emergency → `git revert` 4 auth commits. Schema (Phase 1.2) unaffected.

## Open Questions

- [ ] Google Cloud Console project needs creation + OAuth client ID configuration (external dependency, not code)
- [ ] Anonymous session cleanup: implement as Supabase pg_cron job or Edge Function? (deferred per AD-08)
- [ ] Avatar SVGs: need design assets created (8-10 child-appropriate diverse avatars)

## Commit Plan

1. **`feat(auth): add parent auth — email+password and Google OAuth`** — Supabase Auth config, Server Actions (signUp, signIn, signOut), LoginForm, RegisterForm, `/auth/login`, `/auth/register`, OAuth callback. Middleware session refresh.
2. **`feat(auth): add parent onboarding — register child and generate login code`** — OnboardingWizard (4 steps), registerChild Server Action, generateCode/validateCode, AvatarPicker component, route `/onboarding`. Unit tests for code generation.
3. **`feat(auth): add student auth — code input with anonymous sign-in`** — CodeInput component, loginStudent Server Action, `signInAnonymously()` + `updateUser()` linking, `/auth/student-login`. Integration tests for student flow.
4. **`feat(auth): add welcome screen, route guards, and auth integration tests`** — Welcome placeholder, middleware role-based redirects, role isolation tests, /world and /dashboard placeholders. Refine Supabase helpers with typed session.