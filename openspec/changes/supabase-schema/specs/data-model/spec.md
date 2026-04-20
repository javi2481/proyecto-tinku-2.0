# Delta Spec: data-model (ADDED)

## Capability
`data-model` — Schema relacional completo en PostgreSQL vía Supabase con 16 tablas, RLS policies, triggers, índices, seeds de catálogo y tipos TypeScript generados. Fuente de verdad para toda interacción con datos del alumno, padre y catálogo pedagógico.

## ADDED Requirements

### REQ-DM-001: Schema Migrations

**RFC 2119**: MUST

El sistema DEBE proveer 3 migraciones SQL idempotentes que creen las 16 tablas en orden de dependencia.

- **Given** un proyecto Supabase limpio (solo `auth.users`)
- **When** se ejecutan las 3 migraciones secuencialmente (`supabase db push`)
- **Then** MUST existir las 16 tablas: `users`, `students`, `student_codes`, `islands`, `regions`, `concepts`, `concept_prerequisites`, `exercises`, `student_concept_state`, `student_exercise_attempts`, `student_levels`, `student_coins`, `student_ship_parts`, `missions`, `student_missions`, `ari_conversations`, `app_events`
- **And** cada migración MUST ser idempotente (re-ejecutar no falla ni duplica)

#### Scenario: Migración 001 — tablas de identidad

- **Given** proyecto Supabase sin tablas custom
- **When** se aplica migración `001_users_students.sql`
- **Then** MUST crear tablas: `users`, `students`, `student_codes`
- **And** `users.id` MUST tener FK a `auth.users.id`
- **And** `users.role` MUST ser enum `user_role` con valores `parent | admin`
- **And** `student_codes.code` MUST ser UNIQUE con constraint de 6 caracteres alfanuméricos (charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)

#### Scenario: Migración 002 — tablas de catálogo

- **Given** migración 001 aplicada
- **When** se aplica migración `002_catalog.sql`
- **Then** MUST crear tablas: `islands`, `regions`, `concepts`, `concept_prerequisites`, `exercises`
- **And** `exercises.exercise_type` MUST ser enum con valores: `mcq | numeric_input | h5p_fill_blank | h5p_drag_drop | h5p_match | socioemotional_dilemma`
- **And** todas las FKs MUST ser válidas (ej: `concepts.region_id → regions.id`, `regions.island_id → islands.id`)

#### Scenario: Migración 003 — tablas de estado y analytics

- **Given** migraciones 001 y 002 aplicadas
- **When** se aplica migración `003_student_state.sql`
- **Then** MUST crear tablas: `student_concept_state`, `student_exercise_attempts`, `student_levels`, `student_coins`, `student_ship_parts`, `missions`, `student_missions`, `ari_conversations`, `app_events`
- **And** `student_concept_state` MUST incluir columnas: `p_known`, `attempts`, `last_seen`, `learn_rate`, `slip`, `guess` (campos del motor adaptativo BKT)
- **And** `app_events` MUST tener columnas: `user_id`, `event_type`, `payload JSONB`, `created_at`

---

### REQ-DM-002: Row Level Security Policies

**RFC 2119**: MUST

Todas las tablas con datos de alumno o estudiante DEBEN tener RLS habilitado con policies que implementan: padre ve solo datos de sus hijos, alumno ve solo sus propios datos, admin ve todo.

- **Given** las 16 tablas creadas con RLS habilitado
- **When** un padre autenticado consulta `students`
- **Then** solo MUST ver filas donde `students.parent_id` coincide con su `auth.uid()`

#### Scenario: Padre ve solo sus hijos

- **Given** padre A con 2 hijos y padre B con 1 hijo en la DB
- **When** padre A consulta `SELECT * FROM students`
- **Then** MUST retornar exactamente 2 filas (sus hijos)
- **And** MUST NO retornar filas de hijos de padre B

#### Scenario: Alumno ve solo sus propios datos

- **Given** alumno X y alumno Y en la DB
- **When** alumno X consulta `student_concept_state`, `student_exercise_attempts`, `student_levels`, `student_coins`
- **Then** cada query MUST retornar solo filas donde `student_id` coincide con el `student_id` del alumno X
- **And** MUST NO retornar datos del alumno Y

#### Scenario: Admin ve todos los datos

- **Given** un usuario con role `admin`
- **When** el admin consulta cualquier tabla con RLS
- **Then** MUST poder ver todas las filas sin restricción

