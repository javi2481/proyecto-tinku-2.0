# Delta Spec: project-bootstrap (MODIFIED)

## Capability
`project-bootstrap` — Infraestructura base del proyecto Next.js 14. Se MODIFICA para agregar middleware de auth y refinar helpers Supabase con tipos del schema.

## MODIFIED Requirements

### Requirement: Supabase SSR Helpers

El proyecto DEBE incluir helpers de Supabase SSR (`@supabase/ssr` + `@supabase/supabase-js`) listos para usar en Server Components, Server Actions, Route Handlers y Middleware. Los helpers DEBEN usar tipos generados del schema en vez de `any`. El middleware DEBE manejar auth redirects basados en session state y role.

**FILES**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/database.types.ts`, `middleware.ts`

(Previously: helpers usaban `any` y middleware no tenía lógica de auth redirect)

#### Scenario: Deps Supabase presentes

- **Given** `package.json`
- **Then** `dependencies["@supabase/ssr"]` MUST existir (versión ^0.5.x)
- **And** `dependencies["@supabase/supabase-js"]` MUST existir (versión ^2.45.x)
- **And** `dependencies.zod` MUST existir (versión ^3.23.x)

#### Scenario: Helpers compilan con tipos generados

- **Given** los helpers creados y `database.types.ts` generado
- **When** se ejecuta `pnpm typecheck`
- **Then** MUST salir con código 0
- **And** los 3 helpers MUST exportar sus respectivas factory functions: `createBrowserClient()`, `createServerClient()`, `updateSession()`
- **And** las funciones tipadas en `src/lib/supabase/` MUST usar tipos de `database.types.ts` en vez de `any`

#### Scenario: Helpers leen env vars correctas

- **Given** `src/lib/supabase/client.ts`
- **Then** MUST leer `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **And** MUST validar que existen (lanzar error si faltan) — la validación PUEDE ser vía Zod

#### Scenario: Middleware maneja auth redirects (NUEVO)

- **Given** `middleware.ts` configurado con Supabase session refresh
- **When** un request llega a una ruta protegida
- **Then** el middleware MUST refresh la session de Supabase
- **And** MUST redirigir usuarios no autenticados a `/auth/login`
- **And** MUST redirigir según role: padre → `/dashboard`, alumno → `/world`

#### Scenario: Server helper obtiene session tipada (NUEVO)

- **Given** un Server Component o Server Action que necesita session
- **When** se llama `getServerSession()` desde `src/lib/supabase/server.ts`
- **Then** MUST retornar la session con tipo `Session | null`
- **And** MUST NO usar `any` en el tipo de retorno

#### Scenario: Client helper obtiene session tipada (NUEVO)

- **Given** un Client Component que necesita session
- **When** se llama `getClientSession()` desde `src/lib/supabase/client.ts`
- **Then** MUST retornar la session con tipo `Session | null`
- **And** MUST NO usar `any` en el tipo de retorno