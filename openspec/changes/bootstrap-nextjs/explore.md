# Exploration: bootstrap-nextjs

## Topic

Inicializar el proyecto Next.js 14 de Tinku 2.0 desde cero, dejando el cimiento técnico listo para que cualquier feature posterior (auth, Isla de los Números, dashboard padre, MercadoPago) se construya sobre infraestructura sólida. **No es una feature de producto** — es el esqueleto que las Olas 1+ van a habitar.

## Current State

- Repo recién inicializado (git `main`, cero commits).
- Sólo hay `docs/` (TINKU, ROADMAP, CONTENT — fundacionales 1.0), `.gga`, `.windsurf/workflows/sdd-new.md`, `openspec/` y `.atl/skill-registry.md`.
- **No existe `package.json`**, `node_modules/`, `src/`, ni configuración de Next.js.
- Hay un predecesor v1 funcional (`C:\Users\Equipo\proyecto-tinku\frontend`) que llegó a Ola 2.5 con stack Next.js 14.2.15 + TS 5.6.3 + Supabase SSR 0.5.1 + Tailwind 3.4.14 + MercadoPago + Sentry + Recharts + Motion. Las versiones están validadas en producción real.
- El proyecto Supabase existente (`rihbkanevxlvisanlvsn.supabase.co`) se reusa en v2.0 — mismas credenciales, JWTs vigentes hasta 2092.
- Strict TDD está desactivado hoy; este bootstrap lo activa al instalar Vitest.

## Affected Areas

| Path | Estado | Razón |
|------|--------|-------|
| `package.json` | crear | Manifest de deps + scripts |
| `pnpm-lock.yaml` | crear | Lockfile del package manager elegido |
| `tsconfig.json` | crear | TS estricto + path alias `@/*` |
| `next.config.mjs` | crear | Config Next.js (turbo, images, experimental si aplica) |
| `tailwind.config.ts` | crear | Config Tailwind + tokens Tinku (Andika, palette isla) |
| `postcss.config.mjs` | crear | Plugins Tailwind + autoprefixer |
| `components.json` | crear | Config shadcn/ui |
| `vitest.config.ts` | crear | Vitest + jsdom + @testing-library + path alias |
| `playwright.config.ts` | crear | Playwright (webServer auto-start dev) |
| `middleware.ts` | crear | Middleware Next.js (auth gate para rutas privadas) |
| `.env.local` | crear | Secrets desde engram (scope personal) — NUNCA commitear |
| `.env.example` | crear | Template sin secrets — commitear |
| `.gitignore` | crear | node_modules, .next, .env.local, coverage, test-results |
| `.eslintrc.json` / `eslint.config.mjs` | crear | ESLint con preset Next + TS strict |
| `.prettierrc` | crear | Prettier config |
| `src/app/layout.tsx` | crear | Root layout con Andika font |
| `src/app/page.tsx` | crear | Home placeholder ("Tinku 2.0 · bootstrap OK") |
| `src/app/globals.css` | crear | Tailwind directives + CSS vars shadcn |
| `src/lib/supabase/{client,server,middleware}.ts` | crear | SSR helpers Supabase |
| `src/lib/utils.ts` | crear | `cn()` helper shadcn |
| `tests/setup.ts` | crear | Setup Vitest (@testing-library/jest-dom) |
| `tests/smoke.test.ts` | crear | Test dummy verde para validar pipeline |
| `tests/e2e/home.spec.ts` | crear | Playwright smoke: home carga, tiene `<h1>` |
| `prompts/.gitkeep` | crear | Reservar carpeta para agentes IA |
| `public/` | crear | Assets estáticos |
| `supabase/.gitkeep` | crear | Reservar carpeta para migrations futuras |

Estructura **no incluye** en este bootstrap: auth real, Phaser, H5P, Zustand, shadcn components (más allá del util `cn`), Ari, Sentry, MercadoPago. Todo eso va en cambios posteriores.

## Decisiones de investigación (por eje)

### 1. Package manager: **pnpm**

| Opción | Pros | Cons | Veredicto |
|--------|------|------|-----------|
| npm (v1) | Default, sin instalación extra, lockfile estable | Más lento, node_modules pesado, peor monorepo handling | — |
| **pnpm** | 2-3x más rápido, symlinks (ahorro disco), monorepo-ready si después se divide | Requiere `corepack enable` o install manual | **✅ recomendado** |
| yarn v4 | Berry tiene PnP | Fricción con varias libs (Next 14 OK, pero más ruido) | — |

