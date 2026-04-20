# Design: Testing & Ajuste con Observación Real (Phase 1.11)

## Technical Approach

Deploy Tinku to production (Vercel + custom domain), integrate Sentry and PostHog for observability, and execute a 2-week pedagogical observation with Javier's children. Infrastructure-first strategy: set up deploy pipeline, then observability wrappers, then observation protocol as documentation. All SDK integrations use lazy-loading and feature flags so they can be toggled off without redeploy.

Maps to specs: `production-deployment` (REQ-01 through REQ-08), `observability` (REQ-01 through REQ-07), `project-bootstrap` (modified: Sentry + PostHog deps), `observation-validation` (REQ-01 through REQ-07 — documentation-only, no code).

## Architecture Decisions

| # | Decision | Choice | Alternatives Considered | Rationale |
|---|----------|--------|------------------------|-----------|
| AD-01 | Deployment platform | Vercel (managed) | Self-hosted VPS, Cloudflare Pages | Vercel gives instant rollback, preview deploys on PRs, zero-config Next.js deployment, and free hobby tier. Team is solo-founder — managed infra maximizes velocity. |
| AD-02 | CI/CD runner | GitHub Actions | Vercel-only (no separate CI), CircleCI | GitHub Actions runs lint + typecheck + test on every PR (per spec REQ-02), Vercel handles deploy. Separation of concerns: CI validates, Vercel ships. |
| AD-03 | Error tracking | @sentry/nextjs (v9+) | Logtail, custom webhook | Spec mandates client + server capture with source maps. Sentry has first-class Next.js SDK with Server Action wrappers and automatic source map upload. |
| AD-04 | Analytics | PostHog JS (lazy-loaded) | Mixpanel, Plausible, Umami | Spec requires anonymized student tracking + feature flags. PostHog is open-source, has feature flags built-in, and supports event schemas. Lazy-loaded to protect LCP. |
| AD-05 | Sentry initialization | Dynamic — check env var before init | Always-init with DSN toggle | REQ-08 requires Sentry not initialize when `NEXT_PUBLIC_SENTRY_DSN` is unset. Use conditional init in `sentry.client.config.ts` / `sentry.server.config.ts`. |
| AD-06 | PostHog lazy loading | Dynamic import post-hydration in provider | Static import with shimmer | REQ-05 mandates no PostHog in initial bundle. Use `next/dynamic` + `useEffect` in `PostHogProvider` to load after hydration. |
| AD-07 | Server Action error boundary | Wrapper function `withSentry()` | Sentry middleware, try/catch per action | A single `withSentry(actionFn)` wrapper captures errors, adds action name + sanitized input as tags, and re-throws. Zero overhead on success (<10ms per spec REQ-02). |
| AD-08 | PostHog event schema enforcement | Typed `trackEvent()` with allowlist | Free-form `posthog.capture()` | REQ-04 mandates events outside schema are rejected (dev warning, prod silent). A typed discriminated union function enforces this at compile time. |
| AD-09 | Observation protocol | Document-only (Markdown) | Built-in observation tooling | Phase 1.11 is Javier + 2 kids — no need for tooling. Document protocol, rubric, and feedback format in `docs/`. Data stays private (not in repo). |
| AD-10 | Performance targets verification | Manual Lighthouse + Chrome DevTools | Automated Lighthouse CI, WebPageTest | Solo-founder observing 2 kids. Lighthouse CI can be added in Phase 1.12. For now, manual verification per spec REQ-04/REQ-05. |

## Data Flow

```
Client (Student/Parent)
  │
  ├── Sentry Client SDK ──→ Sentry.io (error events)
  │     └── captures unhandled errors + manual captures
  │
  ├── PostHog JS (lazy) ──→ PostHog Cloud (product events)
  │     └── trackEvent() → allowlist check → capture()
  │
  └── Server Actions
        │
        ├── withSentry() wrapper ──→ Sentry server-side
        │     └── on error: captureException + tags
        │
        └── Business logic ──→ Supabase (data)
              └── No localStorage for pedagogical state
```

