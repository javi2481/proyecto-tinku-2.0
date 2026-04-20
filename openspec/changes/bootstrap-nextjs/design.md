# Design: Bootstrap Next.js 14 App

## Technical Approach

4 commits atómicos que dejan el árbol **verde** (typecheck + tests) al final de cada uno. Cada commit tiene un rol único y rollback barato:

1. Scaffold oficial de Next.js 14 vía `create-next-app@14` con flags explícitos, TS strict hardening, Andika font en root layout, home placeholder.
2. Inicialización de shadcn/ui (config + CSS vars + `cn()` utility) sin componentes.
3. Testing stack: Vitest + jsdom + Testing Library + Playwright + smoke tests verdes.
4. Cliente Supabase SSR + env bootstrap desde secrets en engram.

Al cierre, re-ejecutar `sdd-init` para que detecte Vitest y flipee `strict_tdd: true` en engram + `openspec/config.yaml`.

## Architecture Decisions

### Decision 1: Package manager — pnpm

**Choice**: `pnpm` (vía `corepack enable` + `pnpm@9.x`).

**Alternatives considered**:
- `npm` (lo que usaba v1) — más lento, sin content-addressable store.
- `yarn v4 berry` — PnP aporta, pero más fricción con herramientas Next/Vercel.

**Rationale**: Tinku 2.0 va a tener >60 deps eventualmente (Phaser, H5P, shadcn/Radix * N, testing stack, audio libs, MP, Sentry, etc.). pnpm ahorra ~40% tiempo install y 60-70% espacio en disco vía content-addressable store. Compatible 100% con Next 14, Vercel y Claude Code. El costo de cambiar desde v1 es cero porque v2.0 se rehace fresh.

**Enforcement**: campo `packageManager` en `package.json` bloquea npm/yarn inadvertidos cuando Corepack está activo.

```json
"packageManager": "pnpm@9.15.0"
```

### Decision 2: Scaffold command

**Choice**: `pnpm create next-app@14 . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm`

**Rationale**: los 7 flags son los defaults necesarios para el stack documentado. Evitan el prompt interactivo (que en pwsh tiene rough edges). `--src-dir` respeta la estructura propuesta.

**Gotcha conocida**: `create-next-app` intenta `git init` si detecta que no hay repo. Como el repo ya tiene `.git/` inicializado con branch `main` y un untracked `openspec/`, `docs/`, etc., el scaffold NO creará un `.git/` nuevo. Si por alguna razón genera un segundo `.git/`, abortar y limpiar.

**Post-scaffold cleanup obligatorio**:
- Borrar `README.md` generado (conflict con lo que los docs ya establecen)
- Borrar `next-env.d.ts` NO se borra — es gestionado por Next
- Revisar `.gitignore` generado y mergear con patterns que faltan

### Decision 3: TS strict endurecido

**Choice**: sobre el `tsconfig.json` que genera `create-next-app`, agregar:
```json
{
  "compilerOptions": {
    "strict": true,                         // ya viene
    "noUncheckedIndexedAccess": true,       // NUEVO — fuerza narrowing de arrays/maps
    "noImplicitOverride": true,             // NUEVO — `override` keyword obligatorio
    "noPropertyAccessFromIndexSignature": false  // dejar en false para ergonomía con env vars
  }
}
```

**Rationale**: `noUncheckedIndexedAccess` atrapa el bug clásico `array[i]` siendo `T | undefined`. Es molesto al principio pero elimina una clase entera de bugs en app pedagógica donde se manejan arrays de ejercicios, opciones, provincias. `noImplicitOverride` es higiene OOP (Phaser usa clases).

**NO activamos** `exactOptionalPropertyTypes` por ahora — choca con muchas libs (Next props opcionales).

### Decision 4: Prettier integración

**Choice**: Prettier standalone con config en `.prettierrc`, ESLint delega estilo a Prettier via `eslint-config-prettier` como último elemento en `extends`.

```jsonc
// .eslintrc.json (o eslint.config.mjs)
{
  "extends": ["next/core-web-vitals", "next/typescript", "prettier"]
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Rationale**: `eslint-config-prettier` **desactiva** reglas de ESLint que chocan con Prettier. No ejecuta Prettier — eso se hace con `pnpm format` (script separado). Esto evita el anti-patrón de correr Prettier como regla ESLint (slow + ruidoso en el editor).

### Decision 5: Andika font en root layout

**Choice**: `next/font/google` con `variable` CSS var approach:

```tsx
// src/app/layout.tsx
import { Andika } from "next/font/google";

