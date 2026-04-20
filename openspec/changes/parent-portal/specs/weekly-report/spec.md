# Delta Spec: weekly-report (ADDED)

## Capability
`weekly-report` — Generación y envío automático de reporte semanal por email cada domingo, con resumen del progreso del hijo, usando Resend.

## ADDED Requirements

### REQ-WR-01: Reporte semanal automático cada domingo

**RFC 2119**: MUST

**Given** alumnos con actividad durante la semana
**When** se ejecuta el cron semanal (domingo a las 9:00 AM hora Argentina)
**Then** el sistema MUST generar un reporte para cada alumno con actividad
**And** enviar el reporte por email al padre asociado
**And** el scheduler MUST usar Supabase Edge Function o API Route de Next.js como mecanismo de cron

---

### REQ-WR-02: Contenido del reporte semanal

**RFC 2119**: MUST

**Given** un alumno con actividad en la semana pasada
**When** se genera el reporte semanal
**Then** el email MUST contener:
- Nombre del hijo
- Cantidad de conceptos dominados esta semana
- Cantidad de conceptos en progreso
- Tiempo total de uso esta semana (en minutos)
- Racha de días consecutivos actual
- Si el chico no progresa en algún concepto: mención honesta con sugerencia de intervención
**And** si el alumno no tiene suficiente data (primera semana), el reporte MUST mostrar un mensaje alternativo: "Primer semana, los datos se van a ir completando"
**And** el reporte MUST NO comparar con otros alumnos

---

### REQ-WR-03: Reporte honesto — si el chico no progresa, se dice

**RFC 2119**: MUST

**Given** un alumno que no mejoró en uno o más conceptos esta semana
**When** se genera la sección correspondiente del reporte
**Then** el reporte MUST mencionarlo con dignidad y calidez
**And** el tono MUST ser: "Paulina está trabajando en resta simple y parece que le cuesta un poco más — tal vez un momento juntos la ayude a ganar confianza."
**And** MUST NO suavizar datos que muestren falta de progreso
**And** MUST NO usar lenguaje alarmista

---

### REQ-WR-04: Template HTML responsive del reporte

**RFC 2119**: MUST

**Given** el reporte semanal generado
**When** se envía por email
**Then** el email MUST usar template HTML responsive generado desde `src/templates/weekly-report.tsx`
**And** el template MUST verse bien en Gmail y clientes de email móviles
**And** el diseño del email MUST seguir la estética del portal padre: sobrio, profesional, Inter, sin gamificación
**And** el email MUST incluir un enlace al dashboard del padre para ver más detalle

---

### REQ-WR-05: Envío via Resend

**RFC 2119**: MUST

**Given** el reporte semanal generado y listo para enviar
**When** se envía el email
**Then** el sistema MUST usar la API de Resend para el envío
**And** el email MUST enviarse desde un dominio verificado (SPF/DKIM configurados)
**And** el remitente MUST ser un dominio propio de Tinku (no @gmail ni @resend.dev)
**And** en caso de fallo de envío, el sistema MUST reintentar hasta 3 veces con backoff exponencial
**And** los fallos de envío MUST loguearse para auditoría

---

### REQ-WR-06: Batch processing para múltiples hijos

**RFC 2119**: SHOULD

**Given** un padre con múltiples hijos y/o múltiples padres en la base de datos
**When** el cron genera reportes
**Then** el sistema SHOULD procesar los reportes en batch de máximo 50 por ejecución de Edge Function
**And** si hay más de 50 padres, SHOULD dividir en múltiples ejecuciones
**And** el sistema SHOULD loguear la cantidad de reportes enviados, fallidos y omitidos (sin data suficiente)

---

### REQ-WR-07: Manejo de alumnos sin data suficiente

**RFC 2119**: MUST

**Given** un alumno que no tuvo actividad suficiente esta semana (ej: primera semana, menos de 5 minutos de uso)
**When** se evalúa si incluir al alumno en el reporte
**Then** el sistema MUST incluir al alumno con un mensaje alternativo
**And** MUST NO omitir al alumno sin mención
**And** el mensaje alternativo MUST ser: "Primer semana, los datos se van a ir completando" o "Esta semana tuvo poca actividad — la próxima semana tendrá más información"

---

### REQ-WR-08: Padre puede desactivar el reporte semanal

**RFC 2119**: SHOULD

**Given** un padre que no desea recibir el reporte semanal
**When** el padre configura sus preferencias de notificación
**Then** el padre SHOULD poder desactivar el reporte semanal por email desde `/dashboard/settings`
**And** el sistema SHOULD respetar la preferencia del padre y no enviar el reporte
**And** la configuración MUST persistirse en Supabase y ser accessible vía RLS