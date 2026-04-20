# Design: exercise-components

## Technical Approach

5 commits atómicos: tipos compartidos → componentes individuales → ExerciseSession orquestador → UX infantil + feedback + sonido → H5P wrapper. Se construye bottom-up (componentes primero, orquestador después). BKT engine se consume via Server Action, no se implementa acá.

Refs: spec `exercise-ui` (ADD). Proposal `exercise-components`. Depends on `bkt-engine` for `attemptExercise` Server Action.

## Architecture Decisions

### AD-01: ExerciseSession como Orquestador, No como State Machine

**Choice**: `<ExerciseSession />` es un `"use client"` component que recibe `conceptId` y maneja el flujo: load exercise → render by type → receive answer → call `attemptExercise` → show feedback → load next. Estado local via `useState`/`useReducer`. No state machine library.
**Alternatives**: (a) XState para exercise flow — overkill para 4 estados (loading/active/feedback/complete). (b) Zustand para estado de sesión — mezcla concerns globales vs locales.
**Rationale**: El flujo de ejercicio es lineal y local al componente. Un `useReducer` con states `{ loading | active | feedback | complete }` es suficiente. El estado global (conceptStates) vive en Zustand; el estado de sesión local no.

### AD-02: Exercise Component Types — Discriminated Union

**Choice**: Tipos de ejercicio como discriminated union con `type` como discriminant:
```ts
type Exercise = MCQExercise | NumericInputExercise | H5PExercise | SocioemotionalDilemmaExercise;
```
Cada tipo tiene sus props específicas. `<ExerciseSession />` hace switch en `exercise.type` para renderizar el componente correcto.
**Alternatives**: (a) Component registry map `Record<ExerciseType, ComponentType>` — más dinámico pero pierde type narrowing. (b) Un solo componente con internal switch — monolítico, difícil de mantener.
**Rationale**: Discriminated union + switch es el patrón TS idiomático. Da type safety en cada branch. Cada componente de ejercicio es independiente y testeable por separado.

### AD-03: ExerciseFeedback — 3 Niveles con Motion

