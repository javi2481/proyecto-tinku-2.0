# CONTENT.md

**Plan de contenido pedagógico de Tinku 2.0**
Versión 1.0 — 19 de abril de 2026
Documento hijo de `TINKU.md`

---

## Índice

1. Propósito del documento
2. Arquitectura del contenido
3. Isla de los Números (Ola 1)
4. Isla de los Amigos (Ola 1)
5. Library de personajes argentinos
6. Library de contextos argentinos
7. Tipos de ejercicios soportados
8. H5P content types por tipo pedagógico
9. Proceso de producción de contenido
10. Proceso de revisión y calidad
11. Contenido futuro documentado

---

## 1. Propósito del documento

Este documento especifica qué enseña Tinku, cómo se estructura el contenido pedagógico, qué personajes y contextos vivifican los ejercicios, y cómo se produce y valida el material. Es un documento vivo que se actualiza a medida que se suma contenido.

Se deriva de `TINKU.md`. Toda decisión de contenido acá es coherente con los principios pedagógicos y éticos establecidos allá.

---

## 2. Arquitectura del contenido

### 2.1 Jerarquía pedagógica

El contenido de Tinku se organiza en cinco niveles jerárquicos:

**Isla** → **Región** → **Concepto** → **Ejercicio** → **Item**

- **Isla**: dominio amplio (Números, Palabras, Ciencias, Sociales, Arte, Amigos). En Ola 1 hay 2 islas activas.
- **Región**: sub-dominio dentro de una isla (en Números: "Numeración", "Operaciones", "Espacio y Medida"). En el mapa interno de la isla, cada región es una zona visual coherente.
- **Concepto**: unidad pedagógica que el alumno puede dominar (p_known ≥ 0.85). Ejemplo: "suma sin reagrupamiento hasta 100". Cada concepto es un nodo en el mapa interno.
- **Ejercicio**: instancia específica que evalúa el concepto. Un concepto tiene típicamente 15-25 ejercicios para que el alumno practique variedad sin repetir demasiado.
- **Item**: componente atómico de un ejercicio (un enunciado + opciones + respuesta correcta).

### 2.2 Metadata por concepto

Cada concepto tiene metadata estructurada:

```yaml
concept_id: M1_SUM_SIN_REAGR_100
island: numeros
region: operaciones
grade: 1
nap_alignment: "NAP 1° grado - Operaciones: suma"
prerequisites: [M1_NUM_HASTA_100, M1_CONTEO_ORDINAL]
title_student: "Sumar hasta 100"
title_parent: "Suma sin reagrupamiento hasta 100"
estimated_mastery_time_minutes: 45
difficulty_range: [0.2, 0.6]
province_coin: buenos_aires
tags: [matemática, operaciones, suma, 1er grado]
```

### 2.3 Metadata por ejercicio

Cada ejercicio tiene:

```yaml
exercise_id: M1_SUM_SIN_REAGR_100_001
concept_id: M1_SUM_SIN_REAGR_100
type: h5p_fill_blank
difficulty: 0.3
contexts: [kiosco, figuritas]
characters: [lucia]
source: generated_v1
status: approved
content: # estructura específica del tipo
  question: "Lucía compró {blank} alfajores de chocolate y {blank} de dulce de leche. ¿Cuántos alfajores compró en total?"
  blanks: [3, 4]
  total: 7
reviewed_by: javier
reviewed_at: 2026-04-19T10:30:00Z
```

---

## 3. Isla de los Números (Ola 1)

### 3.1 Alcance

Isla de los Números cubre matemática de 1° a 3° grado de primaria argentina, alineado al NAP. En Ola 1 se apunta a tener contenido completo de 1° grado y cobertura parcial de 2° y 3°.

### 3.2 Regiones de la isla

Tres regiones visuales distintas dentro del mapa interno:

**Región Numeración**: al pie del volcán. Conceptos básicos de número, conteo, orden, comparación. Tonos cálidos, flujos de lava luminosa.

**Región Operaciones**: laderas del volcán. Suma, resta, multiplicación, división. Tonos cobrizos, cristales geométricos.

**Región Espacio y Medida**: alrededor del volcán en terrenos más amplios. Medidas, figuras, comparación de magnitudes. Tonos arenosos, formas geométricas como arquitectura.

