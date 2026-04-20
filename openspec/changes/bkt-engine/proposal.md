# Proposal: bkt-engine

## Intent

Implementar el motor adaptativo de Tinku con BKT simplificado (Ola 1) que calcula la probabilidad de dominio (`p_known`) por concepto para cada alumno, selecciona ejercicios de dificultad apropiada manteniendo al chico en la Zona de Desarrollo Próximo (ZDP), y actualiza el estado tras cada intento. Este change es el corazón pedagógico de Tinku: sin motor adaptativo, los ejercicios son estáticos y no personalizados.

**Usuarios afectados**: alumno (primario — recibe ejercicios calibrados a su nivel). Padre (secundario — ve progreso real en dashboard).

## Scope

### In Scope
- `lib/adaptive/engine.ts` con las 4 funciones core: `getCurrentPKnown`, `updatePKnown`, `pickNextExercise`, `computeXp`
- BKT simplificado (Ola 1): modelo de 3 parámetros por concepto (`learn_rate`, `slip`, `guess`) con actualización empírica
- Algoritmo de selección de ejercicios que calibra dificultad según `p_known` actual (ZDP)
- Cálculo de XP con reglas: primer intento = XP completo, segundo intento = ½, tras hint = ⅓
- Server Action `attemptExercise` que orquesta todo el flujo: recibe respuesta → actualiza p_known → calcula XP → devuelve resultado + próximo ejercicio
- Umbral de dominio: `p_known ≥ 0.85` marca concepto como dominado
- Tests unitarios completos: 4 casos BKT + edge cases de dominio alto/bajo + XP
- Migración SQL para tabla `student_concept_state` con columnas `p_known`, `attempts`, `last_seen`, `status`
- Seed de parámetros BKT por concepto (Ola 1: valores por defecto razonables)

### Out of Scope
- BKT formal con 4 parámetros y actualización bayesiana completa (Ola 4+)
- Integración con componentes de ejercicio React (eso va en `exercise-components`)
- Integración con Phaser/world (eso va en `phaser-world`)
- Motor de repetición espaciada / repaso diario (Ola 2+)
- Migración a LangGraph para orquestación multi-agente (Ola 3+)
- Analytics de patrones de error cross-student (Ola 3+)
- Server Action `awardXp` y toda la gamificación (eso va en fase 1.8)

## Capabilities

### New Capabilities
- `adaptive-engine`: motor BKT simplificado con funciones de cálculo de p_known, selección de ejercicios, y cálculo de XP. Server Actions que lo consumen

### Modified Capabilities
- `project-bootstrap`: se modifica `package.json` para agregar dependencias si las hay (ninguna nueva esperada; Motor es lógica pura en TypeScript)

## Approach

**Modelo BKT simplificado (Ola 1)**:

El BKT (Bayesian Knowledge Tracing) clásico usa 4 parámetros: P(L₀), P(T), P(G), P(S). Para Ola 1 usamos una versión simplificada de 3 parámetros por concepto:

- **`learn_rate`** (equivale a P(T)): probabilidad de transición de "no dominado" a "dominado" tras un acierto. Default: 0.1
- **`slip`** (equivale a P(S)): probabilidad de responder incorrectamente cuando el concepto está dominado. Default: 0.05  
- **`guess`** (equivale a P(G)): probabilidad de responder correctamente por azar. Default: 0.2

P(L₀) se inicializa en 0.0 para conceptos nuevos (sin intentos previos) y se calcula empíricamente con los datos existentes si el alumno ya tiene intentos.

**Funciones core del engine**:

```ts
// lee p_known actual del alumno para un concepto
getCurrentPKnown(studentId: string, conceptId: string): Promise<number>

// actualiza p_known tras un intento (acierto o error)
updatePKnown(studentId: string, conceptId: string, wasCorrect: boolean, difficulty: 'easy' | 'medium' | 'hard'): Promise<{ pKnown: number; mastered: boolean }>

// selecciona próximo ejercicio basándose en p_known actual
pickNextExercise(studentId: string, conceptId: string): Promise<Exercise | null>

// calcula XP ganada según dificultad, intento y uso de hint
computeXp(difficulty: Difficulty, attemptNumber: number, usedHint: boolean): number
```

**Algoritmo de selección (`pickNextExercise`)**:

La ZDP se implementa con 3 umbrales de p_known que determinan la dificultad del próximo ejercicio:

| p_known | Dificultad del ejercicio | Lógica |
|---------|-------------------------|---------|
| < 0.3 | easy | El chico está empezando, ejercicios básicos |
| 0.3–0.7 | medium | ZDP óptima, ejercicios con reto moderado |
| 0.7–0.85 | hard | Casi domina, ejercicios de consolidación |
| ≥ 0.85 | — | Concepto dominado, no se ofrecen más ejercicios |

Dentro de cada banda de dificultad, `pickNextExercise` selecciona aleatoriamente entre los ejercicios disponibles de esa dificultad para ese concepto, evitando repetir el último ejercicio.

**Server Action `attemptExercise`**:

