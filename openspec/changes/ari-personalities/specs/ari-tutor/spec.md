# Delta Spec: ari-tutor (ADDED)

## Capability
`ari-tutor` — Orquestador de tutor IA monolítico con personalidades dinámicas (Quipu para matemática, Tinkú para socioemocional), guardrails de input/output, cache de respuestas, budget cap diario, y logging estructurado.

## ADDED Requirements

### REQ-AT-01: Archivos de prompt versionados en /prompts/

**RFC 2119**: MUST

**Given** el sistema de personalidades de Ari
**When** se inspecciona el directorio `/prompts/`
**Then** MUST existir `prompts/ari-base.md` con la identidad y principios compartidos de Ari (tutor socrático, voseo rioplatense, nunca da respuestas directas)
**And** MUST existir `prompts/quipu.md` con la personalidad matemática (tono sereno, metáforas andinas, lógica)
**And** MUST existir `prompts/tinku.md` con la personalidad socioemocional (calidez, reflexión, empatía)
**And** los archivos MUST estar versionados en Git
**And** los archivos MUST ser `.md` (Markdown) para iteración rápida sin tocar código

---

### REQ-AT-02: Composición dinámica de system prompt según isla activa

**RFC 2119**: MUST

**Given** un alumno que está en una isla específica
**When** se determina qué personalidad usar para la llamada a Ari
**Then** el sistema MUST componer el system prompt concatenando `ari-base.md` + personalidad según isla:
- Isla de los Números → `ari-base.md` + `quipu.md`
- Isla de los Amigos → `ari-base.md` + `tinku.md`
- Sin isla / contexto ambiguo → `ari-base.md` solo (sin personalidad adicional)
**And** la personalidad MUST determinarse automáticamente según la isla activa del alumno
**And** el system prompt compuesto MUST incluir contexto del alumno (nivel, p_known del concepto, últimos intentos)

---

### REQ-AT-03: Server Action askAri

**RFC 2119**: MUST

**Given** un alumno autenticado que necesita ayuda pedagógica
**When** se invoca `askAri(studentId, conceptId, question)`
**Then** la Server Action MUST ejecutar el siguiente flujo:

1. **Determinar isla** → inferir personalidad → componer system prompt
2. **Obtener contexto del alumno** → nivel, p_known del concepto, historial reciente
3. **Validar input** → `guardrails.validateInput(question)` (REQ-AT-07)
4. **Verificar budget cap** → `budget.checkDailyCap(studentId)` (REQ-AT-09)
5. **Verificar cache** → `cache.get(conceptId + situationHash)` (REQ-AT-08)
   - Si hay cache hit válido → devolver respuesta cacheada, saltar pasos 6-8
6. **Llamar OpenRouter** → modelo Claude Haiku 4.5, con system prompt compuesto
7. **Validar output** → `guardrails.validateOutput(response)` (REQ-AT-07)
8. **Loguear interacción** → insertar en `ari_conversations` (REQ-AT-06)
9. **Actualizar budget** → registrar tokens y costo (REQ-AT-09)
10. **Devolver respuesta** → `{response, needsFollowUp, suggestedAction}`

**Contract**:
```
askAri(
  studentId: string,
  conceptId: string,
  question: string
): Promise<{
  response: string;
  needsFollowUp: boolean;
  suggestedAction: string | null;
}>
```

---

### REQ-AT-04: Contrato de interfaz limpio

**RFC 2119**: MUST

**Given** la interfaz del orquestador de Ari
**When** se evalúa el contrato input/output
**Then** el input MUST ser: `{studentContext, conceptContext, question}`
**And** el output MUST ser: `{response, needsFollowUp, suggestedAction}`
**And** `needsFollowUp` MUST indicar si el alumno podría necesitar seguimiento (ej: "todavía le cuesta")
**And** `suggestedAction` MAY sugerir una acción pedagógica siguiente (ej: "practicar suma con reagrupamiento") o ser `null`
**And** el contrato MUST mantenerse estable para facilitar migración a multi-agente en Ola 3+

---

### REQ-AT-05: Ari NUNCA da respuestas directas

**RFC 2119**: MUST

**Given** cualquier interacción con Ari
**When** Ari responda a una pregunta del alumno
**Then** la respuesta MUST seguir principios socráticos: guiar con preguntas, no dar la respuesta directa
**And** el prompt base (`ari-base.md`) MUST contener instrucciones explícitas prohibiendo respuestas directas
**And** la validation de output (REQ-AT-07) SHOULD validar que la respuesta no contiene la respuesta directa al ejercicio

---

### REQ-AT-06: Logging estructurado en ari_conversations

**RFC 2119**: MUST

**Given** cualquier interacción completada con Ari
**When** se loguea la interacción
**Then** el sistema MUST insertar un registro en la tabla `ari_conversations` con:
- `student_id`
- `island_id` (determinada por isla activa)
- `concept_id`
- `personality_used` (quipu | tinku | base)
- `input_hash` (hash de la pregunta del alumno)
- `input_text` (texto completo de la pregunta)
- `output_text` (respuesta de Ari)
- `model_used` (ej: "claude-haiku-4.5")
- `tokens_input` (tokens de input)
- `tokens_output` (tokens de output)
- `latency_ms` (latencia de la llamada)
- `cost_usd` (costo estimado)
- `cache_hit` (boolean: si la respuesta vino de cache)
- `created_at` (timestamp)
**And** la tabla `ari_conversations` MUST tener RLS habilitado (REQ-AT-14)

---

### REQ-AT-07: Guardrails de input y output

**RFC 2119**: MUST

**Given** cualquier interacción con Ari
**When** se aplica validación de input y output

