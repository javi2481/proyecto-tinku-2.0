# Spec: adaptive-engine (ADDED)

## Capability
`adaptive-engine` — motor BKT simplificado con funciones de cálculo de p_known, selección de ejercicios por ZDP, cálculo de XP, Server Action `attemptExercise` que orquesta el flujo completo. Todo estado pedagógico vive en Supabase (NEVER localStorage).

## ADDED Requirements

### REQ-BKT-01: BKT Simplified Parameter Model

El motor MUST implementar BKT simplificado con 3 parámetros por concepto: `learn_rate` (default 0.1), `slip` (default 0.05), `guess` (default 0.2). P(L₀) se inicializa en 0.0 para conceptos nuevos sin intentos previos. Los parámetros se almacenan en columna JSONB de la tabla `concepts`.

#### Scenario: Valores default para concepto nuevo

- **Given** un concepto sin parámetros BKT customizados
- **When** se leen los parámetros del concepto
- **Then** MUST devolver `{ learn_rate: 0.1, slip: 0.05, guess: 0.2 }`

---

### REQ-BKT-02: getCurrentPKnown

`getCurrentPKnown(studentId, conceptId)` MUST leer `p_known` de `student_concept_state` en Supabase. Si no existe registro, MUST retornar 0.0.

#### Scenario: Alumno nuevo sin intentos previos

- **Given** un `studentId` + `conceptId` sin registro en `student_concept_state`
- **When** se llama `getCurrentPKnown(studentId, conceptId)`
- **Then** MUST retornar `0.0`

#### Scenario: Alumno con progreso existente

- **Given** un `studentId` + `conceptId` con `p_known = 0.65` en Supabase
- **When** se llama `getCurrentPKnown(studentId, conceptId)`
- **Then** MUST retornar `0.65`

---

### REQ-BKT-03: updatePKnown

`updatePKnown(studentId, conceptId, wasCorrect, difficulty)` MUST actualizar `p_known` usando la fórmula BKT simplificada. Si el resultado es `p_known ≥ 0.85`, MUST marcar `status: 'mastered'`.

#### Scenario: Acierto eleva p_known

- **Given** `p_known = 0.5`, `learn_rate = 0.1`
- **When** `wasCorrect = true`
- **Then** el nuevo `p_known` MUST ser mayor que 0.5
- **And** MUST actualizar el registro en Supabase

#### Scenario: Error baja p_known

- **Given** `p_known = 0.6`, `slip = 0.05`, `guess = 0.2`
- **When** `wasCorrect = false`
- **Then** el nuevo `p_known` MUST ser menor que 0.6

#### Scenario: Umbral de dominio alcanzado

- **Given** `p_known` calculado ≥ 0.85 tras actualizar
- **When** se completa `updatePKnown`
- **Then** `mastered` en el resultado MUST ser `true`
- **And** `status` en `student_concept_state` MUST ser `'mastered'`

---

### REQ-BKT-04: pickNextExercise

`pickNextExercise(studentId, conceptId)` MUST seleccionar un ejercicio de dificultad apropiada según la banda de `p_known` del alumno: `< 0.3 → easy`, `0.3–0.7 → medium`, `0.7–0.85 → hard`. Si `p_known ≥ 0.85`, retorna `null` (concepto dominado).

#### Scenario: Selección por banda ZDP

- **Given** `p_known = 0.4` (banda medium)
- **When** se llama `pickNextExercise`
- **Then** MUST seleccionar un ejercicio de dificultad `medium` para ese concepto

#### Scenario: No repetir ejercicio inmediato

- **Given** el último ejercicio respondido fue `ex-123`
- **When** se llama `pickNextExercise`
- **Then** el ejercicio seleccionado MUST NO ser `ex-123`
- **And** si no hay alternativas, MAY retornar el mismo como fallback

#### Scenario: Concepto dominado → sin más ejercicios

