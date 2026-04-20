# Proposal: Supabase Schema Tri-lateral con RLS

## Intent

Desplegar el schema completo de base de datos en Supabase que soporta el modelo tri-lateral (alumno/padre/docente) de Tinku 2.0. Sin estas tablas y policies, **no existe auth, no existe motor adaptativo, no existe gamificación, no existe Ari**. Es el cimiento de datos sobre el cual se construye toda la aplicación. Afecta directamente a los **3 usuarios**: alumno (sus datos de progreso, monedas, nivel), padre (ver datos de sus hijos), docente (Ola 3, pero el schema ya lo contempla).

## Scope

### In Scope
- Migración SQL completa con 16 tablas: `users`, `students`, `student_codes`, `islands`, `regions`, `concepts`, `concept_prerequisites`, `exercises`, `student_concept_state`, `student_exercise_attempts`, `student_levels`, `student_coins`, `student_ship_parts`, `missions`, `student_missions`, `ari_conversations`, `app_events`
- RLS habilitado en TODAS las tablas con datos de alumno desde la migración inicial (principio TINKU.md §12.3)
- Policies que implementan: padre ve solo a sus hijos, alumno ve solo sus propios datos, admin ve todo
- Seeds de catálogo: 2 islas (Números, Amigos), regiones, conceptos iniciales (estructura, sin ejercicios aún — eso es Phase 1.3)
- Índices optimizados para queries frecuentes (estado del alumno por concepto, ejercicios disponibles, misiones activas)
- Helpers TypeScript generados (`supabase gen types`) para tipado end-to-end
- Tests de RLS que verifican aislamiento de datos (padre A no ve datos de hijos de padre B, alumno no ve datos de otro alumno)
- Trigger automáticos: `updated_at`,计算 de XP al insertar attempt, creación de `student_levels` row al insertar `student`

### Out of Scope
- Seeds de ejercicios (Phase 1.3 — `pedagogical-content`)
- Seeds de personajes y contextos (Phase 1.3)
- Implementación de Server Actions que usan estas tablas (Phase 1.4+)
- UI de auth o onboarding (Phase 1.4 — `auth-onboarding`)
- Motor BKT simplificado (`lib/adaptive/engine.ts`) (Phase 1.6)
- Trigger de XP y gamificación (Phase 1.8)
- Integración con Ari (Phase 1.9)
- Portal padre (Phase 1.10)
- Tablas de `docente` y relación `teacher_students` (Ola 3)
- Stripe/MercadoPago o tablas de pagos (Ola 2)
- Flutter/Runtime de H5P (Phase 1.7)

## Capabilities

### New Capabilities
- `data-model`: schema relacional completo en PostgreSQL vía Supabase, con RLS, triggers, índices y seeds de catálogo. Incluye helpers TypeScript generados. Es la fuente de verdad para toda interacción con datos del alumno, padre y catálogo pedagógico.

### Modified Capabilities
- None (no hay capabilities previas de datos — el bootstrap no tocó DB).

## Approach

Ejecutar en **4 commits** secuenciales, cada uno dejando la app compilable y testeable:

1. **`feat(schema): add core tables — users, students, student_codes`** — Tablas de identidad. Migración 001. Incluye `users` con FK a `auth.users`, `students` con FK a `users(parent_id)`, `student_codes` con UNIQUE constraint de 6 chars, RLS policies. Tests de RLS para aislamiento padre↔hijo.

2. **`feat(schema): add catalog tables — islands, regions, concepts, exercises, concept_prerequisites`** — Tablas de catálogo pedagógico. Migración 002. Incluye seeds de 2 islas, 6 regiones, y estructura de conceptos (nombres e IDs, sin ejercicios). Tests de integridad referencial.

3. **`feat(schema): add student state tables — concept_state, attempts, levels, coins, ship_parts, missions, student_missions, ari_conversations, app_events`** — Tablas de estado del alumno y analytics. Migración 003. RLS policies para cada una. Índices. Triggers (`updated_at`, creación de `student_levels` al insertar `student`). Tests de RLS para aislamiento alumno↔alumno.

4. **`feat(schema): generate TypeScript helpers and add RLS integration tests`** — `supabase gen types` para generar tipos, helpers tipados en `src/lib/supabase/`, test suite de integración que verifica aislamiento completo entre roles. Actualizar `src/lib/supabase/` para usar los tipos generados.

### Decisiones arquitectónicas clave

