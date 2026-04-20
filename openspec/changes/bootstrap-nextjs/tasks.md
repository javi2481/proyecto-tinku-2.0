# Tasks: Bootstrap Next.js 14 App

## Phase 1: Scaffold + TS Hardening + Andika

### 1.1 — Run create-next-app scaffold

- [ ] **1.1.1** Ejecutar en pwsh: `cd C:\Users\Equipo\proyecto-tinku-2.0 && corepack enable && pnpm create next-app@14 . --ts --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm --no-import-alias`
- [ ] **1.1.2** Verificar que creó los directorios: `src/app/`, `src/lib/`, `src/components/`, `src/types/`
- [ ] **1.1.3** Verificar que creó `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`
- [ ] **1.1.4** Verificar que NO creó `pages/` directory (Pages Router) — si lo creó, eliminar
- [ ] **1.1.5** Verificar que NO commiteó `.git/` — si lo hizo, limpiar con `rm -rf .git` y re-init si es necesario

### 1.2 — Hardening TypeScript

- [ ] **1.2.1** Editar `tsconfig.json`: agregar `noUncheckedIndexedAccess: true` y `noImplicitOverride: true` en `compilerOptions`
- [ ] **1.2.2** Ejecutar `pnpm typecheck` → debe salir con código 0
- [ ] **1.2.3** Ejecutar `pnpm build` → debe compilar sin errores

### 1.3 — Andika font en Root Layout

- [ ] **1.3.1** Editar `src/app/layout.tsx`: importar `{ Andika } from "next/font/google"`, configurar con `subsets: ["latin"]`, `weight: ["400", "700"]`, `variable: "--font-andika"`, `display: "swap"`
- [ ] **1.3.2** Agregar `className={andika.variable}` al `<html>` y agregar clase `font-sans` al `<body>` via Tailwind
- [ ] **1.3.3** Editar `tailwind.config.ts`: agregar `fontFamily.sans: ["var(--font-andika)", "system-ui", "sans-serif"]` en theme.extend
- [ ] **1.3.4** Agregar `lang="es-AR"` al `<html>` tag

### 1.4 — Home Placeholder + Test Hook

- [ ] **1.4.1** Editar `src/app/page.tsx`: crear componente `HomePage()` con `<h1>Tinku 2.0</h1>` + `<p>bootstrap OK</p>` (usar clases Tailwind: `text-4xl font-bold`, `text-muted-foreground`)
- [ ] **1.4.2** Ejecutar `pnpm dev` en background, verificar que localhost:3000 responde 200 con "Tinku 2.0" en body
- [ ] **1.4.3** Detener dev server

### 1.5 — Cleanup scaffold

- [ ] **1.5.1** Eliminar `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/window.svg`, `public/globe.svg`, `public/logo.svg` (assets que no se usan)
- [ ] **1.5.2** Eliminar `src/app/favicon.ico` (por ahora)
- [ ] **1.5.3** Reemplazar `src/app/globals.css` con version minima: `@tailwind base; @tailwind components; @tailwind utilities;` + `@layer base { :root { --background: #ffffff; --foreground: #171717; } }` placeholder
- [ ] **1.5.4** Commit "chore: scaffold next.js 14 app with tailwind and typescript strict"

### 1.6 — Commit 1

- [ ] **1.6.1** `git status` → verificar archivos staged
- [ ] **1.6.2** `git commit -m "chore: scaffold next.js 14 app with tailwind and typescript strict"` (VERIFICAR: no Co-Authored-By, no IA attribution)
- [ ] **1.6.3** `pnpm typecheck` post-commit → debe pasar

---

## Phase 2: Prettier + ESLint + shadcn Init

### 2.1 — Prettier Setup

- [ ] **2.1.1** Ejecutar `pnpm add -D prettier eslint-config-prettier prettier-plugin-tailwindcss`
- [ ] **2.1.2** Crear `.prettierrc` con: `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100, "tabWidth": 2, "plugins": ["prettier-plugin-tailwindcss"] }`
- [ ] **2.1.3** Agregar script `"format": "prettier --write ."`, `"format:check": "prettier --check ."` en `package.json`
- [ ] **2.1.4** Ejecutar `pnpm format` para formatear el código existente

### 2.2 — ESLint Hardening