**Justificación**: Tinku 2.0 va a tener muchas deps (Phaser, H5P, shadcn + Radix * N, testing stack, audio libs). pnpm ahorra 40%+ en tiempo de install y espacio en disco. Es compatible 100% con Next 14 y Vercel. El costo de cambiar desde v1 (npm) es nulo porque v2.0 se rehace fresh.

### 2. Next.js scaffold

**Comando recomendado**:
```pwsh
pnpm create next-app@14 . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm
```

Flags justificados:
- `--ts`: TypeScript estricto (requisito docs §11.1)
- `--tailwind`: Tailwind (requisito)
- `--app`: App Router (requisito)
- `--src-dir`: respeta la estructura propuesta en v1-src-structure
- `--import-alias "@/*"`: alias canónico de Next; evita `../../..` infernales
- `--eslint`: ESLint preconfig Next (lo refinamos después)
- `--use-pnpm`: lockfile correcto

**NO usamos** `--turbopack` en producción todavía (estable en 14 sólo para dev). Mantener webpack para `build`.

**Ajuste TS post-scaffold**: setear `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true`.

### 3. Phaser 4 + React en Next.js 14

Phaser es una lib canvas-heavy que NO debe correr en server. Patrón probado:

```tsx
// src/game/GameWorld.tsx  (más adelante, NO en este bootstrap)
"use client";
import dynamic from "next/dynamic";
const PhaserGame = dynamic(() => import("./PhaserGame"), { ssr: false });
```

**En este bootstrap**: NO se instala Phaser. Se documenta el patrón en el design para el siguiente cambio (`game-world-skeleton`). Justificación: instalar Phaser sin usarlo mete 1.4 MB de bundle innecesario y enmascara bugs de SSR.

### 4. H5P — **diferido**

Ninguna de las 2 libs (`@lumieducation/h5p-react`, `h5p-standalone`) se instala en bootstrap. Razón: ambas traen peer deps pesadas y CSS conflictivo con Tailwind que hay que resolver con wrapper. Ese wrapper es una feature en sí misma (cambio `exercise-engine-h5p`). Bootstrap se queda sin motor de ejercicios y Tinku funciona hasta la fase de ejercicios con React puro.

### 5. Testing setup

**Vitest config objetivo**:
- `environment: "jsdom"` para components
- `setupFiles: ["./tests/setup.ts"]` importa `@testing-library/jest-dom`
- Path alias `@/` → `./src` replicado desde tsconfig
- `globals: true` para no importar `describe/it/expect` cada vez
- `include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"]`
- Excluir `tests/e2e/**` (Playwright)

**Playwright config objetivo**:
- `testDir: "tests/e2e"`
- `webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true }`
- Un solo project chromium al inicio (mobile + firefox + webkit se agregan después)
- `baseURL: "http://localhost:3000"`

**Test de humo obligatorio**:
- Vitest: `tests/smoke.test.ts` → `expect(1+1).toBe(2)` (valida que el runner arranca)
- Playwright: `tests/e2e/home.spec.ts` → navegar a `/`, assertar que el `<h1>` existe

Ambos tests DEBEN pasar al cierre del change. Esto es el gate para activar Strict TDD en el próximo init.

### 6. shadcn/ui — **init sí, componentes no**

`npx shadcn@latest init` en este bootstrap:
- Crea `components.json`
- Crea `src/lib/utils.ts` con `cn()`
- Setea CSS vars en `globals.css`
- NO instala componentes todavía

Componentes (button, input, card, toast) se agregan EN el cambio que los use. Justificación: shadcn es copy-paste, no tiene runtime — no conviene pre-instalar lo que no usás.

### 7. Estructura

Validamos contra `sdd-init/proyecto-tinku-2.0/v1-src-structure`. Ajustes:

- **`src/game/`** NO se crea en este bootstrap (Phaser diferido).
- **`src/exercises/`** NO se crea (H5P diferido).
- **`src/stores/`** NO se crea (Zustand se instala cuando haya estado compartido real).
- **`src/lib/supabase/`** SÍ — necesitamos client/server/middleware helpers desde día 1 para el auth siguiente.
- **`supabase/`** (root) se crea vacío con `.gitkeep`, listo para migrations.

### 8. Supabase — **reusar proyecto v1**

| Opción | Pros | Cons | Veredicto |
|--------|------|------|-----------|
| Crear proyecto nuevo | DB limpia, schema fresh, sin data legacy | Costo de re-setup (OAuth keys, RLS, buckets, edge funcs), perder 42 obs engram de decisiones | — |
| **Reusar proyecto v1** | JWTs válidos hasta 2092, admin email ya configurado, schema v1 disponible como referencia | Hay que decidir: wipear schema y rehacer con migrations fresh, o mantener | **✅ recomendado** |

