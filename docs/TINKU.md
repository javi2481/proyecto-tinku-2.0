# TINKU.md

**Documento madre del proyecto Tinku 2.0**
Versión 1.0 — 19 de abril de 2026
Estado: especificación fundacional, SDD estricto

---

## Índice

1. Resumen ejecutivo
2. Visión y propósito
3. Los tres usuarios
4. Principios pedagógicos innegociables
5. Principios de producto innegociables
6. Compromisos éticos operacionales
7. Identidad visual y estética
8. Arquitectura del mundo explorable
9. Sistema de gamificación
10. Arquitectura de agentes IA
11. Stack técnico
12. Decisiones técnicas clave
13. Herramientas evaluadas y descartadas
14. Roadmap por olas (alto nivel)
15. Anti-roadmap
16. Métricas de éxito
17. Glosario

---

## 1. Resumen ejecutivo

Tinku 2.0 es una plataforma pedagógica tri-lateral con forma de juego, dirigida a alumnos argentinos de 6 a 12 años, sus padres y sus docentes. El alumno aprende matemática, lengua, ciencias, sociales, arte y habilidades socioemocionales navegando un mundo 2D explorable. Los padres acceden a información real sobre el progreso de sus hijos. Los docentes, a futuro, reciben analytics accionables que les permiten personalizar su enseñanza.

La tesis del proyecto es simple: la educación quedó rezagada mientras la tecnología avanzó en finanzas, salud, legales y otros dominios. Tinku aplica tecnología contemporánea, tomada de ecosistemas serios como IA orquestada, motores de juegos modernos y ciencia del aprendizaje rigurosa, al servicio del aprendizaje real, no del engagement vacío.

El diferenciador de Tinku no es competitivo, es ético. No compite con Duolingo, Prodigy ni Matific. Construye lo que debería existir y no existe: una plataforma donde el chico aprende de verdad y encima se divierte, donde los datos generados sirven para personalizar la educación y donde las mecánicas de engagement están al servicio de la pedagogía, no al revés.

---

## 2. Visión y propósito

### 2.1 El problema

La educación primaria argentina enfrenta tres desafíos convergentes. Primero, los chicos aprenden a ritmos distintos pero las aulas homogeneízan. Segundo, los docentes no tienen herramientas accionables para identificar dónde se traba cada alumno. Tercero, la tecnología educativa existente o mantiene a los chicos pegados a la pantalla con loops dopaminérgicos (modelo Candy Crush aplicado a educación) o es tan austera que no logra engagement alguno.

### 2.2 La oportunidad

La IA contemporánea permite personalización real a escala. Los motores de juegos web modernos permiten mundos interactivos sin costos de desarrollo de videojuego AAA. Las mecánicas de engagement que funcionan en Candy Crush y YouTube Kids están documentadas y son extrapolables éticamente. Un founder con background en data science, ML e IA puede construir hoy, con herramientas de AI-assisted coding, lo que hace cinco años requería un equipo de 20 personas.

### 2.3 Qué es Tinku 2.0

Tinku 2.0 es tres cosas simultáneamente:

**Para el alumno**, es un juego. Navega con su nave un mundo cósmico 2D, explora islas con estéticas distintas, colecciona monedas de las provincias argentinas, sube de nivel, personaliza su nave. Dentro de cada isla, ejercicios pedagógicos calibrados a su nivel lo hacen avanzar. El juego es el vehículo emocional que hace que quiera volver mañana.

**Para el padre**, es una ventana. Ve en qué concepto se traba su hijo, cuándo necesita ayuda, cómo evoluciona. Recibe reportes semanales simples. No ve gamificación vana, ve aprendizaje real medido.

**Para el docente** (Ola 3 en adelante), es un asistente pedagógico. Recibe patrones de error cross-student, sugerencias accionables, material contextualizado. Los datos del alumno sirven para que el docente tome mejores decisiones, no para que un algoritmo retenga al chico por retener.

### 2.4 Qué no es Tinku 2.0

No es un juego con pregunta embebida (tipo Prodigy). No es una plataforma educativa con gamificación corporativa (tipo Matific). No es Duolingo para chicos. No es una red social infantil. No es un reemplazo del docente ni del rol parental. No es una app para ocupar a los chicos mientras los adultos hacen otra cosa.

---

## 3. Los tres usuarios

Tinku es una plataforma con tres usuarios primarios que se retroalimentan. Cada uno tiene necesidades distintas, UI distinta y relación distinta con los datos. Este modelo tri-lateral es una decisión arquitectónica fundamental.

### 3.1 El alumno (usuario primario)

Chico argentino de 6 a 12 años, cursando educación primaria. Entra con un código de 6 caracteres que le da el padre. No tiene email ni contraseña propia. Su experiencia es un juego: navega, explora, colecciona, sube de nivel, resuelve ejercicios. La pedagogía está embebida en el juego, no impuesta sobre él.

**Experiencia clave del alumno:** la primera vez que entra, elige avatar y ve el mapa del mundo. Ve la nave-barco del explorador. Ve una isla iluminada (Isla de los Números) y otras en penumbra. Toca la isla, la nave navega, zoom, entra al mapa interno. Un concepto disponible (el primer nodo del camino) lo invita. Toca el nodo, arranca la sesión de ejercicios. Completa 5 ejercicios cortos, gana XP, ve progreso hacia el dominio del concepto. Sale, ve su nave levemente mejorada. Vuelve mañana.

### 3.2 El padre (usuario secundario)

Adulto responsable del alumno, típicamente uno de los padres o tutor. Crea la cuenta, registra al hijo, decide si paga Premium o se queda en free tier. Accede a un dashboard sobrio con datos reales: qué concepto está trabajando el hijo, cuánto tiempo pasó, en qué se trabó, cuándo le conviene intervenir manualmente.

**Experiencia clave del padre:** recibe un reporte semanal por email. Ve una métrica simple ("esta semana Paulina dominó 2 conceptos nuevos y está trabajando en suma con reagrupamiento"). Puede profundizar si quiere. Puede establecer límites (tiempo diario máximo, horarios). Puede compartir logros puntuales con la familia extendida por WhatsApp. No ve leaderboards ni compara con otros chicos.

### 3.3 El docente (usuario terciario, Ola 3+)

