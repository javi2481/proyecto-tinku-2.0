# Proposal: Bootstrap Next.js 14 App

## Intent

Inicializar el repo vacío con un proyecto Next.js 14 App Router + TypeScript estricto + Tailwind + Supabase SSR + Vitest + Playwright listo para compilar, servir, typecheckear y testear. Sin este cimiento NO existe producto: cada feature futura (auth, Isla de los Números, dashboard padre, MercadoPago) se apoya sobre esta base. Afecta indirectamente a los **3 usuarios** (alumno, padre, docente) porque habilita todo lo que viene.

## Scope

### In Scope
- `pnpm` + `create-next-app@14` con flags: `--ts --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm`
- TS strict endurecido (`noUncheckedIndexedAccess`, `noImplicitOverride`)
- Prettier + integración con ESLint
- Tipografía **Andika** via `next/font/google` en `src/app/layout.tsx`
- **shadcn/ui init** (components.json + `src/lib/utils.ts` con `cn()` + CSS vars en `globals.css`). **Sin** componentes todavía.
- **Vitest** + jsdom + `@testing-library/react` + setup + 1 smoke test verde
- **Playwright** + config + 1 smoke E2E verde contra dev server
- Helpers Supabase SSR en `src/lib/supabase/{client,server,middleware}.ts` (NO se usan todavía)
- `.env.local` poblado desde engram (`sdd-init/proyecto-tinku-2.0/secrets-v1`) + `.env.example`
- `.gitignore`, `.prettierrc`, configs Next, Tailwind, Postcss
- Carpetas placeholder: `prompts/`, `supabase/`, `public/`
- Home page placeholder con `<h1>` "Tinku 2.0 · bootstrap OK"
- **Re-correr `sdd-init`** al cierre para activar `strict_tdd: true`

### Out of Scope
- Auth padre y alumno (signup, login, código 6-char) → `auth-padre`, `auth-alumno-codigo`
- Phaser 4 integration → `game-world-skeleton`
- H5P wrapper → `exercise-engine-h5p`
- Componentes shadcn (button, input, card, toast, sonner, drawer) → agregados on-demand en el change que los use
- Zustand stores → `phaser-react-state`
- Sentry + PostHog + Analytics → `observability-setup`
- MercadoPago → `mercadopago-subscripcion`
- Dashboard padre UI → `dashboard-padre-v1`
- CI con GitHub Actions → `ci-setup`
- Migrations Supabase schema v2 → `supabase-schema-v2`
- Prompts de Ari → `ari-agent-v1`
- Connect a remote GitHub → diferido

## Capabilities

### New Capabilities
- `project-bootstrap`: esqueleto del proyecto compilable y testeable (package.json, configs, Next.js app mínima, lib/supabase helpers, tests verdes). Fundación para todas las capabilities posteriores.

### Modified Capabilities
- None (no existen specs previos).

## Stack Alignment Matrix (docs/TINKU.md §11 es source of truth)

Esta tabla es el CONTRATO entre docs y bootstrap. Cada lib del stack v2.0 está explícitamente clasificada: se instala ahora o se difiere a un change concreto. **Ninguna lib del docs queda sin plan.**

