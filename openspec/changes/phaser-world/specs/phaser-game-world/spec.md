# Spec: phaser-game-world (ADDED)

## Capability
`phaser-game-world` — escenas Phaser (MundoGlobal, IslaNumeros, BootScene), componente `<GameWorld />`, transiciones diégeticas, store Zustand React↔Phaser, estados de nodos de concepto, apariencia de nave según nivel, rendimiento Android.

## ADDED Requirements

### REQ-PW-01: Phaser Scenes Lifecycle

El sistema SHALL proporcionar tres escenas Phaser: `BootScene` (preload de assets), `MundoGlobalScene` (océano cósmico con islas), e `IslaNumerosScene` (mapa interno con nodos de concepto). `BootScene` MUST cargar todos los assets antes de transicionar a `MundoGlobalScene`.

#### Scenario: BootScene carga assets y transiciona

- **Given** el juego se inicializa
- **When** `BootScene` completa la carga de sprites, backgrounds y audio
- **Then** MUST transicionar a `MundoGlobalScene` sin pantalla en blanco
- **And** la barra de progreso MUST ser visible durante la carga

#### Scenario: Escenas no dejan memory leaks al desmontar

- **Given** `<GameWorld />` montado en el DOM
- **When** el componente se desmonta (navegación away)
- **Then** `Phaser.Game` MUST invocar `destroy()` en cleanup de `useEffect`
- **And** NO MUST dejar listeners, timers, o textures en memoria

---

### REQ-PW-02: GameWorld React Component

`<GameWorld />` es un componente `"use client"` que embebe el canvas de Phaser con lifecycle correcto. MUST ser importado con `ssr: false` via `next/dynamic` para evitar errores de SSR con Canvas API.

#### Scenario: Dynamic import ssr: false

- **Given** la ruta del juego
- **When** se importa `<GameWorld />`
- **Then** MUST usar `next/dynamic` con `{ ssr: false }`
- **And** MUST NO ejecutar código Phaser en el servidor

#### Scenario: Mount/unmount sin memory leaks

- **Given** `<GameWorld />` montado con `Phaser.Game` inicializado
- **When** se desmonta y remonta 20+ veces
- **Then** MUST NO acumular DOM nodes huérfanos ni listeners pendientes
- **And** cada remount MUST producir un `Phaser.Game` nuevo y funcional

---

### REQ-PW-03: Zustand useGameStore — Single Source of Truth

El store `useGameStore` MUST ser la única fuente de verdad para posición de nave, isla activa, nodo seleccionado, y estado de transición entre React y Phaser. Phaser scenes leen del store; NO mantienen estado paralelo.

#### Scenario: Phaser lee posición del store

- **Given** un alumno en `MundoGlobalScene`
- **When** el store actualiza `shipPosition`
- **Then** la nave en Phaser MUST moverse a la nueva posición
- **And** NO MUST existir estado de posición duplicado dentro de la escena Phaser

#### Scenario: React reacciona a cambios de escena activa

- **Given** un alumno navega de MundoGlobal a IslaNumeros
- **When** Phaser emite transición y el store actualiza `activeIsland`
- **Then** React MUST renderizar la ruta correspondiente
- **And** la navegación React MUST sincronizar con el estado del store

#### Scenario: Store shape incluye conceptStates

- **Given** `useGameStore`
- **Then** MUST contener `conceptStates: Record<string, ConceptState>` donde `ConceptState` es `'locked' | 'available' | 'in_progress' | 'mastered'`

---

### REQ-PW-04: Diégentic Transitions

Las transiciones entre escalas del juego MUST ser visuales (diégeticas), no instantáneas. Zoom-in (mundo→isla), zoom-out (isla→mundo), y fade (isla→ejercicio).

#### Scenario: Zoom-in a isla desde mundo

- **Given** el alumno toca una isla cliqueable en `MundoGlobalScene`
- **When** la nave se anima hacia la isla
- **Then** MUST ejecutar zoom-in cinematográfico hacia la isla
- **And** al completar MUST cambiar `activeIsland` en el store y transicionar a `IslaNumerosScene`

#### Scenario: Zoom-out de isla al mundo

- **Given** el alumno presiona el botón "volver al mundo" en `IslaNumerosScene`
- **When** se inicia la transición de retorno
- **Then** MUST ejecutar zoom-out desde la isla al océano global
- **And** al completar MUST establecer `activeIsland` a `null` y mostrar `MundoGlobalScene`

#### Scenario: Fade a ejercicio React

- **Given** el alumno selecciona un nodo disponible en `IslaNumerosScene`
- **When** se inicia la transición a ejercicio
- **Then** MUST ejecutar fade cross-fade coordinado con Zustand
- **And** `transitionType` MUST ser `'island_to_exercise'`

---

### REQ-PW-05: Concept Node States

Los nodos de concepto en `IslaNumerosScene` MUST mostrar cuatro estados visuales distintos, consultados desde Supabase via el store.

#### Scenario: Nodos reflejan estados de Supabase

- **Given** un alumno con progreso en Supabase
- **When** `IslaNumerosScene` se inicializa
- **Then** MUST consultar `student_concept_state` y mapear cada nodo a su estado visual: `locked` (gris, no cliqueable), `available` (brillante, cliqueable), `in_progress` (brillante con indicador), `mastered` (dorado con estrella)

#### Scenario: Nodo bloqueado no es cliqueable

- **Given** un nodo con estado `locked`
- **When** el alumno intenta tocarlo
- **Then** MUST NO navegar a ejercicio
- **And** MAY mostrar feedback visual sutil (shake o glow tenue)

---

### REQ-PW-06: Ship Visual Progression

La nave del alumno MUST cambiar su apariencia visual según el título naval alcanzado. Ola 1 incluye 4 estados mínimos: novato, marinero, capitán, almirante.

#### Scenario: Nave cambia sprite según título

- **Given** el `shipTitle` del alumno en el store
- **When** el título cambia (e.g., de `novato` a `marinero`)
- **Then** el sprite de la nave MUST actualizarse al correspondiente
- **And** la transición entre sprites MUST ser visible (no flash instantáneo)

---

### REQ-PW-07: Performance Targets

El juego MUST cumplir targets de rendimiento en dispositivos Android mid-range.

#### Scenario: FPS sustain en Android medio

- **Given** un dispositivo Android mid-range (Moto G50 o equivalente)
- **When** el alumno navega por `MundoGlobalScene` con estrellas y sprites activos
- **Then** FPS MUST ser ≥ 45fps sostenido (target 60fps)
- **And** LCP (Largest Contentful Paint) de la ruta del juego MUST ser ≤ 3s

#### Scenario: Bundle size controlado

- **Given** el build de producción
- **When** se mide el bundle inicial de la ruta del juego
- **Then** MUST ser ≤ 500KB gzipped (excluyendo assets cargados lazy)

---

### REQ-PW-08: Accessibility — prefers-reduced-motion

El juego MUST respetar `prefers-reduced-motion` del sistema del usuario.

#### Scenario: Animaciones reducidas con prefers-reduced-motion

- **Given** el usuario tiene `prefers-reduced-motion: reduce` activado en su SO
- **When** se renderiza cualquier escena Phaser
- **Then** las animaciones no esenciales (flotación de nave, partículas, parallax) MUST estar desactivadas o reducidas
- **And** las transiciones entre escenas MUST usar fade instantáneo en vez de zoom animado