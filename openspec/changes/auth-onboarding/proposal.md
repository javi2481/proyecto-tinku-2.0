# Proposal: Auth y Onboarding Tri-lateral

## Intent

Permitir que un **padre** cree cuenta, registre a su hijo, y obtenga un código de login. Permitir que un **alumno** entre con ese código y llegue a la pantalla del mundo. Es el primer flujo end-to-end del producto donde usuarios reales interactúan con la app. Sin auth, nadie puede usar Tinku. Afecta al **padre** (crea cuenta, registra hijo, ve dashboard mínimo) y al **alumno** (entra con código, ve mundo). El docente está fuera de scope (Ola 3).

## Scope

### In Scope
- Auth del padre: registro con email+password e inicio de sesión con email+password
- Auth del padre: Google OAuth (via Supabase Auth providers)
- Onboarding del padre: flujo multi-paso (3-4 pasos) para registrar hijo — nombre, fecha de nacimiento, grado estimado, elección de avatar
- Generación de código alfanumérico de 6 caracteres único por alumno (excluyendo caracteres confusos: 0/O, 1/l/I)
- Auth del alumno: input de código en pantalla de login, validación, `supabase.auth.signInAnonymously()` + asociación del anonymous session al `student_id`
- Pantalla de elección de avatar con 8-10 opciones pre-hechas
- Primera llegada al mundo: pantalla welcome rápida que muestra el mapa con Isla de los Números disponible
- Middleware de Supabase para refresh de session (ya existe el helper del bootstrap, se refina)
- Redirect post-login: padre → `/dashboard` (placeholder), alumno → `/world` (placeholder con mapa)
- Logout para ambos roles
- Consentimiento parental: documentación del flujo que se activará en Ola 2 (por ahora solo placeholder en UI)

### Out of Scope
- Dashboard padre completo con datos de progreso (Phase 1.10 — `dashboard-padre-v1`)
- Implementación real de consentimiento parental versionado con firma digital (Ola 2 — compliance)
- Portal docente (Ola 3)
- MercadoPago / pagos (Ola 2)
- Password reset / forgot password (se agrega como fix rápido si surge, pero no es MVP de beta)
- Email verification (Supabase lo soporta pero no lo habilitamos en beta cerrada)
- Perfil del padre editable (nombre, foto — Ola 2)
- Límites de tiempo parental (Phase 1.10)
- Reporte semanal por email via Resend (Phase 1.10)
- Pantalla del mundo Phaser (Phase 1.5 — `game-world-skeleton`) — este change usa un placeholder visual

## Capabilities

### New Capabilities
- `parent-auth`: registro y login de padres con email+password y Google OAuth. Incluye onboarding multi-paso para registrar hijo(s) y generar código de login del alumno.
- `student-auth`: login del alumno con código de 6 caracteres. Incluye `signInAnonymously()` de Supabase, asociación de session al `student_id`, y redirect a pantalla del mundo.
- `onboarding-flow`: flujo completo de primer uso — padre registra cuenta → registra hijo → alumno entra con código → ve el mundo. Es el journey de onboarding end-to-end.

### Modified Capabilities
- `project-bootstrap`: se agrega middleware de auth al stack existente, se enrutan rutas protegidas. Los helpers Supabase se refactorizan para usar tipos del schema en vez de `any`.

## Approach

Ejecutar en **4 commits** secuenciales:

1. **`feat(auth): add parent auth — email+password and Google OAuth`** — Configurar Supabase Auth providers (email, Google). Server Actions para `signUp` y `signIn`. Componentes de formulario con shadcn/ui (Button, Input, Card). Rutas `/auth/login` y `/auth/register`. Middleware que protege rutas authenticated. Tests unitarios de Server Actions.

2. **`feat(auth): add parent onboarding — register child and generate login code`** — Flujo multi-paso con steps: (1) nombre del hijo, (2) fecha de nacimiento y grado estimado, (3) elección de avatar, (4) pantalla de confirmación con código生成. Server Action `registerChild` que crea row en `students`, genera código único en `student_codes`, y devuelve el código al padre. Componentes de wizard/stepper. Tests de Server Actions con mocks de Supabase.

