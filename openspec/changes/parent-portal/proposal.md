# Proposal: Portal Padre Básico — Dashboard, Alertas y Reportes Semanales

## Intent

Implementar el portal del padre (Ola 1, Fase 1.10): dashboard sobrio y profesional donde el padre ve progreso real de cada hijo, recibe alertas cuando un concepto no mejora ("Momento de ayuda del grande"), y obtiene un reporte semanal por email. El diseño es deliberadamente NO gamificado — tipografía sans-serif estándar (no Andika), componentes shadcn/ui con estética default, sin confetti, sin emojis excesivos. Reportes cálidos pero honestos: si el chico no progresa, se dice con dignidad.

Fundamento ético (TINKU.md §3.2, §15): no hay leaderboards, no se compara entre niños, los datos son del hijo individual, el padre puede exportar todo y tiene consentimiento versionado.

## Scope

### In Scope
- Pantalla `/dashboard` con lista de hijos del padre y resumen por hijo (nivel, conceptos dominados esta semana, tiempo de uso)
- Pantalla `/dashboard/[student-id]` con detalle: conceptos dominados, en progreso, trabados; tiempo por día del último mes; colecciones
- Alerta "Momento de ayuda del grande": detección de concepto con p_known estancado tras N intentos, notificación al padre con sugerencia de intervención manual
- Reporte semanal automático por email (Resend): cada domingo, resumen de la semana del hijo, template HTML responsive, tono cálido pero honesto
- Configuración parental: límite diario de tiempo, horario permitido
- Acceso basado en RLS: padre solo ve datos de sus propios hijos

### Out of Scope
- Portal docente (Ola 3+)
- Analytics avanzados o recomendaciones generativas (Ola 4+)
- Exportación de datos completa (se documenta pero no se implementa en Ola 1)
- Consentimiento parental versionado (documentado pero合规 es post-beta)
- Monetización / MercadoPago (Ola 2+)
- Comparación entre niños (nunca, anti-roadmap)

## Capabilities

### New Capabilities
- `parent-dashboard`: UI sobria y profesional para que el padre vea progreso real de sus hijos
- `parent-alerts`: detección de estancamiento pedagógico y notificación al padre
- `weekly-report`: generación y envío automático de reporte semanal por email (Resend)
- `parental-controls`: configuración de límites de tiempo y horarios permitidos

### Modified Capabilities
- `project-bootstrap`: integración de Resend para email transaccional

## Approach

Panel del padre es una ruta protegida (`/dashboard`) con Server Components por defecto. La autenticación ya está cubierta por Fase 1.4 (auth del padre con email+password + Google OAuth). RLS garantiza que el padre solo accede a datos de sus hijos.

Layout: sidebar con lista de hijos, área principal con detalle. Tipografía sans-serif estándar (Inter, no Andika), componentes shadcn/ui sin customización lúdica. Es deliberadamente SOBER — información real sin adorno.

Reporte semanal: cron job (Edge Function de Supabase o API Route de Next.js) corre cada domingo a las 9am AR. Genera resumen por alumno: conceptos dominados, en progreso, trabados, tiempo total, racha. Envía via Resend con template HTML responsive. Si el chico no progresa, el reporte lo dice con calidez: "Paulina está trabajando en resta simple y parece que le cuesta un poco más — tal vez un momento juntos la ayude a ganar confianza."

Alertas de estancamiento: se detecta cuando `p_known` de un concepto no mejora tras N intentos (threshold configurable, default 5). Se crea registro en tabla `parent_alerts` y se notifica al padre via in-app notification + email opcional.

Controles parentales: el padre establece límite diario (en minutos) y horario permitido (rango de horas). Se aplican en Server Actions relevantes vía middleware check.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/page.tsx` | New | Server Component — lista de hijos con resumen |
| `src/app/dashboard/[student-id]/page.tsx` | New | Server Component — detalle de un hijo |
| `src/app/dashboard/settings/page.tsx` | New | Controles parentales |
| `src/app/actions/parent.ts` | New | Server Actions para datos del dashboard |
| `src/lib/parent/alerts.ts` | New | Detección de estancamiento y creación de alertas |
| `src/lib/parent/reports.ts` | New | Generación de reporte semanal |
| `src/lib/parent/controls.ts` | New | Validación de límites de tiempo y horarios |
| `supabase/functions/weekly-report/` | New | Edge Function que corre cada domingo |
| `src/templates/weekly-report.tsx` | New | Template HTML responsive del reporte |
| `supabase/migrations/` | Modified | Nuevas RLS policies para tablas parentales |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Reporte semanal con datos insuficientes (alumno nuevo) | Med | Template con mensaje alternativo si no hay enough data: "Primer semana, los datos se van a ir completando" |
| Edge Function timeout en generación de reportes para muchos hijos | Bajo | Generar reportes en batch con cola, límite de 50 por ejecución, reintentos |
| Padre compara hijos entre sí viendo múltiples perfiles | Med | Mostrar cada hijo de forma aislada, sin tabla comparativa, sin promedios globales |
| Configuración de límites demasiado estricta causa frustración en el alumno | Med | Defaults razonables (60 min/día, horario 7am-9pm), UI que explica el impacto de cada límite |
| Resend no entrega emails (spam filter) | Med | Configurar SPF/DKIM, usar dominio propio, testear con Gmail/Hotmail antes de beta |

## Rollback Plan

Los Server Actions son aditivos. Si el portal causa problemas, se puede desactivar las rutas `/dashboard/*` sin afectar al alumno. Los reportes semanales se pueden pausar desactivando la Edge Function del cron. Las alertas se pueden silenciar cambiando el threshold a un número alto. Para rollback completo: eliminar las rutas del dashboard, mantener las tablas y RLS (no son destructivas).

## Dependencies

- **Fase 1.2**: schema de Supabase con tablas `students`, `student_concept_state`, `student_levels` y RLS
- **Fase 1.4**: auth del padre (email+password + Google OAuth)
- **Fase 1.6**: datos de `p_known` del motor BKT para mostrar conceptos dominados/en progreso/trabados
- **Fase 1.8**: datos de gamificación (nivel, monedas) para mostrar en el dashboard
- **Resend**: cuenta configurada con dominio verificado para emails transaccionales

## Success Criteria

- [ ] Padre accede a `/dashboard` y ve lista de hijos con resumen (nivel, conceptos dominados semanales, tiempo)
- [ ] Padre accede a `/dashboard/[student-id]` y ve detalle: conceptos dominados, en progreso, trabados con `p_known`
- [ ] Alerta "Momento de ayuda del grande" se dispara cuando concepto no mejora tras 5 intentos
- [ ] Padre recibe reporte semanal por email cada domingo con resumen cálido y honesto
- [ ] Padre puede configurar límite diario de tiempo y horario permitido para cada hijo
- [ ] RLS funciona: padre SOLO ve datos de sus propios hijos, no puede acceder a datos de otros alumnos
- [ ] UI es sobria y profesional: tipografía estándar, sin gamificación, sin Andika, sin confetti
- [ ] Reporte es honesto: si el chico no progresa, lo dice con dignidad y sugiere intervención