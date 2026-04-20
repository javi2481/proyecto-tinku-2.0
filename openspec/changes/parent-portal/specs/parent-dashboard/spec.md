# Delta Spec: parent-dashboard (ADDED)

## Capability
`parent-dashboard` — Dashboard sobrio y profesional donde el padre ve progreso real de cada hijo, con diseño deliberadamente NO gamificado (tipografía Inter, shadcn/ui default, sin confetti).

## ADDED Requirements

### REQ-PD-01: Ruta /dashboard con lista de hijos

**RFC 2119**: MUST

**Given** un padre autenticado con uno o más hijos registrados
**When** el padre accede a `/dashboard`
**Then** la página MUST mostrar una lista de sus hijos con para cada uno:
- Nombre del hijo
- Nivel actual y título naval
- Cantidad de conceptos dominados esta semana
- Tiempo de uso total esta semana
- Indicador de estado general (progressando, estancado, sin actividad reciente)
**And** el diseño MUST ser sobrio y profesional — tipografía Inter (NO Andika, que es para alumnos)
**And** MUST NO haber elementos gamificados (confetti, animaciones lúdicas, emojis excesivos, iconos de juego)
**And** la ruta MUST ser un Server Component por defecto (datos cargados server-side)

---

### REQ-PD-02: Ruta /dashboard/[student-id] con detalle

**RFC 2119**: MUST

**Given** un padre autenticado que selecciona un hijo de su lista
**When** el padre accede a `/dashboard/[student-id]`
**Then** la página MUST mostrar:
- **Conceptos dominados**: lista de conceptos donde p_known ≥ 0.85, con nombre y fecha de dominio
- **Conceptos en progreso**: conceptos donde 0.3 < p_known < 0.85, con p_known actual
- **Conceptos trabados**: conceptos donde p_known no mejora tras N intentos (threshold configurable, default 5)
- **Tiempo por día**: gráfico de tiempo de uso por día del último mes (sin comparación con otros alumnos)
- **Colecciones**: monedas provinciales ganadas, piezas de nave ganadas
**And** cada hijo MUST mostrarse de forma aislada — sin tabla comparativa, sin promedios globales, sin ranking

---

### REQ-PD-03: Server Actions para datos del dashboard

**RFC 2119**: MUST

**Given** un padre autenticado que necesita datos de sus hijos
**When** se invocan las Server Actions del dashboard

**Contract `getChildrenSummary(parentId)`**:
```
getChildrenSummary(parentId: string): Promise<Array<{
  studentId: string;
  studentName: string;
  level: number;
  title: string;
  conceptsMasteredThisWeek: number;
  totalTimeMinutesThisWeek: number;
  status: 'progressing' | 'stuck' | 'inactive';
}>>
```

**Contract `getStudentDetail(parentId, studentId)`**:
```
getStudentDetail(
  parentId: string,
  studentId: string
): Promise<{
  studentId: string;
  studentName: string;
  level: number;
  title: string;
  conceptsMastered: ConceptMastery[];
  conceptsInProgress: ConceptMastery[];
  conceptsStuck: ConceptMastery[];
  dailyTime: DailyTimeEntry[];  // último mes
  coinsCollected: Coin[];
  shipPartsCollected: ShipPart[];
}>
```

**And** las Server Actions MUST validar que el `parentId` es efectivamente padre del `studentId` (RLS)

---

### REQ-PD-04: RLS garantiza que padre solo ve sus hijos

**RFC 2119**: MUST

**Given** la tabla `students` y las tablas de datos del alumno en Supabase
**When** un padre autenticado hace consultas a través de Server Actions
**Then** las políticas RLS MUST garantizar:
- Un padre SOLO puede ver datos de alumnos donde `students.parent_id` coincide con su `auth.uid()`
- Un padre NO puede acceder a datos de alumnos de otros padres
- Un padre NO puede modificar datos pedagógicos del alumno (solo leer y configurar límites)
**And** las Server Actions MUST verificar la relación padre→hijo ANTES de devolver datos (doble verificación: RLS + lógica de acción)

---

### REQ-PD-05: Sin comparación entre alumnos

**RFC 2119**: MUST

**Given** cualquier pantalla del portal del padre
**When** se muestran datos de progreso
**Then** el dashboard MUST NO mostrar comparaciones entre alumnos (ni entre hijos del mismo padre, ni con promedios generales)
**And** MUST NO mostrar leaderboards, rankings, percentiles, ni métricas relativas a otros alumnos
**And** cada métrica MUST ser absoluta y referida al propio alumno ("Paulina dominó 3 conceptos esta semana" — no "Paulina está en el top 30%")

---

### REQ-PD-06: Diseño sobrio con tipografía Inter y shadcn/ui

**RFC 2119**: MUST

**Given** el diseño del portal del padre
**When** se implementan los componentes visuales
**Then** la tipografía MUST ser Inter (sans-serif estándar para adultos)
**And** MUST NO usarse Andika en el portal del padre (Andika es exclusiva para el alumno)
**And** los componentes MUST usar shadcn/ui con estética default (sin customización lúdica)
**And** la paleta de colores MUST ser profesional y sobria
**And** MUST NO haber confetti, animaciones excesivas, ni elementos de gamificación visual
**And** el layout MUST ser funcional: sidebar con lista de hijos, área principal con detalle