### 3.3 Conceptos de 1° grado (Ola 1 completos)

**Numeración**:
- M1_NUM_HASTA_20: Números hasta 20
- M1_NUM_HASTA_100: Números hasta 100
- M1_CONTEO_ORDINAL: Orden (primero, segundo, tercero...)
- M1_COMPARACION_NUM: Comparar cantidades (más, menos, igual)
- M1_PARES_IMPARES: Pares e impares

**Operaciones**:
- M1_SUM_SIN_REAGR_10: Suma sin reagrupamiento hasta 10
- M1_SUM_SIN_REAGR_20: Suma sin reagrupamiento hasta 20
- M1_SUM_SIN_REAGR_100: Suma sin reagrupamiento hasta 100
- M1_RESTA_SIMPLE_10: Resta simple hasta 10
- M1_RESTA_SIMPLE_20: Resta simple hasta 20
- M1_COMPLEMENTO_10: Complemento a 10

**Espacio y Medida**:
- M1_FIGURAS_BASICAS: Figuras básicas (círculo, cuadrado, triángulo, rectángulo)
- M1_MEDIDAS_COMPARATIVAS: Más largo, más corto, más alto, más bajo
- M1_TIEMPO_BASICO: Días de la semana, antes/después
- M1_DINERO_MONEDAS: Monedas argentinas ($1, $2, $5, $10)

### 3.4 Conceptos de 2° grado (Ola 1 parciales)

**Numeración**:
- M2_NUM_HASTA_1000: Números hasta 1000
- M2_VALOR_POSICIONAL: Unidades, decenas, centenas

**Operaciones**:
- M2_SUM_CON_REAGR: Suma con reagrupamiento
- M2_RESTA_CON_REAGR: Resta con reagrupamiento
- M2_MULT_INICIAL: Introducción a la multiplicación como suma repetida

### 3.5 Conceptos de 3° grado (Ola 1 parciales)

**Operaciones**:
- M3_TABLAS_MULT_2_5_10: Tablas de multiplicar 2, 5, 10
- M3_DIVISION_INTRO: Introducción a la división como reparto

### 3.6 Distribución de ejercicios

Objetivo Ola 1: cada concepto de 1° grado completo con 20-25 ejercicios. Conceptos de 2° y 3° con 10-15 ejercicios cada uno. Total Isla de los Números: aproximadamente 350-400 ejercicios.

Distribución por tipo:
- **MCQ (Multiple Choice)**: 40% - pregunta con 3-4 opciones visuales.
- **Numeric Input**: 25% - el chico escribe el número con teclado grande.
- **Drag and Drop Order** (H5P): 15% - ordenar números de menor a mayor.
- **Drag and Drop Match** (H5P): 10% - emparejar cantidad con número.
- **Fill in the Blanks** (H5P): 10% - completar enunciado con número.

### 3.7 Subagente: Quipu

Quipu es el subagente de la Isla de los Números. Su personalidad:

- **Tono**: sereno, paciente, curioso.
- **Voz**: adulta pero accesible. Usa voseo argentino. Habla con metáforas relacionadas a patrones, nudos, cuentas, medidas.
- **Referencia cultural**: el quipu inca como sistema de registro numérico con nudos. Establece que la matemática no es una abstracción europea, sino una herramienta ancestral latinoamericana.
- **Rol pedagógico**: ayuda a ver patrones, invita a descomponer problemas, celebra el proceso de pensamiento no solo el resultado.

Ejemplo de intervención de Quipu cuando el chico se traba en una suma:

> "Mirá, tenés 23 + 15. Probemos algo: ¿cuántas decenas hay en cada número? En 23 hay 2 decenas y 3 unidades. En 15 hay 1 decena y 5 unidades. Si sumás primero las decenas... ¿qué sale?"

---

## 4. Isla de los Amigos (Ola 1)

### 4.1 Alcance

Isla de los Amigos es la isla socioemocional mínima de Ola 1. Cubre las dos primeras competencias del framework CASEL: autoconciencia y autorregulación.

### 4.2 Conceptos de Ola 1

**Autoconciencia**:
- S1_RECONOCER_EMOCIONES: Reconocer emociones básicas propias (alegría, tristeza, enojo, miedo, sorpresa, calma).
- S1_NOMBRAR_EMOCIONES: Poner nombre a lo que uno siente.

