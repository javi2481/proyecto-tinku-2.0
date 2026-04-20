# Delta Spec: ship-upgrades (ADDED)

## Capability
`ship-upgrades` — Apariencias visuales de la nave del alumno ligadas al título naval, y 5 piezas coleccionables de nave ganadas vía misiones exploratorias.

## ADDED Requirements

### REQ-SU-01: 5 apariencias de nave según título naval

**RFC 2119**: MUST

**Given** un alumno con un nivel y título naval específico
**When** se renderiza la nave del alumno en el mapa global o en el perfil
**Then** la apariencia visual de la nave MUST corresponder al título naval actual:

| Título | Niveles | Apariencia |
|--------|---------|------------|
| Explorador Novato | 1-5 | Balsa simple |
| Marinero | 6-15 | Barco básico |
| Navegante | 16-25 | Barco con velas mejoradas |
| Capitán | 26-35 | Galeón con velas trabajadas |
| Almirante | 36-45 | Nave completa iluminada |
| Explorador Legendario | 46-50 | Nave única con detalles míticos |

**And** la transición de apariencia MUST ocurrir al subir de nivel que cruza un umbral de título
**And** la apariencia anterior MUST NO estar disponible simultáneamente (es reemplazada, no acumulada)

---

### REQ-SU-02: Seed de apariencias de nave

**RFC 2119**: MUST

**Given** el seed `seeds/levels.yml` con datos de apariencias
**When** se ejecuta el seed contra la tabla de apariencias
**Then** cada entrada MUST tener: `title_level` (1-6), `title_name`, `min_level`, `max_level`, `ship_asset_id` (referencia al asset visual)
**And** los 6 rangos de título MUST cubrir todos los niveles del 1 al 50 sin gaps ni overlaps

---

### REQ-SU-03: 5 piezas coleccionables de nave

**RFC 2119**: MUST

**Given** el sistema de misiones exploratorias
**When** un alumno completa una misión exploratoria que otorga pieza de nave
**Then** el sistema MUST otorgar exactamente una de las 5 piezas coleccionables:

| Pieza | Nombre | Ganada vía |
|-------|--------|------------|
| Velas | "Velas del Explorador" | Misión exploratoria 1 |
| Banderín | "Banderín de la Brisa" | Misión exploratoria 2 |
| Pintura | "Pintura Oceánica" | Misión exploratoria 3 |
| Figura de proa | "Figura de Proa del Sur" | Misión exploratoria 4 |
| Linterna | "Linterna del Horizonte" | Misión exploratoria 5 |

**And** las piezas son decorativas, NO funcionales (no mejoran stats ni desbloquean contenido)
**And** las piezas MUST persistir en Supabase (tabla `student_ship_parts`)
**And** las piezas ganadas MUST ser visibles en la sección de perfil del alumno

---

### REQ-SU-04: Prevención de duplicados en piezas de nave

**RFC 2119**: MUST

**Given** un alumno que ya posee una pieza de nave específica
**When** se intenta otorgar la misma pieza nuevamente
**Then** el sistema MUST prevenir duplicados usando constraint UNIQUE en `(student_id, ship_part_id)`
**And** MUST devolver silenciosamente `{ awarded: false }` sin error

---

### REQ-SU-05: Piezas de nave no son funcionales

**RFC 2119**: MUST

**Given** el diseño de las piezas coleccionables de nave
**When** se evalúa si las piezas tienen algún efecto mecánico
**Then** las piezas MUST ser estrictamente decorativas — NO afectan velocidad, stats, desbloqueo de contenido, ni progresión
**And** la recompensa es puramente estética: visual diferenciado en la nave del alumno