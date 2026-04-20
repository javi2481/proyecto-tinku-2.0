# ROADMAP.md

**Plan operativo de Tinku 2.0**
Versión 1.0 — 19 de abril de 2026
Documento hijo de `TINKU.md`

---

## Índice

1. Principios del roadmap
2. Ola 1 — Beta cerrada (detalle completo)
3. Ola 2 — Expansión y apertura
4. Ola 3 — Docentes
5. Ola 4 — Personalización profunda
6. Ola 5+ — Expansión LATAM
7. Backlog transversal
8. Anti-roadmap operativo

---

## 1. Principios del roadmap

### 1.1 Olas, no fechas

El roadmap se organiza en olas, no en fechas fijas. Una ola termina cuando se cumplen sus criterios de salida. Si cumplirlos toma 8 semanas o 16, la ola dura lo que tiene que durar.

Esto protege contra el impulso de "lanzar a medias" por compromiso de fecha.

### 1.2 Criterios de salida explícitos

Cada ola tiene criterios de salida medibles. Se define **qué** tiene que estar funcionando, no **cuándo**. Una ola no se cierra hasta que sus criterios se cumplen.

### 1.3 Trabajo paralelo permitido, no simultáneo

Dentro de una ola se pueden trabajar varias áreas en paralelo (contenido + frontend + backend). Entre olas no se superponen: no se empieza Ola 2 hasta cerrar Ola 1.

### 1.4 Aprendizaje entre olas

Al terminar cada ola, se hace retrospectiva honesta: qué funcionó, qué no, qué aprendimos. El roadmap siguiente se ajusta según aprendizaje real, no plan original.

### 1.5 SDD aplicado al roadmap

Cada tarea concreta del roadmap que involucre código tiene que tener spec escrito antes de ejecutar. Para tareas chicas el spec es un prompt a Claude Code con alcance bien definido. Para tareas grandes es un documento propio en `/docs/features/`.

---

## 2. Ola 1 — Beta cerrada

### 2.1 Objetivo de la ola

Construir el producto mínimo viable que los hijos de Javier y 5 familias conocidas del WhatsApp puedan usar con disfrute y donde efectivamente aprendan matemática de 1° grado.

### 2.2 Criterios de salida

La Ola 1 se considera completa cuando se cumplen **todos** estos criterios:

- **Técnicos**: aplicación funciona end-to-end en celular Android de gama media y desktop, sin errores críticos, LCP ≤ 3s, sin loss de progreso del alumno.
- **Contenido**: Isla de los Números tiene 20+ conceptos con al menos 15 ejercicios aprobados cada uno. Isla de los Amigos tiene 3-5 conceptos con al menos 6 ejercicios cada uno.
- **Gamificación**: niveles 1-50 funcionando, colección de 5+ monedas provinciales ganables, misiones diarias y semanales activas, Ari responde con personalidad Quipu y Tinkú.
- **Validación con testers**: los 2 hijos de Javier usaron la app durante al menos 2 semanas, con feedback positivo general y progreso pedagógico observable.
- **Observabilidad**: errores se están capturando en Sentry (o equivalente), eventos de uso se trackean.

### 2.3 Fases de la Ola 1

La Ola 1 se organiza en 5 fases secuenciales con algunas paralelizables internamente.

#### Fase 1.1 — Scaffolding del proyecto (semana 1-2)

**Output esperado**: proyecto Next.js + Supabase + Phaser + H5P levantado, "hola mundo" funcionando, CI/CD básico configurado.

Tareas:
- Crear repo `tinku-2.0` en GitHub (hecho).
- Inicializar Next.js 14 App Router con TypeScript estricto.
- Configurar Tailwind + shadcn/ui con tema base Tinku.
- Crear proyecto Supabase nuevo (dev), configurar auth inicial.
- Instalar Phaser 4 y renderizar escena de prueba embebida en componente React.
- Instalar `@lumieducation/h5p-react` y renderizar un H5P de prueba.
- Configurar Vitest y Playwright con tests de smoke.
- Configurar GitHub Actions: lint + typecheck + tests en cada PR.
- Configurar Sentry y PostHog con stubs funcionales.
- Crear `.env.local` template, documentar variables.
- Instalar OpenRouter SDK y hacer llamada de prueba a Claude Haiku.