| Lib (docs §) | v2.0 lo pide | v1 lo tenía | Bootstrap instala | Si no → change que lo instala | Razón del deferral |
|---|---|---|---|---|---|
| **Next.js 14 App Router** (§11.1) | ✅ | ✅ 14.2.15 | ✅ vía `create-next-app@14` | — | Core del bootstrap |
| **TypeScript estricto** (§11.1) | ✅ | ✅ 5.6.3 | ✅ strict + noUncheckedIndexedAccess + noImplicitOverride | — | Core |
| **Tailwind CSS** (§11.1) | ✅ | ✅ 3.4.14 | ✅ 3.4.x | — | Core |
| **shadcn/ui** (§11.1) | ✅ NUEVA | ❌ | ✅ init (components.json + utils.ts + CSS vars). **Componentes on-demand** | `<change-que-los-use>` | shadcn es copy-paste, no lib runtime — instalar componentes sin consumidor es anti-patrón |
| **Andika (Google Fonts)** (§11.1) | ✅ | — | ✅ via `next/font/google` en root layout | — | Core (root layout) |
| **Lucide React** (§11.1) | ✅ | ✅ 0.453.0 | ❌ | `icons-base-setup` o primer change con icono | Sin UI todavía, sin ícono que mostrar |
| **Motion** (ex Framer) (§11.1) | ✅ NUEVA | ✅ 12.38.0 | ❌ | `animations-ui-v1` o primer change con transición | Sin UI todavía |
| **Lottie (lottie-react)** (§11.1) | ✅ NUEVA | ❌ | ❌ | `celebrations-mascot-v1` | Mascota/celebraciones no existen todavía |
| **use-sound** (§11.1) | ✅ | ✅ 5.0.0 | ❌ | `audio-feedback-v1` | Sin eventos sonoros todavía |
| **Sonner** (toasts) (§11.1) | ✅ NUEVA | ❌ | ❌ | primer change con notificación (probable `auth-padre`) | Sin flujo que necesite toast |
| **Vaul** (drawers) (§11.1) | ✅ NUEVA | ❌ | ❌ | `dashboard-padre-v1` | Mobile drawer específico de dashboard |
| **Phaser 4** (§11.2) | ✅ NUEVA | ❌ | ❌ | `game-world-skeleton` | Motor 2D del mundo explorable, NO del UI general. Se integra via `<GameWorld />` con dynamic import + ssr:false. Instalar sin usar mete 1.4 MB de bundle y enmascara bugs SSR |
| **Phaser Editor v5** (§11.2) | opcional | ❌ | ❌ | `game-world-skeleton` (evaluación) | Docs dice "evaluar tras 2-3 semanas" — no forzar |
| **H5P** (§11.3) | ✅ NUEVA | ❌ | ❌ | `exercise-engine-h5p` | Decisión lib (lumi vs standalone) + wrapper + re-estilizado CSS — es un change en sí mismo |
| **Componentes custom ejercicios** (§11.3) | ✅ | ❌ | ❌ | changes por tipo (`numeric-keypad`, `socioemocional-dilema`, etc.) | On-demand |
| **Supabase (SSR + JS)** (§11.4) | ✅ | ✅ 0.5.1 + 2.45.4 | ✅ mismas versiones | — | Necesarias para auth siguiente |
| **RLS** (§11.4) | ✅ | ✅ | ❌ (no hay tablas) | `supabase-schema-v2` | Se aplica en cada migration; bootstrap no toca DB |
| **Server Actions** (§11.4) | ✅ | ✅ | ✅ habilitadas por Next 14 App Router | — | Habilitación es automática con App Router |
| **OpenRouter** (§11.5) | ✅ | ✅ key | ❌ | `ari-agent-v1` | Sin agente todavía; key en .env ya va (heredada v1) |
| **Anthropic/OpenAI SDK** (§11.5) | ✅ | ❌ | ❌ | `ari-agent-v1` | Decisión SDK pendiente |
| **Vitest** (§11.6) | ✅ NUEVA | ❌ | ✅ + jsdom + @testing-library/react + jest-dom | — | **Gate para Strict TDD Mode** |
| **Playwright** (§11.6) | ✅ NUEVA | ❌ | ✅ + chromium browser | — | Smoke E2E desde día 1 |
| **ESLint** (§11.6) | ✅ NUEVA (explícita) | ❌ | ✅ preset Next + `eslint-config-prettier` | — | Core |
| **Prettier** (§11.6) | ✅ NUEVA | ❌ | ✅ | — | Core |
| **Resend** (§11.7, Ola 1) | ✅ NUEVA | ❌ | ❌ | `email-transaccional` | Ola 1 necesita emails pero no en bootstrap |
| **PostHog** (§11.7, Ola 1) | ✅ NUEVA | ❌ | ❌ | `observability-setup` | Decisión PostHog vs Supabase analytics |
| **Sentry** (§11.7, Ola 1) | ✅ NUEVA | ✅ 10.49.0 | ❌ | `observability-setup` | Instrumentation.ts + DSN |
| **MercadoPago** (§11.7, **Ola 2**) | ✅ | ✅ 2.12.0 | ❌ | `mercadopago-subscripcion` | Docs explícito: "activación Ola 2, no Ola 1" |
| **Zustand** (§12.1 decisión) | ✅ NUEVA | ❌ | ❌ | `phaser-react-state` | Se necesita cuando haya estado compartido real React↔Phaser |
| **canvas-confetti** (no en docs) | — | ✅ 1.9.4 | ❌ | `celebrations-mascot-v1` | v1 tenía; v2.0 podría o no — decidir en change |
| **Recharts** (no en docs §11 pero implicito §9 métricas) | — | ✅ 3.8.1 | ❌ | `dashboard-padre-v1` | v1 lo usaba para gráficos del dashboard padre; probablemente se mantiene |
| **Howler** (audio) | no en docs v2.0 | ✅ 2.2.4 | ❌ | **NO** (descartado) | v2.0 docs §11.1 lista sólo `use-sound`; howler queda fuera |
| **zod** (no en docs §11 explícito) | — | ✅ 3.23.8 | ✅ | — | Validación de env vars en helpers Supabase. Es dep transitive estándar |

### Interpretación
- **Bootstrap instala**: sólo lo que necesita arrancar un proyecto Next.js compilable + typecheckeable + testeable + con cliente Supabase disponible.
- **YAGNI estricto**: ninguna lib de UI/UX (Motion, Lottie, Sonner, Vaul, Lucide, etc.) se instala sin consumidor concreto.
- **Phaser + H5P**: son los 2 motores pesados del producto — cada uno tiene su propio change dedicado con wrapper + tests.
- **Nada que no esté en docs** se instala excepto `zod` (utility para env validation, decisión técnica del bootstrap).
- **Nada que esté en docs queda sin plan**: cada lib tiene un change asignado.

## Approach

