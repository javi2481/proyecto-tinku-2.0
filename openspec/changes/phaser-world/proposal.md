# Proposal: phaser-world

## Intent

Construir el mundo explorable 2D de Tinku usando Phaser 4, permitiendo que el alumno navegue un océano cósmico con su nave, entre a islas, y transite entre las tres escalas del juego (mundo global → mapa interno de isla → ejercicio React). Este change establece la unión visual entre el alumno y la plataforma pedagógica: sin mundo explorable, Tinku no es un juego — es solo una app de ejercicios.

**Usuarios afectados**: alumno (primario). Accede al mundo explorable como experiencia central de juego.

## Scope

### In Scope
- Escena Phaser `MundoGlobal`: fondo estrellado, islas flotantes clickeables, nave del alumno con animación de flotación y navegación
- Escena Phaser `IslaNumeros`: mapa interno con camino serpenteante de nodos de concepto, estados visuales (bloqueado, disponible, en progreso, dominado)
- Transiciones diégeticas entre escalas: mundo→isla (zoom-in), isla→mundo (zoom-out), nodo→ejercicio (fade cross-fade React)
- Store Zustand `useGameStore` sincronizando posición de nave, isla activa, nodo seleccionado entre Phaser y React
- Componente React `<GameWorld />` que embebe Phaser con lifecycle correcto (mount/unmount sin memory leaks)
- Nave del alumno con estados visuales según título naval (4 estados mínimos Ola 1: novato, marinero, capitán, almirante)
- Botón de volver al mundo desde el mapa interno de isla
- Assets iniciales: fondo cósmico, 2 islas placeholder (Números + Amigos), nave con estados, nodos de concepto
- Performance baseline: medir FPS en Android medio, establecer target 60fps

### Out of Scope
- Isla de los Amigos — mapa interno funcional (solo placeholder visual visible pero no cliqueable)
- Clima dinámico y ciclo día/noche (Ola 2+)
- Animaciones Lottie dentro de Phaser (eso va en gamificación)
- Integración con BKT engine (eso va en `bkt-engine`)
- Componentes de ejercicio React (eso va en `exercise-components`)
- Misiones y gamificación (eso va en `gamification`, fase 1.8)
- Optimización de assets productivos (Ola 2, cuando haya ilustrador)
- Phaser Editor v5 (se evalúa post-fase si la curva de aprendizaje justifica)

## Capabilities

### New Capabilities
- `phaser-game-world`: escenas Phaser (MundoGlobal, IslaNumeros), componente `<GameWorld />`, transiciones, assets, store Zustand de estado del juego

### Modified Capabilities
- `project-bootstrap`: se agrega `phaser` como dependencia npm y se modifica la config de build si es necesario para assets de Phaser

## Approach

**Arquitectura de escenas Phaser en Next.js App Router**:

Phaser se embebe en un componente `"use client"` `<GameWorld />` que monta el canvas de Phaser dentro de un `<div>` por ref. El `Phaser.Game` se inicializa en `useEffect` y se destruye en cleanup — sin memory leaks.

**Estructura de archivos**:
```
src/game/
  scenes/MundoGlobalScene.ts
  scenes/IslaNumerosScene.ts
  scenes/BootScene.ts          # preload de assets
  config.ts                    # Phaser config centralizado
  constants.ts                 # dimensiones, velocidades, colores
src/stores/
  useGameStore.ts              # Zustand store global Phaser↔React
src/components/game/
  GameWorld.tsx                # wrapper React "use client"
src/public/assets/
  sprites/                     # spritesheets y atlas
  backgrounds/                 # fondos parallax
  audio/                       # efectos de sonido
```

**Store Zustand `useGameStore`** (shape clave):
```ts
interface GameStore {
  // Mundo global
  shipPosition: { x: number; y: number };
  shipTitle: 'novato' | 'marinero' | 'capitán' | 'almirante';
  activeIsland: string | null; // null = en mundo global

  // Isla interna
  selectedNode: string | null;
  conceptStates: Record<string, 'locked' | 'available' | 'in_progress' | 'mastered'>;

  // Transiciones
  transitioning: boolean;
  transitionType: 'world_to_island' | 'island_to_world' | 'island_to_exercise' | null;

  // Acciones
  navigateToIsland: (islandId: string) => void;
  navigateToWorld: () => void;
  selectNode: (nodeId: string) => void;
  setConceptState: (conceptId: string, state: ConceptState) => void;
}
```