Docente de primaria que adopta Tinku como complemento pedagógico para su aula. Ve analytics agregados de sus alumnos, detecta patrones de error compartidos, recibe sugerencias accionables ("3 chicos confunden el algoritmo de la resta con reagrupamiento cuando hay ceros en el minuendo, acá tenés una actividad grupal de 15 minutos"). Los datos no reemplazan su criterio, lo informan.

**Experiencia clave del docente (a futuro):** empieza su clase con un resumen de dónde está su aula según Tinku. Ve dónde está trabado el grupo. Decide intervención grupal. Adapta su planificación sin abandonar su autonomía profesional.

### 3.4 Secuencia de desarrollo

Primero alumnos (Ola 1), después padres (Ola 2), después docentes (Ola 3). No se puede construir valor para docentes sin datos reales de alumnos. No se puede construir valor para padres sin un producto que los chicos usen con continuidad. El orden no es arbitrario, es causal.

---

## 4. Principios pedagógicos innegociables

La pedagogía de Tinku no se invento nueva. Se apoya en seis principios universales de la ciencia del aprendizaje contemporánea, aplicados con anclaje cultural argentino.

### 4.1 Los seis principios

**Mastery learning.** El alumno no avanza al siguiente concepto hasta dominar el actual (umbral p_known ≥ 0.85). Bloom lo formuló en los 70, la evidencia sigue siendo contundente. En Tinku, cada nodo del mapa interno de una isla es un concepto, y solo se ilumina el siguiente cuando el actual se domina.

**Feedback inmediato y específico.** Cada respuesta tiene feedback instantáneo. Los errores se explican, no se castigan. El efecto size de feedback inmediato según Hattie es 0.73, uno de los más altos documentados. En Tinku, el feedback visual es inmediato y siempre constructivo, nunca rojo puro ni sonido alarmante.

**Práctica espaciada con recuperación activa.** Los conceptos dominados reaparecen espaciadamente (repaso diario de 5 minutos) para consolidar memoria de largo plazo. La investigación de Brown, Roediger y McDaniel (Make It Stick, 2014) es la referencia. Tinku implementa esto como feature central.

**Calibración de dificultad a la zona de desarrollo próximo.** Vygotsky definió la ZDP como el rango donde el alumno puede resolver con ayuda pero no solo. Demasiado fácil aburre, demasiado difícil frustra. El motor adaptativo de Tinku (BKT simplificado en Ola 1, evolución a BKT formal en Ola 2+) mantiene al alumno en esta zona dinámicamente.

**Autonomía del alumno sobre su ritmo.** Deci y Ryan mostraron que motivación intrínseca requiere autonomía, competencia y vínculo. El alumno elige qué concepto trabajar dentro de los disponibles, cuándo entrar, cuánto tiempo quedarse. No hay sesiones forzadas ni rachas que penalizan ausencias.

**Relación cálida con un guía que cree en él.** La figura de Ari (tutor IA orquestador) existe para ser esa presencia. No da respuestas, guía con preguntas. Celebra el esfuerzo, no solo el resultado. Dweck (Mindset, 2006) es la referencia fundacional del growth mindset, y Tinku lo integra en el copy de cada interacción.

### 4.2 Anclaje argentino

Los principios son universales pero el contenido y la voz son argentinos:

- **Idioma**: español rioplatense (voseo) en todo el producto. El chico lee "vos podés", no "tú puedes".
- **Contexto cultural**: ejercicios ubicados en contextos argentinos reconocibles. Lucía compra alfajores en el kiosco, Mateo cuenta figuritas con un amigo, Valentina va en colectivo a la cancha.
- **Personajes recurrentes**: 8 a 10 personajes aparecen consistentemente. El alumno los reconoce, se familiariza, genera vínculo narrativo.
- **Marco legal argentino**: consentimiento parental versionado (Ley 26.061), anonimización automática tras 30 días de inactividad, logs de acceso a datos del alumno. Estos aspectos se reactivan cuando la beta se abre al público; durante beta cerrada con familias conocidas, están documentados pero no activos.

### 4.3 Dimensión socioemocional

Tinku no enseña solamente materias académicas. Desde Ola 1, una isla está dedicada a habilidades socioemocionales. Esto es una diferenciación explícita frente a la EdTech competitiva, que típicamente se enfoca solo en lo cognitivo.

El marco teórico es **CASEL** (Collaborative for Academic, Social, and Emotional Learning), el estándar internacional para aprendizaje socioemocional. Cinco competencias:

1. Autoconciencia (reconocer emociones propias).
2. Autorregulación (manejar emociones).
3. Conciencia social (empatía).
4. Habilidades relacionales (comunicación, cooperación).
5. Toma de decisiones responsables.

En Ola 1 se cubren las dos primeras con 3 a 5 conceptos mínimos. Las demás en olas posteriores.

---

## 5. Principios de producto innegociables

Los principios pedagógicos están acompañados por principios de producto. Ambos son innegociables y cualquier decisión futura se filtra a través de ellos.

### 5.1 Aprender es el objetivo, el juego es el vehículo

Tinku es una plataforma pedagógica con forma de juego. No es un juego con contenido educativo. Cuando haya conflicto entre "lo que hace que el chico aprenda más" y "lo que hace que el chico se quede más tiempo", gana lo primero. Siempre.

Si un chico aprende su sesión de 10 minutos y sale, no hay banner de "seguí jugando". Si un chico se traba, no hay pago para desbloquear ni tip premium, hay hint de Ari gratuito. Si un chico quiere parar, para.

### 5.2 Mecánicas de engagement al servicio de la pedagogía

Se toman prestadas mecánicas que funcionan (colecciones, misiones, progresión visible, celebraciones) pero se orientan al aprendizaje:

- Colecciones se desbloquean por dominio de conceptos, no por tiempo de uso.
- Misiones diarias son pedagógicas ("hacé 5 ejercicios de suma") o exploratorias ("visitá la Isla de los Amigos") pero nunca extractivas ("jugá 30 minutos sin parar").
- Progresión visible en forma de niveles navales (explorador novato, marinero, capitán, almirante) ligada a XP ganada por aprender.
- Celebraciones jerarquizadas: acierto individual es sutil, dominio de concepto es fuerte, racha de 7 días es única.

