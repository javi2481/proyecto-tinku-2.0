# Delta Spec: parental-controls (ADDED)

## Capability
`parental-controls` — Configuración parental de límites de tiempo diario y horarios permitidos, con enforcement en Server Actions.

## ADDED Requirements

### REQ-PC-01: Límite diario de tiempo

**RFC 2119**: MUST

**Given** un padre que configura límites de uso para su hijo
**When** el padre establece un límite diario en minutos
**Then** el sistema MUST almacenar la configuración en Supabase (tabla `parental_controls`)
**And** el valor por defecto MUST ser 60 minutos por día
**And** el padre MUST poder seleccionar entre valores predefinidos (30, 45, 60, 90, 120 minutos) o un valor personalizado
**And** el límite MUST ser por hijo (cada hijo puede tener diferente límite)

---

### REQ-PC-02: Horario permitido

**RFC 2119**: MUST

**Given** un padre que configura horarios de uso para su hijo
**When** el padre establece un horario permitido
**Then** el sistema MUST almacenar el rango de horas en `parental_controls`
**And** el valor por defecto MUST ser 7:00 AM a 9:00 PM (hora Argentina)
**And** el padre MUST poder configurar el rango de horas permitido
**And** fuera del horario permitido, el alumno MUST ver un mensaje amigable: "¡Es hora de descansar! Volvé mañana." (no un bloqueo agresivo)

---

### REQ-PC-03: Enforcement de límites en Server Actions

**RFC 2119**: MUST

**Given** un alumno autenticado que intenta usar la plataforma
**When** se ejecuta una Server Action que involucra tiempo de uso
**Then** la Server Action MUST verificar:
1. Tiempo acumulado hoy vs. límite diario configurado por el padre
2. Hora actual vs. horario permitido configurado por el padre
**And** si el límite diario se alcanzó, la Server Action MUST devolver un estado que el frontend interprete como "tiempo agotado"
**And** si está fuera de horario, la Server Action MUST devolver un estado que el frontend interprete como "fuera de horario"
**And** el frontend MUST mostrar el mensaje amigable correspondiente

---

### REQ-PC-04: Pantalla de configuración /dashboard/settings

**RFC 2119**: MUST

**Given** un padre autenticado
**When** el padre accede a `/dashboard/settings`
**Then** la página MUST mostrar configuración para cada hijo:
- Límite diario de tiempo (minutos)
- Horario permitido (rango de horas)
- Preferencias de notificaciones (email semanal on/off, alertas de estancamiento on/off)
**And** los cambios MUST guardarse vía Server Action
**And** el diseño MUST seguir la estética del portal padre (Inter, shadcn/ui default, sin gamificación)

---

### REQ-PC-05: Server Actions de configuración parental

**RFC 2119**: MUST

**Given** un padre que modifica configuración para un hijo
**When** se invocan las Server Actions de configuración

**Contract `getParentalControls(parentId, studentId)`**:
```
getParentalControls(
  parentId: string,
  studentId: string
): Promise<{
  dailyTimeLimitMinutes: number;    // default 60
  allowedHoursStart: string;          // "07:00"
  allowedHoursEnd: string;            // "21:00"
  weeklyReportEnabled: boolean;        // default true
  stagnationAlertsEnabled: boolean;    // default true
}>
```

**Contract `updateParentalControls(parentId, studentId, config)`**:
```
updateParentalControls(
  parentId: string,
  studentId: string,
  config: {
    dailyTimeLimitMinutes?: number;
    allowedHoursStart?: string;
    allowedHoursEnd?: string;
    weeklyReportEnabled?: boolean;
    stagnationAlertsEnabled?: boolean;
  }
): Promise<{ success: boolean }>
```

**And** las Server Actions MUST validar que `parentId` es padre de `studentId` (RLS + lógica)

---

### REQ-PC-06: Defaults razonables

**RFC 2119**: MUST

**Given** un alumno cuyo padre no ha configurado controles parentales
**When** se evalúan los límites
**Then** los valores por defecto MUST ser:
- Límite diario: 60 minutos
- Horario permitido: 7:00 AM a 9:00 PM (hora Argentina)
- Reporte semanal: habilitado
- Alertas de estancamiento: habilitadas
**And** el sistema MUST funcionar correctamente con estos defaults sin configuración explícita del padre

---

### REQ-PC-07: Mensaje amigable al alumno cuando se alcanza el límite

**RFC 2119**: MUST

**Given** un alumno cuyo límite diario de tiempo se ha alcanzado
**When** la plataforma detecta el límite
**Then** el alumno MUST ver un mensaje amigable, no punitivo
**And** el mensaje MUST ser: "¡Es hora de descansar! Volvé mañana." o similar
**And** MUST NO ser agresivo, culpabilizante, ni usar mecánicas de retención ("¿estás seguro?")
**And** MUST NO mostrar confetti ni celebración excesiva por el límite

---

### REQ-PC-08: RLS en tabla parental_controls

**RFC 2119**: MUST

**Given** la tabla `parental_controls` en Supabase
**When** se aplican políticas de acceso
**Then** las políticas RLS MUST garantizar:
- Un padre SOLO puede leer y modificar configuración de sus propios hijos
- Un padre NO puede acceder a configuración de hijos de otros padres
- Un alumno NO puede modificar su propia configuración de límites