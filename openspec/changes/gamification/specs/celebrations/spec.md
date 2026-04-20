# Delta Spec: celebrations (ADDED)

## Capability
`celebrations` — Jerarquía de 4 niveles de celebración proporcional al logro, desde sutil hasta máximo, con Lottie para niveles medio+.

## ADDED Requirements

### REQ-CEL-01: Jerarquía de 4 niveles de celebración

**RFC 2119**: MUST

**Given** la jerarquía estricta de TINKU.md §9.6
**When** se determina qué celebración mostrar para un evento
**Then** el sistema MUST aplicar esta jerarquía sin excepciones:

| Nivel | Evento | Tipo | Animación | Sonido | Duración |
|-------|-------|------|-----------|--------|----------|
| Subtle | Acierto individual | Bounce del botón, tick verde, sonido corto opcional | Motion (CSS/Framer) | Corto opcional | < 1s |
| Medium | Dominio de concepto primera vez; Subir de nivel | Modal con Lottie, XP grande, moneda ganada | Lottie | Victoria/nivel | ≥ 1.5s |
| Unique | Racha de 7 días | Lottie específica de racha, mensaje personalizado | Lottie | Especial | ≥ 1.5s |
| Maximum | Isla completada | Animación extendida, bandera izada, registro permanente | Lottie | Épico | ≥ 2.5s |

**And** MUST NO mostrar celebración de nivel superior a un evento de nivel inferior
**And** MUST NO mostrar confetti para aciertos individuales
**And** los tiempos de celebración MUST ser mínimo 1.5 segundos para niveles Medium y superior (el alumno necesita procesar emocionalmente)

---

### REQ-CEL-02: Celebración nivel Subtle (acierto individual)

**RFC 2119**: MUST

**Given** un alumno que responde correctamente un ejercicio individual
**When** se determina el tipo de celebración
**Then** el sistema MUST aplicar feedback sutil:
- Bounce animado del botón de respuesta (via Motion)
- Tick verde de confirmación
- Sonido corto OPCIONAL (respetar preferencia de sonido del alumno)
- MUST NO mostrarse modal, confetti, ni interrupción del flujo

---

### REQ-CEL-03: Celebración nivel Medium (dominio de concepto)

**RFC 2119**: MUST

**Given** un alumno que domina un concepto por primera vez (p_known ≥ 0.85)
**When** se determina el tipo de celebración
**Then** el sistema MUST mostrar:
- Modal `<CelebrationModal />` con animación Lottie de celebración
- Notificación de XP grande ganado
- Si corresponde, notificación de moneda provincial ganada
- Sonido de victoria
- Duración mínima de 1.5 segundos antes de permitir cerrar
**And** el modal MUST tener botón de cierre visible pero no intrusivo

---

### REQ-CEL-04: Celebración nivel Medium (subir de nivel)

**RFC 2119**: MUST

**Given** un alumno que sube de nivel (gamification-engine detecta levelup)
**When** se determina el tipo de celebración
**Then** el sistema MUST mostrar:
- Modal `<CelebrationModal />` con animación Lottie
- Nueva nave visible (cambio de apariencia del barco)
- Título naval actualizado
- Sonido de progresión
- Duración mínima de 1.5 segundos

---

### REQ-CEL-05: Celebración nivel Unique (racha de 7 días)

**RFC 2119**: MUST

**Given** un alumno que mantiene una racha de uso de 7 días consecutivos
**When** se detecta la racha de 7 días
**Then** el sistema MUST mostrar:
- Lottie específica de racha (animación única, no reutilizada de dominio)
- Mensaje personalizado con el nombre del alumno
- Sonido especial
- Duración mínima de 1.5 segundos

---

### REQ-CEL-06: Celebración nivel Maximum (isla completada)

**RFC 2119**: MUST

**Given** un alumno que completa todos los conceptos de una isla
**When** se determina el tipo de celebración
**Then** el sistema MUST mostrar:
- Animación extendida con Lottie (la más elaborada del sistema)
- Bandera izada en la isla del mapa global (registro permanente visible)
- Sonido épico
- Duración mínima de 2.5 segundos
**And** este evento MUST ser el único en el sistema que usa el nivel Maximum

---

### REQ-CEL-07: Componente CelebrationModal

**RFC 2119**: MUST

**Given** cualquier celebración de nivel Medium o superior
**When** se renderiza `<CelebrationModal />`
**Then** el componente MUST aceptar props: `level: 'medium' | 'unique' | 'maximum'`, `content: CelebrationContent`, `onClose: () => void`
**And** para nivel Medium y superior, MUST usar animaciones Lottie loaded lazy (no en el bundle inicial)
**And** para nivel Subtle, MUST NO usarse modal — solo animaciones Motion inline
**And** MUST tener `prefers-reduced-motion` respetado: si el alumno tiene esa preferencia, las animaciones MUST ser estáticas o mínimas

---

### REQ-CEL-08: Lazy loading de animaciones Lottie

**RFC 2119**: MUST

**Given** el componente `<CelebrationModal />` y las animaciones Lottie
**When** se evalúa el bundle size del frontend
**Then** las animaciones Lottie MUST cargarse lazy (dynamic import en Next.js)
**And** los archivos Lottie MUST NO estar en el bundle JavaScript inicial
**And** solo se cargan cuando se necesita mostrar una celebración de nivel Medium+

---

### REQ-CEL-09: Sin confetti para aciertos menores

**RFC 2119**: MUST

**Given** cualquier celebración del sistema
**When** el evento es un acierto individual o progreso menor
**Then** el sistema MUST NO mostrar confetti, confeti, cañón de colores, ni cualquier efecto visual disruptivo
**And** confetti/efectos visuales grandes MUST reservarse EXCLUSIVAMENTE para dominio de concepto, levelup, racha, e isla completada