### 5.3 Sin mecánicas extractivas

Explícitamente prohibidas:

- **Vidas o energías limitadas**: nunca. El alumno puede practicar todo lo que quiera.
- **Esperas forzadas**: nunca. Si el alumno quiere seguir, sigue.
- **Loot boxes o recompensas aleatorias de valor funcional**: nunca. Las recompensas son deterministas. La "sorpresa" viene de descubrir qué moneda provincial específica gana, no de azar.
- **FOMO artificial**: nunca. Sin "oferta que expira en 4 horas", sin "última oportunidad".
- **Leaderboards públicos entre chicos**: nunca. La competencia es contra uno mismo.
- **Ranking social de aulas o escuelas** (Ola 3 en adelante): nunca. El valor para docentes no pasa por comparar aulas.

### 5.4 UX infantil calibrada

El público son chicos de 6 a 12 años. La UX se diseña con principios específicos:

- **Tipografía**: Andika (diseñada específicamente para lectura infantil). Tamaño base 18-24px según pantalla.
- **Tap targets**: mínimo 48x48px. Los dedos de los chicos son menos precisos que los de los adultos.
- **Tiempos de celebración**: mínimo 1.5 segundos para que el chico pueda procesar emocionalmente.
- **Colores de feedback**: nunca rojo puro para errores. El rojo en UI infantil activa respuesta de alarma. Tonos naranjas suaves o grises.
- **Sonido de error**: nunca estridente ni metálico. Tono descendente suave, nunca alarmante.
- **Animaciones**: respetar siempre `prefers-reduced-motion`. Los chicos con hipersensibilidad sensorial lo necesitan.

### 5.5 Privacidad radical

Los datos del alumno son sagrados. El alumno no elige su privacidad, la eligen sus padres. Tinku aplica:

- Consentimiento parental explícito y versionado.
- Anonimización automática tras inactividad prolongada.
- Logs de cada acceso a datos del alumno.
- Zero advertising. Ningún dato se comparte con terceros para publicidad.
- Portabilidad: los padres pueden exportar todos los datos del hijo en cualquier momento.

Durante beta cerrada con familias conocidas, estos mecanismos están documentados pero no activos en el código. Se activan antes de abrir a público.

---

## 6. Compromisos éticos operacionales

La ética no es marketing. Es compromiso operativo verificable. Tinku se autoimpone las siguientes obligaciones:

### 6.1 Validación rigurosa de aprendizaje

No basta con "los chicos usan Tinku y les gusta". La métrica que importa es "los chicos usan Tinku y aprenden medible más que si no lo usaran". Tinku se compromete a:

- Medir el aprendizaje real con pre-test/post-test trimestrales en conceptos seleccionados.
- Publicar resultados internos honestos, incluyendo conceptos donde Tinku no logra aprendizaje significativo.
- Ajustar o remover contenido que no genere aprendizaje demostrable.

### 6.2 Respeto al tiempo del chico

Tinku no maximiza tiempo en pantalla. Por diseño, las sesiones son cortas (5 a 15 minutos de valor pedagógico). El producto sugiere activamente descansos cada 15 minutos. Los padres pueden limitar el tiempo diario y la app lo respeta sin fricción.

### 6.3 Honestidad con padres

Si un chico no está progresando, el reporte al padre lo dice. No se suavizan datos para mantener suscripción. Si el padre pregunta por qué su hijo no avanza en un concepto, Tinku da la respuesta real (con dignidad).

### 6.4 Empoderamiento docente, no reemplazo

Cuando el portal docente esté activo (Ola 3+), las sugerencias de Tinku son eso, sugerencias. El docente decide. Tinku no prescribe, informa. Los datos nunca se usan para evaluar al docente.

### 6.5 Auditabilidad de IA

Cada interacción de Ari (tutor IA) con un alumno se registra con input, output y modelo usado. Los padres pueden ver qué le preguntó su hijo a Ari y qué le respondió. Ningún "black box" entre el chico y el sistema.

### 6.6 Sin dark patterns

Cancelar suscripción es tan fácil como suscribirse. No hay preguntas de retención emocional ("¿estás seguro de que querés que Paulina pierda su racha?"). No hay downgrade forzado a "versión gratis degradada". Si el padre quiere irse, se va limpio.

---

## 7. Identidad visual y estética

### 7.1 Concepto central

Cada isla de Tinku tiene **estética intrínseca al contenido que representa**. La inspiración conceptual viene de la película *Intensamente* de Pixar, donde cada isla de la personalidad tiene una identidad visual coherente con lo que representa emocionalmente. En Tinku, cada isla tiene una identidad visual coherente con el dominio que enseña.

Esto es un principio de diseño, no decoración. Implica que los artistas, ilustradores y desarrolladores que contribuyan a Tinku deben entender qué representa cada isla antes de producir assets visuales.

### 7.2 Paleta de referencias

Las siguientes obras son referencias visuales y conceptuales. No son benchmarks a copiar, son vocabulario compartido.

- **Intensamente (Pixar, 2015 y 2024)**: islas como metáfora de interioridad. Cada isla con coherencia emocional propia.
- **Hilda (Netflix, serie animada)**: ilustración 2D moderna, líneas simples, colores planos, mundo mágico accesible para chicos. Técnicamente alcanzable con producción razonable.
- **The Owl House (Disney)**: estética oscura-mágica con acentos cálidos. Demuestra que producto para chicos no tiene que ser exclusivamente pastel claro.
- **Coco (Pixar, 2017)**: estética latinoamericana vibrante, paleta saturada nocturna con flores y luces. Referencia para el anclaje cultural.
- **Arcane (Netflix)**: estilo pictórico moderno 2D/3D mezcla, demuestra que 2D estilizado puede verse "premium".
- **Studio Ghibli** (Totoro, Ponyo): naturaleza con alma, ritmo pausado. Contraste contra el ritmo frenético de Candy Crush.

### 7.3 Estética del mundo global

El mundo de Tinku es un **océano cósmico nocturno**. No es día soleado, no es pastel alegre, no es pixel art retro. Es un cielo estrellado con vía láctea visible al fondo, islas que flotan en un mar oscuro violeta-azul, con acentos de luz cálida (volcanes encendidos, estatuas iluminadas, linternas, auroras).