**Autorregulación**:
- S1_CALMARSE: Estrategias simples para calmarse cuando uno está muy enojado o muy asustado.
- S1_ESPERAR_TURNO: Esperar el turno, demora de gratificación básica.
- S1_PEDIR_AYUDA: Reconocer cuándo uno necesita ayuda y pedirla.

### 4.3 Formato de ejercicios socioemocionales

Los ejercicios socioemocionales son distintos a los de matemática. No hay "respuesta correcta" en el sentido numérico. Formatos:

**Dilema con opciones**: se presenta una situación al chico, opciones de respuesta, cada respuesta tiene un feedback diferente (no "correcto/incorrecto", sino "esta es una forma de verlo, probemos esta otra también").

Ejemplo:
> Lucía se cayó en el patio de la escuela y se le rasguñó la rodilla. Está llorando. ¿Qué hacés?
> - A) Me río porque se cayó.
> - B) Le pregunto si está bien y la ayudo a levantarse.
> - C) Sigo jugando, no me importa.
> - D) Voy a buscar a la maestra.

Ninguna respuesta es "mal", pero Tinku guía hacia B y D como respuestas empáticas, con reflexión sobre A y C.

**Identificación de emoción**: se muestra una escena (ilustración o descripción corta) y el chico identifica qué emoción siente el personaje.

**Reflexión personal**: "Contame una vez que te sentiste así" (registro opcional, no calificado). Esto es más Ola 2 con moderación adecuada.

### 4.4 Subagente: Tinkú

Tinkú es el subagente de la Isla de los Amigos. Lleva el mismo nombre que el producto porque representa el núcleo ético del proyecto: el encuentro. Su personalidad:

- **Tono**: cálido, empático, acogedor. Nunca juzgador.
- **Voz**: suave, paciente. Usa voseo argentino. Habla con sensibilidad.
- **Rol pedagógico**: valida sentimientos del chico, ofrece perspectivas, invita a pensar sobre otros.

Ejemplo de intervención de Tinkú:

> "Lo que contaste es importante. A veces nos enojamos tanto que queremos gritarle al otro. Eso es normal, les pasa a todos los chicos y chicas. ¿Sabés qué ayuda cuando uno está muy enojado? Respirar hondo tres veces y contar hasta diez. ¿Lo probamos juntos?"

### 4.5 Cuidado especial con contenido socioemocional

Los ejercicios socioemocionales pueden tocar temas sensibles. Tinku se autoimpone:

- **Revisión por pedagogo**: cuando el scope crezca más allá de Ola 1, todo contenido socioemocional nuevo pasa por revisión de profesional con formación pedagógica.
- **Señales de alerta**: si un chico marca consistentemente respuestas indicadoras de distrés (tristeza persistente, ideación violenta, autocrítica severa), el sistema alerta al padre. Esto es Ola 2+.
- **Sin exposición forzada**: el chico puede saltear ejercicios socioemocionales que le incomodan sin penalización.
- **Derivación profesional**: Tinku no es terapia. Si detectamos necesidad de apoyo profesional, el mensaje claro al padre es "considerá consultar con un profesional".

---

## 5. Library de personajes argentinos

Los ejercicios no son abstractos. Están poblados por personajes recurrentes que el alumno reconoce. Esto genera familiaridad narrativa y ancla el contenido culturalmente.

### 5.1 Los 10 personajes del cast

**Lucía (8 años, Rosario)**
Le gusta dibujar, juega al fútbol, tiene un perro llamado Rulo. Va a la escuela pública del barrio. Aparece en contextos de: familia, kiosco, cancha, cumpleaños.

**Mateo (9 años, Bariloche)**
Le encanta esquiar, colecciona figuritas, es hijo único. Habla de las montañas y el lago. Aparece en contextos de: naturaleza, escuela, figuritas, invierno.

**Valentina (7 años, Córdoba)**
Canta en el coro de la escuela, tiene una hermana melliza, le gustan los animales. Aparece en contextos de: escuela, familia, animales, cumpleaños.

**Joaquín (10 años, Salta)**
Toca el bombo, le gusta la historia, va a la feria con su abuelo los sábados. Aparece en contextos de: feria, música, abuelos, historia local.

