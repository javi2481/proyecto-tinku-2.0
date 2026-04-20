# Proposal: Beta Families — Apertura a 5 Familias (Phase 1.12)

## Intent

Expandir la validación de 2 chicos (hijos de Javier) a 5 familias externas (~10 chicos). Activar compliance de privacidad ANTES de abrir a externos (consentimiento parental versionado, anonimización, logs de acceso, portabilidad). Recolectar data real de uso fuera del entorno controlado, y producir retrospectiva de Ola 1 que determine si están dadas las condiciones para apertura pública (Ola 2). Afecta a: **alumno** (onboarding externo), **padre** (consentimiento formal, onboarding asistido).

## Scope

### In Scope
- Activación de compliance legal argentino: consentimiento parental explícito y versionado (Ley 26.061)
- Anonimización automática tras 30 días de inactividad
- Logs de cada acceso a datos de alumnos
- Portabilidad: export de todos los datos del hijo (padre puede descargar)
- Zero advertising, zero data sharing enforcement en UI y legal
- Onboarding asistido via WhatsApp: guía personalizada de Javier para crear cuenta
- Monitoreo de errores a escala: dashboard Sentry con alertas configuradas
- Grupo de WhatsApp con las 5 familias para feedback semanal
- Rúbrica de feedback para padres: preguntas abiertas semanales
- Decisión de salida de Ola 1: retrospectiva escrita con Go/No-Go para Ola 2

### Out of Scope
- Landing pública (Ola 2)
- MercadoPago / monetización (Ola 2)
- Portal docente (Ola 3)
- Nuevas features de producto — solo ajustes basados en feedback
- Compliance formal regulatorio más allá de Ley 26.061 (no es COPPA, es ley argentina)

## Capabilities

### New Capabilities
- `privacy-compliance`: Consentimiento parental versionado, anonimización automática, audit logs, portabilidad de datos
- `onboarding-support`: Flujo de onboarding asistido para familias externas, WhatsApp onboarding guide
- `ola1-retrospective`: Framework de retrospectiva, criterios de salida de Ola 1, Go/No-Go decision template

### Modified Capabilities
- `production-deployment`: Env vars nuevas para consentimiento, logs de acceso, export endpoints
- `observability`: Agregar eventos de privacy (consentimiento otorgado, acceso a datos, export solicitado)

## Approach

1. **Compliance primero, familias después**: No se invita familias hasta que consentimiento parental, anonimización y portabilidad estén funcionando y testeado. Esto es innegociable per TINKU.md §5.5.
2. **Onboarding personalizado**: Javier acompaña a cada familia via WhatsApp. No se lanza un link y se espera — se guía la creación de cuenta, se verifica que el hijo pueda entrar, seStay disponible para consultas.
3. **Feedback estructurado**: Grupo WhatsApp + rúbrica de preguntas semanales (¿qué le gusta? ¿qué le aburre? ¿qué cambiarías? ¿cuánto tiempo usa?). Complementa data cuantitativa de PostHog.
4. **Decisión explícita**: Al cierre, retrospectiva con Go/No-Go basado en criterios de salida de Ola 1 del ROADMAP.md.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(auth)/` | Modified | Consentimiento parental en flow de registro |
| `src/app/(parent)/` | Modified | Pantalla de export de datos del hijo |
| `src/lib/supabase/` | Modified | RLS policies con audit logging |
| `src/app/api/privacy/` | New | Endpoints de export y consentimiento (o Server Actions) |
| `supabase/migrations/` | New | Tabla `consent_versions`, `data_access_logs`, triggres de anonimización |
| `docs/privacy-policy.md` | New | Política de privacidad versionada en español rioplatense |
| `docs/parental-consent.md` | New | Template de consentimiento parental |
| `docs/ola1-retrospective.md` | New | Template de retrospectiva de Ola 1 |
| `docs/onboarding-guide.md` | New | Guía de onboarding para familias (WhatsApp) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Compliance incompleto al invitar familias | Med | No invitar familias hasta que tests de consentimiento + portabilidad + anonimización pasen |
| Padres no entienden el consentimiento | Med | UX simple con lenguaje claro en español rioplatense; disponible desde la primer pantalla de registro |
| Anonimización rompe datos necesarios | Bajo | Anonimizar solo campos PII; preservar datos pedagógicos agregados |
| Familias no dan feedback consistente | Med | Javier guía personalmente; preguntas simples y semanales; refuerzo positivo por WhatsApp |
| Errores de producción con 10 chicos | Med | Sentry alertas configuradas; hotfix process definido; rollback instantáneo |

## Rollback Plan

- Si compliance falla en producción, se desactiva el registro de nuevas familias (feature flag) sin afectar a los 2 hijos de Javier.
- Si una familia tiene issues críticos, se desactiva su cuenta individualmente y se notifica personalmente.
- Los datos de anonimización son irreversibles — se ejecutan solo después de 30 días de inactividad confirmada, con preview antes de commit.
- Si retrospectiva determina No-Go, se pausa Ola 2 y se itera sobre los issues identificados.

## Dependencies

- **Phase 1.11 (testing-adjustment) completa**: observación con los 2 hijos de Javier validada, ajustes prioritarios implementados.
- Compliance legal: asesoramiento sobre Ley 26.061 (o confirmación de que es el marco correcto para la beta).
- 5 familias del WhatsApp de Javier confirmadas y dispuestas.
- Sentry + PostHog operando en producción (de Phase 1.11).
- Cuenta Resend configurada para notificaciones a padres.

## Success Criteria

- [ ] Consentimiento parental versionado implementado y testeado
- [ ] Anonimización automática configurada (30 días inactividad) con test end-to-end
- [ ] Audit logs de acceso a datos de alumnos funcionando
- [ ] Export de datos del hijo disponible (padre descarga JSON/CSV)
- [ ] Zero advertising verificado en UI (sin banners, sin promos)
- [ ] 5 familias onboardedas con asistencia de Javier
- [ ] ≥10 chicos con uso semanal medible (PostHog)
- [ ] Sin errors críticos en producción (Sentry error rate < 0.5%)
- [ ] Feedback semanal recolectado de las 5 familias (mínimo 3 semanas)
- [ ] Retrospectiva de Ola 1 escrita con decisión Go/No-Go documentada
- [ ] Criterios de salida de Ola 1 del ROADMAP.md evaluados honestamente