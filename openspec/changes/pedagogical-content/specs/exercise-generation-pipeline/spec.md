# Delta Spec: exercise-generation-pipeline (ADDED)

## Capability
`exercise-generation-pipeline` — Scripts CLI para generar ejercicios vía LLM (OpenRouter/Claude Haiku), revisarlos por humanos, y seedearlos en Supabase. Incluye validación automatizada de calidad.

## ADDED Requirements

### REQ-EG-001: Exercise Generation Script

**RFC 2119**: MUST

El script `scripts/generate_exercises.ts` DEBE tomar un plan YAML por concepto y generar ejercicios en JSON vía OpenRouter con prompt estructurado.

#### Scenario: Generación de ejercicios para un concepto

- **Given** un archivo plan YAML para un concepto (ej: `seeds/concepts/num-001.yml`)
- **When** se ejecuta `npx tsx scripts/generate_exercises.ts --concept <concept_id>`
- **Then** el script MUST leer el plan YAML (personajes, contextos, difficulty_range, type_distribution)
- **And** MUST componer un prompt que incluye: personaje del cast, contexto argentino, criterios de calidad
- **And** MUST llamar a OpenRouter (Claude Haiku 4.5) vía API
- **And** MUST parsear la respuesta JSON
- **And** MUST guardar resultados crudos en `seeds/exercises_raw/<concept_id>/`

#### Scenario: Prompt respeta type_distribution del concepto

- **Given** un concepto con `type_distribution: { mcq: 0.4, numeric_input: 0.25, ... }`
- **When** se genera el lote de ejercicios para ese concepto
- **Then** el prompt MUST instruir al LLM para generar ejercicios respetando la distribución de tipos
- **And** el ejercicio generado MUST tener un campo `exercise_type` coincidente con el tipo solicitado

#### Scenario: Manejo de error en parseo JSON del LLM

- **Given** una respuesta del LLM que no es JSON válido
- **When** el script intenta parsear la respuesta
- **Then** el script MUST reintentar con temperatura 0 (fallback)
- **And** si el reintento falla, MUST loguear el error y continuar con el siguiente concepto (no abortar todo el batch)

---

### REQ-EG-002: Prompt Template for Generation

**RFC 2119**: MUST

El archivo `prompts/exercise-generation.md` DEBE contener el template de prompt para generación de ejercicios.

#### Scenario: Template existe y es completo

- **Given** el archivo `prompts/exercise-generation.md`
- **When** se lee el prompt
- **Then** MUST contener placeholders para: `{character_name}`, `{character_age}`, `{context_name}`, `{context_description}`, `{concept_name}`, `{difficulty_range}`, `{exercise_type}`, `{num_exercises}`
- **And** MUST instruir al LLM para responder en español rioplatense con voseo
- **And** MUST instruir al LLM para NO usar precios reales argentinos inctxtuales

---

### REQ-EG-003: Exercise Review Pipeline

**RFC 2119**: MUST

El script `scripts/review_exercises.ts` DEBE proveer una UI de terminal para revisar, editar, aprobar o rechazar ejercicios generados.

#### Scenario: Revisión interactiva de ejercicios

- **Given** ejercicios crudos en `seeds/exercises_raw/<concept_id>/`
- **When** se ejecuta `npx tsx scripts/review_exercises.ts --concept <concept_id>`
- **Then** el script MUST mostrar cada ejercicio en formato legible en terminal
- **And** MUST ofrecer opciones: aprobar, editar, rechazar, skip
- **And** los ejercicios aprobados MUST guardarse en `seeds/exercises_approved/<concept_id>/`
- **And** los rechazados MUST guardarse en `seeds/exercises_rejected/` con razón de rechazo

---

### REQ-EG-004: Exercise Seed Script

**RFC 2119**: MUST

El script `scripts/seed_exercises.ts` DEBE importar ejercicios aprobados a Supabase de forma idempotente usando UPSERT.

#### Scenario: Importación idempotente