const andika = Andika({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-andika",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${andika.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

Y en `tailwind.config.ts`:
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ["var(--font-andika)", "system-ui", "sans-serif"],
    },
  },
}
```

**Rationale**: Andika está diseñada para lectura infantil (docs §11.1). La estrategia de CSS variable permite cambiar la font en un subtree sin tocar `<html>` class, y Tailwind la expone como `font-sans`. `display: "swap"` evita FOIT. `lang="es-AR"` es crítico para el público argentino (afecta a11y, hyphenation, screen readers).

### Decision 6: shadcn init SIN componentes

**Choice**: correr `pnpm dlx shadcn@latest init` eligiendo:
- Style: `default`
- Base color: `slate`
- CSS variables: `yes`
- `components.json` → `src/components/ui` como `components` path, `src/lib/utils` como `utils` path

**NO instalar** ningún componente en este change (`pnpm dlx shadcn@latest add button` etc. queda para cuando haya consumidor).

**Rationale**: shadcn NO es una runtime dep — es copy-paste de componentes a tu repo. Instalar componentes sin consumidor crea dead code + surface de bugs + deuda de estilizado. El bootstrap deja la `components.json` + `utils.ts` + CSS vars listos; cada componente se agrega en el change que lo usa.

**Base color**: `slate` porque casa bien con la paleta cósmica implícita del mundo Tinku (azules neutros + acentos). Si después se define paleta final distinta en un change de design system, se cambia.

### Decision 7: Vitest config

**Choice**: `vitest.config.ts` con `jsdom`, `@testing-library/*`, y path alias vía `vite-tsconfig-paths`:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules", ".next"],
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

**Rationale**:
- `vite-tsconfig-paths` replica automáticamente `@/*` → `src/*` sin duplicar config. Mantiene un solo source of truth (tsconfig).
- `globals: true` evita `import { describe, it, expect }` en cada archivo.
- `tests/e2e/**` excluido para que Vitest no intente correr specs de Playwright.

**Deps que se agregan**:
- `vitest`, `@vitest/ui` (dev)
- `@vitejs/plugin-react`, `vite-tsconfig-paths` (dev)
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (dev)
- `jsdom` (dev)

### Decision 8: Playwright config

**Choice**: config con `webServer` que levanta `pnpm dev`:

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "es-AR",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
```

**Rationale**:
- Sólo `chromium` al principio — firefox y webkit se agregan cuando haya UI que probar en múltiples browsers.
- `webServer.reuseExistingServer: true` local (si ya tenés `pnpm dev` corriendo), `false` en CI.
- `locale: "es-AR"` fuerza el locale argentino en las pruebas (fechas, números).
- `devices["Desktop Chrome"]` por default; mobile se agrega con primer test responsive.

**Deps**:
- `@playwright/test` (dev)
- Browsers descargados con `pnpm exec playwright install chromium`

### Decision 9: Supabase helpers (SSR pattern oficial)

**Choice**: 3 archivos siguiendo el pattern oficial `@supabase/ssr`:

#### `src/lib/supabase/client.ts` (Browser client, Client Components)
```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

#### `src/lib/supabase/server.ts` (Server Components, Server Actions, Route Handlers)
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export async function createClient() {
  const cookieStore = await cookies();
  const env = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component sin response writable — ignorar (se setea en Middleware)
        }
      },
    },
  });
}
```

#### `src/lib/supabase/middleware.ts` (Middleware SSR session refresh)
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh session if expired — bootstrap no hace redirect todavía (no hay auth routes)
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

#### `middleware.ts` (root del proyecto)
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Rationale**: este es el pattern OFICIAL de Supabase para Next.js App Router. Garantiza que las cookies de sesión se refrescan en cada request sin que los Server Components las pierdan. En bootstrap NO hay rutas protegidas, pero el middleware ya está y funciona — cualquier auth feature posterior lo encuentra listo.

**Env validation con Zod**: si faltan vars, `z.parse` tira error al startup — fail-fast. Preferible a `process.env.X!` (non-null assertion que oculta el bug).

### Decision 10: Variables de entorno

**Choice**: dos archivos:
- `.env.local` (NO trackeado) — valores reales desde engram (`sdd-init/proyecto-tinku-2.0/secrets-v1`)
- `.env.example` (trackeado) — mismas keys, valores placeholder

`.gitignore` incluye:
```
# env files (can opt-in for committing if needed)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local
```

**Rationale**: estándar Next.js. `.env.example` documenta las vars para futuros devs/CI. Nunca comitear secrets — aunque sean TEST, es higiene.

**Vars a poblar** (desde engram `sdd-init/proyecto-tinku-2.0/secrets-v1`):
```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://rihbkanevxlvisanlvsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=a8f3c9d2e1f4b5h6j7k8l9m0n1o2p3q4r
ADMIN_EMAILS=rjavierst@gmail.com,tinku-test-1776447878@example.com
SENTRY_DSN=
MERCADOPAGO_ACCESS_TOKEN=TEST-6108553279625812-...
MERCADOPAGO_CLIENT_ID=77689175
MERCADOPAGO_CLIENT_SECRET=3cabf5702a780a811059f296d3b7dbaf
OPENROUTER_API_KEY=sk-or-v1-03ac7...
```

### Decision 11: Home placeholder

**Choice**: `src/app/page.tsx` minimalista pero **útil para smoke tests**:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Tinku 2.0</h1>
      <p className="mt-4 text-muted-foreground">bootstrap OK · ready para construir</p>
    </main>
  );
}
```

**Rationale**: el `<h1>` es el hook para el smoke test E2E de Playwright. Usar clases Tailwind confirma que el build procesa Tailwind. `text-muted-foreground` valida que las CSS vars de shadcn están activas.

### Decision 12: Scripts de package.json

**Choice**: scripts mínimos + los del stack de testing:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

**Rationale**: el set mínimo para los 13 scenarios del spec + ergonomía dev (watch modes). `-H 0.0.0.0` mantiene compatibilidad con v1 (accesible en LAN).

### Decision 13: .gitignore endurecido

**Choice**: sobre el `.gitignore` que genera `create-next-app`, agregar:

```
# Testing
/coverage
/playwright-report
/test-results
/blob-report
/playwright/.cache

# SDD artifacts activos (se agrega si el user decide no commitear openspec/)
# openspec/changes/
# openspec/changes/archive/

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea

# OS
.DS_Store
Thumbs.db

# Sentry
.sentryclirc
```

**NO** agregar `openspec/` al ignore — los artefactos SDD SÍ se commitean (es hybrid, ese es el punto).

### Decision 14: Commits granulares sin AI attribution

**Choice**: 4 commits:

```
chore: scaffold next.js 14 app with tailwind and typescript strict
chore: add shadcn/ui baseline with css variables
chore: add vitest and playwright with smoke tests
chore: add supabase ssr helpers and env scaffolding
```

**Rationale**: conventional commits, inglés imperativo, sin punto final. Cada commit deja árbol verde. Permite `git bisect` posterior. Mensajes claros para `git log --oneline`.

**Prohibido** (regla del user en AGENTS.md):
- `Co-Authored-By: ...`
- `🤖 Generated with ...`
- Cualquier firma de IA

## Sequence Diagram — bootstrap flow

```
Developer                  pnpm               create-next-app            repo
   |                         |                       |                      |
   |-- pnpm create ---------->                       |                      |
   |                         |-- download template ->|                      |
   |                         |                       |--- write files ----->|
   |                         |-- install deps ------>|                      |
   |                         |                       |<-- done --------------|
   |<- scaffold done --------|                       |                      |
   |                         |                       |                      |
   |-- edit tsconfig (strict)-+--------------------------------------------->|
   |-- edit layout.tsx (Andika)-------------------------------------------->|
   |-- git commit 1 (scaffold)---------------------------------------------->|
   |                         |                       |                      |
   |-- pnpm dlx shadcn init->|                       |                      |
   |                         |-- write components.json + utils.ts --------->|
   |                         |-- write globals.css (CSS vars)---------------|>
   |-- git commit 2 (shadcn)------------------------------------------------>|
   |                         |                       |                      |
   |-- pnpm add -D vitest... ->                                              |
   |                         |-- resolve deps ------>|                      |
   |-- write vitest.config.ts, setup.ts, smoke.test.ts ------------------->|
   |-- pnpm add -D @playwright/test -->                                     |
   |-- pnpm exec playwright install chromium ->                             |
   |-- write playwright.config.ts, home.spec.ts -------------------------->|
   |-- pnpm test && pnpm e2e (validar verde)                                |
   |-- git commit 3 (testing)----------------------------------------------->|
   |                         |                       |                      |
   |-- pnpm add @supabase/ssr @supabase/supabase-js zod ->                  |
   |-- write src/lib/supabase/{client,server,middleware}.ts -------------->|
   |-- write middleware.ts (root) --------------------------------------->|
   |-- populate .env.local (desde engram) + .env.example ---------------->|
   |-- pnpm typecheck && pnpm test (re-validar verde)                       |
   |-- git commit 4 (supabase + env)---------------------------------------->|
   |                         |                       |                      |
   |-- sdd-init (re-run) --> flip strict_tdd: true en engram + config.yaml   |
```

## Data Flow — ninguno (bootstrap no tiene runtime lógico)

Este change NO procesa datos. Ningún Server Action, ningún fetch, ningún state store. El único "data flow" es:
- `env vars → Zod parse → Supabase client config` (al primer import, aunque bootstrap no importa nada que lo dispare hasta el siguiente change)

## State Management

No aplica. Zustand se instala en `phaser-react-state`.

## Security Considerations

- `.env.local` NUNCA trackeado (verificado en spec scenario).
- `SUPABASE_SERVICE_ROLE_KEY` es server-only — **no usar nunca en Client Components**. Los helpers browser (`client.ts`) sólo leen `NEXT_PUBLIC_*`. Enforce via naming + review manual (no hay runtime check a nivel Next).
- Middleware refresca sesión pero NO redirige — esto es deliberado. Cuando haya auth routes, se extiende el middleware (en el change `auth-padre`).
- No hay rutas sensibles en bootstrap, así que RLS + auth gating se posponen a `supabase-schema-v2` y `auth-padre`.

## Performance Considerations

- `next/font/google` para Andika → self-hosted en build, zero CLS.
- `display: "swap"` → evita FOIT.
- `experimental.turbopack` NO se activa en `next.config.mjs` (Turbopack stable en 15, no en 14). Mantener webpack.
- Bundle target: `pnpm build` debería producir First Load JS < 100 kB en la home (sin componentes, sólo layout + page).

## Accessibility

- `<html lang="es-AR">` en layout.
- Andika es una font legible para disléxicos y público infantil (justificación clave en docs §11.1).
- `antialiased` clase Tailwind en `<body>` para smoothing.
- Esto es baseline; a11y específica por componente se hace cuando se creen.

## Observability

Diferido a `observability-setup` change. Bootstrap NO instala Sentry/PostHog.

## Testing Strategy

Este change **es el gate** para testing en el proyecto. Los 2 smoke tests NO son cobertura — son **prueba de vida del pipeline**:

- **Vitest smoke** (`tests/smoke.test.ts`): `expect(1 + 1).toBe(2)` + un test mínimo que renderiza un componente trivial con Testing Library. Valida jsdom + config.
- **Playwright smoke** (`tests/e2e/home.spec.ts`): navegar a `/`, assertar `<h1>` con `Tinku 2.0`. Valida que dev server arranca + Playwright conecta + routing funciona.

Ambos DEBEN pasar antes del commit 3. Si fallan, se rollback ese commit y se ajusta config.

## Migration Strategy

Ninguna migration — no hay data legacy en este repo. Los secrets v1 se reusan sin transformación.

## Rollback Strategy

| Escenario | Acción |
|-----------|--------|
| Commit 1 falla (scaffold no compila) | `git reset --hard <pre>` + limpiar node_modules + retry con otra versión de Next |
| Commit 2 falla (shadcn init) | `git reset --hard HEAD~1` — queda en estado post-commit-1 funcional |
| Commit 3 falla (tests) | Debuggear config Vitest/Playwright ANTES de commitear — no commitear rojo |
| Commit 4 falla (Supabase helpers typecheck) | Revisar versions + tipos; `git reset --hard HEAD~1` si irreparable |
| .env.local comiteado por error | `git rm --cached .env.local` + rotar keys (nuclear — v1 TEST keys no críticas) |

## Open Questions (resueltas con defaults)

1. **Node version**: Node 20.x LTS → `.nvmrc: 20` + `engines.node: ">=20"`.
2. **pnpm version**: `pnpm@9.15.0` pinned en `packageManager`.
3. **ESLint v8 vs v9**: Next 14 usa ESLint 8 por default — mantener.
4. **Prettier plugins Tailwind**: `prettier-plugin-tailwindcss` SÍ incluir (ordena classes automáticamente). Dep dev.
5. **Cerrar el change en 1 sesión**: objetivo sí, pero si falla, los 4 commits son independientes y se puede pausar entre medio.

## Validation Checklist (pre-apply)

- [ ] Node 20.x disponible en PATH
- [ ] pnpm disponible (via corepack o install global)
- [ ] Internet estable (Playwright descarga ~120 MB)
- [ ] Credenciales Supabase validadas (JWT decodificado, no expirado)
- [ ] Branch actual = `main` (sin commits todavía)
- [ ] Carpeta `node_modules/` NO existe (greenfield)
