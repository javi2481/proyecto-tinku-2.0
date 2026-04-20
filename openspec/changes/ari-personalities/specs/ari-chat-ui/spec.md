# Delta Spec: ari-chat-ui (ADDED)

## Capability
`ari-chat-ui` — Componente de UI de conversación con Ari, botón de ayuda siempre visible, y trigger contextual automático tras 2 fallos consecutivos.

## ADDED Requirements

### REQ-ACU-01: Componente AriChat

**RFC 2119**: MUST

**Given** un alumno en una pantalla de ejercicio o isla
**When** se renderiza la interfaz de Ari
**Then** el componente `<AriChat />` MUST mostrarse como un personaje sutil en el borde inferior de la pantalla, no invasivo
**And** Ari MUST NO tener cuerpo visible por defecto — solo el botón de ayuda y el chat cuando se activa
**And** el chat MUST aparecer como un panel o burbuja desde el borde inferior
**And** el chat MUST ser dismissible (el alumno puede cerrarlo)

---

### REQ-ACU-02: Botón "Ayuda" siempre visible

**RFC 2119**: MUST

**Given** cualquier pantalla donde el alumno interactúa con contenido pedagógico
**When** se renderiza la UI del ejercicio o isla
**Then** un botón de ayuda "Ayuda" MUST estar siempre visible y accesible
**And** el botón MUST NO ser intrusivo — visible pero no obstruyendo el contenido pedagógico
**And** al hacer tap/click en el botón, MUST abrir el componente `<AriChat />` con la personalidad correspondiente a la isla activa

---

### REQ-ACU-03: Trigger automático tras 2 fallos consecutivos

**RFC 2119**: MUST

**Given** un alumno que falla 2 veces consecutivas en el mismo ejercicio
**When** se detecta el segundo fallo consecutivo
**Then** Ari MUST aparecer automáticamente ofreciendo ayuda con 1-2 frases breves
**And** la aparición MUST ser NO intrusiva: el alumno puede ignorarla y continuar sin interactuar con Ari
**And** el alumno MUST poder cerrar la aparición de Ari sin pena (no hay penalización por no aceptar ayuda)
**And** la aparición automática MUST NO interrumpir el flujo del ejercicio (no bloquea la pantalla, no requiere acción)

---

### REQ-ACU-04: Dismiss sin pena del trigger automático

**RFC 2119**: MUST

**Given** Ari aparece automáticamente tras 2 fallos consecutivos
**When** el alumno cierra o ignora la aparición de Ari
**Then** el sistema MUST respetar la decisión del alumno sin penalización
**And** MUST NO repetir el trigger automático para el mismo ejercicio en la misma sesión
**And** el botón "Ayuda" MUST seguir visible y funcional si el alumno cambia de opinión

---

### REQ-ACU-05: Presentación breve de Ari

**RFC 2119**: MUST

**Given** Ari aparece (automáticamente o por botón de ayuda)
**When** se muestra la primera intervención de Ari
**Then** la presentación MUST ser breve: 1-2 frases relacionadas al problema específico
**And** MUST seguir orientación socrática: una pregunta, no la respuesta
**And** MUST adaptarse a la isla activa (Quipu en Números, Tinkú en Amigos)
**And** el tono MUST ser cálido, respetuoso, en español rioplatense con voseo

---

### REQ-ACU-06: Zustand store para estado de Ari en cliente

**RFC 2119**: MUST

**Given** el componente `<AriChat />` en el cliente
**When** se gestiona el estado de la conversación
**Then** el estado del chat de Ari MUST gestionarse con Zustand store (`src/stores/ari-store.ts`)
**And** el store MUST contener: `isOpen`, `messages`, `isLoading`, `personality`, `contextualTrigger`
**And** el store MUST sincronizarse con las Server Actions para persistir eventos relevantes en Supabase
**And** el estado pedagógico (historial de conversaciones, interacciones) MUST NO persistirse en localStorage — solo en Supabase