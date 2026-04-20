# Delta Spec: production-deployment (ADDED)

## Capability

`production-deployment` — CI/CD pipeline, Vercel deployment, custom domain, and environment variables management for production release.

## ADDED Requirements

### REQ-01: Vercel Project with Custom Domain

The application SHALL be deployed to Vercel with a custom Argentine domain and HTTPS enforcement.

- **RFC 2119**: MUST / SHALL

#### Scenario: Vercel project created and linked

- **Given** the Tinku 2.0 repository on GitHub
- **When** Vercel project is created and linked to the repository
- **Then** every push to `main` MUST trigger an automatic deployment
- **And** the deployment URL MUST be accessible over HTTPS

#### Scenario: Custom domain configured

- **Given** a registered domain (tinku.com.ar or similar)
- **When** the domain is added to the Vercel project
- **Then** the app MUST be accessible at `https://tinku.com.ar` (or chosen domain)
- **And** HTTP requests MUST redirect to HTTPS
- **And** SSL certificate MUST be provisioned automatically by Vercel

### REQ-02: CI/CD Pipeline via GitHub Actions

Every pull request MUST pass automated checks before merge. Every merge to `main` MUST trigger a production deploy.

- **RFC 2119**: MUST / SHALL

#### Scenario: PR checks run on every pull request

- **Given** an open pull request against `main`
- **When** the PR is created or updated
- **Then** GitHub Actions MUST run `pnpm lint`, `pnpm typecheck`, and `pnpm test`
- **And** the PR MUST NOT be mergeable until all three checks pass

#### Scenario: Production deploy on merge

- **Given** a pull request merged into `main`
- **When** the merge completes
- **Then** Vercel MUST auto-deploy to production
- **And** the deploy MUST complete within 5 minutes

### REQ-03: Environment Variables Management

Production environment variables MUST be configured in Vercel with no secrets in the repository.

- **RFC 2119**: MUST / SHALL NOT

#### Scenario: Production env vars configured

- **Given** the Vercel project settings
- **When** environment variables are reviewed
- **Then** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, and `SENTRY_AUTH_TOKEN` MUST be set in Vercel's production environment
- **And** `SUPABASE_SERVICE_ROLE_KEY` MUST be set in Vercel (server-only, no `NEXT_PUBLIC_` prefix)
- **And** `.env.local` MUST NOT be committed to git

### REQ-04: Performance Verification — LCP ≤ 3s on Mid-Range Android

The app MUST meet LCP ≤ 3 seconds on simulated mid-range Android (Motorola Moto G50 equivalent) on 4G.

- **RFC 2119**: MUST

#### Scenario: LCP target met on mobile

- **Given** the production deployment live
- **When** LCP is measured via Chrome DevTools throttling (4G, mid-range mobile CPU)
- **Then** the Largest Contentful Paint of the initial route MUST be ≤ 3 seconds
- **And** the bundle size (JS gzipped) for the student route MUST be ≤ 500 KB

### REQ-05: Performance Verification — 60fps in Phaser World

The Phaser world scene MUST render at 60 FPS on mid-range Android without frame drops below 45 FPS.

- **RFC 2119**: MUST

#### Scenario: Phaser renders at 60fps on Android

- **Given** a student has entered the world scene on a mid-range Android device (Moto G50)
- **When** the student navigates between islands
- **Then** the Phaser scene MUST render at ≥ 60 FPS average
- **And** MUST NOT drop below 45 FPS for more than 500ms consecutive

### REQ-06: No Student Progress Loss in Production

Under normal operation, a student's pedagogical progress MUST NOT be lost.

- **RFC 2119**: MUST NOT

#### Scenario: Progress persists across sessions

- **Given** a student who has mastered at least 1 concept
- **When** the student logs out and logs back in from a different device
- **Then** all progress (p_known values, XP, level, coins, mission state) MUST be identical to the previous session
- **And** no pedagogical state MAY be stored in browser localStorage or sessionStorage

### REQ-07: Instant Rollback Capability

Production deployments MUST support instant rollback via Vercel.

- **RFC 2119**: MUST

#### Scenario: Rollback to previous deployment

- **Given** a production deployment that introduced a critical bug
- **When** `vercel rollback` is executed (or Vercel dashboard rollback is triggered)
- **Then** the previous known-good deployment MUST be live within 60 seconds
- **And** no data loss MUST occur from the rollback itself

### REQ-08: Feature Flag Toggle for Sentry and PostHog

Sentry and PostHog integrations MUST be disableable via environment variables without redeployment.

- **RFC 2119**: SHOULD

#### Scenario: Disable Sentry via env var

- **Given** `NEXT_PUBLIC_SENTRY_DSN` is unset or empty
- **When** the application starts
- **Then** Sentry SDK MUST NOT initialize and MUST NOT capture events
- **And** the application MUST function normally without errors

#### Scenario: Disable PostHog via env var

- **Given** `NEXT_PUBLIC_POSTHOG_KEY` is unset or empty
- **When** the application starts
- **Then** PostHog MUST NOT initialize and MUST NOT send events
- **And** PostHog function calls MUST be no-ops (not throw errors)