```ts
// orquesta el flujo completo de un intento de ejercicio
async function attemptExercise(
  exerciseId: string, 
  answer: StudentAnswer
): Promise<AttemptResult> {
  // 1. Validar respuesta
  // 2. Calificar (correcto/incorrecto)
  // 3. updatePKnown
  // 4. computeXp
  // 5. Registrar intento en student_exercise_attempts
  // 6. Si dominó, disparar side effects (moneda, nivel, etc.) — en fase 1.8
  // 7. pickNextExercise para devolver siguiente
  // 8. Devolver AttemptResult
}
```

**Estructura de datos**:

```ts
// tabla student_concept_state en Supabase
interface StudentConceptState {
  student_id: string;
  concept_id: string;
  p_known: number;        // 0.0 a 1.0
  attempts: number;        // total de intentos
  correct_count: number;  // aciertos
  last_seen: timestamp;   // último intento
  status: 'locked' | 'available' | 'in_progress' | 'mastered';
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Parámetros BKT por concepto**: en Ola 1, todos los conceptos arrancan con los mismos valores default (`learn_rate: 0.1`, `slip: 0.05`, `guess: 0.2`). Se almacenan en una columna JSONB de la tabla `concepts` para permitir calibración individual en el futuro.

**XP Rules** (para fase 1.8, pero el cálculo vive en el engine):
- Acierto primer intento: 10 XP × multiplicador de dificultad (easy: 1x, medium: 1.5x, hard: 2x)
- Acierto segundo intento: XP × 0.5
- Acierto con hint: XP × 0.33
- Dominio de concepto: bonus de 50 XP
- No se da XP por ejercicios repetidos para farmear

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/adaptive/engine.ts` | New | Motor BKT simplificado con 4 funciones core |
| `src/lib/adaptive/types.ts` | New | Tipos compartidos del dominio adaptativo |
| `src/app/actions/attempt-exercise.ts` | New | Server Action que orquesta el flujo |
| `src/lib/adaptive/__tests__/engine.test.ts` | New | Tests unitarios del motor BKT |
| `supabase/migrations/` | New | Migración para `student_concept_state` y columnas BKT |
| `seeds/concepts-bkt-params.ts` | New | Seed de parámetros BKT default por concepto |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BKT simplificado no calibra bien con pocos datos | Med | Aceptar que en beta cerrada (10-20 alumnos) la calibración es aproximada. Monitorear distribución de p_known y ajustar defaults si se detectan sesgos |
| Ejercicios repetidos seleccionados por `pickNextExercise` | Med | Implementar anti-repeat: excluir último ejercicio respondido. Evitar loops de ejercicio único |
| Edge case: alumno dominado que vuelve a fallar | Med | Implementar "forgetting factor": si dominado y falla 3+ veces seguidas, p_known baja a 0.7 (en progreso) |
| Server Action lento por múltiples queries a Supabase | Bajo | Batch queries con `supabase.rpc()` si es necesario. Hot path: 2 queries máximo (read state + write state) |
| Falta de ejercicios en cierta dificultad para un concepto | Med | Si no hay ejercicios hard para un concepto, bajar dificultad automáticamente. Loggear para content team |

## Rollback Plan

1. Si el motor BKT presenta errores de cálculo que afectan progreso del alumno: revertir a modelo still más simple (p_known = correct_count / total_attempts, sin probabilístico) como fallback temporal.
2. Si la migración de `student_concept_state` introduce errores: la tabla es nueva sin datos existentes, se puede recrear sin perdida.
3. Si `pickNextExercise` tiene bugs de selección: agregar flag feature toggle en env que deshabilite selección adaptiva y pase a secuencia fija como fallback.

## Dependencies

- **Phase 1.2 (schema)**: las tablas `concepts`, `exercises`, `student_exercise_attempts` y `student_concept_state` deben existir antes de escribir el engine. El engine CONSULTE estas tablas, no las crea
- **Phase 1.4 (auth)**: el engine necesita el `studentId` del alumno autenticado para leer/escribir su estado
- **Supabase**: client ya configurado en `src/lib/supabase/server.ts` (bootstrap completo)

## Success Criteria

- [ ] `getCurrentPKnown` devuelve un valor entre 0 y 1 para cualquier combinación alumno-concepto
- [ ] `updatePKnown` con 5 aciertos seguidos eleva `p_known` por encima de 0.80
- [ ] `updatePKnown` con 5 errores seguidos baja `p_known` por debajo de 0.30
- [ ] Cuando `p_known ≥ 0.85`, el concepto se marca como `mastered`
- [ ] `pickNextExercise` selecciona ejercicios de dificultad apropiada según la banda de `p_known`
- [ ] `pickNextExercise` no repite el mismo ejercicio inmediatamente
- [ ] `computeXp` calcula correctamente con reglas de primer intento, segundo intento y hint
- [ ] `attemptExercise` Server Action orquesta el flujo completo y devuelve resultado + próximo ejercicio
- [ ] Todos los tests unitarios del engine pasan (4 casos BKT + edge cases)
- [ ] Migración SQL aplicada sin errores en Supabase
- [ ] No hay `any` en el código TypeScript del engine