- **Given** ejercicios aprobados en `seeds/exercises_approved/`
- **When** se ejecuta `npx tsx scripts/seed_exercises.ts`
- **Then** el script MUST importar cada ejercicio usando UPSERT por `exercise_id`
- **And** re-ejecutar el script MUST NO duplicar ejercicios existentes
- **And** el script MUST validar que los `concept_id`, `region_id`, `island_id` referenciados existen en la DB antes de insertar

#### Scenario: Seed falla gracefully si schema no está listo

- **Given** las tablas de catálogo no existen en la DB
- **When** se intenta ejecutar `seed_exercises.ts`
- **Then** el script MUST salir con error explicito: "Tablas de catálogo no encontradas. Ejecutar migraciones primero."
- **And** MUST NO insertar datos parciales

---

### REQ-EG-005: Exercise Validation

**RFC 2119**: MUST

El módulo `src/lib/exercise-validation.ts` DEBE validar la calidad de ejercicios generados.

#### Scenario: Validación de schema JSON

- **Given** un ejercicio generado como JSON
- **When** se ejecuta la validación de schema
- **Then** MUST verificar que contiene campos obligatorios: `exercise_id`, `exercise_type`, `concept_id`, `prompt`, `correct_answer`, `distractors` (si aplica)
- **And** MUST verificar que `exercise_type` es un valor válido del enum
- **And** ejercicios inválidos MUST ser rechazados con mensaje descriptivo

#### Scenario: Validación de distractores plausibles

- **Given** un ejercicio MCQ con distractores
- **When** se ejecuta la validación de calidad
- **Then** MUST verificar que los distractores NO son trivialmente distinguibles de la respuesta correcta
- **And** MUST verificar que no hay distractores duplicados entre sí

#### Scenario: Validación de respuesta correcta numérica

- **Given** un ejercicio de tipo `numeric_input` con `correct_answer`
- **When** se ejecuta la validación
- **Then** MUST verificar que `correct_answer` es numéricamente correcto (para ejercicios de matemática)
- **And** MUST verificar que el prompt contiene la operación que genera esa respuesta

#### Scenario: Validación de contexto argentino coherente

- **Given** un ejercicio con campo `context_id`
- **When** se ejecuta la validación de contexto
- **Then** MUST verificar que el texto del ejercicio es coherente con el contexto argentino declarado
- **And** MUST detectar traducciones obvias de contextos genéricos (ej: "supermarket" → "supermercado" sin adaptación local)

---

### REQ-EG-006: Content Volume Targets

**RFC 2119**: MUST

El pipeline DEBE producir los siguientes volúmenes mínimos de ejercicios aprobados.

#### Scenario: Isla de los Números — 350+ ejercicios

- **Given** el pipeline de generación y revisión completado para Isla de los Números
- **When** se cuenta el total de ejercicios aprobados en `seeds/exercises_approved/`
- **Then** MUST existir al menos 350 ejercicios para conceptos de Números
- **And** MUST cubrir los 15 conceptos de 1° grado + ~5 conceptos de 2°/3° grado parciales

#### Scenario: Isla de los Amigos — 30+ ejercicios

- **Given** el pipeline completado para Isla de los Amigos
- **When** se cuenta el total de ejercicios aprobados
- **Then** MUST existir al menos 30 ejercicios para los 5 conceptos socioemocionales

#### Scenario: Cobertura de tipos de ejercicio

- **Given** todos los ejercicios aprobados
- **When** se agrupan por `exercise_type`
- **Then** cada tipo (MCQ, NumericInput, H5P fill-blank, H5P drag-drop, H5P match, SocioemotionalDilemma) MUST tener al menos 10 ejercicios representativos
- **And** la distribución general de tipos MUST aproximarse a lo especificado en `seeds/concepts.yml`

#### Scenario: Balance de personajes y contextos

- **Given** todos los ejercicios aprobados
- **When** se analiza la distribución de personajes y contextos
- **Then** ningún personaje MUST aparecer en más del 15% del total de ejercicios
- **And** cada contexto MUST aparecer en al menos 3 ejercicios diferentes