**Input validation**:
- El sistema MUST filtrar preguntas off-topic (el alumno no puede pedir recetas de torta, chistes, ni temas no pedagógicos)
- El filtro MUST usar una lista ampliada de temas permitidos (matemática, socioemocional, conceptos curriculares)
- Si el input es rechazado, Ari MUST responder con mensaje amigable: "¡Esa pregunta es interesante! Pero estoy acá para ayudarte con lo que estás aprendiendo. ¿Probamos con un ejercicio?"

**Output validation**:
- El sistema MUST filtrar contenido inapropiado antes de mostrar al alumno
- El filtro MUST bloquear: lenguaje violento, contenido sexual, datos personales, instrucciones peligrosas
- Si el output es rechazado, el sistema MUST devolver fallback genérico y loguear el incidente
- Ambos filtros son reglas simples (listas, patterns), no modelos de ML

---

### REQ-AT-08: Cache de respuestas por concepto+situación

**RFC 2119**: MUST

**Given** una pregunta del alumno sobre un concepto
**When** se evalúa si hay respuesta cacheada
**Then** el sistema MUST usar una clave de cache compuesta por `conceptId + hash(situación pedagógica)`
**And** la "situación pedagógica" MUST incluir: nivel del alumno, rango de p_known (bajo/medio/alto), tipo de error (si aplica)
**And** el TTL del cache MUST ser de 7 días
**And** si hay cache hit válido, la llamada LLM MUST saltarse completamente
**And** las respuestas cacheadas MUST registrarse en `ari_conversations` con `cache_hit: true`

---

### REQ-AT-09: Budget cap diario por alumno

**RFC 2119**: MUST

**Given** un alumno que interactúa con Ari
**When** se evalúa el costo diario acumulado
**Then** el sistema MUST trackear el costo diario por `student_id`
**And** el límite diario MUST ser USD 0.10 por alumno por día
**And** al superar el límite, Ari MUST responder con fallback genérico: "¡Seguí intentando, ya estás cerca! 💪"
**And** al superar el límite, el sistema MUST enviar una alerta email al equipo administrativo
**And** el presupuesto MUST resetearse cada día a medianoche (hora Argentina)
**And** el tracking de costo MUST persistirse en `ari_budget_tracking` en Supabase

---

### REQ-AT-10: Modelo OpenRouter Claude Haiku 4.5 con fallbacks

**RFC 2119**: SHOULD

**Given** una llamada a OpenRouter para obtener respuesta de Ari
**When** se selecciona el modelo LLM
**Then** el modelo default SHOULD ser Claude Haiku 4.5 (vía OpenRouter)
**And** los fallbacks SHOULD estar configurados: GPT-4o-mini (si Haiku no responde), Gemini 2.5 Flash (si ambos no responden)
**And** si todos los modelos fallan, el sistema MUST devolver el fallback genérico y loguear el error
**And** el timeout de la llamada LLM MUST ser de 10 segundos con fallback genérico al superar

---

### REQ-AT-11: Context del alumno en prompt

**RFC 2119**: MUST

**Given** un alumno que interactúa con Ari sobre un concepto específico
**When** se compone el system prompt
**Then** el prompt MUST incluir contexto del alumno:
- Nivel actual y título naval
- `p_known` del concepto específico (del motor BKT)
- Últimos 3 intentos en el concepto (acierto/fallo/hint)
- Lenguaje: español rioplatense con voseo
**And** el contexto MUST actualizarse en cada llamada (no cacheado entre sesiones)

---

### REQ-AT-12: Streaming SSE para respuestas de Ari

**RFC 2119**: MAY

**Given** una llamada a OpenRouter que tarda más de 1 segundo
**When** se evalúa la UX de la conversación
**Then** el sistema MAY implementar streaming vía SSE (Server-Sent Events) para mostrar la respuesta de Ari progresivamente
**And** si se implementa streaming, el componente `<AriChat />` debe mostrar la respuesta carácter por carácter con efecto de tipeo

---

### REQ-AT-13: Prompt base define personalidad socrática rioplatense

**RFC 2119**: MUST

**Given** el archivo `prompts/ari-base.md`
**When** se inspecciona su contenido
**Then** el prompt MUST definir:
- Identidad: tutor pedagógico, guía con preguntas, NUNCA da respuestas directas
- Lenguaje: español rioplatense con voseo
- Restricciones: no dar soluciones, no revelar respuestas, no evaluar al alumno negativamente
- Principio: festejar esfuerzo, no solo resultado
- Formato de respuesta: breve (1-3 oraciones), orientada a preguntas socráticas

---

### REQ-AT-14: RLS en tabla ari_conversations

**RFC 2119**: MUST

**Given** la tabla `ari_conversations` en Supabase
**When** se aplican políticas de acceso
**Then** las políticas RLS MUST garantizar:
- Un padre SOLO puede ver interacciones de sus propios hijos
- Un alumno SOLO puede ver sus propias interacciones
- El sistema (service role) puede insertar logs
- Nadie puede modificar logs existentes (solo INSERT, no UPDATE)
**And** el padre puede ver el historial completo de interacciones de sus hijos (auditoría parental, REQ-AT-15)

---

### REQ-AT-15: Auditoría parental de interacciones de Ari

**RFC 2119**: MUST

**Given** un padre autenticado que quiere ver las interacciones de su hijo con Ari
**When** el padre accede al detalle de su hijo en el dashboard
**Then** el padre MUST poder ver el historial completo de interacciones de Ari con su hijo
**And** cada interacción debe mostrar: fecha, concepto, pregunta del hijo, respuesta de Ari, personalidad usada
**And** esto garantiza transparencia: "ningún black box entre el chico y el sistema" (TINKU.md §6.4)