```
Observation Flow (offline):
  Javier observes child → notes in friction rubric → Markdown docs (private)
  Weekly feedback → 4 open questions → Private folder
  Rapid iterations → Issues in tracker → <24h hotfix or weekly batch
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/sentry.ts` | Create | Sentry init (client + server) + `withSentry()` Server Action wrapper |
| `src/lib/sentry.client.config.ts` | Create | Sentry client configuration (DSN, source maps, tracesSampleRate) |
| `src/lib/sentry.server.config.ts` | Create | Sentry server configuration |
| `src/lib/posthog.ts` | Create | PostHog client init (lazy), `trackEvent()` typed function with event schema allowlist, `PostHogProvider` |
| `src/app/layout.tsx` | Modify | Wrap children with `<SentryProvider>` + `<PostHogProvider>` |
| `next.config.mjs` | Modify | Add Sentry webpack plugin for source map uploads in production builds |
| `.env.example` | Modify | Add `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| `package.json` | Modify | Add `@sentry/nextjs`, `posthog-js` to dependencies |
| `.github/workflows/ci.yml` | Create | GitHub Actions: lint + typecheck + test on PR |
| `.github/workflows/deploy.yml` | Create | Deploy workflow (Vercel auto-deploys on merge to main — this is for reference only) |
| `sentry.client.config.ts` (root) | Create | Next.js convention — Sentry client config file |
| `sentry.server.config.ts` (root) | Create | Next.js convention — Sentry server config file |
| `docs/observation-protocol.md` | Create | Observation session protocol, friction rubric, weekly feedback format |
| `docs/privacy-policy.md` | Create | Privacy policy in rioplatense Spanish (per observability REQ-07) |

## Interfaces / Contracts

### `withSentry<TInput, TOutput>(action: Function, actionName: string)`

```typescript
// src/lib/sentry.ts
type ServerAction<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

function withSentry<TInput, TOutput>(
  action: ServerAction<TInput, TOutput>,
  actionName: string
): ServerAction<TInput, TOutput> {
  return async (input: TInput) => {
    try {
      return await action(input);
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag("action", actionName);
        scope.setContext("input", sanitizePII(input));
        Sentry.captureException(error);
      });
      throw error;
    }
  };
}
```

### `trackEvent()` — Typed PostHog Event Schema

```typescript
// src/lib/posthog.ts
type TinkuEvent =
  | { event: "session_start"; properties: { student_code: string; island_id: string } }
  | { event: "exercise_attempt"; properties: { student_code: string; concept_id: string; exercise_id: string; correct: boolean; difficulty: string; attempt_number: number } }
  | { event: "concept_mastered"; properties: { student_code: string; concept_id: string; p_known: number; xp_gained: number } }
  | { event: "island_enter"; properties: { student_code: string; island_id: string } }
  | { event: "ari_invoke"; properties: { student_code: string; island_id: string; concept_id: string; personality: string; budget_remaining: number } }
  | { event: "parent_dashboard_view"; properties: { parent_id: string; student_count: number } };

function trackEvent(event: TinkuEvent): void;
```

### Sentry Environment Toggle

```typescript
// Conditional init — Sentry does nothing when DSN is empty
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... });
}
// PostHog — no-op wrapper when key is empty
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `withSentry()` wrapper captures errors and re-throws | Vitest: mock Sentry, call wrapped action that throws, verify `captureException` called with correct tags |
| Unit | `trackEvent()` allowlist blocks unknown events | Vitest: call `trackEvent({ event: "unknown_event" })`, verify console.warn + no `posthog.capture` call |
| Unit | PostHog provider no-ops when key is empty | Vitest: render with empty env var, verify no crash, verify no network call |
| Unit | Sentry init skipped when DSN is empty | Vitest: test both branches of conditional init |
| Integration | Sentry source maps uploaded on build | Manual: `pnpm build` succeeds with `SENTRY_AUTH_TOKEN` set |
| Integration | PostHog lazy-loaded after hydration | Playwright: verify initial JS bundle does not contain PostHog code via network interception |
| Integration | CI pipeline runs on PR | Manual: push PR, verify GitHub Actions runs lint + typecheck + test |
| E2E | Production deploy completes | Manual: push to main, verify Vercel deploy succeeds |
| E2E | LCP ≤ 3s on simulated mobile | Manual: Chrome DevTools throttling (4G, mid-range mobile) |
| E2E | 60fps in Phaser world | Manual: Chrome DevTools Performance tab on Android mid-range simulation |

## Migration / Rollout

1. **Phase 1 — Infra**: Set up Vercel project, custom domain, GitHub Actions CI, env vars. Zero code changes to app.
2. **Phase 2 — Observability**: Install SDKs, create wrappers, modify layout. Can be feature-flagged off via empty env vars.
3. **Phase 3 — Deploy**: Merge to main, verify production URL, verify Sentry captures test error.
4. **Phase 4 — Observation**: Javier runs 2-week protocol. Iteration based on findings.
5. **Rollback**: `vercel rollback` for critical issues. Sentry/PostHog toggle via env vars without redeploy.

## Open Questions

- [ ] Confirm domain name: `tinku.com.ar` or alternative? (Blocking: custom domain setup)
- [ ] Sentry project DSN and auth token — need to be created before env vars can be set
- [ ] PostHog project key and host — need to be created before env vars can be set
- [ ] Vercel team/account already provisioned, or needs setup?