**Milestone**: repo con todo el stack instalado y un "hola mundo" que prueba que Next.js + Phaser + H5P + Supabase + OpenRouter coexisten sin conflictos.

#### Fase 1.2 — Schema Supabase y modelo de datos (semana 2-3)

**Output esperado**: schema completo de Supabase desplegado, con RLS, para soportar todo el modelo tri-lateral.

Tablas principales (lista preliminar, se refina en diseño detallado):

- `users` (extensión de auth.users): perfil del adulto (padre o docente futuro).
- `students`: alumnos. Relación `parent_id` → `users`.
- `student_codes`: códigos de 6 caracteres para login del alumno. Relación con `students`.
- `islands`: catálogo de islas. Seed con "numeros" y "amigos".
- `regions`: regiones dentro de cada isla.
- `concepts`: conceptos pedagógicos. Relación con `regions`.
- `concept_prerequisites`: dependencias entre conceptos (tabla de relación many-to-many).
- `exercises`: ejercicios específicos. Relación con `concepts`.
- `student_concept_state`: estado del alumno por concepto (p_known, attempts, last_seen). Core del motor adaptativo.
- `student_exercise_attempts`: registro de cada intento de ejercicio.
- `student_levels`: nivel actual, XP total, título del alumno.
- `student_coins`: monedas coleccionadas.
- `student_ship_parts`: piezas de nave coleccionadas.
- `missions`: catálogo de misiones.
- `student_missions`: misiones asignadas al alumno, estado, progreso.
- `ari_conversations`: log de interacciones con Ari/subagentes.
- `app_events`: eventos de uso (analytics internos).

RLS en todas las tablas con datos del alumno. Policies para que un padre solo vea a sus hijos, un alumno solo vea sus propios datos, admin vea todo.

**Milestone**: migración SQL completa aplicada en Supabase dev, tests de RLS verifican aislamiento correcto.

#### Fase 1.3 — Producción de contenido pedagógico (semana 2-5, paralelizable con 1.2 y 1.4)

**Output esperado**: Isla de los Números con 20+ conceptos y 350+ ejercicios aprobados. Isla de los Amigos con 5 conceptos y 30+ ejercicios aprobados.

Tareas:
- Escribir `seeds/islands.yml`, `seeds/regions.yml`, `seeds/concepts.yml` con todos los conceptos de Ola 1.
- Escribir `seeds/characters.yml` con los 10 personajes del cast.
- Escribir `seeds/contexts.yml` con los contextos argentinos.
- Escribir `scripts/generate_exercises.ts` que toma plan YAML y genera JSON vía OpenRouter.
- Generar ejercicios concepto por concepto (proceso descripto en `CONTENT.md` sección 9).
- Revisar ejercicios en UI de review y aprobar.
- Crear H5P content packages para ejercicios H5P-type (drag-drop, fill-blank, etc.). Inicialmente con editor H5P standalone, luego programático si es viable.
- Seed final con todos los ejercicios aprobados.

**Milestone**: Supabase con contenido pedagógico completo seedeado, accesible desde la app.

#### Fase 1.4 — Auth y onboarding (semana 3-4)

**Output esperado**: padres pueden crear cuenta, registrar hijos, obtener códigos de login para alumnos. Alumnos pueden entrar con código y llegar a pantalla de mundo.

Tareas:
- Implementar auth del padre: email+password + Google OAuth.
- Onboarding del padre: 3-4 pasos para registrar hijo (nombre, fecha de nacimiento, grado estimado, avatar). Consentimiento parental versionado documentado aunque no aplicable en beta cerrada.
- Generación de código de 6 caracteres único por alumno.
- Auth del alumno: input de código en pantalla de entrada, validación, `signInAnonymously()` de Supabase, asociación del session al `student_id`.
- Pantalla de elección de avatar (8-10 opciones pre-hechas).
- Primera llegada al mundo (pantalla welcome rápida).

**Milestone**: padre crea cuenta → registra hijo → alumno entra con código → ve mundo con Isla de los Números disponible.

#### Fase 1.5 — Mundo explorable Phaser (semana 3-6)

