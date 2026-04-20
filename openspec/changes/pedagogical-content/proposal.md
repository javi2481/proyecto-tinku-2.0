# Proposal: Producción de Contenido Pedagógico

## Intent

Producir el contenido pedagógico completo de Ola 1 para las 2 islas activas: **Isla de los Números** (20+ conceptos, 350+ ejercicios) y **Isla de los Amigos** (5 conceptos, 30+ ejercicios). Sin contenido, el producto es una cáscara vacía — el alumno no tiene qué aprender ni qué practicar. Afecta al **alumno** (recibe los ejercicios) y al **padre** (ve progreso en conceptos reales). El docente está fuera de scope (Ola 3).

## Scope

### In Scope
- Archivos YAML de catálogo: `seeds/islands.yml`, `seeds/regions.yml`, `seeds/concepts.yml` con toda la estructura de conceptos de Ola 1 (IDs, prereqs, difficulty_range, province_coin assignment, alignment con NAP)
- Archivo YAML de personajes: `seeds/characters.yml` con los 10 personajes del cast (Lucía, Mateo, Valentina, Joaquín, Camila, Tomás, Sofía, Benjamín, Martina, Lautaro) con metadata completa (nombre, edad, ciudad, intereses)
- Archivo YAML de contextos: `seeds/contexts.yml` con todos los contextos argentinos (kiosco, colectivo, plaza, escuela, feria, cancha, cumpleaños, etc.)
- Script `scripts/generate_exercises.ts`: toma un plan YAML por concepto y genera ejercicios en JSON vía OpenRouter (Claude Haiku 4.5), con prompt estructurado que incluye personaje + contexto + criterios de calidad
- Script `scripts/review_exercises.ts`: UI de terminal para revisar, editar, aprobar o rechazar ejercicios generados
- Script `scripts/seed_exercises.ts`: importa ejercicios aprobados a Supabase de forma idempotente (UPSERT por `exercise_id`)
- Ejercicios generados y revisados para todos los conceptos de 1° grado de Isla de los Números (15 conceptos → ~300 ejercicios)
- Ejercicios generados y revisados para conceptos de 2° y 3° grado parciales (~5 conceptos → ~60 ejercicios)
- Ejercicios generados y revisados para Isla de los Amigos (5 conceptos → ~35 ejercicios)
- Tests de calidad de ejercicios: validar schema JSON, verificar que distractores son plausibles, verificar alineación con difficulty_range, verificar contexto argentino coherente (no traducciones obvias)
- Seed SQL final con ejercicios aprobados para importar a Supabase

### Out of Scope
- H5P content packages (se generan aparte cuando el wrapper H5P esté listo en Phase 1.7)
- Prompts de Ari/subagentes (Phase 1.9 — `ari-agent-v1`)
- UI web de revisión de ejercicios (`/admin/review-exercises` — se agrega en Phase 1.7 o como admin tool)
- Ilustraciones y assets visuales de las islas (Phase 1.5 — `game-world-skeleton`)
- Motor BKT que consume estos ejercicios (Phase 1.6)
- Componentes React de ejercicios (Phase 1.7)
- Isla de las Palabras, Ciencias, Sociales, Arte (Olas futuras)

## Capabilities

### New Capabilities
- `pedagogical-catalog`: estructura YAML de islas, regiones, conceptos, personajes y contextos que define el modelo pedagógico de Ola 1. Es la fuente de verdad para el contenido disponible.
- `exercise-generation-pipeline`: scripts CLI para generar ejercicios vía LLM (OpenRouter/Claude Haiku), revisarlos por humanos, y seedearlos en Supabase. Incluye validación de calidad automatizada.

### Modified Capabilities
- None (no hay capabilities de contenido previas).

## Approach

Ejecutar en **5 commits**, aprovechando que este change es **paralelizable** con 1.2 (schema) y 1.4 (auth):

1. **`feat(content): add YAML catalogs — islands, regions, concepts, characters, contexts`** — Crear directorio `seeds/`, escribir los 5 archivos YAML con toda la metadata. Este commit NO depende de Supabase (los YAML son fuente de verdad offline).

