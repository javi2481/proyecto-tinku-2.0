# Delta Spec: project-bootstrap

## Capability Overview

Capability que garantiza que el repo `proyecto-tinku-2.0` contiene un proyecto Next.js 14 compilable, servible, typecheckeable y testeable al cierre de este change. Es el cimiento técnico de TODAS las capabilities posteriores.

## ADDED Requirements

### Requirement: Package Manager Configurado

El repo DEBE tener `pnpm` como package manager canónico, con lockfile versionado y el script `packageManager` en `package.json`.

**FILES**: `package.json`, `pnpm-lock.yaml`, `.gitignore`

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

---

### Requirement: Next.js 14 App Router Configurado

El proyecto DEBE usar Next.js 14.x con App Router, TypeScript estricto y estructura `src/`.

**FILES**: `next.config.mjs`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

#### Scenario: Next.js App Router activo

- **Given** el proyecto bootstrappeado
- **When** se lee `package.json`
- **Then** `dependencies.next` MUST matchear `^14.` o `14.x.x`
- **And** MUST existir `src/app/layout.tsx` y `src/app/page.tsx`
- **And** MUST NO existir `pages/` directory (Pages Router)

#### Scenario: TypeScript strict habilitado

- **Given** el proyecto bootstrappeado
- **When** se lee `tsconfig.json`
- **Then** `compilerOptions.strict` MUST ser `true`
- **And** `compilerOptions.noUncheckedIndexedAccess` MUST ser `true`
- **And** `compilerOptions.noImplicitOverride` MUST ser `true`
- **And** MUST existir path alias `"@/*": ["./src/*"]`

#### Scenario: Home page renderiza placeholder válido

- **Given** el proyecto bootstrappeado con dev server corriendo
- **When** se hace GET a `http://localhost:3000/`
- **Then** la respuesta MUST tener status 200
- **And** el HTML MUST contener un `<h1>` con texto que incluya `"Tinku 2.0"`

---

### Requirement: Typecheck Pasa

El comando `pnpm typecheck` DEBE ejecutar `tsc --noEmit` y salir con código 0.

**FILES**: `package.json`, `tsconfig.json`

#### Scenario: Typecheck es un script npm

- **Given** el proyecto bootstrappeado
- **When** se lee `package.json`
- **Then** `scripts.typecheck` MUST ser exactamente `"tsc --noEmit"`

#### Scenario: Typecheck pasa limpio

- **Given** el proyecto bootstrappeado con deps instaladas
- **When** se ejecuta `pnpm typecheck`
- **Then** MUST salir con código 0
- **And** MUST NO imprimir errores TS

---

### Requirement: Tailwind + Andika Font Configurados

Tailwind CSS 3.4.x DEBE estar configurado y la tipografía `Andika` DEBE cargarse via `next/font/google` en el root layout.

**FILES**: `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`

#### Scenario: Tailwind procesa clases

- **Given** el proyecto bootstrappeado
- **When** se inspecciona `src/app/globals.css`
- **Then** MUST contener las directivas `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`

#### Scenario: Andika font cargada en root layout

- **Given** el root layout
- **When** se lee `src/app/layout.tsx`
- **Then** MUST importar `Andika` desde `"next/font/google"`
- **And** MUST aplicar el `className` del font al `<html>` o `<body>`

---

### Requirement: Linter y Formatter Configurados

ESLint (preset Next.js) y Prettier DEBEN estar instalados y configurados sin conflictos estilísticos.

**FILES**: `eslint.config.mjs` (o `.eslintrc.json`), `.prettierrc`, `package.json`

#### Scenario: Lint pasa

- **Given** el proyecto bootstrappeado
- **When** se ejecuta `pnpm lint`
- **Then** MUST salir con código 0

#### Scenario: Prettier integrado con ESLint

- **Given** la config de ESLint
- **When** se inspecciona el `extends` array
- **Then** `"prettier"` (de `eslint-config-prettier`) MUST estar al final del array

---

### Requirement: shadcn/ui Baseline

El proyecto DEBE tener `components.json` (config shadcn) y `src/lib/utils.ts` con el helper `cn()`. NO es requerido tener ningún componente shadcn instalado todavía.

**FILES**: `components.json`, `src/lib/utils.ts`, `src/app/globals.css`

#### Scenario: shadcn está inicializado