**Camila (6 años, Mendoza)**
Es la más chica del cast. Le gustan las uvas y los colores. Sus papás tienen un viñedo. Aparece en contextos de: naturaleza, uvas, colores, familia.

**Tomás (11 años, Ushuaia)**
El mayor del cast. Le interesa la ciencia, le apasionan los pingüinos, quiere ser biólogo marino. Aparece en contextos de: ciencia, frío, Antártida, animales marinos.

**Sofía (8 años, Buenos Aires - Boedo)**
Fanática de San Lorenzo, juega al vóley, va al parque los domingos con su papá. Aparece en contextos de: cancha, fútbol, parque, barrio.

**Benjamín (9 años, Posadas)**
Habla español y guaraní, le gusta contar historias, va al río los fines de semana. Aparece en contextos de: río, cuentos, naturaleza, guaraní.

**Martina (10 años, La Plata)**
Le gustan los dinosaurios, es nieta de paleontólogo, colecciona fósiles y rocas. Aparece en contextos de: ciencia, museo, rocas, dinosaurios.

**Lautaro (7 años, Tucumán)**
Le encanta comer empanadas tucumanas, juega al tenis, tiene dos hermanos mayores. Aparece en contextos de: comida, familia grande, tenis, calor.

### 5.2 Criterios de diseño de personajes

- **Representación geográfica**: cubrir distintas regiones argentinas, no solo Buenos Aires.
- **Diversidad de intereses**: deportes, arte, ciencia, música, naturaleza, tecnología.
- **Edades distribuidas**: de 6 a 11 para cubrir todo el rango target.
- **Paridad de género**: 5 femeninos, 5 masculinos (no obligatorio pero se busca).
- **Sin estereotipos**: a la chica no solo le gustan muñecas ni al chico solo fútbol. Cada uno tiene intereses variados.
- **Realismo**: son chicos reales, no superhéroes. Tienen virtudes y defectos sutiles.

### 5.3 Uso de personajes en ejercicios

Cada ejercicio que tenga enunciado narrativo menciona 1 o 2 personajes. Se balancea el uso para que el alumno se familiarice con todos sin que ninguno domine.

Ejemplos:
- "Lucía compró 3 alfajores y Sofía compró 4. ¿Cuántos alfajores tienen juntas?"
- "Mateo junta figuritas. Tiene 25 del álbum del Mundial. Si compra un sobre de 5, ¿cuántas tendrá?"
- "Benjamín vive en Posadas y Valentina en Córdoba. ¿Cuál de las dos ciudades está más al norte?"

---

## 6. Library de contextos argentinos

Los contextos son los escenarios donde viven los ejercicios. Establecen anclaje cultural tan importante como los personajes.

### 6.1 Contextos de vida cotidiana

- **Kiosco de barrio**: comprar alfajores, caramelos, revistas. Pagar con monedas y billetes, recibir vuelto.
- **Colectivo**: subir, pagar la tarjeta, contar paradas.
- **Plaza de barrio**: jugar, encontrarse con amigos, llevar al perro.
- **Escuela pública**: recreo, patio, salón.
- **Feria**: del sábado, variedad de puestos, regatear.
- **Cancha**: ir con el papá o la mamá, comprar entradas.
- **Cumpleaños**: invitados, torta, regalos.

### 6.2 Contextos geográficos argentinos

- **Ciudades grandes**: Buenos Aires, Córdoba, Rosario, Mendoza, La Plata.
- **Lugares turísticos reconocibles**: Cataratas del Iguazú, Glaciar Perito Moreno, Bariloche, Salta.
- **Paisajes típicos**: pampa, litoral, cordillera, patagonia.
- **Ríos**: Paraná, Uruguay, Río de la Plata.

### 6.3 Objetos y alimentos argentinos

- **Comida**: alfajor, facturas, empanadas (tucumanas, salteñas, mendocinas), asado, locro, mate.
- **Golosinas**: chupetines, caramelos de miel, mantecol.
- **Juguetes tradicionales**: figuritas, bolitas, barrilete, trompo.
- **Moneda**: pesos argentinos en denominaciones relevantes a 2026 (cuidar que los ejercicios no queden obsoletos por inflación, usar números redondos y ficticios cuando sea posible).