- [ ] **2.2.1** Editar `.eslintrc.json` (o crear si usa flat config): agregar `"prettier"` como ÚLTIMO elemento del array `extends`
- [ ] **2.2.2** Ejecutar `pnpm lint` → debe pasar con código 0 (sin errors)
- [ ] **2.2.3** Corregir cualquier warning que bloque el build (usar `--max-warnings=0` si es necesario, pero por defecto el scaffold pasa)

### 2.3 — Commit Intermedio Prettier

- [ ] **2.3.1** Commit "chore: add prettier and eslint with shadcn baseline" (COMBINAR con shadcn para reducir commit count)

### 2.4 — shadcn/ui Init

- [ ] **2.4.1** Ejecutar `pnpm dlx shadcn@latest init`
- [ ] **2.4.2** Responder prompts:
  - Style: `Default`
  - Base color: `Slate`
  - CSS variables: `Yes`
  - Custom prefix: `@` (default)
  - CSS output: `src/app/globals.css`
  - Components path: `src/components/ui`
  - Utils path: `src/lib/utils`
- [ ] **2.4.3** Verificar creó `components.json`
- [ ] **2.4.4** Verificar creó `src/lib/utils.ts` con función `cn()`
- [ ] **2.4.5** Verificar `src/app/globals.css` tiene CSS variables en `:root` y `.dark`

### 2.5 — Commit 2

- [ ] **2.5.1** `git status` → verificar archivos staged (globals.css, components.json, utils.ts, package.json actualizado)
- [ ] **2.5.2** `git commit -m "chore: add shadcn/ui baseline with css variables"` (VERIFICAR: no IA attribution)
- [ ] **2.5.3** `pnpm lint` post-commit → debe pasar

---

## Phase 3: Vitest + Playwright + Smoke Tests

### 3.1 — Vitest Setup

- [ ] **3.1.1** Ejecutar `pnpm add -D vitest @vitest/ui @vitejs/plugin-react vite-tsconfig-paths`
- [ ] **3.1.2** Ejecutar `pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] **3.1.3** Crear `vitest.config.ts`:
  ```ts
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
- [ ] **3.1.4** Crear directorio `tests/` si no existe
- [ ] **3.1.5** Crear `tests/setup.ts`: `import "@testing-library/jest-dom/vitest";`
- [ ] **3.1.6** Agregar scripts `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:ui": "vitest --ui"` en package.json

### 3.2 — Vitest Smoke Test

- [ ] **3.2.1** Crear `tests/smoke.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";

  describe("smoke", () => {
    it("can add numbers", () => {
      expect(1 + 1).toBe(2);
    });

    it("renders a simple component", () => {
      const Test = () => <div>Hello</div>;
      // Minimal render test — jsdom can render simple functions
      expect(Test().type).toBe("div");
    });
  });
  ```
- [ ] **3.2.2** Ejecutar `pnpm test` → debe pasar con 2 tests, 0 failures, código 0

### 3.3 — Playwright Setup

