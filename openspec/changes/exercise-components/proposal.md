# Proposal: exercise-components

## Intent

Construir los componentes de UI pedagógica de Tinku para los 6 tipos de ejercicio de Ola 1: MCQ custom, Numeric Input, H5P drag-drop, H5P fill-blank, H5P match, y Dilema Socioemocional. Estos componentes son donde el alumno interactúa con el contenido pedagógico real: respondiendo, recibiendo feedback, y avanzando conceptos. Sin estos componentes, el mundo explorable es un cascarón sin aprendizaje.

**Usuarios afectados**: alumno (primario — responde ejercicios y recibe feedback). Padre (secundario — ve resultados en dashboard via BKT engine).

## Scope

### In Scope
- Componente `<MCQExercise />`: multiple choice con opciones ilustrables, feedback visual con colores Tinku (nunca rojo puro)
- Componente `<NumericInputExercise />`: input numérico con teclado grande tipo tablet, validación inline
- Componente `<H5PExerciseWrapper />`: wrapper React que renderiza H5P content types con `@lumieducation/h5p-react`, CSS custom Tinku, propaga resultado al BKT engine
- Componente `<SocioemotionalDilemmaExercise />`: tipo especial sin respuesta "correcta" única, evalúa reflexión del alumno
- Componente `<ExerciseSession />`: orquestador de sesión de ejercicios que fluye: ejercicio → feedback → (Ari si 2 fallos) → próximo ejercicio
- Integración con BKT engine: al completar ejercicio, llama `attemptExercise` Server Action, recibe próximo ejercicio, renderiza transición
- Sistema de feedback visual y auditivo: bounce de botones (Motion), sonidos correcto/incorrecto (use-sound), transiciones suaves (1.5s mínimo para celebraciones)
- Botón "Ayuda" (activa Ari) siempre visible en sesión de ejercicios
- Tipografía Andika 18-24px, tap targets ≥ 48×48px, colores de feedback nunca rojo puro (naranjas suaves o grises para errores)
- Respeto a `prefers-reduced-motion` en todas las animaciones
- Accessibility: ARIA labels, focus management, keyboard navigation

### Out of Scope
- Motor BKT (eso va en `bkt-engine`) — este change CONSUME el engine pero no lo implementa
- Mundo explorable Phaser (eso va en `phaser-world`)
- Gamificación: XP, niveles, monedas, celebraciones jerárquicas Lottie (eso va en fase 1.8)
- Componente `<AriChat />` completo (eso va en fase 1.9) — solo el placeholder del botón "Ayuda"
- Creación de contenido H5P (.h5p files) — eso va en fase 1.3
- Dashboard del padre (fase 1.10)

## Capabilities

### New Capabilities
- `exercise-ui`: componentes de ejercicio pedagógico (MCQ, NumericInput, H5P, Dilema), sesión de ejercicios, feedback system

### Modified Capabilities
- (Ninguna — los componentes de ejercicio son nuevos y no modifican capabilities existentes del bootstrap)

## Approach

**Arquitectura de componentes**:

Los ejercicios viven en la escala 3 del mundo (TINKU.md §8.2). Cuando el alumno selecciona un nodo de concepto en el mapa interno (escala 2, Phaser), hay una transición a la UI de ejercicio (escala 3, React). Esta transición es un fade cross-fade coordinado por Zustand.

**Estructura de archivos**:
```
src/components/exercises/
  ExerciseSession.tsx        # orquestador de sesión completa
  MCQExercise.tsx            # multiple choice
  NumericInputExercise.tsx   # input numérico con teclado grande
  H5PExerciseWrapper.tsx     # wrapper para H5P content types
  SocioemotionalDilemmaExercise.tsx  # dilema sin respuesta única
  ExerciseFeedback.tsx       # sistema de feedback reutilizable
  ExerciseLayout.tsx         # layout compartido (fondo temático, botón ayuda)
  NumericKeypad.tsx          # teclado numérico tipo tablet
  exercise-types.ts          # tipos compartidos de ejercicio
```