**Choice**: `<ExerciseFeedback />` con 3 niveles configurables:
- `subtle`: acierto simple — bounce del botón, tick sound, 0.8s duración
- `constructive`: error — naranja suave (#E8A87C), mensaje constructivo, tono descendente suave, 1.2s
- `celebration`: dominio — animación extendida >= 1.5s, sonido de logro, confetti sutil (Lottie en futuro)

NUNCA rojo puro (#FF0000). NUNCA sonido alarmante.
**Alternatives**: (a) Toast genérico — no respeta timing de procesamiento emocional infantil. (b) Sonidos custom para cada nivel — más trabajo, inconsistencia potencial.
**Rationale**: TINKU.md §5.4 y REQ-EX-06 especifican feedback proporcional y nunca punitivo. Los 3 niveles mapean a celebration hierarchy de TINKU.md §9.6. Duración mínima de 1.5s para celebraciones es requisito (REQ-EX-06).

### AD-04: NumericKeypad — Componente Dedicado

**Choice**: `<NumericKeypad />` como componente dedicado con botones 0-9, delete, submit. Estilado para niños: buttons ≥ 48×48px, Andika font, grid responsive. Se maneja como componente separado porque se reutiliza fuera de NumericInput si es necesario.
**Alternatives**: (a) `<input type="number">` — UX mala en mobile, keypad nativo no es amigable para niños. (b) Librería de keypad — innecesaria, el componente es simple de construir.
**Rationale**: Los keypads nativos de iOS/Android son confusos para niños de 6-12. Un keypad custom tipo tablet con botones grandes es UX calibrada para el público. Button spacing y tap targets son requisitos (REQ-EX-03, REQ-EX-07).

### AD-05: H5P Integration — Wrapper con CSS Override y xAPI

**Choice**: `<H5PExerciseWrapper />` usa `@lumieducation/h5p-react` para renderizar contenido H5P. Inyecta CSS custom Tinku via `<style>` tag scoped. Captura resultados via eventos `xAPI` (`completed` event). Timeout de 10 minutos sin interacción.
**Alternatives**: (a) `h5p-standalone` — más control pero más setup, buen fallback. (b) Iframe con postMessage — complejidad de comunicación, pero aislamiento natural.
**Rationale**: `@lumieducation/h5p-react` es la lib recomendada para integración React. Si falla con Next.js App Router, el rollback plan del proposal dice cambiar a `h5p-standalone`. CSS injection funciona porque el wrapper controla el contenedor.

### AD-06: SocioemotionalDilemma — Participation-Based Assessment

**Choice**: `<SocioemotionalDilemmaExercise />` presenta escenario + opciones con reflexión pedagógica. No hay `correctOptionId`. Cada opción muestra su reflexión al elegirla. El resultado se propaga como `{ participation: true }` al BKT engine, no como correct/incorrect.
**Alternatives**: (a) Forced choice con puntuación — contradice la filosofía socioemocional. (b) Texto libre — no evaluable en Ola 1.
**Rationale**: REQ-EX-05 es explícito: no hay respuesta correcta única. Se evalúa reflexión, no exactitud. El BKT engine necesita un tipo de resultado especial `participation` (coordinar con bkt-engine).

### AD-07: UX Infantil como Design Tokens, No Inline Styles

**Choice**: Constantes de UX calibrada como design tokens exportables:
```ts
export const KIDS_UX = {
  minTapTarget: 48,           // px
  fontFamily: 'var(--font-andika)',
  fontSizeBase: 18,           // px
  fontSizeLarge: 24,           // px
  errorColor: '#E8A87C',      // naranja suave
  errorColorAlt: '#9CA3AF',   // gris alternativo
  forbiddenRed: '#FF0000',    // NUNCA usar esto
  celebrationMinDuration: 1500, // ms
  soundEnabled: true,          // default, persiste en localStorage
} as const;
```
**Alternatives**: (a) Tailwind config extendida — pierde const assertions y type safety. (b) CSS custom properties — noaccessible en JS (sonidos, duraciones).
**Rationale**: Tokens en TS dan type safety, son importables en componentes y tests, y se pueden usar para assertions de tap targets y colores. Tailwind classes se construyen a partir de estos tokens.

### AD-08: Feedback Auditivo via use-sound

**Choice**: `use-sound` para sonidos de acierto, error y celebración. Archivos de audio en `public/assets/audio/`. Preferencia de sonido se persiste en `localStorage` (excepción permitida por TINKU.md §12.7: preferencias locales de UI sí pueden usar localStorage).
**Alternatives**: (a) `Audio()` API directa — más control manual pero más compleja, sin sprite management. (b) Sin sonido — viola REQ-EX-09.
**Rationale**: `use-sound` (wrapping Howler.js) maneja preload, sprite, y playback. Persistir preferencia en localStorage es explícitamente permitido (es preferencia de UI, no estado pedagógico). Sonidos son archivos cortos en `public/assets/audio/`.

### AD-09: prefers-reduced-motion en Ejercicios React

**Choice**: Hook `useReducedMotion()` que detecta `prefers-reduced-motion: reduce`. Cuando activo: desactivar animaciones Motion, usar transiciones CSS fade simples, mantener sonidos activos (no son motion). ExerciseFeedback usa `animate` condicional.
**Alternatives**: (a) Ignorar en exercises — inaccesible. (b) Desactivar todo incluyendo sonidos — REQ-EX-10 dice sonidos OK con reduced-motion.
**Rationale**: REQ-EX-10 es explícito. Motion (ex Framer Motion) se desactiva, sonidos se mantienen. Hook compartido con phaser-world (puede importarse de `hooks/`).

### AD-10: Ayuda Button — Ari Placeholder con Visual Highlight

**Choice**: Botón "Ayuda" siempre visible en `<ExerciseLayout />`. Cuando el alumno falla 2+ veces consecutivas, el botón obtiene glow/pulse via Tailwind `animate-pulse`. Click muestra placeholder "Ari vendrá pronto" (Phase 1.9).
**Alternatives**: (a) Modal completo de Ari — no existe en Phase 1.7. (b) Sin botón — viola REQ-EX-08.
**Rationale**: REQ-EX-08 requiere botón siempre visible con destaque tras 2 fallos. El placeholder es honesto: dice que Ari vendrá, no promete algo que no existe.

## Data Flow

```
<ExerciseLayout>                          ← Theme background, Ayuda button
  └─ <ExerciseSession conceptId={id}>
        │
        ├─ Load initial exercise via attemptExercise (p_known → difficulty band)
        │
        ├─ Render exercise by type:
        │     ├─ <MCQExercise />
        │     ├─ <NumericInputExercise /> + <NumericKeypad />
        │     ├─ <H5PExerciseWrapper />
        │     └─ <SocioemotionalDilemmaExercise />
        │
        ├─ Student answers → call attemptExercise Server Action
        │
        ├─ Show <ExerciseFeedback level="subtle|constructive|celebration" />
        │
        ├─ If 2+ consecutive errors → highlight Ayuda button
        │
        └─ Load next exercise (from AttemptResult.nextExercise)
              └─ Transition animation (1.5s minimum for celebrations)
```

## Component Tree

```
<ExerciseLayout>                              ← common background, help button
  ├─ <AyudaButton />                         ← always visible, pulses on 2+ errors
  └─ <ExerciseSession conceptId={id}>
        ├─ loading state → <LoadingSpinner />
        ├─ active state → <ExerciseRenderer exercise={exercise} />
        │     ├─ <MCQExercise />             ← multiple choice with illustrated options
        │     ├─ <NumericInputExercise />     ← prompt + display + NumericKeypad
        │     ├─ <H5PExerciseWrapper />       ← H5P content with CSS override
        │     └─ <SocioemotionalDilemmaExercise />  ← scenario + choice + reflection
        ├─ feedback state → <ExerciseFeedback />
        └─ complete state → <CompletionScreen />
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/exercises/exercise-types.ts` | Create | Discriminated union types: Exercise, MCQExercise, NumericInputExercise, etc. |
| `src/components/exercises/kids-ux.ts` | Create | KIDS_UX design tokens: tap targets, font sizes, colors, durations, forbidden colors |
| `src/components/exercises/ExerciseLayout.tsx` | Create | Shared layout: island-themed background, font sizing, Ayuda button |
| `src/components/exercises/ExerciseSession.tsx` | Create | Orquestador: load → render → answer → feedback → next. useReducer state machine |
| `src/components/exercises/ExerciseRenderer.tsx` | Create | Switch on exercise.type → render appropriate component |
| `src/components/exercises/MCQExercise.tsx` | Create | Multiple choice with illustrated options, 48px targets, ARIA labels |
| `src/components/exercises/NumericInputExercise.tsx` | Create | Numeric prompt + display field |
| `src/components/exercises/NumericKeypad.tsx` | Create | 0-9, delete, submit buttons in grid layout, ≥48px targets |
| `src/components/exercises/H5PExerciseWrapper.tsx` | Create | H5P renderer + CSS override + xAPI listener + 10min timeout |
| `src/components/exercises/SocioemotionalDilemmaExercise.tsx` | Create | Scenario + options + reflection reveal + participation result |
| `src/components/exercises/ExerciseFeedback.tsx` | Create | 3-level feedback: subtle, constructive, celebration. Motion animations |
| `src/components/exercises/AyudaButton.tsx` | Create | Always-visible help button with pulse on 2+ consecutive errors |
| `src/styles/h5p-custom.css` | Create | CSS override theme for H5P content (Andika, colors, tap targets) |
| `src/hooks/useReducedMotion.ts` | Create | Hook for prefers-reduced-motion detection (shared with phaser-world) |
| `src/hooks/useExerciseSound.ts` | Create | use-sound wrapper for correct/incorrect/celebration sounds |
| `src/app/(game)/exercise/[conceptId]/page.tsx` | Create | Route: Server Component fetches concept data → passes to ExerciseSession |
| `public/assets/audio/correct.mp3` | Create | Ascending tone sound |
| `public/assets/audio/incorrect.mp3` | Create | Soft descending tone sound |
| `public/assets/audio/celebration.mp3` | Create | Achievement sound |
| `package.json` | Modify | Add `@lumieducation/h5p-react`, `use-sound`, `motion` |
| `src/components/exercises/__tests__/MCQExercise.test.tsx` | Create | Render, select option, ARIA, tap target validation |
| `src/components/exercises/__tests__/NumericInputExercise.test.tsx` | Create | Input, validation, unit display |
| `src/components/exercises/__tests__/ExerciseFeedback.test.tsx` | Create | All 3 levels, duration, colors (no red), reduced-motion |
| `src/components/exercises/__tests__/ExerciseSession.test.tsx` | Create | Full flow: load → answer → feedback → next exercise |
| `src/components/exercises/__tests__/kids-ux.test.ts` | Create | Validate KIDS_UX constants (no #FF0000, tap targets ≥ 48) |

## Interfaces / Contracts

```ts
// src/components/exercises/exercise-types.ts
export type ExerciseType = 'mcq' | 'numeric_input' | 'h5p_drag_drop' | 'h5p_fill_blank' | 'h5p_match' | 'socioemotional_dilemma';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface BaseExercise {
  id: string;
  conceptId: string;
  type: ExerciseType;
  difficulty: Difficulty;
  islandTheme: 'numeros' | 'amigos';
}

export interface MCQExercise extends BaseExercise {
  type: 'mcq';
  prompt: string;
  options: Array<{ id: string; text: string; illustrationUrl?: string }>;
  correctOptionId: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface NumericInputExercise extends BaseExercise {
  type: 'numeric_input';
  prompt: string;
  correctAnswer: number;
  tolerance?: number; // default 0
  unit?: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface H5PExercise extends BaseExercise {
  type: 'h5p_drag_drop' | 'h5p_fill_blank' | 'h5p_match';
  h5pContentId: string;
}

export interface SocioemotionalDilemmaExercise extends BaseExercise {
  type: 'socioemotional_dilemma';
  scenario: string;
  options: Array<{ id: string; text: string; reflection: string }>;
}

export type Exercise = MCQExercise | NumericInputExercise | H5PExercise | SocioemotionalDilemmaExercise;

export type FeedbackLevel = 'subtle' | 'constructive' | 'celebration';

// Props for exercise components
export interface ExerciseComponentProps<T extends Exercise> {
  exercise: T;
  onAnswer: (answer: StudentAnswer) => void;
  disabled?: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | KIDS_UX constants — no #FF0000, tap targets ≥ 48, font sizes valid | Vitest — data assertions |
| Unit | `<MCQExercise />` — render, select option, tap target size, ARIA labels | Vitest + @testing-library/react |
| Unit | `<NumericInputExercise />` — input, validation, unit display, keypad interaction | Vitest + @testing-library/react |
| Unit | `<NumericKeypad />` — button render, tap targets ≥ 48 | Vitest + @testing-library/react |
| Unit | `<ExerciseFeedback />` — 3 levels, correct colors, duration, reduced-motion | Vitest + @testing-library/react |
| Unit | `<SocioemotionalDilemmaExercise />` — scenario render, option select, reflection reveal | Vitest + @testing-library/react |
| Unit | `<AyudaButton />` — always visible, pulse after 2 errors | Vitest + @testing-library/react |
| Integration | `<ExerciseSession />` — full flow: load → answer → feedback → next | Vitest + @testing-library/react + mocked Server Action |
| Integration | BKT integration — ExerciseSession calls attemptExercise, receives nextExercise | Vitest with MSW or mocked action |
| E2E | Complete 10 exercises of different types without errors or state loss | Playwright |

## Migration / Rollout

No database migration required. NPM dependencies to add: `@lumieducation/h5p-react`, `use-sound`, `motion`.

Rollback per commit:
1. Remove types/tokens — file-only removal
2. Remove individual exercise components — file-only removal
3. Remove ExerciseSession — file-only removal
4. Remove UX/sound hooks — file-only removal
5. Remove H5P wrapper — file-only removal + uninstall npm deps

## Commit Plan

1. **`feat(exercises): add shared types and UX design tokens`** — `exercise-types.ts`, `kids-ux.ts`. Discriminated union types, KIDS_UX constants. Unit tests validating no red, tap targets. Means: types compile, constants validate.

2. **`feat(exercises): add MCQExercise and NumericInputExercise components`** — `MCQExercise.tsx`, `NumericInputExercise.tsx`, `NumericKeypad.tsx`. Tap targets ≥ 48xp, ARIA labels, Andika font. Unit tests. Means: 2 exercise types render and respond to input.

3. **`feat(exercises): add SocioemotionalDilemmaExercise, ExerciseFeedback, and AyudaButton`** — Socioemotional dilemmas, 3-level feedback system, help button with pulse. Unit tests. Means: feedback loop complete, socioemotional participation works.

4. **`feat(exercises): add ExerciseSession orchestrator and ExerciseLayout`** — `ExerciseSession.tsx` (useReducer state machine), `ExerciseLayout.tsx`, `ExerciseRenderer.tsx`, route `exercise/[conceptId]/page.tsx`. Integration tests for full flow. Means: orquestador maneja sesiones completas.

5. **`feat(exercises): add H5P wrapper and sound feedback`** — `H5PExerciseWrapper.tsx`, `h5p-custom.css`, `useExerciseSound.ts`, audio assets. H5P timeout, xAPI capture. Means: all 4 exercise types functional.

## Open Questions

- [ ] H5P content hosting strategy: self-hosted vs. H5P.com. Affects `h5pContentId` resolution in `H5PExerciseWrapper`.
- [ ] Confirm `@lumieducation/h5p-react` compatibility with Next.js 14 App Router. May need `h5p-standalone` fallback.
- [ ] Exercise data fetching: should `<ExerciseSession />` call `attemptExercise` directly, or should the route Server Component pre-fetch initial exercise data and pass it down?
- [ ] Sound asset sourcing: record custom tones vs. use CC0 sound effects library. Need ascending/descending/celebration audio files.