- **Given** `p_known ≥ 0.85`
- **When** se llama `pickNextExercise`
- **Then** MUST retornar `null`

#### Scenario: Sin ejercicios en la dificultad target

- **Given** `p_known = 0.75` (banda hard) pero no existen ejercicios hard para el concepto
- **When** se llama `pickNextExercise`
- **Then** MUST seleccionar un ejercicio de la banda más cercana disponible (medium como fallback)

---

### REQ-BKT-05: computeXp

`computeXp(difficulty, attemptNumber, usedHint)` MUST calcular XP según reglas: primer intento correcto = 10 XP × multiplicador de dificultad (easy: 1x, medium: 1.5x, hard: 2x). Segundo intento = ×0.5. Con hint = ×0.33. Dominio de concepto = bonus 50 XP.

#### Scenario: XP primer intento sin hint

- **Given** `difficulty = 'medium'`, `attemptNumber = 1`, `usedHint = false`
- **When** se llama `computeXp`
- **Then** MUST retornar `15` (10 × 1.5)

#### Scenario: XP segundo intento

- **Given** `difficulty = 'easy'`, `attemptNumber = 2`, `usedHint = false`
- **When** se llama `computeXp`
- **Then** MUST retornar `5` (10 × 1 × 0.5)

#### Scenario: XP con hint

- **Given** `difficulty = 'hard'`, `attemptNumber = 1`, `usedHint = true`
- **When** se llama `computeXp`
- **Then** MUST retornar `6.6` (10 × 2 × 0.33)

---

### REQ-BKT-06: attemptExercise Server Action

`attemptExercise(exerciseId, answer)` MUST orquestar el flujo completo: validar respuesta → updatePKnown → computeXp → registrar intento → pickNextExercise → devolver resultado. Es una Server Action de Next.js (NO una route API).

#### Scenario: Flujo completo de acierto

- **Given** un alumno autenticado en un ejercicio
- **When** se llama `attemptExercise` con respuesta correcta
- **Then** MUST retornar `{ correct: true, xpEarned, pKnown, mastered, nextExercise }`

#### Scenario: Flujo completo de error

- **Given** un alumno autenticado en un ejercicio
- **When** se llama `attemptExercise` con respuesta incorrecta
- **Then** MUST retornar `{ correct: false, xpEarned: 0, pKnown, mastered: false, nextExercise }`

#### Scenario: Alumno no autenticado

- **Given** una petición sin sesión válida
- **When** se llama `attemptExercise`
- **Then** MUST lanzar error de autenticación
- **And** NO MUST escribir en Supabase

---

### REQ-BKT-07: Persistence in Supabase Only

Todo estado pedagógico MUST persistirse exclusivamente en Supabase. NEVER MUST usarse `localStorage`, `sessionStorage`, ni ninguna forma de almacenamiento browser-side para estado de aprendizaje.

#### Scenario: No localStorage para p_known

- **Given** cualquier función del engine
- **When** se ejecuta `getCurrentPKnown` o `updatePKnown`
- **Then** MUST leer/escribir exclusivamente de Supabase
- **And** MUST NO invocar `localStorage` ni `sessionStorage`

---

### REQ-BKT-08: Edge Cases — Forgetting and Absence

El motor MUST manejar alumnos que regresan tras ausencia larga (decay de `p_known`) y conceptos dominados que se olvidan (forgetting factor).

#### Scenario: Ausencia larga aplica decay

- **Given** un alumno cuyo `last_seen` en un concepto es > 30 días atrás
- **When** se llama `getCurrentPKnown`
- **Then** MUST aplicar un factor de decaimiento que reduzca `p_known` proporcionalmente al tiempo de ausencia

#### Scenario: Concepto dominado con errores repetidos baja a en_progreso

- **Given** un concepto con `status: 'mastered'`
- **When** el alumno falla 3+ veces seguidas
- **Then** `p_known` MUST bajar a 0.7 y `status` MUST cambiar a `'in_progress'`