- **`users` extiende `auth.users`** (no reemplaza). FK `users.id → auth.users.id`. Esto permite usar Supabase Auth nativo y agregar campos de perfil (nombre, rol, avatar preference).
- **`student_codes` es tabla separada** de `students`. Un código puede regenerarse sin tocar el alumno. Código es UNIQUE de 6 chars alfanuméricos (excluyendo caracteres confusos: 0/O, 1/l/I).
- **`student_concept_state` es el core del motor adaptativo** (TINKU.md §12.6). Contiene `p_known`, `attempts`, `last_seen`, `learn_rate`, `slip`, `guess`. El motor BKT simplificado (Phase 1.6) lee y escribe esta tabla.
- **No hay `teacher` role en Ola 1**. La tabla `users` tiene campo `role` con valores `parent | admin`. Docente se agrega en Ola 3.
- **`app_events` es genérica**. Columnas: `user_id`, `event_type`, `payload JSONB`, `created_at`. Reemplaza necesidad de PostHog para analytics internos básicos.
- **Enum types en PostgreSQL** para: `user_role`, `island_id`, `concept_mastery_status`, `exercise_type`, `mission_type`, `mission_status`. Benefits: type safety en DB, readable queries.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `supabase/migrations/` | New | 3 archivos SQL: `001_users_students.sql`, `002_catalog.sql`, `003_student_state.sql` |
| `supabase/seeds/` | New | `seed_islands.sql`, `seed_regions.sql`, `seed_concepts.sql` (estructura sin ejercicios) |
| `src/lib/supabase/` | Modified | Reemplazar tipos `any` por tipos generados, agregar helper functions tipadas |
| `src/lib/supabase/database.types.ts` | New | Tipos TypeScript auto-generados desde schema |
| `tests/integration/rls/` | New | Suite de tests de integración verificando RLS policies (padre→sus hijos, alumno→sus datos, admin→todo) |
| `tests/integration/schema/` | New | Tests de integridad referencial y constraints |
| `docs/` | Modified | Actualizar referencia al schema en README o docs de desarrollo |

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| RLS policies demasiado restrictivas rompen queries legítimas | Media | Escribir tests de integración ANTES de cerrar cada migración. Testear cada role (parent, student anon, admin) contra cada tabla |
| Supabase free tier limits (500 MB DB, 50K monthly active users) | Baja | Ola 1 beta cerrada con 10-20 chicos. Monitorear tamaño. Migración `app_events` puede crecer rápido → agregar retention policy (DELETE older than 90 días) |
| `auth.users` + `public.users` sync issues | Media | Trigger on `auth.users` INSERT que crea row en `public.users`. Testing este trigger explícitamente |
| Student code collision (6 chars = ~2B combinaciones, pero `0/O` exclusión reduce) | Baja | UNIQUE constraint + retry automático en generación. Verificar que el charset de generación coincide con el esquema |
| TypeScript types generados se desincronizan con schema | Media | Agregar paso `supabase gen types` al pipeline de desarrollo. Documentar en README |
| Joins complejos con RLS pueden ser lentos | Baja | Índices en todas las columnas FK. Supabase RLS usa internals de PG, performance es razonable si hay índices |

## Rollback Plan

1. **Por migración**: `supabase migration repair <version>` para marcar como reverted, luego DROP CASCADE de las tablas de esa migración.
2. **Si el schema completo falla**: `supabase db reset` vuelve al estado pre-migraciones (solo `auth.users`). Los seeds son idempotentes.
3. **Tipo TypeScript desincronizado**: `supabase gen types` regenera desde el schema actual.
4. **En emergencia**: Revertir 4 commits con `git reset --hard` al hash pre-schema. Las migraciones se re-aplican limpio con `supabase db push`.

## Dependencies

### Este change DEPENDE de
- **bootstrap-nextjs** (COMPLETADO) — proyecto Next.js levantado, Supabase SSR helpers instalados, Vitest configurado.
- **Supabase project activo** con CLI configurado (ya existe: project ref `rihbkanevxlvisanlvsn`).

### Este change BLOQUEA (dependen de este)
- `pedagogical-content` (Phase 1.3) — necesita tablas `islands`, `regions`, `concepts`, `exercises` para seedear contenido.
- `auth-onboarding` (Phase 1.4) — necesita tablas `users`, `students`, `student_codes` y RLS policies.
- Motor BKT (Phase 1.6) — necesita `student_concept_state`, `student_exercise_attempts`.
- Gamificación (Phase 1.8) — necesita `student_levels`, `student_coins`, `student_ship_parts`, `missions`, `student_missions`.
- Ari (Phase 1.9) — necesita `ari_conversations`.
- Portal padre (Phase 1.10) — necesita datos del alumno con RLS para que el padre pueda leerlos.

## Success Criteria

- [ ] 3 migraciones aplicadas limpiamente en Supabase dev (`supabase db push` exitoso)
- [ ] 16 tablas creadas con tipos de datos correctos, FK, constraints, e índices
- [ ] RLS habilitado en todas las tablas con datos de alumno/estudiante
- [ ] Policies permiten: padre ve SOLO datos de sus hijos, alumno ve SOLO sus propios datos, admin ve todo
- [ ] Tests de RLS verifican aislamiento: padre A NO puede ver datos de hijos de padre B, alumno X NO puede ver datos de alumno Y
- [ ] Seeds de catálogo insertados: 2 islas, 6 regiones, estructura de concepts (sin ejercicios)
- [ ] Tipos TypeScript generados con `supabase gen types` — `src/lib/supabase/database.types.ts` existe y compila
- [ ] `pnpm typecheck` sale limpio (tsc --noEmit)
- [ ] `pnpm test` incluye y pasa tests de integración de schema
- [ ] Triggers funcionan: `updated_at` auto-set, `student_levels` row se crea al insertar `students`
- [ ] Convención de commits cumplida (conventional commits, sin AI attribution)