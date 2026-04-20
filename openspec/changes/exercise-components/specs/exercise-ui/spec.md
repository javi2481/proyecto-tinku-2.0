# Spec: exercise-ui (ADDED)

## Capability
`exercise-ui` — componentes de ejercicio pedagógico (MCQ, NumericInput, H5P, SocioemotionalDilemma), orquestador de sesión `<ExerciseSession />`, sistema de feedback `<ExerciseFeedback />`, integración con BKT engine via Server Actions, UX infantil calibrada (Andika, tap targets, colores no-rojo), feedback auditivo con `use-sound`, accesibilidad y `prefers-reduced-motion`.

## ADDED Requirements

### REQ-EX-01: ExerciseSession Orchestrator

`<ExerciseSession />` MUST recibir `conceptId` como prop, gestionar el flujo completo del ejercicio (cargar → renderizar → responder → feedback → próximo), y comunicarse con el BKT engine via `attemptExercise` Server Action. Es un `"use client"` component.

#### Scenario: Flujo completo de ejercicio

- **Given** un alumno en sesión de ejercicios con `conceptId`
- **When** `<ExerciseSession />` se monta
- **Then** MUST cargar el primer ejercicio via BKT engine
- **And** renderizar el componente de ejercicio correspondiente al tipo (`mcq`, `numeric_input`, `h5p_*`, `socioemotional_dilemma`)

#### Scenario: Respuesta correcta → feedback → próximo

- **Given** el alumno responde correctamente
- **When** se completa el ejercicio
- **Then** MUST llamar `attemptExercise` con la respuesta
- **And** MUST renderizar `<ExerciseFeedback />` con el resultado
- **And** tras 1.5s mínimo (celebración), MUST cargar y renderizar el próximo ejercicio

---

### REQ-EX-02: MCQExercise Component

`<MCQExercise />` MUST renderizar un prompt con opciones clickeables/tecleables, cada una con texto e ilustración opcional. Acepta la respuesta del alumno y la propaga al orquestador.

#### Scenario: Alumno selecciona opción correcta

- **Given** un ejercicio MCQ con 4 opciones
- **When** el alumno selecciona una opción
- **Then** MUST propagar la `answer` al orquestador
- **And** cada opción MUST tener tap target ≥ 48×48px

#### Scenario: Opciones con ilustración

- **Given** un ejercicio MCQ con `illustrationUrl` en opciones
- **When** se renderiza el ejercicio
- **Then** MUST mostrar imagen junto al texto de cada opción que tenga `illustrationUrl`

---

### REQ-EX-03: NumericInputExercise Component

`<NumericInputExercise />` MUST renderizar un input numérico con keypad grande tipo tablet (`<NumericKeypad />`), validate inline, y propagar la respuesta numérica al orquestador.

#### Scenario: Input numérico con keypad

- **Given** un ejercicio de tipo `numeric_input`
- **When** se renderiza
- **Then** MUST mostrar un teclado numérico grande con botones ≥ 48×48px
- **And** MUST mostrar el prompt del ejercicio
- **And** la validación inline MUST aceptar tolerancia configurable (default 0)

#### Scenario: Unidad mostrada junto al input

- **Given** un ejercicio con `unit: "cm"`
- **When** se renderiza el input
- **Then** MUST mostrar "cm" junto al campo de respuesta

---

### REQ-EX-04: H5PExerciseWrapper Component

`<H5PExerciseWrapper />` MUST renderizar contenido H5P (drag-drop, fill-blank, match) via `@lumieducation/h5p-react`, inyectar CSS custom Tinku (colores, Andika, tap targets), y capturar resultados via eventos xAPI.

#### Scenario: Renderiza H5P con CSS override

- **Given** un ejercicio H5P con `h5pContentId`
- **When** se renderiza
- **Then** MUST inyectar CSS custom que reemplace colores H5P por tema Tinku
- **And** MUST aplicar tipografía Andika 18-24px al contenido H5P
- **And** tap targets dentro de H5P MUST ser ≥ 48px donde el CSS lo permita

#### Scenario: Captura resultado xAPI

- **Given** un ejercicio H5P completado por el alumno
- **When** H5P emite evento `xAPI` con `completed`
- **Then** el wrapper MUST capturar el score resultado
- **And** propagarlo como `answer` al orquestador

#### Scenario: Timeout de sesión H5P

- **Given** un ejercicio H5P abierto
- **When** pasan 10 minutos sin interacción
- **Then** MUST mostrar aviso de timeout al alumno
- **And** MUST registrar el intento como incompleto

---

### REQ-EX-05: SocioemotionalDilemmaExercise Component

`<SocioemotionalDilemmaExercise />` MUST presentar un escenario con opciones donde NO hay respuesta correcta única. Cada opción incluye una reflexión pedagógica que se muestra al elegirla. Se evalúa participación, no exactitud.

#### Scenario: Alumno elige opción y ve reflexión