**Tipos de ejercicio**:

```ts
type ExerciseType = 'mcq' | 'numeric_input' | 'h5p_drag_drop' | 'h5p_fill_blank' | 'h5p_match' | 'socioemotional_dilemma';

interface BaseExercise {
  id: string;
  conceptId: string;
  type: ExerciseType;
  difficulty: 'easy' | 'medium' | 'hard';
  islandTheme: 'numeros' | 'amigos'; // para fondo temático
}

interface MCQExercise extends BaseExercise {
  type: 'mcq';
  prompt: string;
  options: Array<{ id: string; text: string; illustrationUrl?: string }>;
  correctOptionId: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

interface NumericInputExercise extends BaseExercise {
  type: 'numeric_input';
  prompt: string;
  correctAnswer: number;
  tolerance?: number; // default 0
  unit?: string; // "cm", "kg", etc.
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

interface H5PExercise extends BaseExercise {
  type: 'h5p_drag_drop' | 'h5p_fill_blank' | 'h5p_match';
  h5pContentId: string;
}

interface SocioemotionalDilemmaExercise extends BaseExercise {
  type: 'socioemotional_dilemma';
  scenario: string;
  options: Array<{ id: string; text: string; reflection: string }>;
  // No hay "correctOptionId" — se evalúa reflección, no exactitud
}
```

**ExerciseSession (orquestador)**:

`<ExerciseSession />` es el componente que maneja el flujo completo de una sesión de ejercicios para un concepto:
1. Carga datos del concepto y alumno via Server Component → pasa a Client Component
2. Renderiza ejercicio actual según tipo
3. Al recibir respuesta, llama `attemptExercise` Server Action
4. Muestra `<ExerciseFeedback />` según resultado
5. Si 2 errores seguidos en mismo ejercicio, muestra botón de Ari (placeholder para fase 1.9)
6. Pide próximo ejercicio al engine y transiciona con animación

**H5P Integration Strategy**:

`@lumieducation/h5p-react` provee un componente que recibe un content ID y renderiza el ejercicio H5P. El wrapper:
- Inyecta CSS custom Tinku (colores, tipografía Andika, tap targets grandes)
- Escucha eventos `xAPI` del H5P para capturar resultado
- Propaga el resultado al BKT engine via `attemptExercise`
- Maneja timeout de sesión (10 minutos máximo por ejercicio)

**SocioemotionalDilemmaExercise — diseño especial**:

Los dilemas socioemocionales NO tienen una única respuesta correcta. Se evalúa la reflexión del alumno. El componente:
- Presenta un escenario con opciones
- Cada opción tiene una "reflexión" pedagógica que se muestra al elegir
- Se marca como completado independientemente de la opción elegida
- El BKT engine registra el intento como "participación" (no correcto/incorrecto binario)
- Se adapta el modelo: para socioemocional, `p_known` sube con participación, no con exactitud

**UX infantil calibrada** (TINKU.md §5.4):

