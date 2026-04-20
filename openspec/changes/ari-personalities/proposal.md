# Proposal: Ari Monolítico con Personalidades (Quipu y Tinkú)

## Intent

Implementar el tutor IA Ari en su forma monolítica de Ola 1 (Fase 1.9): un solo LLM con system prompt dinámico que cambia de personalidad según la isla activa del alumno. Quipu (Isla de los Números) guía con metáforas andinas y lógica serena. Tinkú (Isla de los Amigos) acompaña con calidez y reflexión socioemocional. Ari aparece contextualmente y guía con preguntas socráticas, NUNCA da respuestas directas.

Fundamento ético (TINKU.md §10, §6): input validation (no off-topic), output validation (no contenido inapropiado), structured logging, budget cap diario por alumno, auditoría parental completa.

## Scope

### In Scope
- Prompts base en `/prompts/`: `ari-base.md`, `quipu.md`, `tinku.md`
- Server Action `askAri(studentId, conceptId, question)` con composición de prompt y llamada OpenRouter
- Determinación automática de personalidad según isla activa
- Context del alumno en prompt (nivel, p_known del concepto, últimos intentos)
- Guardrails: validación de input (no off-topic), validación de output (no contenido inapropiado)
- Cache de respuestas por (conceptId + situación) con TTL 1 semana
- Budget cap diario por alumno (USD 0.10/día, fallback genérico al superarse, email de alerta)
- Logging estructurado de cada interacción en `ari_conversations`
- Componente `<AriChat />` para UI de conversación
- Trigger automático: tras 2 fallos consecutivos en mismo ejercicio, Ari aparece ofreciendo ayuda (no interrumpe)

### Out of Scope
- Arquitectura multi-agente real (Ola 3+, LangGraph)
- Personalidades adicionales (Voseo, Ñandú, Memo, Color — islas futuras)
- Integración con OpenRAG/Axioma 2.0
- Detección de patrones de frustración vía señales de UI (Ola 2+)
- Respuestas generativas para misiones creativas
- Training/fine-tuning de modelos

## Capabilities

### New Capabilities
- `ari-tutor`: orquestador de tutor IA monolítico con personalidades, guardrails, cache y budget cap
- `ari-chat-ui`: componente de UI de conversación con Ari (chat bubble, botón de ayuda, trigger contextual)

### Modified Capabilities
- `project-bootstrap`: prompts en `/prompts/` como archivos `.md` versionados

## Approach

Arquitectura monolítica con contrato limpio desde día 1. El system prompt se compone dinámicamente: `ari-base.md` + personalidad según isla (`quipu.md` o `tinku.md`). El contrato de interfaz es `{studentContext, conceptContext, question} → {response, needsFollowUp, suggestedAction}`.

Flujo: `askAri()` → determina isla → arma system prompt → obtiene context del alumno (via BKT) → llama OpenRouter (Claude Haiku 4.5) → valida output → loguea en `ari_conversations` → devuelve respuesta.

Cache: key = hash de (conceptId + situación pedagógica), TTL = 7 días. Si hay cache hit, se salta la llamada LLM y se devuelve respuesta cacheada. Esto reduce costos y mejora latencia.

Budget cap: se trackea costo diario por `student_id`. Al superar USD 0.10, Ari responde con fallback genérico ("Seguí intentando, ya estás cerca 💪") y se envía alerta email al equipo.

Guardrails: input validation filtra off-topic (el chico no puede pedir recetas de torta). Output validation filtra contenido inapropiado antes de mostrar al alumno. Ambos son reglas simples, no modelos de ML.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prompts/ari-base.md` | New | Identidad y principios compartidos de Ari |
| `prompts/quipu.md` | New | Personalidad matemática: sereno, metáforas andinas |
| `prompts/tinku.md` | New | Personalidad socioemocional: cálido, reflexivo, empático |
| `src/app/actions/ari.ts` | New | Server Action askAri con orquestación completa |
| `src/lib/ari/prompt-builder.ts` | New | Composición dinámica de system prompt |
| `src/lib/ari/guardrails.ts` | New | Validación de input y output |
| `src/lib/ari/cache.ts` | New | Cache simple de respuestas por concepto+situación |
| `src/lib/ari/budget.ts` | New | Budget cap diario por alumno con tracking de costos |
| `src/components/ari/AriChat.tsx` | New | UI de conversación con Ari |
| `src/stores/ari-store.ts` | New | Zustand store para estado de chat de Ari en cliente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Costos de IA más altos de lo estimado | Med | Budget cap estricto, cache agresivo, métricas diarias, fallback genérico |
| Calidad inconsistente de respuestas Haiku | Med | Guardrails de output, logged para auditoría, iteración de prompts |
| Latencia alta en llamadas LLM (>3s) | Med | Cache reduce llamadas, streaming vía SSE para UX, timeout de 10s con fallback |
| Chicos encuentran formas de evadir guardrails | Med | Input validation con lista ampliada, logging de intentos, revisión semanal |
| Cache devuelve respuesta incorrecta para contexto similar | Bajo | Key de cache incluye situación pedagógica, no solo conceptId; TTL de 7 días limita stale data |

## Rollback Plan

Los prompts son archivos `.md` que se pueden revertir via Git. Si Ari causa problemas, se puede desactivar el trigger automático (los 2 fallos) y dejar solo el botón manual. El fallback genérico ya está diseñado como circuit breaker. Para rollback completo: desactivar `askAri()` y mostrar solo botón de ayuda sin funcionalidad de chat, las tablas `ari_conversations` quedan pero no se consumen.

## Dependencies

- **Fase 1.2**: tabla `ari_conversations` en schema de Supabase con RLS
- **Fase 1.6**: motor BKT para obtener `p_known` y estado del concepto del alumno (contexto del prompt)
- **Fase 1.7**: componentes de ejercicio para detectar 2 fallos consecutivos y trigger de aparición de Ari
- **Fase 1.4**: auth para identificar al alumno autenticado
- **OpenRouter**: API key configurada, SDK integrado (hecho en bootstrap)

## Success Criteria

- [ ] Alumno se traba en ejercicio de Números → Ari aparece con personalidad Quipu → ofrece pista socrática sin dar respuesta directa
- [ ] Alumno se traba en ejercicio de Amigos → Ari aparece con personalidad Tinkú → ofrece reflexión empática
- [ ] System prompt se compone dinámicamente según isla activa
- [ ] Budget cap funciona: al superar USD 0.10/día, Ari responde con fallback genérico y se registra alerta
- [ ] Cache funciona: segunda pregunta similar dentro de 7 días devuelve respuesta cacheada sin llamada LLM
- [ ] Input validation bloquea off-topic; output validation bloquea contenido inapropiado
- [ ] Cada interacción queda logged en `ari_conversations` con timestamp, studentId, islandId, conceptId, tokens, latencia
- [ ] Trigger de 2 fallos funciona sin interrumpir al alumno que no quiere ayuda
- [ ] Padre puede ver historial completo de interacciones de su hijo (auditoría parental)