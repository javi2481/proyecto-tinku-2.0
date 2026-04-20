# Delta Spec: project-bootstrap (MODIFIED)

## Capability
`project-bootstrap` — Integración de Resend para email transaccional y configuración del scheduler semanal.

## MODIFIED Requirements

### REQ-PB-PP-01: Dependencia Resend configurada

**RFC 2119**: MUST

**Given** el proyecto bootstrappeado
**When** se inspecciona `package.json`
**Then** `dependencies.resend` MUST existir con versión ^4.x
**And** la variable de entorno `RESEND_API_KEY` MUST estar en `.env.local` y `.env.example`

---

### REQ-PB-PP-02: Edge Function para reporte semanal

**RFC 2119**: MUST

**Given** el directorio de Supabase Edge Functions
**When** se inspecciona `supabase/functions/weekly-report/`
**Then** MUST existir una Edge Function `weekly-report` que:
- Se ejecuta como cron cada domingo a las 9:00 AM hora Argentina
- Genera reportes para cada alumno con actividad
- Envía emails via Resend
- Registra envíos exitosos y fallidos

---

### REQ-PB-PP-03: Template de reporte semanal

**RFC 2119**: MUST

**Given** el proyecto
**When** se inspecciona `src/templates/weekly-report.tsx`
**Then** MUST existir un componente React para email que genera HTML responsive
**And** el template MUST usar tipografía Inter (no Andika)
**And** el template DEBE tener diseño sobrio sin gamificación