- **Given** el proyecto bootstrappeado
- **Then** MUST existir `components.json` en root
- **And** MUST existir `src/lib/utils.ts`
- **And** `src/lib/utils.ts` MUST exportar una función llamada `cn`

#### Scenario: CSS variables shadcn presentes

- **Given** `src/app/globals.css`
- **Then** MUST contener al menos las variables CSS `--background` y `--foreground` en selectores `:root` y `.dark`

---

### Requirement: Vitest con Smoke Test Verde

Vitest DEBE estar instalado con `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, config que respeta path aliases de tsconfig, y al menos 1 test que pasa.

**FILES**: `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`, `package.json`

#### Scenario: Scripts de test presentes

- **Given** `package.json`
- **Then** `scripts.test` MUST ser `"vitest run"` (o equivalente que corra una vez, no watch)
- **And** `scripts["test:watch"]` PUEDE ser `"vitest"` (watch mode)

#### Scenario: Smoke test Vitest pasa

- **Given** el proyecto bootstrappeado con deps instaladas
- **When** se ejecuta `pnpm test`
- **Then** MUST salir con código 0
- **And** al menos 1 test MUST ser ejecutado
- **And** 0 tests MUST fallar

#### Scenario: Path alias funciona en tests

- **Given** `vitest.config.ts`
- **Then** MUST configurar `resolve.alias` con `"@": "./src"` (o equivalente via `vite-tsconfig-paths`)

---

### Requirement: Playwright con Smoke E2E Verde

Playwright DEBE estar instalado, configurado con `webServer` que levanta `pnpm dev`, browsers Chromium descargados, y al menos 1 test E2E que pasa.

**FILES**: `playwright.config.ts`, `tests/e2e/home.spec.ts`, `package.json`

#### Scenario: Script e2e presente

- **Given** `package.json`
- **Then** `scripts.e2e` MUST ser `"playwright test"`

#### Scenario: Smoke E2E pasa contra dev server

- **Given** el proyecto bootstrappeado con deps y browsers instalados
- **When** se ejecuta `pnpm e2e`
- **Then** Playwright MUST levantar el dev server automáticamente (via `webServer` config)
- **And** MUST salir con código 0
- **And** el test `home.spec.ts` MUST navegar a `/` y assertar que existe un `<h1>` con `"Tinku 2.0"`

---

### Requirement: Supabase SSR Helpers

El proyecto DEBE incluir helpers de Supabase SSR (`@supabase/ssr` + `@supabase/supabase-js`) listos para usar en Server Components, Server Actions, Route Handlers y Middleware. El código de los helpers NO debe ejecutarse todavía (no hay consumers).

**FILES**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`

#### Scenario: Deps Supabase presentes

- **Given** `package.json`
- **Then** `dependencies["@supabase/ssr"]` MUST existir (versión ^0.5.x)
- **And** `dependencies["@supabase/supabase-js"]` MUST existir (versión ^2.45.x)
- **And** `dependencies.zod` MUST existir (versión ^3.23.x)

#### Scenario: Helpers compilan

- **Given** los helpers creados
- **When** se ejecuta `pnpm typecheck`
- **Then** MUST salir con código 0
- **And** los 3 helpers MUST exportar sus respectivas factory functions: `createBrowserClient()`, `createServerClient()`, `updateSession()`

#### Scenario: Helpers leen env vars correctas

- **Given** `src/lib/supabase/client.ts`
- **Then** MUST leer `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **And** MUST validar que existen (lanzar error si faltan) — la validación PUEDE ser vía Zod

---

### Requirement: Variables de Entorno Seguras

El proyecto DEBE tener `.env.local` con las credenciales v1 heredadas (Supabase, OpenRouter, MercadoPago TEST) y `.env.example` con las mismas keys pero valores vacíos o placeholder. `.env.local` NO debe ser trackeado por git.

**FILES**: `.env.local`, `.env.example`, `.gitignore`

#### Scenario: .env.local existe con Supabase URL

- **Given** el repo bootstrappeado
- **Then** MUST existir `.env.local`
- **And** MUST contener `NEXT_PUBLIC_SUPABASE_URL=https://rihbkanevxlvisanlvsn.supabase.co`
- **And** MUST contener `NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt válido>`
- **And** MUST contener `SUPABASE_SERVICE_ROLE_KEY=<jwt válido>`

#### Scenario: .env.example sin secrets

- **Given** `.env.example`
- **Then** MUST existir en root
- **And** MUST contener las mismas keys que `.env.local`
- **And** los valores MUST ser strings vacíos o placeholders genéricos (ej. `your-key-here`)
- **And** MUST estar trackeado por git