**Output esperado**: mapa global navegable en Phaser, mapa interno de Isla de los Números funcional, nave del alumno con animación básica, transiciones entre escalas.

Tareas:
- Diseño de assets visuales iniciales: fondo cósmico, 2 islas (Números + Amigos), nave, efectos.
  - **Decisión a tomar temprano**: contratar ilustrador freelance argentino, usar assets de marketplaces (itch.io, Kenney.nl), o generar con IA (Midjourney + retocar). Para Ola 1 beta cerrada, probablemente mix de los tres. Para apertura pública (Ola 2), profesionales.
- Implementar escena Phaser "MundoGlobal": fondo estrellado, islas clickeables, nave del alumno.
- Implementar escena Phaser "IslaNumeros": mapa interno con nodos de concepto, camino serpenteante, estados visuales (bloqueado, disponible, en progreso, dominado).
- Implementar transiciones entre escenas con animaciones suaves.
- Integrar estado Zustand que sincroniza entre Phaser y React (posición de nave, nivel, conceptos dominados).
- Implementar navegación inversa: botón de volver al mundo desde isla.
- Performance tuning inicial: target 60fps en Android medio.

**Milestone**: el alumno puede navegar el mundo, entrar a la Isla de los Números, ver el mapa interno con nodos, volver al mundo.

#### Fase 1.6 — Motor adaptativo BKT (semana 4-5, paralelizable)

**Output esperado**: motor adaptativo calcula p_known por concepto, selecciona ejercicio de dificultad apropiada, actualiza estado tras cada intento.

Tareas:
- Implementar `lib/adaptive/engine.ts` con funciones:
  - `getCurrentPKnown(studentId, conceptId)`: lee estado actual.
  - `updatePKnown(studentId, conceptId, wasCorrect, difficulty)`: BKT simplificado.
  - `pickNextExercise(studentId, conceptId)`: selecciona ejercicio basado en p_known actual y umbrales de dificultad.
  - `computeXp(difficulty, attempt_number, usedHint)`: calcula XP ganada.
- Tests unitarios completos (los 4 casos del BKT + edge cases con dominio alto/bajo).
- Integración con Server Actions: `attemptExercise(exerciseId, answer)` llama al motor y devuelve resultado + next exercise.

**Milestone**: el motor BKT está testeado y funciona en producción. Un alumno que responde correctamente conceptos sube su p_known progresivamente hasta 0.85 y el concepto queda dominado.

#### Fase 1.7 — Componentes de ejercicios (semana 4-6, paralelizable)

**Output esperado**: todos los tipos de ejercicio de Ola 1 (MCQ custom, Numeric Input, H5P drag-drop, H5P fill-blank, H5P match, dilema socioemocional) renderizan correctamente con feedback pedagógico.

Tareas:
- Componente `<MCQExercise />` con opciones ilustrables, feedback visual.
- Componente `<NumericInputExercise />` con teclado grande.
- Componente `<H5PExerciseWrapper />` que recibe `.h5p` file, renderiza con `@lumieducation/h5p-react`, aplica CSS custom Tinku, propaga resultado.
- Componente `<SocioemotionalDilemmaExercise />` para ejercicios tipo dilema.
- Integración con motor BKT: al completar ejercicio, llama Server Action, recibe next exercise, renderiza.
- Feedback visual y auditivo: bounce del botón, sonido correcto/incorrecto (use-sound), transición suave al siguiente.
- Botón "ayuda" (activa Ari) siempre visible.

**Milestone**: un alumno puede entrar a un concepto, completar 10 ejercicios seguidos con distintos tipos, cerrar la sesión con su p_known actualizado.

#### Fase 1.8 — Gamificación (semana 5-7)

**Output esperado**: sistema de niveles, colección de monedas provinciales, misiones diarias/semanales, celebraciones jerarquizadas funcionando end-to-end.

