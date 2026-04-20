# Proposal: Testing & Ajuste con Observación Real (Phase 1.11)

## Intent

Validar que Tinku funciona con chicos reales. Deploy a producción, integrar observabilidad (Sentry + PostHog, diferidos de 1.1), y ejecutar 2 semanas de observación directa con los 2 hijos de Javier. No es testing técnico — es validación pedagógica con usuarios reales de 6-12 años. Afecta a: **alumno** (uso real), **padre** (observación e interpretación).

## Scope

### In Scope
- Deploy production en Vercel con CI/CD (GitHub Actions)
- Dominio propio (tinku.com.ar o similar) con SSL
- Integración Sentry: error tracking client + server, source maps, alertas
- Integración PostHog: eventos de producto (sesiones, ejercicios, migrations entre escalas)
- Methodology de observación con chicos: protocolo de sesión, rúbrica de notas, tipos de fricción a observar
- Semana 1: sesiones de observación individual con cada hijo
- Semana 2: uso sostenido ~10 min/día con feedback semanal
- Ajustes prioritarios derivados de observación (UX, pedagogía, performance)
- LCP ≤ 3s y 60fps en Android mid-range como targets de validación

### Out of Scope
- Nueva funcionalidad de producto (gamificación, Ari, etc. ya cubierto en 1.5-1.9)
- Apertura a familias externas (eso es Phase 1.12)
- Portal padre — ya cubierto en Phase 1.10
- Compliance legal activo — documentado pero no enforced hasta 1.12

## Capabilities

### New Capabilities
- `production-deployment`: CI/CD pipeline, Vercel deploy, dominio, env vars management
- `observability`: Sentry error tracking, PostHog analytics, event tracking schema
- `observation-validation`: Protocolo de observación pedagógica, rúbrica de fricción, feedback semanal con chicos

### Modified Capabilities
- `project-bootstrap`: Agregar Sentry SDK + PostHog SDK al stack bootstrappeado (config, env vars, wrappers)

## Approach

1. **Infra primero**: deploy a Vercel con dominio, luego CI/CD pipeline que corra lint + typecheck + tests en cada PR.
2. **Observabilidad**: instalar Sentry SDK (client + server), crear wrappers alrededor de Server Actions, configurar source maps. PostHog con evento schema definido (`session_start`, `exercise_attempt`, `concept_mastered`, `island_enter`, `ari_invoke`).
3. **Observación**: Javier observa sin intervenir (2 sesiones individuales primero). Rúbrica: ¿dónde se traba? ¿qué no entiende? ¿qué lo divierte? ¿qué ignora? Semana 2 con uso sostenido y check-ins diarios informales.
4. **Iteración rápida**: issues críticos (crashes, loss de progreso) se arreglan en < 24hs. Issues de UX se priorizan semanalmente.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/` | Modified | Sentry/PostHog providers wrapper en layout |
| `src/lib/sentry.ts` | New | Sentry SDK init + Server Action wrapper |
| `src/lib/posthog.ts` | New | PostHog client + event tracking functions |
| `.github/workflows/` | New | CI/CD: lint, typecheck, test, deploy |
| `next.config.mjs` | Modified | Sentry webpack plugin, source maps upload |
| `docs/observation-protocol.md` | New | Rúbrica y methodology de observación |
| Vercel project config | New | Project, domain, env vars |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Performance en Android mid-range no cumple LCP ≤ 3s | Med | Test con Chrome DevTools throttling antes de observación; lazy-load agresivo de islas no visibles |
| Chicos no entienden la UI sin explicación del adulto | Med | Observación sin intervenir primero; si es necesario, agregar micro-onboarding en primera sesión |
| Sentry/PostHog revienta bundle size | Bajo | Tree-shaking + dynamic import; PostHog lazy-loaded post-hydration |
| Loss de progreso del alumno en producción | Bajo | RLS ya protege datos; test de resistencia con sessiones múltiples antes de observación |

## Rollback Plan

- Vercel permite instant rollback a deploy anterior. Si deployment rompe algo, `vercel rollback` en < 1 minuto.
- Si observación revela issues críticos irreparables en 48hs, se pausa la fase, se vuelve a dev/staging, y se re-planifica.
- Sentry/PostHog se pueden desactivar con feature flags (env vars) sin redeploy.

## Dependencies

- **Todas las fases 1.2-1.10 deben estar completas**: schema, auth, mundo Phaser, motor BKT, ejercicios, gamificación, Ari, portal padre.
- Cuenta Vercel activa con acceso al repo.
- Dominio `tinku.com.ar` (o similar) registrado y DNS accesible.
- Cuentas Sentry + PostHog creadas (proyecto configurado).
- Los 2 hijos de Javier disponibles para las 2 semanas de observación.

## Success Criteria

- [ ] App deployada en Vercel, accesible en dominio propio, HTTPS, LCP ≤ 3s en Android mid-range
- [ ] Sentry captura errores JS client-side y server-side con source maps
- [ ] PostHog trackea eventos de producto: `session_start`, `exercise_attempt`, `concept_mastered`, `island_enter`
- [ ] 60fps estables en Android mid-range (verificado con DevTools)
- [ ] Sin loss de progreso del alumno durante las 2 semanas
- [ ] Sesión de observación completada con cada hijo (notas documentadas)
- [ ] 2 semanas de uso sostenido (~10 min/día) con continuidad voluntaria
- [ ] Progreso pedagógico observable en al menos 1 concepto dominado por hijo
- [ ] CI/CD pipeline corriendo en cada PR (lint + typecheck + test)
- [ ] Ajustes prioritarios identificados y backlog creado