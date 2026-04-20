# Delta Spec: gamification-engine (ADDED)

## Capability
`gamification-engine` — Sistema de XP, niveles 1-50 con títulos navales, curva de progresión, y detección de levelup vía Server Actions.

## ADDED Requirements

### REQ-GE-01: Tabla student_levels con curva de XP y títulos navales

**RFC 2119**: MUST

**Given** un alumno nuevo que nunca interactuó con gamificación
**When** se crea su registro en `student_levels`
**Then** el nivel inicial MUST ser 1, el XP acumulado MUST ser 0, y el título naval MUST ser "Explorador Novato"

---

### REQ-GE-02: Seed de niveles y títulos navales

**RFC 2119**: MUST

**Given** el seed `seeds/levels.yml` ejecutado contra la tabla de niveles
**When** se consultan los títulos navales por rango de nivel
**Then** los títulos MUST mapear exactamente así:
- Niveles 1-5 → Explorador Novato
- Niveles 6-15 → Marinero
- Niveles 16-25 → Navegante
- Niveles 26-35 → Capitán
- Niveles 36-45 → Almirante
- Niveles 46-50 → Explorador Legendario

---

### REQ-GE-03: Curva de XP progresiva pero no exponencial desmotivadora

**RFC 2119**: MUST

**Given** el seed `seeds/levels.yml` con curva de XP tuneable
**When** se calcula el XP requerido para pasar del nivel N al nivel N+1
**Then** pasar del nivel 1 al 10 MUST ser rápido (un alumno dedicado lo logra en ~5 sesiones)
**And** pasar del nivel 40 al 50 MUST requerir dedicación sostenida pero ser alcanzable en un ciclo escolar
**And** la curva MUST ser monótona creciente pero NO exponencial desmotivadora
**And** los valores de XP requerido por nivel MUST estar parametrizados en el seed para ajuste sin cambio de código

---

### REQ-GE-04: Server Action awardXp

**RFC 2119**: MUST

**Given** un alumno autenticado con `studentId`
**When** se invoca `awardXp(studentId, amount)`
**Then** la Server Action MUST:
1. Incrementar `total_xp` en `student_levels` por `amount`
2. Recalcular el nivel actual basado en la curva de XP del seed
3. Si el nivel cambió respecto al anterior, actualizar `level` y `title` en `student_levels`
4. Devolver `{ levelUp: boolean, newLevel: number, newTitle: string, totalXp: number }`
5. Ejecutarse como operación atómica (transacción o UPSERT con retorno)

**Contract**:
```
awardXp(studentId: string, amount: number): Promise<{
  levelUp: boolean;
  newLevel: number;
  newTitle: string;
  totalXp: number;
}>
```

---

### REQ-GE-05: Cálculo de XP según reglas de TINKU.md §9.2

**RFC 2119**: MUST

**Given** un alumno que completa una acción pedagógica
**When** se determina el monto de XP a otorgar
**Then** el cálculo MUST seguir estas reglas:

| Evento | XP |
|--------|----|
| Ejercicio correcto, primer intento | XP base (definido en seed) |
| Ejercicio correcto, segundo intento | XP base × 0.5 |
| Ejercicio correcto, tras hint | XP base × 0.33 |
| Concepto dominado primera vez | Bonus grande (definido en seed) |
| Misión completada | XP según tipo de misión (seed) |
| Racha diaria (streak de días consecutivos) | Bonus pequeño (definido en seed) |

**And** reintentar ejercicios fáciles ya dominados MUST NO otorgar XP adicional significativo (anti-farming)

---

### REQ-GE-06: Cálculo de XP ejecutado server-side

**RFC 2119**: MUST

**Given** cualquier lógica de cálculo de XP
**When** se determina el monto a otorgar
**Then** el cálculo MUST ejecutarse íntegramente en Server Actions (server-side)
**And** el cliente MUST NO enviar el monto de XP calculado — solo el evento (acierto, segundo intento, etc.)
**And** la Server Action MUST calcular el monto basándose en el tipo de evento y el estado del alumno

---

### REQ-GE-07: Estado de gamificación almacenado en Supabase

**RFC 2119**: MUST

**Given** cualquier estado del sistema de gamificación (nivel, XP, títulos, monedas, misiones)
**When** se persiste ese estado
**Then** MUST almacenarse en Supabase (PostgreSQL con RLS)
**And** MUST NO almacenarse en `localStorage`, `sessionStorage`, ni ningún mecanismo del browser para estado pedagógico
**And** la excepción para preferencias de UI (sonido on/off, reducir movimiento) MAY usar localStorage

---

### REQ-GE-08: Componente LevelBadge

**RFC 2119**: MUST

**Given** un alumno con nivel y título naval
**When** se renderiza `<LevelBadge />`
**Then** el componente MUST mostrar el título naval actual y el número de nivel
**And** MUST reflejar cambios de nivel en tiempo real (via suscripción o re-fetch tras `awardXp`)

---

### REQ-GE-09: Detección y notificación de levelup

**RFC 2119**: MUST

**Given** un alumno que acaba de ganar XP suficiente para subir de nivel
**When** `awardXp` detecta un levelup
**Then** el sistema MUST emitir un evento que dispare la celebración de nivel (`celebrations` capability, nivel "medio")
**And** el componente `<LevelBadge />` MUST actualizarse al nuevo título y nivel
**And** la nave del alumno MUST cambiar visualmente al correspondiente al nuevo título (`ship-upgrades` capability)

---

### REQ-GE-10: Ausencia de mecánicas extractivas

**RFC 2119**: MUST

**Given** el sistema de gamificación completo
**When** se evalúa cualquier mecánica de progresión
**Then** MUST NO existir:
- Vidas limitadas que se agoten
- Loot boxes o recompensas aleatorias de valor funcional
- Leaderboards públicos o comparación entre alumnos
- FOMO, wait timers, o dark patterns que presionen al alumno a volver por urgencia artificial
- Monedas que se pierdan o gasten (las monedas son solo colección, sin economía)