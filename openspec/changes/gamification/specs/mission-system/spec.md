# Delta Spec: mission-system (ADDED)

## Capability
`mission-system` — Misiones diarias, semanales y exploratorias con tracking de progreso, rotación, y Server Actions.

## ADDED Requirements

### REQ-MS-01: Seed de tipos de misión

**RFC 2119**: MUST

**Given** el seed `seeds/missions.yml` ejecutado contra la tabla de misiones
**When** se consultan las misiones disponibles
**Then** MUST existir al menos:
- 5 tipos de misiones pedagógicas diarias (ej: "Hacé 5 ejercicios de suma hoy", "Practicá durante 10 minutos")
- 3 tipos de misiones pedagógicas semanales (ej: "Dominá 3 conceptos esta semana", "Completá el repaso diario 5 veces esta semana")
- Pool de misiones exploratorias no-pedagógicas (ej: "Escuchá el volcán de la Isla de los Números durante 10 segundos", "Encontrá el cóndor escondido en el mapa")
**And** cada misión tipo MUST tener: `id`, `type` (daily|weekly|exploratory), `title`, `description`, `objective`, `xp_reward`, `coin_reward` (solo diarias), `ship_part_reward` (solo semanales)

---

### REQ-MS-02: Rotación de misiones diarias

**RFC 2119**: MUST

**Given** un alumno que accede al sistema en un nuevo día
**When** se seleccionan las misiones diarias activas para ese alumno
**Then** el sistema MUST seleccionar misiones del pool diario usando la fecha como seed de rotación
**And** las misiones diarias MUST resetearse completamente cada día a medianoche (hora Argentina)
**And** un alumno dedicado MUST percibir variedad en las misiones de día a día

---

### REQ-MS-03: Rotación de misiones semanales

**RFC 2119**: MUST

**Given** un alumno que accede al sistema en una nueva semana
**When** se seleccionan las misiones semanales activas
**Then** el sistema MUST seleccionar misiones del pool semanal usando el número de semana como seed de rotación
**And** las misiones semanales MUST resetearse cada lunes a medianoche (hora Argentina)
**And** las recompensas de misiones semanales MUST incluir XP grande y una pieza de nave

---

### REQ-MS-04: Misiones exploratorias no-pedagógicas

**RFC 2119**: SHOULD

**Given** el mundo explorable del alumno (islas y mapa global)
**When** se presentan misiones exploratorias
**Then** las misiones exploratorias SHOULD tener objetivos de exploración pura (no pedagógica)
**And** las recompensas de misiones exploratorias SHOULD ser estéticas (piezas de nave, cosméticos menores)
**And** las misiones exploratoriasSHOULD ser opcionales y no bloquear progresión

---

### REQ-MS-05: Server Action getActiveMissions

**RFC 2119**: MUST

**Given** un alumno autenticado con `studentId`
**When** se invoca `getActiveMissions(studentId)`
**Then** la Server Action MUST devolver:
```
{
  daily: Mission[];    // misiones diarias activas con progreso
  weekly: Mission[];   // misiones semanales activas con progreso
  exploratory: Mission[]; // misiones exploratorias disponibles
}
```
**And** cada misión MUST incluir: `id`, `type`, `title`, `description`, `progress` (current/target), `completed`, `rewards`
**And** el cálculo de progreso MUST basarse en datos reales del alumno (ejercicios completados hoy, conceptos dominados esta semana, etc.)

**Contract**:
```
getActiveMissions(studentId: string): Promise<{
  daily: Mission[];
  weekly: Mission[];
  exploratory: Mission[];
}>
```

---

### REQ-MS-06: Server Action checkMissionProgress

**RFC 2119**: MUST

**Given** un alumno que acaba de realizar una acción pedagógica (completar ejercicio, dominar concepto, etc.)
**When** se invoca `checkMissionProgress(studentId, eventType, payload)`
**Then** la Server Action MUST:
1. Evaluar qué misiones activas se ven afectadas por el evento
2. Actualizar el progreso de las misiones relevantes
3. Si una misión alcanza su objetivo, marcarla como completada
4. Si una misión se completó, llamar a `awardXp` con la recompensa de XP correspondiente
5. Devolver `{ missionsUpdated: Mission[], missionsCompleted: Mission[], xpAwarded: number }`

**Contract**:
```
checkMissionProgress(
  studentId: string,
  eventType: 'exercise_completed' | 'concept_mastered' | 'daily_practice' | 'island_visited' | 'duration_reached',
  payload: Record<string, unknown>
): Promise<{
  missionsUpdated: Mission[];
  missionsCompleted: Mission[];
  xpAwarded: number;
}>
```

---

### REQ-MS-07: Componente MissionsWidget

**RFC 2119**: MUST

**Given** un alumno con misiones activas
**When** se renderiza `<MissionsWidget />` en el mundo global
**Then** el componente MUST mostrar las misiones diarias y semanales activas con su progreso actual
**And** las misiones completadas MUST mostrarse como completadas con estilo visual diferenciado
**And** el componente MUST actualizarse cuando el progreso de una misión cambia
**And** al completar una misión, el componente SHOULD mostrar feedback visual sutil (no celebración grande — eso se reserva para logros mayores)

---

### REQ-MS-08: Misiones creativas documentadas pero no activas

**RFC 2119**: MAY

**Given** el seed de misiones
**When** se evalúa el tipo de misión "creativa"
**Then** las misiones creativas (ej: "Diseñá tu bandera del explorador") MAY estar documentadas en el seed pero NO activas en Ola 1
**And** la infraestructura de tipos de misión MAY soportar el tipo `creative` sin activarlo

---

### REQ-MS-09: Recompensas de misiones son deterministas

**RFC 2119**: MUST

**Given** el diseño de recompensas de misiones
**When** un alumno completa una misión
**Then** la recompensa MUST ser determinista y conocida de antemano
**And** las misiones diarias MUST dar XP + 1 moneda provincial
**And** las misiones semanales MUST dar XP grande + 1 pieza de nave
**And** las misiones exploratorias MUST dar pequeñas recompensas estéticas
**And** MUST NO haber recompensas aleatorias o loot box mechanics