**Transiciones diégeticas**: Phaser maneja la animación visual (zoom, fade). Zustand dispara el cambio de escena. React Router (App Router) navega al componente de ejercicio cuando `selectedNode` cambia y `transitionType === 'island_to_exercise'`.

**Assets Ola 1**: mix de placeholders generados (fondo estrellado procedural con Phaser), assets de Kenney.nl/itch.io para elementos UI, y sprites de nave simples. La estética Ola 1 es funcional, no final.

**Performance**: usar `SpriteGPULayer` de Phaser 4 para estrellas de fondo. Lazy-load de assets de isla al navegar. Target medido con `game.loop.actualFps`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/game/` | New | Escenas Phaser, config, constantes |
| `src/stores/useGameStore.ts` | New | Store Zustand para estado Phaser↔React |
| `src/components/game/GameWorld.tsx` | New | Wrapper React "use client" para Phaser |
| `src/app/(game)/page.tsx` | Modified | Ruta principal renderiza `<GameWorld />` |
| `src/app/(game)/island/[id]/page.tsx` | Modified | Rута de isla renderiza escena interna |
| `public/assets/` | New | Sprites, backgrounds, audio para Phaser |
| `package.json` | Modified | Se agrega dependencia `phaser` |
| `next.config.mjs` | Modified | Posible config para asset serving |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Phaser learning curve alto | Med | SepararBootScene simple primero. Prototipar escena mínima antes de la completa. Evaluar Phaser Editor v5 tras 2 semanas |
| Memory leaks en mount/unmount de Phaser en React | Med | Cleanup riguroso en `useEffect` return. Testear navegación entre rutas 20+ veces sin leaks |
| Performance en Android medio (< 60fps) | Med | SpriteGPULayer para partículas/estrellas. Medir FPS real desde día 1. Lazy-load assets de isla |
| Sincronización Zustand↔Phaser pierde estado | Bajo | Store único como fuente de verdad. Phaser lee del store, no mantiene estado paralelo. Tests de integración |
| Assets placeholder se ven genéricos | Alto | Aceptar para Ola 1 beta cerrada. Estética consistente importa más que calidad individual. Curaduría sobre cantidad |

## Rollback Plan

1. Si Phaser demuestra ser inviable en semana 2 (no se logra escena mínima funcional): evaluar fallback a Canvas API + requestAnimationFrame sin motor de juegos. Perderíamos tilemaps y scene management pero ganaríamos simplicidad.
2. Si memory leaks no se resuelven: implementar patrón de singleton de Phaser.Game que persiste entre navegaciones en vez de destruir/recrear.
3. Si performance es < 30fps en Android: reducir assets, desactivar parallax, usar sprites más simples. Target mínimo aceptable es 30fps.

## Dependencies

- **Phase 1.2 (schema)**: las tablas `islands`, `concepts`, `student_concept_state` deben existir para alimentar los estados visuales de los nodos de concepto en `IslaNumerosScene`
- **Phase 1.4 (auth)**: se necesita identidad del alumno para cargar su progreso (conceptos dominados, nave, posición). Sin auth no se puede personalizar el mundo
- **`phaser` npm package**: Phaser 4.x como dependencia nueva

## Success Criteria

- [ ] El alumno puede navegar el océano cósmico y ver 2 islas flotantes
- [ ] Al tocar una isla, la nave se anima hacia ella y hace zoom-in al mapa interno
- [ ] En el mapa interno de Isla de los Números, los nodos de concepto muestran estados visuales correctos (bloqueado, disponible, en progreso, dominado)
- [ ] Al tocar un nodo disponible, se dispara transición a ejercicio React
- [ ] El botón "volver al mundo" regresa del mapa interno al mundo global con zoom-out
- [ ] La navegación React↔Phaser no pierde estado (20+ transiciones sin bugs)
- [ ] FPS ≥ 45 en Android medio (Moto G50), target 60fps
- [ ] No hay memory leaks visibles al navegar entre rutas repetidamente
- [ ] Store Zustand es la única fuente de verdad para posición de nave e isla activa