Todos los componentes de ejercicio DEBEN cumplir:
- Tipografía Andika, tamaño base 18-24px
- Tap targets mínimo 48×48px
- Colores de error: naranjas suaves (#E8A87C) o grises, nunca rojo puro
- Sonido de error: tono descendente suave, nunca alarmante
- Celebraciones: mínimo 1.5s para que el chico procese emocionalmente
- `prefers-reduced-motion`: desactivar todas las animaciones no esenciales
- No hay presión temporal (sin timer, sin modo desafío por defecto)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/exercises/` | New | Todos los componentes de ejercicio |
| `src/lib/adaptive/types.ts` | Modified | Se agregan tipos Exercise compartidos (o se importan de exercise-types) |
| `src/app/(game)/exercise/[conceptId]/page.tsx` | New | Ruta de sesión de ejercicio (Server Component → Client) |
| `public/assets/audio/` | New | Sonidos de feedback (correcto, incorrecto, click) |
| `public/assets/h5p/` | New | Content types H5P (.h5p files) |
| `src/styles/h5p-custom.css` | New | CSS override para estilizar H5P con tema Tinku |
| `package.json` | Modified | Se agrega `@lumieducation/h5p-react`, `use-sound`, `motion` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| H5P integration compleja y poco documentada | Alto | Prototipar wrapper H5P en semana 1. Si `@lumieducation/h5p-react` no funciona bien con Next.js App Router, evaluar `h5p-standalone` como alternativa |
| Tipografía Andika no aplica bien en H5P iframes | Medio | CSS injection agresiva desde el wrapper. Si no se puede, aceptar estética parcial en H5P para Ola 1 |
| SocioemotionalDilemmaExercise no encaja en modelo binario correcto/incorrecto del BKT | Medio | Diseñar tipo de resultado especial "participación" en BKT engine. Coordinar con `bkt-engine` para soportar este caso |
| Tap targets 48×48px no se respetan en H5P content types estándar | Medio | CSS custom override para aumentar tamaño de elementos interactivos en H5P. Reportar upstream si es limitación del content type |
| Accessibility en H5P es limitada | Alto | H5P tiene issues de accessibility conocidos. Para Ola 1, los ejercicios H5P son progresivamente accesibles. Ejercicios custom (MCQ, NumericInput) son 100% accesibles |

## Rollback Plan

1. Si H5P integration falla (demasiados bugs, performance, accessibility): fallback a implementar drag-drop, fill-blank y match como componentes React custom. Más trabajo inicial pero control total sobre UX y accessibility.
2. Si socioemocional no funciona con BKT binario: cambiar `attemptExercise` para aceptar un tipo `participation` que no calcule correcto/incorrecto, solo registre interacción y sume XP fijo por participación.
3. Si feedback visual causa problemas de performance en mobile: desactivar animaciones Motion y usar transiciones CSS como fallback.

## Dependencies

- **Phase 1.6 (bkt-engine)**: `attemptExercise` Server Action y tipos de resultado deben estar implementados. Los componentes de ejercicio CONSUMEN el engine, no lo implementan
- **Phase 1.2 (schema)**: tablas `exercises`, `concepts` deben existir para cargar contenido de ejercicios
- **Phase 1.4 (auth)**: identidad del alumno para enviar respuestas al engine
- **Phase 1.5 (phaser-world)**: la transición desde el mapa interno de isla al ejercicio es coordinada por Zustand. Se puede desarrollar en paralelo con interfaces согласованные (i.e., store shape compatible)
- **`@lumieducation/h5p-react`** o **`h5p-standalone`**: dependencia npm nueva para renderizar H5P
- **`use-sound`**: dependencia npm para feedback auditivo
- **`motion`** (ex Framer Motion): dependencia npm para animaciones declarativas

## Success Criteria

- [ ] `<MCQExercise />` renderiza pregunta con opciones, acepta respuesta, muestra feedback visual
- [ ] `<NumericInputExercise />` renderiza input con teclado grande tipo tablet
- [ ] `<H5PExerciseWrapper />` renderiza al menos un content type H5P con CSS custom Tinku
- [ ] `<SocioemotionalDilemmaExercise />` renderiza escenario con opciones y reflexiones
- [ ] `<ExerciseSession />` orquesta flujo completo: ejercicio → feedback → próximo ejercicio
- [ ] La sesión registra cada intento via `attemptExercise` y actualiza p_known
- [ ] Botón "Ayuda" (Ari) siempre visible en sesión de ejercicios
- [ ] Tipografía Andika 18-24px en todos los componentes
- [ ] Tap targets ≥ 48×48px en todos los interactivos
- [ ] Colores de error nunca son rojo puro (naranjas suaves o grises)
- [ ] `prefers-reduced-motion` desactiva animaciones no esenciales
- [ ] Un alumno puede completar 10 ejercicios seguidos de distintos tipos sin errores ni pérdida de estado
- [ ] Transición suave (1.5s mínimo) entre ejercicios con celebration para aciertos