# Delta Spec: pedagogical-catalog (ADDED)

## Capability
`pedagogical-catalog` — Archivos YAML de islas, regiones, conceptos, personajes y contextos que definen el modelo pedagógico de Ola 1. Fuente de verdad offline versionada en Git para todo el contenido disponible.

## ADDED Requirements

### REQ-PC-001: Islands Catalog YAML

**RFC 2119**: MUST

El archivo `seeds/islands.yml` DEBE contener la definición completa de las 2 islas de Ola 1 con toda su metadata pedagógica.

#### Scenario: Estructura de islas YAML

- **Given** el archivo `seeds/islands.yml`
- **When** se parsea el YAML
- **Then** MUST contener exactamente 2 islas: "Isla de los Números" e "Isla de los Amigos"
- **And** cada isla MUST tener: `id` (UUID o slug), `name`, `description`, `theme_color`, `nap_alignment` (referencia a NAP)
- **And** los IDs de isla MUST coincidir con los enum values en `island_id` de la DB

#### Scenario: Isla de los Números

- **Given** la isla "Isla de los Números" en el YAML
- **Then** MUST tener al menos 3 regiones referenciadas (Numeración, Operaciones, Espacio y Medida)
- **And** su `nap_alignment` MUST referenciar competencias matemáticas de 1° a 3° grado

#### Scenario: Isla de los Amigos

- **Given** la isla "Isla de los Amigos" en el YAML
- **Then** MUST tener regiones referenciadas de desarrollo socioemocional
- **And** su `nap_alignment` MUST referenciar competencias de ciudadanía y convivencia

---

### REQ-PC-002: Regions Catalog YAML

**RFC 2119**: MUST

El archivo `seeds/regions.yml` DEBE definir las regiones dentro de cada isla con su metadata.

#### Scenario: Estructura de regiones YAML

- **Given** el archivo `seeds/regions.yml`
- **When** se parsea el YAML
- **Then** cada región MUST tener: `id`, `island_id`, `name`, `description`, `order` (orden de desbloqueo)
- **And** MUST existir al mínimo 2 regiones por isla
- **And** MUST existir mínimo 6 regiones en total

---

### REQ-PC-003: Concepts Catalog YAML

**RFC 2119**: MUST

El archivo `seeds/concepts.yml` DEBE definir los ~25 conceptos de Ola 1 con prerequisitos, dificultad y alineación curricular.

#### Scenario: Estructura de conceptos YAML

- **Given** el archivo `seeds/concepts.yml`
- **When** se parsea el YAML
- **Then** cada concepto MUST tener: `id`, `region_id`, `name`, `description`, `difficulty_range` (tupla `[min, max]`), `province_coin` (emoji/identificador), `nap_alignment`, `prerequisites` (lista de IDs), `type_distribution` (distribución de exercise_types)
- **And** MUST existir 20+ conceptos para Isla de los Números
- **And** MUST existir 5 conceptos para Isla de los Amigos

#### Scenario: Prerequisitos forman un DAG sin ciclos

- **Given** todos los conceptos en `seeds/concepts.yml`
- **When** se construye el grafo de prerequisitos
- **Then** el grafo MUST ser un DAG (Directed Acyclic Graph)
- **And** MUST NO existir ciclos de prerequisitos

#### Scenario: Type distribution espleta para Números

- **Given** los conceptos de Isla de los Números
- **When** se inspecciona el campo `type_distribution` de cada concepto
- **Then** las distribuciones MUST sumar 100%
- **And** MUST incluir: MCQ (~40%), NumericInput (~25%), H5P fill-blank (~15%), H5P drag-drop (~10%), H5P match (~10%)

#### Scenario: Type distribution espleta para Amigos

- **Given** los conceptos de Isla de los Amigos
- **When** se inspecciona el campo `type_distribution`
- **Then** las distribuciones MUST sumar 100%
- **And** MUST incluir `socioemotional_dilemma` como tipo primario

---

### REQ-PC-004: Characters Catalog YAML

**RFC 2119**: MUST

El archivo `seeds/characters.yml` DEBE definir los 10 personajes del cast con metadata completa.

#### Scenario: Estructura de personajes YAML

- **Given** el archivo `seeds/characters.yml`
- **When** se parsea el YAML
- **Then** MUST existir exactamente 10 personajes: Lucía, Mateo, Valentina, Joaquín, Camila, Tomás, Sofía, Benjamín, Martina, Lautaro
- **And** cada personaje MUST tener: `id`, `name`, `age` (6-12), `city` (ciudad argentina), `interests` (lista), `personality_traits` (lista)

---

### REQ-PC-005: Contexts Catalog YAML

**RFC 2119**: MUST

El archivo `seeds/contexts.yml` DEBE definir los contextos argentinos para generar ejercicios culturalmente relevantes.

#### Scenario: Estructura de contextos YAML

- **Given** el archivo `seeds/contexts.yml`
- **When** se parsea el YAML
- **Then** cada contexto MUST tener: `id`, `name`, `description`, `setting_type` (ej: kiosco, colectivo, plaza, escuela, feria, cancha, cumpleaños)
- **And** MUST existir al menos 8 contextos argentinos distintos
- **And** los contextos económicos (kiosco, feria) MUST usar números ficticios, no precios reales argentinos

#### Scenario: Contextos son culturalmente argentinos

- **Given** los contextos en `seeds/contexts.yml`
- **Then** las descripciones MUST estar en español rioplatense con voseo
- **And** MUST referenciar elementos culturales argentinos (no traducciones de contextos genéricos)