Ejecutar en **4 commits** atómicos y secuenciales, cada uno dejando el árbol en estado verde (typecheck + test + dev server OK):

1. **`chore: scaffold next.js 14 app`** — `pnpm create next-app` + TS strict hardening + Prettier + Andika font + home placeholder.
2. **`chore: add shadcn/ui baseline`** — `shadcn init` (components.json + utils.ts + CSS vars). Sin componentes.
3. **`chore: add vitest + playwright with smoke tests`** — instalar testing stack, configs, smoke tests verdes en ambos runners.
4. **`chore: add supabase ssr helpers + env scaffolding`** — `@supabase/ssr` + `@supabase/supabase-js` + `zod`, helpers SSR, `.env.local` (desde engram), `.env.example`, `.gitignore` endurecido.

Al final: **re-run `sdd-init`** para que detecte Vitest y active Strict TDD Mode.

## Affected Areas

| Área | Impacto | Descripción |
|------|--------|-------------|
| Repo root | New | `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `vitest.config.ts`, `playwright.config.ts`, `middleware.ts`, `.env.local`, `.env.example`, `.gitignore`, `.prettierrc`, `eslint.config.mjs` |
| `src/app/` | New | `layout.tsx` con Andika + metadata, `page.tsx` placeholder, `globals.css` con Tailwind + CSS vars |
| `src/lib/supabase/` | New | `client.ts`, `server.ts`, `middleware.ts` — SSR helpers oficiales |
| `src/lib/utils.ts` | New | `cn()` shadcn helper |
| `tests/` | New | `setup.ts`, `smoke.test.ts`, `e2e/home.spec.ts` |
| `prompts/`, `supabase/`, `public/` | New | Carpetas placeholder con `.gitkeep` |
| `openspec/config.yaml` | Modified | Actualizar `testing.runner.installed: true`, `strict_tdd: true` al cierre |
| Engram `sdd/proyecto-tinku-2.0/testing-capabilities` | Modified | Flip installed flags a `true` al cierre |

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| Interacción `create-next-app` pide input en pwsh | Baja | Flags explícitos incluyen `--use-pnpm` y todos los defaults; documentar el comando exacto en task 1.1 |
| Conflicto shadcn último con Tailwind 3 | Media | Fijar `shadcn init` respondiendo "v3" si pregunta; verificar versión de shadcn CLI antes |
| Playwright descarga ~200 MB de browsers | Aceptable | Documentar en README + tarea separada, correr una vez |
| ESLint preset Next + Prettier chocan en reglas estilísticas | Baja | Agregar `eslint-config-prettier` al final del extends array |
| Secrets v1 apuntan a emergentagent.com como APP_URL | Bajo | `.env.local` usa `http://localhost:3000`; secrets de MP/OpenRouter son TEST y esperados |
| Schema Supabase v1 activo podría interferir | Controlado | Este change NO toca DB; sólo instala clientes |
| `pnpm create next-app` puede crear `.git/` dentro y chocar con git ya inicializado | Media | Correr con flag `--skip-install` + no git init; o ejecutar en temp y copiar |

## Rollback Plan

Si algo falla a mitad de camino:

1. **Por commit**: `git reset --hard HEAD~1` por cada commit que haya que revertir (máx 4).
2. **Si los 4 commits ya están pero hay problema sistémico**: `git reset --hard <hash-pre-bootstrap>` donde `<hash-pre-bootstrap>` es el último commit antes de empezar (actualmente no hay commits, así que sería `git clean -fdx` + mantener sólo `docs/`, `.windsurf/`, `.gga`, `openspec/`, `.atl/`, `.git/`).
3. **Engram**: los artefactos SDD quedan en engram aunque se haga rollback del código. Pueden reusarse.
4. **.env.local no se pushea nunca** (está en `.gitignore`) → no hay exposure por rollback.

## Dependencies

- Node 20.x LTS instalado
- pnpm disponible (via `corepack enable` o install global)
- Internet para descargar deps + Playwright browsers
- Credenciales Supabase/MP/OpenRouter en engram (ya están, `topic_key: sdd-init/proyecto-tinku-2.0/secrets-v1`, scope personal)
- Permisos de escritura en `C:\Users\Equipo\proyecto-tinku-2.0`

## Success Criteria

- [ ] `pnpm install` sin errores
- [ ] `pnpm dev` levanta en `http://localhost:3000` y muestra home con "Tinku 2.0 · bootstrap OK"
- [ ] `pnpm typecheck` (tsc --noEmit) sale con código 0
- [ ] `pnpm lint` sale con código 0
- [ ] `pnpm test` corre `tests/smoke.test.ts` y sale verde
- [ ] `pnpm e2e` corre `tests/e2e/home.spec.ts` y sale verde contra dev server
- [ ] `pnpm build` exitoso
- [ ] `.env.local` existe con todas las vars del template pero NO está trackeado por git
- [ ] 4 commits con conventional commits sin AI attribution en `git log`
- [ ] Re-run `sdd-init` → engram muestra `strict_tdd: true`
- [ ] `openspec/config.yaml` actualizado con `strict_tdd: true`