- [ ] **3.3.1** Ejecutar `pnpm add -D @playwright/test`
- [ ] **3.3.2** Ejecutar `pnpm exec playwright install chromium` (descarga ~120 MB)
- [ ] **3.3.3** Crear `playwright.config.ts`:
  ```ts
  import { defineConfig, devices } from "@playwright/test";

  export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "github" : "list",
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
- [ ] **3.3.4** Crear directorio `tests/e2e/` si no existe
- [ ] **3.3.5** Agregar script `"e2e": "playwright test"` en package.json

### 3.4 — Playwright Smoke Test

- [ ] **3.4.1** Crear `tests/e2e/home.spec.ts`:
  ```ts
  import { test, expect } from "@playwright/test";

  test("home page renders Tinku 2.0", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Tinku 2.0");
  });
  ```
- [ ] **3.4.2** Ejecutar `pnpm e2e` → debe pasar con 1 test, 0 failures (Playwright arranca dev server automáticamente via webServer)

### 3.5 — Commit 3

- [ ] **3.5.1** `git status` → verificar archivos staged
- [ ] **3.5.2** `git commit -m "chore: add vitest and playwright with smoke tests"` (VERIFICAR: no IA attribution)
- [ ] **3.5.3** `pnpm test && pnpm e2e` post-commit → debe pasar

---

## Phase 4: Supabase SSR Helpers + Env + Strict TDD Activation

### 4.1 — Supabase Deps

- [ ] **4.1.1** Ejecutar `pnpm add @supabase/ssr @supabase/supabase-js zod`
- [ ] **4.1.2** Verificar que se agregaron en `dependencies` de package.json

### 4.2 — Supabase Helpers

- [ ] **4.2.1** Crear directorio `src/lib/supabase/`
- [ ] **4.2.2** Crear `src/lib/supabase/client.ts`:
  - "use client"
  - Importar `createBrowserClient` de `@supabase/ssr`
  - Zod env schema validando NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Exportar función `createClient()`
- [ ] **4.2.3** Crear `src/lib/supabase/server.ts`:
  - Importar `createServerClient` de `@supabase/ssr`
  - Importar `cookies` de `next/headers`
  - Zod env schema same que client.ts
  - Exportar función `createClient()` async
  - Implementar cookies.getAll() y setAll() con manejo de error silencioso
- [ ] **4.2.4** Crear `src/lib/supabase/middleware.ts`:
  - Importar `createServerClient`, `NextResponse`, `NextRequest`
  - Exportar función `updateSession(request: NextRequest)` async
  - Implementar cookies.getAll() y setAll()
  - Llamar `await supabase.auth.getUser()` (sin redirect todavía)
  - Retornar supabaseResponse
- [ ] **4.2.5** Crear `middleware.ts` en raíz del proyecto:
  - Importar `NextRequest`, `updateSession` desde lib/supabase/middleware
  - Exportar función `middleware(request: NextRequest)`
  - Matcher exclude para static files, images, favicon
- [ ] **4.2.6** Ejecutar `pnpm typecheck` → debe pasar sin errores de tipos

### 4.3 — Environment Files

- [ ] **4.3.1** Poblar `.env.local` con vars desde engram secrets-v1:
  ```
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
- [ ] **4.3.2** Crear `.env.example` con mismas keys y valores placeholder: `your-url-here`, `your-key-here`, etc.
- [ ] **4.3.3** Agregar al `.gitignore`: `.env.local`, `.env*.local`

### 4.4 — Placeholders

- [ ] **4.4.1** Crear `prompts/.gitkeep`
- [ ] **4.4.2** Crear `supabase/.gitkeep`
- [ ] **4.4.3** Verificar `public/` existe (de scaffold)

### 4.5 — Final Validation

- [ ] **4.5.1** `pnpm install` → debe correr sin errores
- [ ] **4.5.2** `pnpm typecheck` → código 0
- [ ] **4.5.3** `pnpm lint` → código 0
- [ ] **4.5.4** `pnpm test` → verde
- [ ] **4.5.5** `pnpm e2e` → verde
- [ ] **4.5.6** `pnpm build` → debe compilar sin errores

### 4.6 — Commit 4 (Final)

- [ ] **4.6.1** `git status` → verificar archivos staged
- [ ] **4.6.2** `git commit -m "chore: add supabase ssr helpers and env scaffolding"` (VERIFICAR: no IA attribution)
- [ ] **4.6.3** GitHub remote (optional): `git remote add origin <url>` + `git push -u origin main`

### 4.7 — Strict TDD Activation

- [ ] **4.7.1** Actualizar engram `sdd/proyecto-tinku-2.0/testing-capabilities`:
  - `Strict TDD Mode`: enabled
  - `Test Runner.installed`: true
  - `Test Runner.command`: pnpm test
- [ ] **4.7.2** Actualizar `openspec/config.yaml`:
  - `strict_tdd`: true
  - `testing.runner.installed`: true
  - `test_command`: pnpm test

---

## Validation Post-Apply (REQUIRED antes de marcar cambio como completado)

| Cmd | Expected | Check |
|---|---|---|
| `pnpm install` | Código 0 | [ ] |
| `pnpm dev` (background) | localhost:3000 responde 200 | [ ] |
| `pnpm typecheck` | Código 0 | [ ] |
| `pnpm lint` | Código 0 | [ ] |
| `pnpm test` | 2 tests, 0 failures | [ ] |
| `pnpm e2e` | 1 test, 0 failures | [ ] |
| `pnpm build` | Código 0, .next/ creado | [ ] |

## Git Log Post-Apply

```
<hash-4> chore: add supabase ssr helpers and env scaffolding
<hash-3> chore: add vitest and playwright with smoke tests
<hash-2> chore: add shadcn/ui baseline with css variables
<hash-1> chore: scaffold next.js 14 app with tailwind and typescript strict
```

Debe mostrar exactamente 4 commits con prefijos `chore:`. Sin `Co-Authored-By`, sin `Generated`, sin IA attribution.