**Decisión**: reusar proyecto (`rihbkanevxlvisanlvsn`). **Schema**: tratar como vacío — las migrations v2.0 arrancan desde `V0__init.sql`. El schema v1 activo sigue ahí y puede servir como seed/referencia sin migrar. Si eventualmente se quiere wipe total, se hace en un change posterior con rollback plan.

Este bootstrap NO escribe migrations — sólo deja la estructura `supabase/` lista.

### 9. Activación de Strict TDD

Para que el próximo `sdd-init` active Strict TDD automáticamente, este change DEBE dejar:
- `vitest` en `devDependencies` de `package.json`
- Script `"test": "vitest run"` en `scripts`
- `vitest.config.ts` funcional
- Al menos un test pasando (smoke)

Con eso, `sdd-init` detecta Vitest instalado y flipea `strict_tdd: true`. El propio change puede updatear `sdd/proyecto-tinku-2.0/testing-capabilities` y `openspec/config.yaml` al cierre.

### 10. Fuera de alcance (diferido a cambios futuros)

- Auth real (padre email + Google, alumno 6-char) → `auth-padre` + `auth-alumno-codigo`
- Phaser 4 integration → `game-world-skeleton`
- H5P wrapper → `exercise-engine-h5p`
- Dashboard padre UI → `dashboard-padre-v1`
- MercadoPago subscripción → `mercadopago-subscripcion`
- Sentry + PostHog → `observability-setup`
- CI (GitHub Actions) → `ci-setup`
- Migrations Supabase → `supabase-schema-v2`
- Prompts de Ari → `ari-agent-v1`

## Recommendation

**Approach recomendado**: Bootstrap minimalista en 4 fases:

1. **Scaffold oficial**: `pnpm create next-app@14 . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm`
2. **Hardening TS + configs**: endurecer tsconfig, agregar Prettier, reemplazar `next-env.d.ts` intacto, setear tokens Tinku en tailwind.config.
3. **Testing stack**: instalar Vitest + @testing-library + jsdom + Playwright; configs + smoke tests verdes.
4. **Supabase SSR helpers + env**: instalar `@supabase/ssr` + `@supabase/supabase-js` + `zod`, crear `src/lib/supabase/{client,server,middleware}.ts` y `.env.local` desde los secrets en engram.

**Éxito del change** = `pnpm dev` levanta, `pnpm typecheck` pasa, `pnpm test` pasa, `pnpm e2e` pasa, commit inicial limpio.

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| Conflicto de versions Tailwind 3 vs shadcn (último shadcn usa Tailwind 4 opcional) | Media | Fijar shadcn init en template `tailwind: "v3"` |
| Phaser 4 todavía en alpha/beta | Alta | Phaser diferido a cambio posterior; no bloquea bootstrap |
| `pnpm create next-app` puede pedir flags interactivos en Windows pwsh si no se pasa `--use-pnpm` | Baja | Pasar todos los flags explícitos; documentar comando |
| Schema Supabase v1 activo interfiere con schema v2 | Media | No tocar DB en este change; decisión de wipe/migrate queda para `supabase-schema-v2` |
| Playwright descarga de browsers tarda (>100 MB) | Baja | Documentar en README; aceptar one-time cost |
| ESLint preset Next choca con Prettier | Baja | Usar `eslint-config-prettier` que desactiva reglas estilísticas |
| Secrets de v1 (MP, OpenRouter) son TEST → no servirán en prod | Conocido | Esperado; prod keys se inyectan en deploy posterior |

## Preguntas abiertas para el propose

1. **Package manager**: confirmar **pnpm** (alternativa: npm si el user prefiere continuidad con v1). Recomiendo pnpm.
2. **Node version**: pinear en `.nvmrc` / `engines` → Node 20 LTS (v1 compatible). Confirmar.
3. **Commit inicial único o por fase**: ¿Un commit atómico "chore: bootstrap next.js 14 app" o 4 commits (scaffold, configs, testing, supabase)? Recomiendo 4 commits para git log legible.
4. **Supabase schema**: ¿wipe la DB v1 ahora o diferir? Recomiendo **diferir**. Este change no toca DB.
5. **GitHub remote**: ¿ya hay repo en github.com? ¿lo conectamos en este change o después? Recomiendo diferir.

## Ready for Proposal

**Yes**. Hay señal suficiente para un proposal con scope bien acotado. Las 5 preguntas abiertas se responden con defaults sensatos en el proposal (pnpm, Node 20, 4 commits, diferir DB, diferir remote). El user puede overridear en review.