La paleta base del mundo global:

- **Fondo**: violetas profundos (#1a0b2e a #2d1b4e), azules noche (#0d1b3d), con estrellas blancas y doradas.
- **Acentos cálidos**: naranjas y amarillos ardientes para volcán y luces (#ff6b35, #ffa500, #ffd700).
- **Acentos fríos**: celestes suaves para auroras, hielo, agua (#7fdbff, #a0d8ff).
- **Nave del explorador**: tonos cálidos, recuerda a vela de barco al atardecer.

### 7.4 Estética por isla

Cada isla tiene paleta y motivos visuales distintos, coherentes con su dominio:

**Isla de los Números (Quipu)**: geometría, patrones, cristales, arquitectura ordenada. Volcán central que arroja números en lugar de lava. Tonos dorados y cobrizos sobre base oscura. Paisaje inspirado en Cafayate o Jujuy transformado a fantasía.

**Isla de los Amigos (Tinkú central)**: cálida, plaza con gente diversa, luces suaves, puentes que conectan. Tonos rosados y dorados. Representa el encuentro, curiosamente lo que significa "tinkú" en quechua.

**Islas futuras** (documentadas pero no producidas en Ola 1): Palabras (Voseo) orgánico-biblioteca viva, Ciencias (Ñandú) laboratorio-glaciar, Sociales (Memo) ruinas arqueológicas, Arte (Color) acuarela animada.

### 7.5 Estética de los ejercicios

Los ejercicios pedagógicos tienen UI más sobria que el mundo global, pero conservan el tema de la isla. Fondo temático suave de la isla correspondiente, componentes shadcn/ui adaptados con la paleta, tipografía Andika generosa, tap targets grandes.

Los ejercicios H5P se envuelven con CSS custom que los hace coherentes con Tinku. No se usan con su estética default.

### 7.6 Dashboard del padre y del docente

Los adultos ven UI distinta: sobria, profesional, legible. Hereda la paleta de Tinku pero en tonos más planos, tipografía sans-serif estándar (no Andika, que es específicamente infantil), componentes shadcn/ui con su estética default. El objetivo es "herramienta útil", no "juego".

---

## 8. Arquitectura del mundo explorable

### 8.1 Concepto

El alumno navega un **mundo 2D interactivo** construido con Phaser 4. El mundo es un espacio cósmico con islas flotantes, cada una representando una materia o dominio. Una nave-barco permite navegación entre islas. Al entrar a una isla, transición a mapa interno con estilo **camino serpenteante tipo Candy Crush**, donde cada nodo es un concepto pedagógico.

### 8.2 Escalas del mundo

Tinku opera en tres escalas anidadas:

**Escala 1 — Mundo global**: océano cósmico con islas distantes, nave del explorador. Vista panorámica. El alumno elige destino.

**Escala 2 — Mapa interno de isla**: al entrar a una isla, zoom-in dramático, transición a vista del territorio de la isla con camino de nodos. Cada nodo es un concepto pedagógico con estado visual (bloqueado, disponible, en progreso, dominado).

**Escala 3 — Ejercicio**: al tocar un nodo, transición a UI de ejercicio (esto ya NO es Phaser, es React). Fondo temático de la isla, componentes pedagógicos (H5P o custom), feedback inmediato.

### 8.3 Nave del explorador

La nave es el avatar del alumno en el mundo global. Tiene:

- **Estados visuales según nivel del alumno**: novato (balsa simple), marinero (barco básico), capitán (galeón con velas trabajadas), almirante (nave completa iluminada), explorador legendario (nave única con detalles míticos).
- **Piezas coleccionables**: velas, banderines, pintura, figura de proa, linterna. Se ganan al completar misiones exploratorias y dominios de concepto.
- **Animación**: flotación sutil cuando está detenida, estela de luz cuando navega entre islas, celebración breve cuando el alumno sube de nivel.

### 8.4 Clima y ambiente dinámico (Ola 2+)

En Ola 1 el mundo es estático en su clima. En olas posteriores se agregan:

- **Clima por isla**: lluvia suave en Isla de Palabras, tormenta eléctrica ocasional en Isla de Números (volcán activo), nieve en Isla de Ciencias, niebla matinal en Isla de Sociales.
- **Ciclo día/noche sutil**: transición suave según hora del día del alumno.
- **Elementos ambientales animados**: pájaros que vuelan entre islas, criaturas marinas cósmicas, meteoros ocasionales.

### 8.5 Navegación entre escalas

La navegación entre las tres escalas es diégetica (parte del mundo del juego, no menús abstractos):

- Para ir de Mundo global a Isla: tocar la isla, la nave se mueve con animación hacia ella, zoom-in.
- Para salir de Isla a Mundo global: botón de nave visible en esquina, click, zoom-out.
- Para ir de Mapa interno a Ejercicio: tocar un nodo disponible, transición con fade.
- Para salir de Ejercicio al Mapa interno: al completar o tocar cerrar, fade back.

### 8.6 Performance targets

El mundo se diseña con performance como restricción no negociable:

- **60 FPS estables** en celular Android de gama media (ejemplo referencia: Motorola Moto G50).
- **LCP ≤ 2.5s** en 4G simulada.
- **Bundle inicial** (ruta del alumno): ≤ 500 KB gzipped de JavaScript.
- **Assets totales del mundo**: ≤ 2 MB en Ola 1 (se puede descargar progresivo).

Estas restricciones orientan decisiones técnicas: usar sprites optimizados (no imágenes sin comprimir), aprovechar SpriteGPULayer de Phaser 4, lazy-load de islas no visibles, audio comprimido, etc.

---

## 9. Sistema de gamificación

### 9.1 Niveles

El alumno sube de nivel del 1 al 50 con progresión de XP. Los títulos navales son visibles y marcan hitos:

- Niveles 1-5: Explorador Novato
- Niveles 6-15: Marinero
- Niveles 16-25: Navegante
- Niveles 26-35: Capitán
- Niveles 36-45: Almirante
- Niveles 46-50: Explorador Legendario

La curva de XP es progresiva pero no exponencial desmotivadora. Pasar del nivel 1 al 10 es rápido, del 40 al 50 requiere más dedicación sostenida pero es alcanzable en un ciclo escolar de uso regular.

### 9.2 XP — cómo se gana

- **Ejercicio correcto primer intento**: XP base.
- **Ejercicio correcto segundo intento**: XP reducida (la mitad).
- **Ejercicio correcto tras hint**: XP reducida (tercio).
- **Concepto dominado primera vez**: bonus grande.
- **Misión completada**: XP según tipo.
- **Racha diaria**: bonus pequeño por cada día consecutivo.

El XP se calibra para que el chico dedicado avance perceptiblemente cada sesión pero no pueda "farmear" de manera vacía (reintentar ejercicios fáciles no da más XP).

### 9.3 Colecciones

Tinku tiene un **bestiario amplio de colecciones documentadas**. En Ola 1 solo se activa la primera. Las demás se activan progresivamente.

**Colección 1 — Monedas de las 23 provincias argentinas** (activa en Ola 1):
Cada provincia es una moneda única con escudo provincial, nombre de la provincia y un dato cultural breve. Se gana al dominar conceptos específicos (cada concepto da una moneda provincial asignada de antemano, no aleatoria). Coleccionarlas completas requiere dominar los 23 conceptos madre de Ola 1.

**Colección 2 — Personajes recurrentes** (documentada, activación Ola 2):
Las 8 a 10 figuras del Cast argentino (Lucía de Rosario, Mateo de Bariloche, Valentina, etc.) son cartas coleccionables que se ganan al completar misiones narrativas específicas. Cada carta tiene ilustración, nombre, ciudad, dato.

**Colección 3 — Animales argentinos** (documentada, activación Ola 2):
Yaguareté, cóndor andino, huemul, carpincho, ñandú, guanaco, cauquén, lobito de río, aguará guazú, taruca. Se ganan al completar islas o hitos exploratorios mayores.

**Colección 4 — Piezas de nave** (activa en Ola 1, reducida):
Velas, banderines, pintura, figura de proa, linterna. Se ganan al completar misiones exploratorias. Decorativas, no funcionales.

**Colecciones futuras documentadas para Ola 3+**:
Comidas típicas argentinas (empanadas por región, alfajores, mate), lugares icónicos (Perito Moreno, Cataratas del Iguazú, Casa Rosada, Obelisco), instrumentos musicales (bombo, charango, guitarra criolla), plantas autóctonas (ceibo, ombú, jacarandá).

### 9.4 Misiones

Tres tipos de misiones conviven:

**Misiones pedagógicas diarias**: "Hacé 5 ejercicios de suma hoy", "Practicá durante 10 minutos". Se resetean cada día. Premio: XP y una moneda provincial.

**Misiones pedagógicas semanales**: "Dominá 3 conceptos esta semana", "Completá el repaso diario 5 veces esta semana". Se resetean cada lunes. Premio: XP grande y pieza de nave.

**Misiones exploratorias no-pedagógicas**: "Escuchá el volcán de la Isla de los Números durante 10 segundos", "Encontrá el cóndor escondido en el mapa", "Visitá las 2 islas disponibles". El objetivo es darle al chico momentos de juego puro que aflojan la presión del aprender. Son el "refrescar la mente". Premio: pequeñas recompensas estéticas.

**Misiones creativas**: "Diseñá tu bandera del explorador" (elegís íconos y colores, queda visible en tu perfil). Cero pedagogía, creatividad pura. Una misión creativa cada 2-3 semanas.

### 9.5 Modo desafío opcional

El alumno puede activar "modo desafío" en configuración, que agrega temporizador a ejercicios de velocidad (cuenta mental). Es **opt-in explícito**. Sin modo desafío, no hay presión temporal en ningún lado de la app.

### 9.6 Celebraciones jerarquizadas

Las celebraciones son proporcionales al logro. No todo es "fiesta". La jerarquía es:

- **Acierto individual**: feedback sutil. Bounce del botón, tick verde, sonido corto opcional. Sin confetti ni modal.
- **Dominio de concepto primera vez**: celebración media. Modal con Lottie de celebración, XP grande, moneda provincial ganada, sonido de victoria.
- **Racha 7 días**: celebración única. Lottie específica de racha, mensaje personalizado.
- **Subir de nivel**: celebración media. Nueva nave visible, título actualizado, sonido de progresión.
- **Isla completada**: celebración máxima. Animación extendida, bandera izada en la isla, registro permanente.

---

## 10. Arquitectura de agentes IA

### 10.1 Ari — el orquestador

Ari es el tutor IA central de Tinku. Su rol es acompañar pedagógicamente al alumno. No da respuestas directas, guía con preguntas. Celebra esfuerzo, no solo resultado. Su voz es cálida, respetuosa, en español rioplatense.

Ari no tiene cuerpo visible por defecto. Aparece contextualmente:

- Cuando el alumno falla dos veces seguidas el mismo ejercicio.
- Cuando el alumno toca un botón de ayuda explícito (siempre disponible).
- Cuando se detectan patrones de frustración (implementación en Ola 2+).

Visualmente, Ari es un personaje sutil en el borde inferior de la pantalla, no invasivo. Su presentación es breve (1-2 frases), relacionada al problema específico, con orientación socrática.

### 10.2 Subagentes por isla

Cada isla tiene su propio subagente especializado con personalidad distinta. En Ola 1, solo dos están activos:

- **Quipu** (Isla de los Números): tono sereno, metáforas andinas, lógica. Evoca el sistema inca de contabilidad con nudos. Se especializa en matemática.
- **Tinkú** (Isla de los Amigos): tono cálido, reflexivo, empático. Lleva el nombre del producto y representa el encuentro. Se especializa en socioemocional.

Subagentes documentados para islas futuras:

- **Voseo** (Isla de las Palabras): rioplatense, juguetón, amante del lenguaje.
- **Ñandú** (Isla de Ciencias): curioso, observador, metáforas pampeanas.
- **Memo** (Isla de Sociales): narrador, conector con historia.
- **Color** (Isla de Arte): descriptivo, sensorial, colorido.

### 10.3 Modelo 3 — evolución progresiva

La arquitectura se diseña para multi-agente pero se implementa monolítica en Ola 1. Se migra a multi-agente real cuando haya evidencia que lo justifique.

**Ola 1 — Monolítico con personalidades**:
- Un solo LLM responde, con system prompt dinámico.
- Al prompt base de Ari se le agrega fragmento de personalidad según isla activa del chico.
- Las personalidades viven en archivos separados (`/prompts/ari-base.md`, `/prompts/quipu.md`, etc.) listos para transformar en agentes reales más adelante.
- Contrato de interfaz limpio desde día 1: `{studentContext, conceptContext, question} → {response, needsFollowUp, suggestedAction}`.

**Ola 3 o cuando haya evidencia — Supervisor + Subagentes**:
- Migración a LangGraph con Ari como supervisor y subagentes reales.
- Cada subagente con su propio LLM, system prompt, herramientas, memoria.
- Posibilidad de que distintos subagentes usen distintos modelos según tarea.
- Orquestación explícita con routing, fallbacks, timeouts.

### 10.4 Proveedor LLM

**OpenRouter** como proxy unificado. Ventajas:

- Una sola API key para acceder a múltiples proveedores (Anthropic, OpenAI, Google, Meta).
- Fallback automático si un proveedor cae.
- Métricas de costo centralizadas.
- Posibilidad de A/B testing entre modelos.
- Desacoplado del proveedor de hosting.

**Modelo default en Ola 1**: Claude Haiku 4.5. Balance óptimo entre calidad de respuesta, costo y latencia. Para hints pedagógicos cortos es más que suficiente.

**Fallbacks configurados**: GPT-4o-mini (si Haiku cae), Gemini 2.5 Flash (si ambos caen).

### 10.5 Presupuesto y controles

Para evitar costos descontrolados en beta:

- Límite de hints por sesión (5 hints por sesión típica).
- Cache de respuestas: consultas muy similares se cachean por concepto.
- Budget cap diario por alumno (configurable, arranca en USD 0.10 por alumno por día).
- Alert si el costo diario total supera umbral.

Estimación de costo Ola 1: con 10-20 alumnos en beta, uso promedio 10 min/día cada uno, se estima costo mensual de IA en USD 5 a 15. Cuando Tinku tenga 1000 alumnos, se reevaluará.

### 10.6 Guardrails

Cada interacción con Ari pasa por:

- **Validación de input**: el chico no puede pedir cosas fuera de dominio pedagógico (detección simple de temas inapropiados).
- **Validación de output**: antes de mostrar al chico, filtrado de contenido inapropiado (palabras prohibidas, temas sensibles).
- **Logging estructurado**: cada interacción registra `{timestamp, studentId, islandId, conceptId, inputHash, model, outputHash, tokensUsed, latencyMs}` para auditar calidad y detectar patrones.

### 10.7 OpenRAG / Axioma 2.0 — integración futura

Tinku puede integrar a futuro con el ecosistema OpenRAG (forkeado en Axioma 2.0 del proyecto langflow-ai/openrag) para capacidades avanzadas:

- **Retrieval sobre corpus pedagógico curado**: docentes suben sus materiales, Ari los usa para contextualizar ejercicios al aula específica.
- **Docling para ingesta**: parseo de PDFs docentes, extracción estructurada.
- **OpenSearch para búsqueda vectorless**: encontrar ejercicios similares sin vector embeddings.
- **Langflow para orquestación visual** de agentes complejos.

Esta integración es **Ola 3+ o cuando la escala lo requiera**. En Ola 1 Tinku opera con OpenRouter directo. La arquitectura está pensada para acoplarse a OpenRAG como servicio externo cuando sea momento, no para depender de él desde el día 1.

---

## 11. Stack técnico

Stack reducido pero potente. Cada pieza tiene justificación específica.

### 11.1 Frontend

- **Next.js 14 App Router**: framework React con SSR, Server Actions, layouts anidados, routing jerárquico.
- **TypeScript estricto**: type safety end-to-end.
- **Tailwind CSS + shadcn/ui**: sistema de estilos + componentes accesibles basados en Radix UI.
- **Andika (Google Fonts)**: tipografía específica para lectura infantil.
- **Lucide React**: iconos SVG tree-shakeables.
- **Motion** (ex Framer Motion): animaciones declarativas para UI pedagógica.
- **Lottie (lottie-react)**: animaciones vectoriales para celebraciones y mascotas.
- **use-sound**: feedback auditivo.
- **Sonner**: toasts modernos.
- **Vaul**: drawers mobile-first.

### 11.2 Mundo explorable

- **Phaser 4**: motor de juegos 2D para el mundo, mapa interno de isla, animaciones complejas, partículas, clima dinámico, ciclo día/noche.
- **Phaser Editor v5** (opcional, USD 12/mes): editor visual con MCP support para Claude Code. Se evalúa tras 2-3 semanas de trabajo programático en Phaser.

### 11.3 Motor de ejercicios pedagógicos

- **H5P** (via `@lumieducation/h5p-react` o `h5p-standalone`): content types pre-construidos para ejercicios estándar (drag-drop, fill-blank, multi-select, matching, memory game, etc.).
- **Componentes custom React** para ejercicios específicos que H5P no cubre bien: numeric input con teclado grande, cálculo mental, ejercicios socioemocionales tipo dilema.

### 11.4 Backend

- **Supabase**: PostgreSQL, Auth, Storage, Edge Functions, Realtime subscriptions, pgvector (para futuro Ari avanzado).
- **Row Level Security (RLS)** en todas las tablas con datos sensibles, desde el primer schema.
- **Next.js Server Actions** para toda mutación server-side. Sin `/api/*` endpoints custom, sin FastAPI, sin microservicios.

### 11.5 IA

- **OpenRouter** como proxy LLM unificado.
- **Claude Haiku 4.5** como modelo default para Ari en Ola 1.
- **Anthropic SDK o OpenAI SDK** vía OpenRouter endpoint.

### 11.6 Herramientas de desarrollo

- **Claude Code** en VS Code + Claude Code en terminal para pair programming con IA.
- **Emergent** para prototipado rápido de pantallas específicas.
- **GitHub** con branches `feat/*` para features, `main` protegida.
- **Vitest** para tests unitarios.
- **Playwright** para tests E2E de flujos críticos.
- **ESLint + Prettier** configurados.

### 11.7 Servicios externos en Ola 1

- **Resend**: emails transaccionales (signup, reset password, reportes semanales).
- **PostHog** o analytics nativo de Supabase: tracking de eventos producto.
- **Sentry**: error tracking cliente y servidor.
- **MercadoPago**: pagos (activación Ola 2, no Ola 1).

---

## 12. Decisiones técnicas clave

### 12.1 Phaser + React, no uno o el otro

El mundo explorable vive en Phaser 4. Las pantallas de UI pedagógica, dashboards, auth, onboarding, Ari viven en React. Los dos stacks conviven en la misma aplicación Next.js.

Comunicación entre Phaser y React:
- Phaser se embebe en un componente React específico (`<GameWorld />`).
- Estado compartido con Zustand (store global).
- Eventos custom: cuando el chico toca una isla en Phaser, se dispara evento que React intercepta para navegar a la ruta del ejercicio.
- Las transiciones entre Phaser y React se hacen con fade global controlado por Zustand.

### 12.2 H5P con CSS custom, no estético default

H5P aporta el runtime y la estructura pedagógica de ejercicios. La estética default es sobria y no encaja con Tinku. Solución: wrapper React + CSS custom que re-estiliza los componentes H5P para que coincidan con el design system Tinku.

### 12.3 RLS desde el primer schema

Todas las tablas con datos sensibles tienen RLS habilitado desde su creación. No se agrega "después". Esto evita deuda técnica de seguridad y hace que cada tabla nazca pensando en multi-tenancy.

### 12.4 Auth alumno con code 6-char + anonymous sign-in de Supabase

El alumno no tiene email ni password. Entra con un código de 6 caracteres que el padre le da. Técnicamente esto se resuelve con `supabase.auth.signInAnonymously()` + asociación del session al `student_id`.

Este patrón se rehace fresh en Tinku 2.0 (no se migra del repo anterior).

### 12.5 Prompts de Ari en archivos separados

Cada personalidad (Ari base, Quipu, Tinkú, etc.) vive en su propio archivo `.md` bajo `/prompts/`. Esto permite iteración rápida de prompts sin tocar código, versionado en Git, y lista para transformar en subagentes reales en Ola 3+.

### 12.6 BKT simplificado Ola 1, formal Ola 2+

El motor adaptativo en Ola 1 es BKT simplificado (heurística inspirada en BKT con 3 parámetros: `learn_rate`, `slip`, `guess`). En Ola 2 o cuando el producto tenga tracción, se migra a BKT formal con 4 parámetros por concepto y actualización bayesiana completa.

Para beta cerrada con 10-20 chicos, la heurística simplificada es suficiente. La migración a BKT formal no rompe datos existentes.

### 12.7 No usar browser storage en artifacts

En el código frontend de Tinku, se evita `localStorage` y `sessionStorage` para estado pedagógico. Todo estado del alumno vive en Supabase, sincronizado por sesión. Esto evita inconsistencias cross-device y garantiza que el progreso está siempre seguro.

Excepción: preferencias locales de UI (sonido on/off, reducir movimiento on/off) sí pueden usar localStorage porque no afectan progreso.

---

## 13. Herramientas evaluadas y descartadas

Decisiones explícitas de herramientas que **no se usan** en Tinku 2.0, con justificación documentada.

### 13.1 Lovable (plataforma IA de desarrollo)

**Descartado.** Stack incompatible (requiere React + Vite, Tinku usa Next.js App Router). No optimizado para game dev con Phaser. Agrega lock-in de Lovable Cloud y Lovable AI Gateway sobre alternativas más estándar (Supabase directo, OpenRouter). Duplica valor que Claude Code + Emergent ya entregan. Viola el principio de stack reducido.

### 13.2 Unity WebGL

**Descartado.** Overkill para 2D, bundle size prohibitivo, curva de aprendizaje alta. Phaser 4 resuelve el mundo 2D con menor complejidad y mejor performance web.

### 13.3 Pixi.js directo

**Descartado.** Más low-level que Phaser 4. Phaser usa Pixi internamente pero agrega abstracciones (cámara, física, tilemaps, audio) que en Tinku son necesarias.

### 13.4 Vue, Svelte, Angular, SolidJS

**Descartado.** Next.js es la elección. Cambiar framework de UI no aporta ventaja y rompe stack establecido.

### 13.5 MongoDB, DynamoDB, Firestore

**Descartado.** PostgreSQL vía Supabase es la BD. Relacional con RLS encaja con el modelo de datos tri-lateral de Tinku.

### 13.6 GraphQL

**Descartado en Ola 1.** Next.js Server Actions + Supabase direct access cubren las necesidades. GraphQL agrega complejidad sin ventaja en el scope actual.

### 13.7 Redux, Recoil, Jotai

**Descartado.** Zustand para estado global compartido Phaser-React. React Context para estado local de árbol de componentes. TanStack Query para estado servidor.

---

## 14. Roadmap por olas (alto nivel)

Detalle operativo en `ROADMAP.md`. Aquí solo los hitos.

### 14.1 Ola 1 — Beta cerrada con alumnos

Objetivo: producto mínimo viable que los hijos de Javier y 5 familias conocidas del WhatsApp puedan usar.

Contenido:
- Isla de los Números (matemática 1° a 3°, grados 1-3).
- Isla de los Amigos (socioemocional mínima, 3-5 conceptos).

Features:
- Mundo explorable Phaser (mapa global + mapa interno de Isla de los Números).
- Sistema de niveles 1-50 con títulos navales.
- Colección de monedas de las 23 provincias.
- Misiones diarias, semanales y exploratorias.
- Ari monolítico con 2 personalidades (Quipu, Tinkú).
- Portal padre básico: dashboard de progreso del hijo, reporte semanal por email.
- Auth padre (email+password + Google OAuth), auth alumno (code 6-char).

Sin compliance formal durante beta cerrada. Sin MercadoPago. Sin portal docente.

Duración estimada: 8 a 12 semanas con foco.

### 14.2 Ola 2 — Expansión pedagógica y apertura

Objetivo: producto listo para apertura a público general con monetización.

Contenido: Isla de las Palabras (lengua 1° a 3°), más conceptos socioemocionales.

Features:
- MercadoPago integrado.
- Landing pública con waitlist.
- Compliance completo (consentimiento parental versionado, anonimización automática, logs).
- Portal padre maduro con reportes profundos.
- Beta abierta con 100+ familias.

### 14.3 Ola 3 — Docentes

Objetivo: primera cohorte de docentes piloto usando analytics.

Contenido: Isla de Ciencias básica.

Features:
- Portal docente con analytics básicos (progreso del aula, patrones de error, sugerencias accionables nivel 1).
- Migración de Ari monolítico a multi-agente real (LangGraph, supervisor + subagentes).
- Integración inicial con OpenRAG/Axioma 2.0 para retrieval sobre material del docente.

### 14.4 Ola 4 — Personalización profunda

Contenido: Isla de Sociales, más conceptos socioemocionales.

Features:
- Analytics docentes nivel 2 (recomendaciones accionables con materiales generados).
- Ari con acceso a corpus curricular via OpenRAG.
- BKT formal con 4 parámetros por concepto.
- Exportación de datos para investigación educativa (con consentimiento).

### 14.5 Ola 5+ — Expansión LATAM

Uruguay y Chile primero. Adaptación de contenido a currículos regionales. Contratación de primer equipo.

---

## 15. Anti-roadmap

Cosas explícitamente excluidas de Tinku, para siempre o para un horizonte muy largo:

- **Chat social entre alumnos**: nunca. Riesgo de grooming, bullying, exposición. Tinku no es red social.
- **Leaderboards públicos**: nunca. Competencia social destruye motivación intrínseca.
- **Compras dentro de la cuenta del chico**: nunca. Solo el padre puede pagar.
- **Ads dirigidos a chicos**: nunca. Viola ética básica de producto infantil.
- **Gamificación extractiva** (vidas, esperas, loot boxes, FOMO, dark patterns): nunca.
- **Apps mobile nativas iOS/Android con código separado**: no en Ola 1 ni 2. Tinku es PWA; si se empaqueta para stores, se empaqueta la PWA.
- **Contenido generado por alumnos que otros alumnos ven**: no hasta tener moderación robusta (Ola 5+).
- **Reconocimiento facial o biometría del alumno**: nunca.
- **Venta o cesión de datos de alumnos a terceros**: nunca, bajo ninguna circunstancia.

---

## 16. Métricas de éxito

Tinku se evalúa con métricas honestas, no con vanity metrics. Las métricas centrales son:

### 16.1 Métricas pedagógicas (las que más importan)

- **Conceptos dominados por alumno**: cuántos conceptos NAP el alumno aprendió a dominar (p_known ≥ 0.85) desde que empezó.
- **Retención de dominio**: de los conceptos dominados, cuántos siguen dominados después de 30 días (mide si Tinku enseña o solo entrena para el momento).
- **Progresión medida con pre-test/post-test**: en cohortes piloto, comparación de performance en conceptos específicos antes y después de uso sostenido de Tinku.

### 16.2 Métricas de uso saludable

- **Sesiones por semana**: cuántas veces el alumno vuelve voluntariamente. Target: 3-4 sesiones/semana para uso activo.
- **Duración promedio de sesión**: target 10-15 minutos. Si empieza a subir a 45+ minutos sistemáticamente, es señal de alarma (no de éxito) y se revisa si hay mecánicas extractivas que se colaron.
- **Retención D30**: porcentaje de alumnos que siguen usando Tinku 30 días después del primer uso.

### 16.3 Métricas de satisfacción

- **NPS del padre**: cuán probable es que recomiende Tinku a otro padre.
- **Feedback cualitativo trimestral**: entrevistas abiertas con padres de la beta.
- **Observación directa de chicos**: sesiones de observación con los hijos de Javier y testers, registro de momentos de frustración, aburrimiento, disfrute.

### 16.4 Métricas técnicas

- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **Error rate**: < 0.1% de sesiones con errores JavaScript no manejados.
- **Uptime**: > 99% (objetivo, no SLA).

---

## 17. Glosario

**BKT** (Bayesian Knowledge Tracing): modelo matemático para estimar probabilidad de que un alumno domine un concepto basándose en secuencia de aciertos/errores. Usado en el motor adaptativo de Tinku.

**CASEL** (Collaborative for Academic, Social, and Emotional Learning): organización que define el framework estándar internacional para aprendizaje socioemocional. Marco teórico para las islas socioemocionales de Tinku.

**Mastery learning**: enfoque pedagógico donde el alumno no avanza hasta dominar el concepto actual. Formulado por Bloom en los años 70.

**NAP** (Núcleos de Aprendizaje Prioritarios): currículo oficial argentino de educación primaria, definido por el Consejo Federal de Educación.

**Ola**: fase de desarrollo de Tinku. Cada ola expande el producto con nuevo alcance. Ola 1 = beta cerrada, Ola 2 = apertura, Ola 3 = docentes, Ola 4 = personalización profunda, Ola 5+ = expansión.

**p_known**: probabilidad estimada (0 a 1) de que un alumno domine un concepto específico. Umbral de "dominado" es p_known ≥ 0.85.

**PWA** (Progressive Web App): aplicación web que se comporta como app nativa (instalable, funciona offline parcial, push notifications). Tinku es PWA, empaquetable para stores si se decide.

**RLS** (Row Level Security): mecanismo de PostgreSQL para aplicar políticas de acceso por fila según usuario autenticado. Activo en todas las tablas con datos sensibles de Tinku.

**SDD** (Spec-Driven Development): metodología de desarrollo donde la especificación escrita precede al código. Principio fundamental de Javier para proyectos Tinku y Axioma.

**Voseo**: uso del pronombre "vos" en lugar de "tú", característico del español rioplatense. Idioma oficial del producto Tinku.

**ZDP** (Zona de Desarrollo Próximo): concepto de Vygotsky para describir el rango donde el alumno puede resolver con ayuda pero no solo. El motor adaptativo de Tinku mantiene al alumno en esta zona.

---

**Fin de TINKU.md**

Este documento es la fuente de verdad del proyecto Tinku 2.0. Todas las decisiones técnicas, de producto, pedagógicas y de gamificación se derivan de acá o de sus documentos hijos (`CONTENT.md`, `ROADMAP.md`). Cualquier contradicción futura con este documento requiere actualizarlo explícitamente antes de avanzar con la contradicción.