2. **`feat(content): add exercise generation script via OpenRouter`** — Script `scripts/generate_exercises.ts` que lee un plan YAML por concepto, compone prompt con personaje+contexto, llama a OpenRouter (Claude Haiku 4.5), parsea respuesta JSON, valida contra schema, guarda resultados crudos en `seeds/exercises_raw/`.

3. **`feat(content): add exercise review pipeline and seed script`** — Script `scripts/review_exercises.ts` (CLI interactivo) para revisar ejercicios. Script `scripts/seed_exercises.ts` que importa ejercicios aprobados desde `seeds/exercises_approved/` a Supabase via UPSERT. Tests de validación de schema.

4. **`feat(content): generate and review exercises for Isla de los Números (1° grado)`** — Ejecutar pipeline para los 15 conceptos de 1° grado (Numeración, Operaciones, Espacio y Medida). Review manual, aprobación, placement en `seeds/exercises_approved/`. ~300 ejercicios aprobados.

5. **`feat(content): generate and review exercises for remaining concepts + Isla de los Amigos`** — Ejecutar pipeline para conceptos de 2°/3° grado parciales (~5 conceptos) + 5 conceptos socioemocionales de Isla de los Amigos. Review manual, aprobación. ~95 ejercicios aprobados. Seed SQL final consolidado.

### Decisiones arquitectónicas clave

- **YAML como fuente de verdad**, no la base de datos. Los YAML se versionan en Git. La DB se popúa desde los YAML via seed scripts. Si se necesita regenerar, se regenera desde los YAML.
- **Ejercicios generados por LLM, revisados por humano**. El pipeline genera ~30 ejercicios por concepto (más de los necesarios) para que el revisor descarte los peores y se quede con 20-25. Calidad > velocidad.
- **Clase de ejercicio (`exercise_type`)** determina si es custom React o H5P. El YAML de concepto especifica `type_distribution` (40% MCQ, 25% numeric_input, 15% drag-drop, 10% drag-match, 10% fill-blank para Números). La generación respeta esta distribución.
- **Personajes se rotan** en los ejercicios para que el alumno se familiarice con todos. El plan YAML especifica `characters_to_use` por concepto.
- **Contextos económicos usan números ficticios** (TINKU.md §XX y CONTENT.md §6.5). Los precios en ejercicios de kiosco/compras usan números redondos ficticios, no precios reales argentinos que se vuelven obsoletos.
- **Validación automatizada** en el pipeline: el script verifica que los distractores sean plausibles (no absurdamente obvios), que la respuesta correcta sea numéricamente correcta para matemática, y que el contexto sea coherente.
- **Seed idempotente**: el script de seed usa `exercise_id` como key para UPSERT. Re-ejecutar no duplica ejercicios.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `seeds/islands.yml` | New | Catálogo de islas (Números, Amigos) |
| `seeds/regions.yml` | New | Regiones dentro de cada isla |
| `seeds/concepts.yml` | New | ~25 conceptos con metadata completa (prereqs, difficulty, NAP alignment, province_coin) |
| `seeds/characters.yml` | New | 10 personajes del cast con metadata |
| `seeds/contexts.yml` | New | Contextos argentinos para ejercicios |
| `seeds/exercises_raw/` | New | Ejercicios generados por LLM, pendientes de revisión |
| `seeds/exercises_approved/` | New | Ejercicios revisados y aprobados, listos para seed |
| `scripts/generate_exercises.ts` | New | Pipeline de generación vía OpenRouter |
| `scripts/review_exercises.ts` | New | CLI de revisión humana |
| `scripts/seed_exercises.ts` | New | Importación idempotente a Supabase |
| `src/lib/exercise-validation.ts` | New | Funciones de validación de schema y calidad de ejercicios |
| `tests/unit/exercise-validation.test.ts` | New | Tests de validación |
| `prompts/exercise-generation.md` | New | Prompt template para generación de ejercicios |

## Risks