Tareas:
- Implementar tabla de niveles con curva de XP y títulos navales en `seeds/levels.yml`.
- Server Action `awardXp(studentId, amount)`: actualiza XP, recalcula nivel, devuelve si hubo levelup.
- Componente `<LevelBadge />` mostrando título y nivel actual.
- Seed de 23 monedas provinciales con datos culturales y asignación a conceptos específicos (`seeds/coins.yml`).
- Server Action `awardCoin(studentId, coinId)`: entrega moneda, evita duplicados.
- Componente `<CoinCollection />` donde el alumno ve su colección.
- Misiones: seed de 5 misiones diarias tipo (se rotan) + 3 semanales tipo. Server Action `getActiveMissions(studentId)` + `checkMissionProgress(studentId, eventType, payload)`.
- Componente `<MissionsWidget />` en el mundo global.
- Celebraciones jerarquizadas: componente `<CelebrationModal />` con variantes (acierto, dominio, racha, levelup). Integrar Lottie para variantes altas.
- Upgrades automáticos de nave: seed de 5 apariencias de nave (según título naval), aplicar al componente Phaser cuando el alumno cambia de título.
- Piezas coleccionables de nave (versión reducida Ola 1): 5 piezas ganables por misiones exploratorias.

**Milestone**: alumno que completa sesión recibe XP, puede subir de nivel, colecciona moneda provincial al dominar concepto, completa misión diaria, ve celebración jerarquizada, observa cómo su nave cambia al subir de título.

#### Fase 1.9 — Ari monolítico con personalidades (semana 6-7)

**Output esperado**: Ari aparece contextualmente (botón de ayuda siempre, automático tras 2 fallos), responde con personalidad apropiada (Quipu en Números, Tinkú en Amigos), cachea respuestas similares.

Tareas:
- Escribir prompts base en `/prompts/`:
  - `ari-base.md`: identidad y principios compartidos.
  - `quipu.md`: personalidad matemática.
  - `tinku.md`: personalidad socioemocional.
- Server Action `askAri(studentId, conceptId, question)`:
  - Determina isla activa y personalidad.
  - Compone system prompt = base + personalidad.
  - Obtiene context del alumno (nivel, estado del concepto, últimos intentos).
  - Llama OpenRouter con Claude Haiku 4.5.
  - Valida output (guardrails simples).
  - Loguea interacción en `ari_conversations`.
  - Devuelve respuesta + `needsFollowUp`.
- Cache simple de respuestas por (conceptId + situación) con TTL de 1 semana.
- Budget cap diario por alumno (cuando superado, Ari responde con fallback genérico y se alerta por email).
- Componente `<AriChat />` para UI de la conversación.
- Trigger automático: si el alumno falla 2 veces el mismo ejercicio, aparece Ari ofreciendo ayuda (sin interrumpir si el alumno no quiere).

**Milestone**: alumno se traba → Ari (con personalidad Quipu) aparece → ofrece pista socrática → el alumno llega a respuesta. Interacción queda registrada.

#### Fase 1.10 — Portal padre básico (semana 7-8)

**Output esperado**: padre accede a su dashboard, ve progreso real de cada hijo, recibe reporte semanal por email.

Tareas:
- Pantalla `/dashboard` para el padre: lista de hijos, para cada uno resumen (nivel, conceptos dominados semana, tiempo de uso).
- Pantalla `/dashboard/[student-id]`: detalle de un hijo. Conceptos dominados, en progreso, trabados. Tiempo por día último mes. Colecciones.
- Alerta "Momento de ayuda del grande": cuando p_known de un concepto no mejora tras varios intentos, alertar al padre con sugerencia de intervención manual.
- Reporte semanal automático por email (Resend): cada domingo, generar resumen de la semana del hijo y enviar. Template HTML responsive, tono cálido pero honesto.
- Configuración: padre puede establecer límite diario de tiempo, horario permitido.

**Milestone**: padre recibe reporte dominical con "Esta semana Paulina dominó 2 conceptos nuevos (suma sin reagrupamiento hasta 20, complemento a 10) y está trabajando en resta simple".

#### Fase 1.11 — Testing y ajuste (semana 8-10)

**Output esperado**: app probada con los 2 hijos de Javier por al menos 2 semanas, con ajustes según observación directa y feedback.