#### Scenario: .env.local ignorado por git

- **Given** `.gitignore`
- **Then** MUST contener `.env.local` como patrón
- **And** MUST contener `.env*.local`
- **And** al correr `git status` DESPUÉS de crear `.env.local`, MUST NO aparecer como untracked ni modified

---

### Requirement: Dev Server Levanta

El comando `pnpm dev` DEBE levantar el servidor de Next.js en `http://localhost:3000` sin errores de compilación ni runtime.

**FILES**: `package.json`

#### Scenario: Script dev presente

- **Given** `package.json`
- **Then** `scripts.dev` MUST ser `"next dev"` (o `"next dev -H 0.0.0.0 -p 3000"` para alineación con v1)

#### Scenario: Dev server responde

- **Given** el proyecto bootstrappeado con `pnpm install` ejecutado
- **When** se ejecuta `pnpm dev` en background
- **And** se hace GET a `http://localhost:3000/` después de ~3 segundos
- **Then** MUST responder con status 200
- **And** MUST NO imprimir errores en stderr

---

### Requirement: Build Producción Exitoso

El comando `pnpm build` DEBE producir un build de producción sin errores.

**FILES**: `package.json`, `next.config.mjs`

#### Scenario: Script build presente

- **Given** `package.json`
- **Then** `scripts.build` MUST ser `"next build"`

#### Scenario: Build compila

- **Given** el proyecto bootstrappeado con deps instaladas
- **When** se ejecuta `pnpm build`
- **Then** MUST salir con código 0
- **And** MUST crear el directorio `.next/`
- **And** NO DEBE haber warnings de TS ni ESLint que fallen el build

---

### Requirement: Commits Siguen Conventional Commits Sin Atribución IA

Los commits creados durante este change DEBEN seguir el estándar Conventional Commits y NO DEBEN contener atribución a IA.

**FILES**: (git log)

#### Scenario: 4 commits atómicos

- **Given** el change completado
- **When** se ejecuta `git log --oneline <hash-inicial>..HEAD`
- **Then** MUST mostrar exactamente 4 commits
- **And** cada subject MUST empezar con `chore:` (o tipo conventional válido)
- **And** cada subject MUST estar en inglés, imperativo, lowercase, sin punto final

#### Scenario: Sin AI attribution

- **Given** los commits del change
- **When** se ejecuta `git log --all --pretty=full`
- **Then** ningún commit MUST contener `"Co-Authored-By"`, `"Generated by"`, `"Claude"`, `"AI"`, `"assistant"`, ni firma similar

---

### Requirement: Strict TDD Mode Activable Post-Bootstrap

Al cierre del change, al re-ejecutar `sdd-init`, el sistema DEBE detectar el test runner (Vitest) y activar Strict TDD Mode.

**FILES**: `openspec/config.yaml`, engram `sdd/proyecto-tinku-2.0/testing-capabilities`, engram `sdd-init/proyecto-tinku-2.0`

#### Scenario: testing-capabilities actualizado

- **Given** el change completado
- **When** se inspecciona engram observation con `topic_key: sdd/proyecto-tinku-2.0/testing-capabilities`
- **Then** el campo `Strict TDD Mode` MUST ser `enabled`
- **And** `Test Runner.installed` MUST ser `true`
- **And** `Test Runner.command` MUST ser `pnpm test`

#### Scenario: openspec/config.yaml actualizado

- **Given** el change completado
- **When** se lee `openspec/config.yaml`
- **Then** `strict_tdd` MUST ser `true`
- **And** `testing.runner.installed` MUST ser `true`
- **And** `test_command` MUST ser `pnpm test`

---

### Requirement: Estructura de Carpetas Completa

El repo DEBE tener todas las carpetas placeholder necesarias para cambios futuros.

**FILES**: `prompts/.gitkeep`, `supabase/.gitkeep`, `public/.gitkeep`

#### Scenario: Carpetas placeholder existen

- **Given** el repo bootstrappeado
- **Then** MUST existir `prompts/` con `.gitkeep`
- **And** MUST existir `supabase/` con `.gitkeep`
- **And** MUST existir `public/` (puede tener favicon.ico del scaffold)

## MODIFIED Requirements

(Ninguno — no hay specs previos en `openspec/specs/`)

## REMOVED Requirements

(Ninguno)
