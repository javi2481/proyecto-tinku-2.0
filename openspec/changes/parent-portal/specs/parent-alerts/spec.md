# Delta Spec: parent-alerts (ADDED)

## Capability
`parent-alerts` — Detección de estancamiento pedagógico (p_known no mejora) y notificación al padre con sugerencia de intervención ("Momento de ayuda del grande").

## ADDED Requirements

### REQ-PA-01: Detección de estancamiento por concepto

**RFC 2119**: MUST

**Given** un alumno que ha intentado un concepto sin mejorar su p_known
**When** el motor BKT registra N intentos consecutivos sin mejora (threshold configurable, default 5)
**Then** el sistema MUST detectar el estancamiento evaluando:
- El `p_known` del concepto no ha aumentado en los últimos N intentos registrados
- N MUST ser configurable por administrador (default: 5 intentos)
**And** al detectarse estancamiento, el sistema MUST crear un registro en la tabla `parent_alerts`

---

### REQ-PA-02: Alerta "Momento de ayuda del grande"

**RFC 2119**: MUST

**Given** un concepto estancado detectado para un alumno
**When** se crea la alerta en `parent_alerts`
**Then** la alerta MUST contener:
- `student_id`: el alumno afectado
- `concept_id`: el concepto donde se estancó
- `concept_name`: nombre legible del concepto
- `p_known_current`: valor actual de p_known
- `attempts_without_improvement`: cantidad de intentos sin mejora
- `suggestion`: texto sugerido de intervención manual (ej: "Paulina está trabajando en resta simple y parece que le cuesta un poco más. Tal vez un momento juntos la ayude a ganar confianza.")
- `status`: `pending` (por defecto)
- `created_at`: timestamp
**And** la sugerencia MUST ser cálida pero honesta — no suaviza el problema, lo presenta con dignidad

---

### REQ-PA-03: Notificación in-app al padre

**RFC 2119**: MUST

**Given** una alerta creada en `parent_alerts`
**When** el padre accede al dashboard
**Then** el dashboard MUST mostrar indicador visual de alertas pendientes
**And** al hacer click en la alerta, el padre MUST ver: nombre del concepto, intentos sin mejora, sugerencia de intervención
**And** el padre MUST poder marcar la alerta como "visto" o "leído"

---

### REQ-PA-04: Notificación email opcional

**RFC 2119**: SHOULD

**Given** una alerta creada en `parent_alerts`
**When** el sistema evalúa si enviar notificación email
**Then** el sistema SHOULD enviar un email al padre con la alerta
**And** el email SHOULD usar el servicio Resend configurado
**And** el padre SHOULD poder configurar si quiere recibir alertas por email o solo in-app (REQ-PC-02)
**And** el email MUST seguir el tono cálido pero honesto del portal

---

### REQ-PA-05: Sugerencia de intervención es digna y honesta

**RFC 2119**: MUST

**Given** el texto de sugerencia de una alerta de estancamiento
**When** se genera el texto de sugerencia
**Then** el texto MUST seguir los principios de TINKU.md §6.3 (honestidad con padres):
- Si el chico no progresa, decirlo con dignidad
- No suavizar datos para mantener suscripción
- Sugerir intervención concreta: "tal vez un momento juntos la ayude"
- MUST NO ser alarmista ni usar lenguaje negativo sobre el alumno
- El tono MUST ser: "está trabajando en X y parece que le cuesta un poco más"

---

### REQ-PA-06: RLS en tabla parent_alerts

**RFC 2119**: MUST

**Given** la tabla `parent_alerts` en Supabase
**When** se aplican políticas de acceso
**Then** las políticas RLS MUST garantizar:
- Un padre SOLO puede ver alertas de sus propios hijos
- Un padre NO puede ver alertas de hijos de otros padres
- Un padre puede marcar sus propias alertas como "leído"
- Solo el sistema (service role) puede crear alertas