Tareas:
- Deploy a producción (Vercel o similar).
- Setup de dominio propio (tinku.com.ar o similar).
- Sesión de observación 1: hijo 1 usa por primera vez, Javier observa sin intervenir, toma notas.
- Sesión de observación 2: hijo 2 usa por primera vez, misma metodología.
- Ajustes prioritarios según observación (lo que los chicos no entienden, lo que los traba, lo que los aburre).
- Uso sostenido durante 2 semanas: los chicos usan ~10 min por día.
- Feedback semanal con preguntas abiertas ("¿qué te gusta? ¿qué te aburre? ¿qué cambiarías?").
- Ajustes finales.

**Milestone**: los 2 hijos de Javier usan Tinku con continuidad voluntaria durante 2 semanas y muestran progreso pedagógico observable.

#### Fase 1.12 — Apertura a 5 familias del WhatsApp (semana 10-12)

**Output esperado**: 5 familias conocidas usando Tinku, primera data de uso real fuera de la casa de Javier.

Tareas:
- Mensaje a las 5 familias invitando a probar.
- Onboarding personalizado vía WhatsApp (Javier acompaña la creación de la cuenta).
- Monitoreo de errores en producción (Sentry).
- Feedback semanal vía grupo de WhatsApp.
- Ajustes según feedback.
- Decisión de salida de Ola 1: ¿está listo para apertura pública (Ola 2) o necesita más pulido?

**Milestone**: 5 familias usando Tinku activamente, ≥10 chicos con uso semanal, retrospectiva de Ola 1 escrita.

### 2.4 Estimación total de Ola 1

Con trabajo focalizado de solo-founder + Claude Code + Emergent:

- Fases secuenciales críticas: 8-10 semanas.
- Buffers realistas por bloqueos y aprendizaje: 2-4 semanas adicionales.
- **Total honesto**: 10-14 semanas.

Esto asume ~20-30 horas semanales de trabajo efectivo.

### 2.5 Riesgos identificados de Ola 1

- **Riesgo alto — Phaser learning curve**: Javier no tiene experiencia previa con Phaser. Curva de aprendizaje puede ser más larga de lo esperado. Mitigación: invertir en Phaser Editor v5 con MCP si se nota fricción después de semana 4.
- **Riesgo alto — Calidad del contenido generado**: ejercicios generados por LLM pueden tener errores matemáticos sutiles. Mitigación: revisión cuidadosa, tests de validación automatizados donde posible.
- **Riesgo medio — Assets visuales**: sin ilustrador profesional en Ola 1, el mundo puede verse "genérico". Mitigación: curaduría cuidadosa de assets, uso de estética consistente, aceptar que Ola 1 beta es menos pulida que Ola 2.
- **Riesgo medio — Costos de IA**: Ari puede costar más de lo estimado si los chicos usan mucho. Mitigación: budget caps + cache agresivo + monitoreo diario de gastos la primera semana.
- **Riesgo bajo — Supabase limits**: improbable con 10 familias, pero monitorear.

---

## 3. Ola 2 — Expansión pedagógica y apertura

### 3.1 Objetivo

Apertura del producto a público general con monetización activa.

### 3.2 Criterios de salida de Ola 2

- **Contenido**: Isla de las Palabras completa (lengua 1° a 3°), Isla de los Números expandida con más conceptos socioemocionales.
- **Monetización**: MercadoPago integrado, free tier + Premium funcionando, primer cohorte de padres pagando.
- **Apertura**: landing pública, waitlist funcional, 50-100 familias activas.
- **Compliance**: consentimiento parental activo, anonimización automática configurada, logs de acceso a datos, portabilidad implementada.

### 3.3 Features principales

- Isla de las Palabras (lengua 1-3).
- Más islas socioemocionales (al menos 2 más).
- MercadoPago con suscripciones recurrentes.
- Free tier limitado (primeros 5 conceptos por isla) + Premium (acceso completo).
- Landing pública con waitlist.
- Compliance legal argentino activado.
- Portal padre con reportes profundos.
- Assets visuales profesionales (contratar ilustrador).

### 3.4 Estimación

10-16 semanas después de cerrar Ola 1.

---

## 4. Ola 3 — Docentes

### 4.1 Objetivo

Primera cohorte de docentes piloto usando analytics para tomar decisiones pedagógicas.

### 4.2 Criterios de salida