| Riesgo | Prob | Mitigación |
|--------|------|------------|
| Ejercicios generados por LLM tienen errores matemáticos sutiles | Alta | Revisión humana obligatoria. Validación automatizada de respuestas numéricas. Nunca confiar en LLM para aritmética sin verificación |
| Contenido socioemocional mal generado por LLM (tono inapropiado, simpleza) | Alta | MAYOR supervisión humana en Isla de los Amigos. CONTENT.md §4.5 exige cuidado especial. Revisar cada ejercicio socioemocional con lupa |
| Costo de generación con Claude Haiku | Media | ~350 ejercicios × ~30 ejercicios/concepto ext × 25 conceptos = ~750 calls. Estimado < USD 5 total. Budget cap en script |
| Formato JSON inconsistente del LLM | Media | Prompt estricto con ejemplo de output. Fallback: reintentar con temperatura 0 si falla el parseo. Manual override posible |
| Desbalance de personajes/contextos en ejercicios generados | Media | El plan YAML fuerza `characters_to_use` y `context_distribution`. Script de validación verifica balance |
| Dependencia en schema 1.2 para seed final | Media | Los YAML y generación se pueden hacer SIN schema (son archivos offline). Solo el seed SQL final necesita `supabase-schema` completado. Commit 4 y 5 se pueden hacer después de 1.2 |

## Rollback Plan

1. **YAML incorrecto**: editar el archivo y re-commit. Los YAML son la fuente de verdad, fáciles de corregir.
2. **Ejercicios mal generados**: descartar `seeds/exercises_raw/` y re-ejecutar el pipeline. Los archivos aprobados están en `seeds/exercises_approved/` separados.
3. **Seed SQL con datos malos**: `DELETE FROM exercises WHERE source = 'generated_v1'`; re-ejecutar seed script. UPSERT es idempotente.
4. **En emergencia total**: `git revert` de los commits de contenido. Los YAML no se pierden, se re-procesan.

## Dependencies

### Este change DEPENDE de
- **OpenRouter API key** configurada en `.env.local` (ya existe de v1).
- **CONTENT.md y TINKU.md** como especificación de contenido (ya existen en `docs/`).

### Dependencia PARCIAL con
- **supabase-schema** (Phase 1.2) — Los commits 1-3 (YAML, scripts, generación) NO necesitan el schema. Solo el commit 5 (seed SQL final) necesita las tablas `exercises`, `concepts`, `islands`, `regions` ya creadas. **Paralelizable**: generar y revisar contenido ANTES de que el schema esté listo.

### Este change BLOQUEA (dependen de este)
- Motor BKT (Phase 1.6) — necesita ejercicios en la DB para funcionar.
- Componentes de ejercicio (Phase 1.7) — necesita los tipos de ejercicio y datos de prueba.
- Mundo explorable Phaser (Phase 1.5) — necesita estructura de islas/regiones/conceptos para el mapa.

## Success Criteria

- [ ] `seeds/islands.yml` tiene 2 islas (Números, Amigos) con metadata completa
- [ ] `seeds/concepts.yml` tiene 25 conceptos (20+ Números, 5 Amigos) con IDs, prereqs, difficulty_range, province_coin
- [ ] `seeds/characters.yml` tiene 10 personajes con metadata completa
- [ ] `seeds/contexts.yml` tiene todos los contextos argentinos documentados en CONTENT.md
- [ ] Script `generate_exercises.ts` corrre sin errores para un concepto de prueba
- [ ] Script `seed_exercises.ts` importa ejercicios a Supabase sin duplicar (idempotente)
- [ ] Tests de validación pasan: schema JSON, distractores plausibles, respuesta correcta verificable
- [ ] **350+ ejercicios aprobados** para Isla de los Números (all 1° grade concepts + partial 2°/3°)
- [ ] **30+ ejercicios aprobados** para Isla de los Amigos (5 conceptos)
- [ ] Distribución de tipos de ejercicio respeta lo especificado en CONTENT.md §3.6
- [ ] Distribución de personajes y contextos es balanceada (ningún personaje > 15% del total)
- [ ] Todo el contenido está en español rioplatense con voseo (no castellano neutro)
- [ ] Convención de commits cumplida