- **Given** un dilema socioemocional con 3 opciones
- **When** el alumno selecciona una opción
- **Then** MUST mostrar la reflexión pedagógica correspondiente
- **And** MUST propagar resultado tipo `participation` (no binario correcto/incorrecto) al BKT

#### Scenario: Se marca como completado siempre

- **Given** un ejercicio de tipo `socioemotional_dilemma`
- **When** el alumno selecciona cualquier opción
- **Then** el ejercicio MUST marcarse como completado independientemente de la opción elegida

---

### REQ-EX-06: ExerciseFeedback System

`<ExerciseFeedback />` es un componente reutilizable con tres niveles: sutil (correcto), constructivo (error), y celebración (dominio de concepto). NEVER MUST usar rojo puro (#FF0000) para errores.

#### Scenario: Feedback sutil para acierto

- **Given** el alumno responde correctamente en primer intento
- **When** se muestra feedback
- **Then** MUST mostrar animación breve y tono de confirmación
- **And** NO MUST revelar si es celebración de dominio (eso es nivel separado)

#### Scenario: Feedback constructivo para error

- **Given** el alumno responde incorrectamente
- **When** se muestra feedback
- **Then** MUST usar colores suaves (naranja #E8A87C o gris) — NEVER rojo puro
- **And** MUST mostrar mensaje constructivo, nunca punitivo

#### Scenario: Celebración de dominio

- **Given** el alumno alcanza `p_known ≥ 0.85` en un concepto
- **When** se muestra feedback de dominio
- **Then** la celebración MUST durar mínimo 1.5s para procesamiento emocional
- **And** MUST mostrar animación y sonido de logro

---

### REQ-EX-07: UX Infantil Calibrada

Todos los componentes de ejercicio MUST cumplir estándares de UX infantil: tipografía Andika 18-24px, tap targets ≥ 48×48px, colores de error nunca rojo puro, celebraciones ≥ 1.5s, sin presión temporal.

#### Scenario: Tipografía Andika aplicada

- **Given** cualquier componente de ejercicio renderizado
- **When** se inspecciona la tipografía
- **Then** todos los textos MUST usar Andika con tamaño base 18-24px

#### Scenario: Tap targets accesibles

- **Given** cualquier elemento interactivo en ejercicio
- **When** se mide el tap target
- **Then** MUST ser ≥ 48×48px

#### Scenario: Sin presión temporal

- **Given** cualquier ejercicio en sesión
- **When** se renderiza
- **Then** NO MUST existir timer, countdown, ni modo desafío por defecto

---

### REQ-EX-08: Ayuda Button — Ari Placeholder

El botón "Ayuda" MUST estar siempre visible durante una sesión de ejercicios. En Ola 1, es un placeholder que activa el futuro componente `<AriChat />` (fase 1.9). Si el alumno falla 2+ veces seguidas, el botón MUST destacarse visualmente.

#### Scenario: Botón siempre visible

- **Given** una sesión de ejercicios activa
- **When** se renderiza `<ExerciseLayout />`
- **Then** el botón "Ayuda" MUST estar visible y accesible

#### Scenario: Destaque tras 2 fallos consecutivos

- **Given** el alumno falló 2 veces seguidas en el mismo ejercicio
- **When** se renderiza el botón "Ayuda"
- **Then** MUST destacarse visualmente (glow, pulse, o badge)
- **And** al hacer clic MAY mostrar placeholder de Ari (fase 1.9)

---

### REQ-EX-09: Sound Feedback

Los componentes de ejercicio MUST proveer feedback auditivo via `use-sound`: sonido de acierto (tono ascendente), sonido de error (tono descendente suave), sonido de celebración. NEVER sonidos alarmantes para errores.

#### Scenario: Sonido de acierto

- **Given** el alumno responde correctamente
- **When** se muestra feedback
- **Then** MUST reproducir un tono ascendente suave

#### Scenario: Sonido de error no alarmante

- **Given** el alumno responde incorrectamente
- **When** se muestra feedback
- **Then** MUST reproducir un tono descendente suave
- **And** NEVER MUST reproducir sonidos alarmantes o agudos

---

### REQ-EX-10: Accessibility and prefers-reduced-motion

Todos los componentes de ejercicio MUST cumplir accesibilidad: ARIA labels, focus management, keyboard navigation. MUST respetar `prefers-reduced-motion`.

#### Scenario: ARIA labels en controles

- **Given** cualquier componente interactivo de ejercicio
- **When** se inspecciona el DOM
- **Then** MUST tener `aria-label` descriptivo o `aria-labelledby` apropiado

#### Scenario: Keyboard navigation

- **Given** el alumno navega con teclado
- **When** usa Tab/Enter/Escape
- **Then** MUST poder completar un ejercicio MCQ sin mouse

#### Scenario: prefers-reduced-motion desactiva animaciones

- **Given** el usuario con `prefers-reduced-motion: reduce`
- **When** se renderizan feedback animations y celebration sequences
- **Then** las animaciones MUST estar desactivadas o reducidas a fade simple
- **And** sonidos MAY mantenerse activos (no son motion)