### 6.4 Fauna y flora argentina

- **Animales**: yaguareté, cóndor, huemul, carpincho, ñandú, guanaco, aguará guazú, vizcacha.
- **Árboles**: ceibo (flor nacional), ombú, jacarandá, lapacho, quebracho.
- **Ríos y lagos**: Nahuel Huapi, Argentino, Viedma.

### 6.5 Cuidado con el contexto económico

Los precios reales en Argentina cambian rápido por inflación. Los ejercicios que involucran precios usan:
- **Números redondos** y ficticios: "Lucía tiene $100 y compra un alfajor de $30".
- **Unidades monetarias distantes del precio real del momento** para que no queden obsoletos.
- **Enfoque en la operación**, no en el monto real.

---

## 7. Tipos de ejercicios soportados

Tinku soporta múltiples tipos de ejercicio. Algunos son componentes custom React, otros son H5P content types.

### 7.1 Custom React (no H5P)

**Multiple Choice con ilustración**: pregunta + 3-4 opciones, cada opción puede tener ilustración o texto. Feedback inmediato visual al tocar. Componente propio con diseño Tinku.

**Numeric Input con teclado grande**: el chico escribe un número usando un teclado numérico grande (tap targets 60x60px mínimo). Incluye botón "verificar". Componente propio.

**Cálculo mental timer** (solo modo desafío opcional): cuenta regresiva visible, input con teclado. Se desbloquea solo si el alumno activa modo desafío.

**Ejercicio socioemocional tipo dilema**: situación descripta con ilustración + opciones de respuesta + feedback reflexivo por opción. No "correcto/incorrecto". Componente propio.

### 7.2 H5P Content Types

H5P aporta 50+ content types pre-construidos. Tinku usa un subset cuidado:

**Drag and Drop**: arrastrar objetos a zonas correctas. Ideal para ordenar números, emparejar cantidad con numeral, clasificar figuras.

**Fill in the Blanks**: completar un enunciado con palabras o números. Ideal para ejercicios con contexto narrativo.

**Mark the Words**: marcar palabras específicas en un texto. Útil para ejercicios de identificación (marcar números pares, marcar sustantivos en Ola 2).

**Memory Game**: juego de pares. Para emparejar conceptos relacionados (cantidad con número, palabra con imagen).

**Multiple Choice H5P**: versión H5P del multiple choice. Alternativa a nuestro componente custom si se decide usar H5P para consistencia.

**Branching Scenario**: escenarios con decisiones ramificadas. Perfecto para ejercicios socioemocionales complejos en Ola 2+.

**Interactive Video**: video con preguntas embebidas. Útil para conceptos que se benefician de demostración visual (por ejemplo, explicar valor posicional con animación).

### 7.3 Cuándo usar custom vs H5P

Regla general:

- **Usar custom** cuando: el ejercicio es central y frecuente (MCQ, numeric input), necesita UX muy específica (teclado grande), o involucra gamificación tightly integrada (celebraciones custom, XP visible durante el ejercicio).
- **Usar H5P** cuando: es un tipo de interacción estándar (drag-drop, fill-blank, matching), queremos aprovechar el ecosistema existente, o el ejercicio es menos frecuente y no justifica desarrollo custom.

En Ola 1, aproximadamente 65% de los ejercicios son custom, 35% H5P.

---

## 8. H5P content types por tipo pedagógico

Mapeo explícito de qué content type H5P usar para cada tipo de ejercicio pedagógico.

### 8.1 Matemática

| Tipo pedagógico | H5P Content Type | Alternativa custom |
|---|---|---|
| Ordenar números | Drag and Drop | No |
| Emparejar cantidad con numeral | Memory Game o Drag Match | No |
| Completar suma en contexto | Fill in the Blanks | No |
| Identificar figura | Multiple Choice o custom | Sí, custom preferido |
| Cálculo mental rápido | Custom React | No H5P bueno |
| Contar objetos | Custom React | H5P no visualiza bien |

### 8.2 Socioemocional

| Tipo pedagógico | H5P Content Type | Alternativa custom |
|---|---|---|
| Identificar emoción en cara | Image Hotspots o Multiple Choice | Custom con ilustración |
| Dilema con opciones | Branching Scenario | Custom con feedback reflexivo |
| Secuenciar reacción apropiada | Drag and Drop Order | No |