- Portal docente funcional con 3-5 escuelas piloto.
- Analytics básicos (nivel 1): progreso del aula, patrones de error simples.
- Ari migrado a arquitectura multi-agente real (LangGraph).
- Integración inicial con OpenRAG para retrieval sobre material de docentes.

### 4.3 Features principales

- Portal docente: registro de aula, invitación a alumnos, dashboard agregado.
- Analytics nivel 1: qué conceptos trabaja el aula, tasa de dominio, chicos trabados.
- Migración de Ari monolítico a supervisor + subagentes reales.
- Isla de Ciencias (cobertura básica).
- Primera integración con OpenRAG/Axioma 2.0.

### 4.4 Estimación

12-20 semanas después de cerrar Ola 2.

---

## 5. Ola 4 — Personalización profunda

### 5.1 Objetivo

Analytics docentes accionables (nivel 2) con recomendaciones pedagógicas generadas.

### 5.2 Features principales

- Analytics nivel 2: detección de patrones de error cross-student, recomendaciones accionables, materiales generados.
- Ari con acceso a corpus curricular via OpenRAG.
- BKT formal con 4 parámetros por concepto.
- Isla de Sociales.
- Más islas socioemocionales.
- Exportación de datos para investigación educativa (con consentimiento).

### 5.3 Estimación

6 a 12 meses después de cerrar Ola 3.

---

## 6. Ola 5+ — Expansión LATAM

### 6.1 Objetivo

Adaptar Tinku a Uruguay y Chile como primeros mercados externos.

### 6.2 Consideraciones

- Adaptación a currículos locales.
- Adaptación lingüística sutil (español uruguayo es muy cercano al argentino, chileno requiere más adaptación).
- Contratación de primer equipo (contenido + dev junior).
- Partnerships con escuelas locales.

---

## 7. Backlog transversal

Tareas que no pertenecen a una ola específica pero se trabajan cuando aparecen oportunidades.

### 7.1 Technical debt continuo

- Refactoring de componentes que crezcan demasiado (regla: >300 líneas se refactoriza).
- Actualización de dependencias mensual.
- Revisión de performance trimestral.
- Revisión de seguridad trimestral.

### 7.2 Contenido continuo

- Mejora de ejercicios con baja tasa de acierto (probable problema de calidad).
- Generación de variantes de ejercicios populares.
- Actualización de library de personajes y contextos.

### 7.3 Experimentos pedagógicos

- A/B testing de distintas progresiones para el mismo concepto.
- Experimentos con celebraciones (intensidad, frecuencia).
- Prueba de nuevos tipos de ejercicio.

### 7.4 Ideas P3 (capturadas pero no comprometidas)

(Sección libre para capturar ideas que aparecen en el chat o en la práctica. Regla: una idea en P3 no se trabaja hasta que pase explícitamente a P0/P1/P2 con spec.)

- Minijuegos educativos estilo DragonBox (Ola 4+).
- Modo colaborativo entre amigos (con moderación robusta, Ola 5+).
- Integración con cuadernos digitales Conectar Igualdad.
- Versión para 4° a 7° grado (después de perfeccionar 1° a 3°).
- Integración con plataformas escolares existentes.

---

## 8. Anti-roadmap operativo

Cosas que conscientemente no están en el roadmap y no se trabajan:

- **Apps nativas iOS/Android con código separado**: PWA alcanza. Si se empaqueta para stores, se empaqueta la misma PWA con Capacitor o PWABuilder.
- **Feature de chat social entre alumnos**: excluido del producto para siempre por principio ético.
- **Integración con redes sociales (Facebook, TikTok, Instagram)**: no para alumnos. Tal vez para marketing del producto a padres en Ola 2+.
- **Gamificación con elementos extractivos** (vidas, FOMO, loot boxes): excluidos para siempre por principio ético.
- **NFTs, crypto, blockchain**: irrelevante y potencialmente problemático para público infantil.
- **Reconocimiento facial del alumno**: excluido por privacidad.
- **Publicidad dentro del producto**: excluida para siempre.
- **Venta de datos**: excluida para siempre.

---

**Fin de ROADMAP.md**

Este documento se actualiza semanalmente durante Ola 1 con progreso real. Después de cerrar cada ola se hace retrospectiva y se actualiza el plan de la siguiente ola con aprendizajes.
