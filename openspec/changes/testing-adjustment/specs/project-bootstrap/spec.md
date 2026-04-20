# Delta Spec: project-bootstrap (MODIFIED)

## Capability

`project-bootstrap` — Updates to the existing project bootstrap capability to add Sentry SDK and PostHog SDK to the technology stack.

## MODIFIED Requirements

### Requirement: Package Manager Configurado

El repo DEBE tener `pnpm` como package manager canónico, con lockfile versionado y el script `packageManager` en `package.json`.

**FILES**: `package.json`, `pnpm-lock.yaml`, `.gitignore`

(Previously: Unchanged — pnpm remains the canonical package manager.)

#### Scenario: pnpm es el package manager declarado

- **Given** el repo recién bootstrappeado
- **When** se lee `package.json`
- **Then** el campo `packageManager` MUST empezar con `"pnpm@"`
- **And** MUST existir `pnpm-lock.yaml` en el root
- **And** MUST NO existir `package-lock.json` ni `yarn.lock`

#### Scenario: pnpm install es reproducible

- **Given** el repo bootstrappeado con lockfile presente
- **When** se ejecuta `pnpm install --frozen-lockfile`
- **Then** MUST salir con código 0
- **And** MUST NO modificar `pnpm-lock.yaml`

### Requirement: Sentry SDK Added to Dependencies

Sentry SDK for Next.js (`@sentry/nextjs`) MUST be installed and configured as a production dependency.

(Previously: Sentry was not in the bootstrap stack.)

#### Scenario: Sentry SDK installed

- **Given** `package.json`
- **Then** `dependencies["@sentry/nextjs"]` MUST exist (version ^9.x or latest stable)
- **And** `src/lib/sentry.ts` MUST exist and export an `initSentry()` function

#### Scenario: Sentry webpack plugin configured

- **Given** `next.config.mjs`
- **Then** the Sentry webpack plugin MUST be configured for source map uploads during production builds
- **And** `SENTRY_AUTH_TOKEN` MUST be listed as a required env var for build-time

### Requirement: PostHog SDK Added to Dependencies

PostHog JS SDK (`posthog-js`) MUST be installed and configured as a production dependency, lazy-loaded post-hydration.

(Previously: PostHog was not in the bootstrap stack.)

#### Scenario: PostHog SDK installed

- **Given** `package.json`
- **Then** `dependencies.posthog-js` MUST exist (version ^1.x or latest stable)
- **And** `src/lib/posthog.ts` MUST exist and export tracking functions for the event schema

#### Scenario: PostHog lazy-loaded

- **Given** `src/lib/posthog.ts`
- **When** the module is imported in a client component
- **Then** PostHog initialization MUST be deferred until after page hydration
- **And** the PostHog bundle MUST NOT be included in the initial JS chunk

### Requirement: Environment Variables Extended

The `.env.example` file MUST be updated with Sentry and PostHog environment variable placeholders.

(Previously: Only Supabase and OpenRouter env vars were present.)

#### Scenario: Sentry and PostHog env vars in .env.example

- **Given** `.env.example`
- **Then** it MUST contain the following keys with placeholder values:
  - `NEXT_PUBLIC_SENTRY_DSN=`
  - `SENTRY_AUTH_TOKEN=`
  - `NEXT_PUBLIC_POSTHOG_KEY=`
  - `NEXT_PUBLIC_POSTHOG_HOST=`
- **And** `.env.local` MUST contain real values for these keys

### Requirement: Sentry/PostHog Providers in Layout

The root layout MUST wrap the application with Sentry and PostHog provider components.

(Previously: No observability providers in layout.)

#### Scenario: Observability providers wrap app

- **Given** `src/app/layout.tsx`
- **Then** the component tree MUST include a `<SentryProvider>` (or equivalent error boundary) wrapping children
- **And** MUST include `<PostHogProvider>` wrapping children
- **And** both providers MUST be client components (using `"use client"`)

### Requirement: Typecheck Passes with New SDKs

The `pnpm typecheck` command MUST pass with Sentry and PostHog SDKs installed and configured.

(Previously: Typecheck passed with only Supabase and base deps.)

#### Scenario: Typecheck includes observability modules

- **Given** Sentry and PostHog SDKs installed
- **When** `pnpm typecheck` is executed
- **Then** it MUST exit with code 0
- **And** MUST NOT report type errors in `src/lib/sentry.ts` or `src/lib/posthog.ts`