### 8.3 Setup técnico de H5P

Librería seleccionada: **`@lumieducation/h5p-react`**.

Integración:
- H5P content se genera programáticamente (JSON válido) o con editor H5P standalone.
- Los archivos `.h5p` se hostean en Supabase Storage.
- El componente React carga el `.h5p` correspondiente al ejercicio y lo renderiza.
- CSS custom de Tinku sobrescribe estilos default para coherencia visual.
- Eventos de completitud del H5P se propagan al estado global (Zustand) para que Tinku pueda procesar resultado.

---

## 9. Proceso de producción de contenido

### 9.1 Flujo de generación de ejercicios

Tres pasos: **plan**, **generación**, **revisión**.

**Paso 1 — Plan del concepto**:
Antes de generar ejercicios para un concepto, se define el plan en formato YAML:

```yaml
concept_id: M1_SUM_SIN_REAGR_100
target_exercise_count: 25
difficulty_distribution:
  easy: 8   # difficulty 0.2-0.4
  medium: 12 # difficulty 0.4-0.6
  hard: 5   # difficulty 0.6-0.8
type_distribution:
  mcq_custom: 10
  numeric_input: 6
  h5p_fill_blank: 5
  h5p_drag_match: 4
context_distribution:
  kiosco: 6
  cancha: 4
  escuela: 5
  figuritas: 4
  cumpleanos: 3
  neutral: 3
characters_to_use: [lucia, mateo, valentina, joaquin, sofia]
```

**Paso 2 — Generación con LLM**:
Claude (via OpenRouter) genera ejercicios siguiendo el plan. Prompt estructurado que incluye:
- El plan completo.
- Library de personajes y contextos relevantes.
- Formato esperado de salida (JSON válido que coincide con el schema de ejercicios).
- Criterios de calidad: distractores plausibles no obvios, enunciados naturales, contexto argentino coherente, dificultad calibrada.

Se generan ~30 ejercicios por ronda (un poco más de los necesarios para poder descartar los peores).

**Paso 3 — Revisión humana**:
Javier revisa los ejercicios generados en la UI de `/review-exercises`. Por cada ejercicio:
- Acepta tal cual.
- Acepta con modificación menor (edita en la UI).
- Rechaza (lo descarta, no entra al dataset).

Criterios de revisión:
- Enunciado natural en español rioplatense.
- Contexto argentino coherente (no parece traducción).
- Distractores (opciones incorrectas) plausibles, no obvios.
- Dificultad calibrada al target.
- Sin errores matemáticos (importante verificar esto siempre).
- Sin sesgos o estereotipos problemáticos.

Target: 20-25 ejercicios aprobados por concepto tras revisión.

### 9.2 Herramientas de producción

- **Script de generación**: `scripts/generate_exercises.ts` que toma un plan YAML y genera JSON via OpenRouter. Ejecutable desde línea de comandos.
- **UI de revisión**: `/admin/review-exercises` en la app (disponible solo para usuarios con rol admin). Permite ver, editar, aprobar, rechazar ejercicios.
- **Seed idempotente**: los ejercicios aprobados se exportan a un archivo `seeds/exercises.yml` versionado en Git. Un script importa este archivo a Supabase sin duplicar (usando `exercise_id` como key).

### 9.3 Estimación de esfuerzo para Ola 1

Producir Isla de los Números completa (aproximadamente 350 ejercicios):

- Planificación por concepto: 30 min × 20 conceptos = 10 horas.
- Generación con LLM: 10 min × 20 conceptos = 3 horas (la mayor parte es espera).
- Revisión humana: 45 min × 20 conceptos = 15 horas.
- Ajustes finales y testing: 5 horas.

**Total estimado**: 33 horas de trabajo humano distribuido en 2-3 semanas calendar.

Producir Isla de los Amigos mínima (30-40 ejercicios):

- Este contenido requiere **más cuidado humano** porque los ejercicios socioemocionales no se generan bien con LLM sin supervisión cuidadosa.
- Planificación: 2 horas.
- Generación: 4 horas (más back-and-forth con LLM).
- Revisión: 8 horas.
- **Total**: 14 horas.