3. **`feat(auth): add student auth — code input with anonymous sign-in`** — Pantalla de login del alumno: input de 6 caracteres, validación contra `student_codes`, `signInAnonymously()` de Supabase, link de anonymous session al `student_id`. Redirect a `/world`. Comprobación de que el alumno sin código NO puede acceder a rutas del mundo. Tests de integración del flujo completo.

4. **`feat(auth): add welcome screen, route guards, and auth integration tests`** — Pantalla welcome para primera llegada del alumno (placeholder visual del mapa con Isla de los Números accesible). Route guards: padre no ve rutas de alumno, alumno no ve rutas de padre. Auth integration tests que verifican: registro padre → login → registro hijo → login hijo con código → acceso al mundo. Refinar helpers Supabase para usar tipos generados del schema.

### Decisiones arquitectónicas clave

- **Patrón de auth alumno**: código de 6 chars → validación → `signInAnonymously()` → asociación de session (TINKU.md §12.4). El alumno NO tiene email ni password. La sesión anónima se asocia al `student_id` correspondiente. Esto es diezmado nuevo en v2.0 (no se migra de v1).
- **Onboarding es Server Actions**, no API routes (TINKU.md §12.7 — "Mutations via Server Actions, NOT custom /api/* routes"). Toda mutación es `use server` en Next.js.
- **Código de alumno se genera con exclusion de caracteres confusos**: charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin 0/O, 1/I/l). Esto da 32^6 ≈ 1.07 billiones de combinaciones, más que suficiente para beta cerrada.
- **Middleware de Supabase** ya está instalado del bootstrap (phase 1.1). Se refina para agregar redirect logic basado en auth state y role.
- **Google OAuth** se configura via Supabase Dashboard (no via código). Se documenta el setup en README.
- **Avatar se almacena como string** (identificador de avatar pre-hecho, ej: `"avatar_01"`), no como imagen subida. Los 8-10 avatars son assets estáticos en `public/avatars/`. El campo `avatar` en `students` es un ENUM o string validado.
- **Consentimiento parental** en Ola 1 es placeholder en UI (checkbox "He leído y acepto los términos" + link a documento). El flujo real de consentimiento versionado con firma digital se implementa en Ola 2 cuando se abre al público (TINKU.md §5.5 y §4.2).
- **No hay localStorage para estado pedagógico** (TINKU.md §12.7). Auth state vive en Supabase session. Preferencias de UI (ej: sonido on/off) son la única excepción permitida.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/app/(auth)/` | New | Grupo de rutas de auth: `/login`, `/register`, `/onboarding` |
| `src/app/(parent)/dashboard/` | New | Placeholder del dashboard padre, redirect post-login |
| `src/app/(student)/world/` | New | Pantalla del mundo placeholder (sin Phaser aún) |
| `src/app/(student)/welcome/` | New | Pantalla welcome post-primer-login |
| `src/app/(public)/` | New | Landing page sin auth |
| `src/lib/auth/` | New | Server Actions: `signUp`, `signIn`, `signOut`, `registerChild`, `loginStudent` |
| `src/lib/auth/student-code.ts` | New | Generación y validación de códigos de 6 chars |
| `src/components/auth/` | New | Componentes: `LoginForm`, `RegisterForm`, `OnboardingWizard`, `CodeInput`, `AvatarPicker` |
| `src/components/ui/` | New | Componentes shadcn/ui que se necesitan: `Button`, `Input`, `Card`, `Label`, `Select` |
| `middleware.ts` | Modified | Agregar auth redirects basados en role y session state |
| `src/lib/supabase/` | Modified | Refinar helpers para usar tipos del schema, agregar `getServerSession()`, `getClientSession()` |
| `public/avatars/` | New | 8-10 archivos SVG/PNG de avatars pre-hechos para alumnos |
| `tests/integration/auth/` | New | Tests de integración del flujo completo de auth |

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| `signInAnonymously()` de Supabase puede generar muchas sessions huérfanas si hay abuso | Media | Rate limiting por IP (Supabase Auth tiene rate limits configurables). Monitorear sessions anónimas en dashboard |
| Google OAuth requiere configuración en Google Cloud Console + Supabase Dashboard | Alta | Documentar paso a paso en README. Probar con cuenta de test antes de beta |
| Onboarding multi-paso puede tener fallas de UX en mobile | Media | Design mobile-first. Stepper con progress visible. Test con dispositivos reales |
| Códigos de alumno predecibles o colisiones | Baja | Generación aleatoria con exclusion de chars confusos. UNIQUE constraint en DB. Retry automático si hay colisión |
| Middleware de auth puede agregar latencia a cada request | Baja | Supabase SSR middleware es eficiente (solo lee cookie de session). Medir LCP post-middleware |
| Onboarding del padre puede ser demasiado largo → abandono | Media | 3-4 pasos máximos. Permitir skipear paso de avatar (default). No pedir más datos de los necesarios para beta |
| Sesiones anónimas no se limpian automáticamente | Media | Cron job (Supabase Edge Function o pg_cron) que limpia anonymous sessions sin `student_id` después de 24 horas |

## Rollback Plan

1. **Auth roto**: deshabilitar Google OAuth temporalmente (Supabase Dashboard → Auth → Providers → Google → Disable). Email+password sigue funcionando.
2. **Onboarding roto**: agregar flag `SKIP_ONBOARDING` en .env que permite registro directo sin onboarding para testing.
3. **Student code login roto**: revertir al placeholder que muestra código hardcodeado para testing manual.
4. **En emergencia total**: `git revert` de los 4 commits de auth. Las rutas vuelven al estado pre-auth (solo placeholder). La DB schema (Phase 1.2) no se afecta.

## Dependencies

### Este change DEPENDE de
- **supabase-schema** (Phase 1.2) — necesita tablas `users`, `students`, `student_codes` con RLS policies funcionando. **BLOQUEANTE**: sin estas tablas, auth no funciona.
- **bootstrap-nextjs** (COMPLETADO) — proyecto Next.js levantado, Supabase SSR helpers, shadcn/ui init.

### Dependencia PARCIAL con
- **pedagogical-content** (Phase 1.3) — la pantalla welcome puede mostrar datos de islas/conceptos si están disponibles, pero funciona con datos hardcodeados si no lo están.

### Este change BLOQUEA (dependen de este)
- Mundo explorable Phaser (Phase 1.5) — necesita que el alumno pueda entrar a la app y llegar a la pantalla del mundo.
- Motor BKT (Phase 1.6) — necesita auth funcionando para saber quién es el alumno.
- Portal padre (Phase 1.10) — necesita que el padre tenga cuenta y sesión.
- Gamificación (Phase 1.8) — necesita student_id autenticado para award XP/coins.

## Success Criteria

- [ ] Padre puede registrarse con email+password y ver pantalla de onboarding
- [ ] Padre puede registrarse con Google OAuth y ver pantalla de onboarding
- [ ] Padre puede registrar hijo: nombre, fecha de nacimiento, grado, avatar
- [ ] Al completar onboarding, se genera un código de 6 chars único y se muestra al padre
- [ ] Alumno puede ingresar código de 6 chars y ser autenticado via `signInAnonymously()`
- [ ] Session del alumno se asocia correctamente al `student_id` correspondiente
- [ ] Padre NO puede acceder a rutas del alumno (`/world`, `/welcome`)
- [ ] Alumno NO puede acceder a rutas del padre (`/dashboard`)
- [ ] Logout funciona correctamente para ambos roles
- [ ] Middleware redirige correctamente: usuario no autenticado → `/login`, padre autenticado → `/dashboard`, alumno autenticado → `/world`
- [ ] Rutas protegidas devuelven 401/403 si no hay sesión
- [ ] Tests de integración cubren el flujo end-to-end: registro padre → registro hijo → login hijo → acceso al mundo
- [ ] Código de 6 chars excluye caracteres confusos (0/O, 1/I/l)
- [ ] `pnpm typecheck` sale limpio
- [ ] `pnpm test` pasa todos los tests de auth
- [ ] Convención de commits cumplida