#### Scenario: Estudiante anónimo no ve datos de otros

- **Given** un estudiante autenticado via `signInAnonymously()` con `student_id` asociado
- **When** ese estudiante consulta `student_exercise_attempts`
- **Then** solo MUST ver sus propios attempts (filtrado por su `student_id`)

---

### REQ-DM-003: Database Triggers

**RFC 2119**: MUST

El sistema DEBE tener triggers automáticos para `updated_at` y creación de registros dependientes.

#### Scenario: Trigger updated_at

- **Given** cualquier tabla con columna `updated_at`
- **When** se ejecuta un UPDATE sobre una fila
- **Then** la columna `updated_at` MUST actualizarse automáticamente a `now()`

#### Scenario: Trigger de creación de student_levels

- **Given** migración 003 aplicada con trigger activo
- **When** se INSERT una fila en `students`
- **Then** MUST crearse automáticamente una fila en `student_levels` con el `student_id` correspondiente y valores iniciales por defecto

#### Scenario: Trigger de sincronización auth.users → public.users

- **Given** trigger activo en `auth.users`
- **When** se crea un nuevo usuario en `auth.users` (vía signUp)
- **Then** MUST crearse automáticamente una fila en `public.users` con el mismo `id` y `role` por defecto `parent`

---

### REQ-DM-004: Catalog Seeds

**RFC 2119**: MUST

Los seeds de catálogo DEBEN insertar datos de islas, regiones y conceptos (estructura, sin ejercicios) y ser idempotentes.

#### Scenario: Seeds de islas insertados

- **Given** migración 002 aplicada
- **When** se ejecuta el seed de islas
- **Then** MUST existir exactamente 2 islas: "Isla de los Números" e "Isla de los Amigos"
- **And** re-ejecutar el seed MUST NO duplicar filas (idempotente via UPSERT)

#### Scenario: Seeds de regiones insertados

- **Given** seed de islas ejecutado
- **When** se ejecuta el seed de regiones
- **Then** MUST existir 6 regiones distribuidas entre las 2 islas (mínimo 2 por isla)

#### Scenario: Seeds de conceptos insertados

- **Given** seed de regiones ejecutado
- **When** se ejecuta el seed de conceptos
- **Then** MUST existir 20+ conceptos para Isla de los Números y 5 conceptos para Isla de los Amigos
- **And** cada concepto MUST tener: `id`, `name`, `region_id`, `difficulty_range`, `province_coin`, `nap_alignment`
- **And** las prerequisiciones (`concept_prerequisites`) MUST ser consistentes (sin ciclos)

---

### REQ-DM-005: TypeScript Types Generated

**RFC 2119**: MUST

El proyecto DEBE tener tipos TypeScript generados desde el schema via `supabase gen types`.

#### Scenario: Tipos generados existen y compilan

- **Given** las 3 migraciones aplicadas
- **When** se ejecuta `supabase gen types`
- **Then** MUST existir `src/lib/supabase/database.types.ts` con tipos para las 16 tablas
- **And** `pnpm typecheck` MUST salir limpio (sin errores TS)

#### Scenario: Helpers usan tipos generados

- **Given** `database.types.ts` generado
- **When** se inspecciona `src/lib/supabase/`
- **Then** los helpers de query MUST usar los tipos generados en vez de `any`
- **And** las funciones tipadas MUST exportarse desde `src/lib/supabase/`

---

### REQ-DM-006: RLS Isolation Tests

**RFC 2119**: MUST

El proyecto DEBE tener tests de integración que verifican aislamiento de datos entre roles.

#### Scenario: Test suite de RLS existe y pasa

- **Given** las 3 migraciones y RLS policies aplicadas
- **When** se ejecuta `pnpm test` incluyendo los tests de `tests/integration/rls/`
- **Then** MUST haber tests que verifican: padre A no ve datos de hijos de padre B
- **And** MUST haber tests que verifican: alumno X no ve datos de alumno Y
- **And** MUST haber tests que verifican: admin ve todos los datos
- **And** todos los tests MUST pasar

#### Scenario: Tests de integridad referencial

- **Given** las migraciones aplicadas
- **When** se ejecutan los tests de `tests/integration/schema/`
- **Then** MUST haber tests que verifican: FK constraints impiden inserts huérfanos
- **And** MUST haber tests que verifican: UNIQUE constraints en `student_codes.code`
- **And** MUST haber tests que verifican: ENUM types aceptan solo valores válidos