---

## 10. Proceso de revisión y calidad

### 10.1 Niveles de revisión

Todo ejercicio pasa por al menos un nivel de revisión antes de activarse:

**Nivel 1 — Revisión inicial** (todos los ejercicios):
Revisión por Javier con los criterios listados en 9.1. Esto es el filtro base.

**Nivel 2 — Feedback de testers** (Ola 1 beta):
Los hijos de Javier y las familias del WhatsApp hacen los ejercicios y reportan problemas. Se instrumenta un feedback rápido en la UI ("¿este ejercicio fue raro?") que genera ticket.

**Nivel 3 — Revisión pedagógica profesional** (Ola 2 en adelante):
Antes de abrir al público, contratar pedagogo por un ciclo de revisión. Especialmente importante para contenido socioemocional.

### 10.2 Criterios de calidad pedagógica

Más allá de "bien escrito", los ejercicios se evalúan pedagógicamente:

- **Alineación al NAP**: el concepto está en el currículo oficial argentino.
- **Progresión coherente**: el ejercicio requiere lo que debería requerir según su difficulty.
- **Sin confusiones conceptuales**: un ejercicio de "suma sin reagrupamiento" no tiene números que requieran reagrupar.
- **Distractores pedagógicos**: las opciones incorrectas reflejan errores comunes reales, no opciones absurdas. Esto ayuda al motor adaptativo a diagnosticar tipos de error.

### 10.3 Instrumentación de calidad

Cuando la app esté en uso, se tracea por ejercicio:

- Tasa de acierto global.
- Tiempo promedio de respuesta.
- Distribución de respuestas incorrectas elegidas (ayuda a detectar si un distractor es "demasiado atractivo" = probablemente el ejercicio está mal).
- Feedback explícito de padres/chicos.

Ejercicios con problemáticas detectadas se marcan para revisión y potencialmente se desactivan.

---

## 11. Contenido futuro documentado

Para que el bestiario de contenido tenga coherencia de largo plazo, se documentan las islas e islas futuras aunque no se produzcan aún.

### 11.1 Isla de las Palabras (Ola 2)

Lengua de 1° a 3° grado. Regiones: Vocabulario, Lectura Comprensiva, Escritura.

Conceptos iniciales planeados: reconocer letras, sílabas simples, palabras frecuentes, frases cortas, ortografía básica (mb antes de b, p, m).

Subagente: **Voseo**. Tono juguetón, rioplatense, le encantan las palabras y los juegos lingüísticos.

### 11.2 Isla de Ciencias (Ola 3)

Ciencias Naturales 1° a 3°. Regiones: Mundo Vivo, Mundo Físico, Mundo Tierra.

Conceptos iniciales: seres vivos y no vivos, partes del cuerpo humano, ciclo del agua, los sentidos, plantas y animales.

Subagente: **Ñandú**. Tono curioso, observador, hace muchas preguntas.

### 11.3 Isla de Sociales (Ola 3)

Ciencias Sociales 1° a 3°. Regiones: Vida en Comunidad, Historia, Geografía.

Conceptos iniciales: familia y comunidad, días y meses, efemérides argentinas básicas, provincias argentinas, bandera y símbolos.

Subagente: **Memo**. Tono narrador, conector con historia, le gusta contar cómo era antes.

### 11.4 Isla de Arte (Ola 4)

Educación artística integrada. Regiones: Visual, Musical, Corporal.

Conceptos iniciales: colores primarios y secundarios, formas, ritmos básicos, expresión corporal.

Subagente: **Color**. Tono descriptivo, sensorial, sinestésico.

### 11.5 Más islas socioemocionales (Ola 4+)

Isla de los Amigos se expande. Nuevas islas socioemocionales cubren conciencia social (empatía avanzada), habilidades relacionales (comunicación, cooperación, resolución de conflictos), toma de decisiones responsables.

Subagentes distintos por isla socioemocional, o Tinkú como subagente común de la dimensión socioemocional en todas las islas. A decidir cuando llegue el momento.

---

**Fin de CONTENT.md**

Este documento se actualiza a medida que el contenido crece. Cada vez que se agrega un concepto nuevo o se redefine la estructura, se actualiza acá y se versiona en Git.
