# Design: phaser-world

## Technical Approach

5 commits atómicos que incrementan desde asset config hasta transiciones diégeticas completas. Phaser 4 se embebe en Next.js via `dynamic({ ssr: false })` con lifecycle estricto en `useEffect`. Zustand es single source of truth — Phaser scenes subscribe al store, React components leen del store, nunca hay estado paralelo.

Refs: specs `project-bootstrap` (MOD), `phaser-game-world` (ADD). Proposal `phaser-world`.

## Architecture Decisions

### AD-01: Phaser Scene Architecture — 3 Scenes + Transition Coordinator

**Choice**: BootScene → MundoGlobalScene → IslaNumerosScene (linear), con `TransitionCoordinator` singleton que gestiona animaciones diégenticas.
**Alternatives**: (a) Single scene con state machine — Phaser scenes ya son state machines naturales, innecesario reinventar. (b) React Flow para navegación — pierderenders, partículas, todo lo que justifica Phaser.
**Rationale**: Cada escena Phaser tiene lifecycle propio (preload/create/update). El `TransitionCoordinator` centraliza zoom-in/out/fade con configs parametrizables, evitando lógica de transición duplicada en scenes.

### AD-02: `<GameWorld />` via dynamic import ssr: false

**Choice**: Componente `"use client"` que importa `PhaserGame` sub-component via `next/dynamic({ ssr: false })`. El `Phaser.Game` se crea en `useEffect` y se destruye en cleanup.
**Alternatives**: (a) `<canvas>` con `ref` directo — pierde type safety y Phaser plugin system. (b) iframe — overhead de comunicación postMessage innecesario.
**Rationale**: Patrón documentado en bootstrap design (AD-12). `ssr: false` es obligatorio porque Phaser usa Canvas API que no existe en Node. Cleanup riguroso previene memory leaks en navegación.

### AD-03: Zustand como Single Source of Truth React↔Phaser

**Choice**: `useGameStore` Zustand con shape: `{ activeScene, shipPosition, shipTitle, activeIsland, selectedNode, conceptStates, transitioning, transitionType }`. Phaser scenes leen via `useGameStore.getState()`, React via `useGameStore()`.
**Alternatives**: (a) Phaser EventEmitter + React state — estado duplicado, race conditions. (b) RxJS — overkill, agrega complejidad.
**Rationale**: Zustand es la convención del proyecto (TINKU.md §12.1). Store único elimina sincronización. Phaser scenes subscriben al store en `create()` y desubscriben en `shutdown()`. React re-renderiza solo en slices que cambian.

### AD-04: Diégentic Transitions con Config Object

**Choice**: Objeto `TRANSITION_CONFIG` centralizado:
```
WORLD_TO_ISLAND: { type: 'zoom-in', duration: 800, easing: 'Power2' }
ISLAND_TO_WORLD: { type: 'zoom-out', duration: 600, easing: 'Power2' }
ISLAND_TO_EXERCISE: { type: 'fade', duration: 400 }
```
`TransitionCoordinator` ejecuta la animación Phaser y al completar actualiza `activeScene` en Zustand.
**Alternatives**: (a) React Router transitions — pierde animación diégetica, es un fade genérico. (b) Sin transiciones — UX jarring, viola TINKU.md §8.5.
**Rationale**: Animaciones diégeticas son requisito del producto (§8.5). Centralizar configs hace fácil ajustar timings y desactivar con `prefers-reduced-motion`.

### AD-05: Node Visual States con Map de Config Visual

**Choice**: `NODE_STATE_CONFIG` map:
```ts
locked:      { tint: 0x666666, alpha: 0.5, interactive: false, glow: false }
available:   { tint: 0xffffff, alpha: 1.0, interactive: true,  glow: true }
in_progress: { tint: 0x44ff88, alpha: 1.0, interactive: true,  glow: true, pulse: true }
mastered:    { tint: 0xffd700, alpha: 1.0, interactive: false, glow: true, star: true }
```
IslaNumerosScene lee `conceptStates` del store y aplica config visual a cada nodo.
**Alternatives**: (a) Spritesheet con 4 frames por nodo — más assets, más maintainencia. (b) CSS classes sobre Phaser — imposible, Phaser renderiza en canvas.
**Rationale**: Tint + alpha + glow da flexibilidad sin assets duplicados. Phaser supports `setTint()`, `setAlpha()`, y pipelines de glow custom. Los 4 estados son requisito (REQ-PW-05).

### AD-06: Ship Appearance Mapping — Sprite Variantes por ShipTitle

**Choice**: Map `SHIP_VARIANTS` con 4 configs para Ola 1 (novato, marinero, capitán, almirante). Cada variant es un texture key cargado en BootScene. Transición entre variantes usa cross-fade de 300ms.
**Alternatives**: (a) Un sprite con overlays dinámicos — más flexible pero más complejo. (b) Texture atlas con emojis — inconsistente con estética.
**Rationale**: 4 variantes limitadas para Ola 1 es suficiente. Cross-fade evita flash instantáneo (REQ-PW-06). Sprite variants son simples de cargar y mantener.

### AD-07: Performance — SpriteGPULayer + Lazy-load Islands

**Choice**: Estrellas de fondo via `SpriteGPULayer` (batch rendering). Assets de isla se lazy-loadean al navegar (no en BootScene). Target 60fps en mid-range Android.
**Alternatives**: (a) Tilemap para estrellas — overkill para partículas simples. (b) Cargar todo en BootScene — bundle grande, LCP > 3s.
**Rationale**: `SpriteGPULayer` es la API de Phaser 4 para renderizado batcheado, ideal para cientos de estrellas. Lazy-load reduce bundle inicial (REQ-PW-07: ≤ 500KB gzipped). FPS se mide con `game.loop.actualFps`.

### AD-08: prefers-reduced-motion — Condicionar Animaciones

**Choice**: Al inicializar, `BootScene` lee `window.matchMedia('(prefers-reduced-motion: reduce)')`. Si activo: desactiva partículas, parallax, flotación de nave; transiciones usan fade instantáneo (duration: 0). Se re-checkea en focus/visibility change.
**Alternatives**: (a) CSS `@media prefers-reduced-motion` — no afecta Phaser canvas. (b) No soporte — inaccesible.
**Rationale**: Requisito REQ-PW-08. Phaser se ejecuta en canvas, CSS media queries no aplican directamente. Se necesita bridge JS.

### AD-09: Zustand Store Shape Detallado

**Choice**:
```ts
interface GameStore {
  activeScene: 'boot' | 'world' | 'island';
  shipPosition: { x: number; y: number };
  shipTitle: 'novato' | 'marinero' | 'capitán' | 'almirante';
  activeIsland: string | null;
  selectedNode: string | null;
  conceptStates: Record<string, ConceptState>;
  transitioning: boolean;
  transitionType: TransitionType | null;
  reducedMotion: boolean;
  // Actions
  navigateToIsland: (islandId: string) => void;
  navigateToWorld: () => void;
  selectNode: (nodeId: string) => void;
  setConceptState: (conceptId: string, state: ConceptState) => void;
  setScene: (scene: GameScene) => void;
  setReducedMotion: (v: boolean) => void;
}
```
**Rationale**: Shape completo especificado en proposal. Actions son la única forma de mutar estado, Phaser y React comparten las mismas actions.

## Data Flow

```
React (Next.js App Router)
  │
  ├─ <GameWorld /> (dynamic ssr:false)
  │     │
  │     └─ Phaser.Game
  │           ├─ BootScene (preload assets)
  │           ├─ MundoGlobalScene (ocean, islands, ship)
  │           └─ IslaNumerosScene (concept nodes, paths)
  │
  └─ Zustand useGameStore ◄──── single source of truth
        │                    │
        ▼                    ▼
  React Components      Phaser Scenes
  (exercise routes)     (subscribe to
   read store            state changes)
```

Navigation flow:
1. Alumno toca isla → `navigateToIsland()` → `TransitionCoordinator` zoom-in → `MundoGlobalScene` escucha y anima → al completar: `setScene('island')`, `activeIsland = islandId`
2. Alumno toca nodo → `selectNode()` → fade transition → React Router navega a exercise route
3. Alumno presiona "volver" → `navigateToWorld()` → zoom-out → `setScene('world')`, `activeIsland = null`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/game/config.ts` | Create | Phaser game config: width, height, physics, scene list, scale mode |
| `src/game/constants.ts` | Create | TRANSITION_CONFIG, NODE_STATE_CONFIG, SHIP_VARIANTS, ISLAND_DATA, colors, dimensions |
| `src/game/scenes/BootScene.ts` | Create | Preload all assets, show progress bar, transition to MundoGlobal |
| `src/game/scenes/MundoGlobalScene.ts` | Create | Cosmic ocean, floating islands, ship with navigation, subscribe to store |
| `src/game/scenes/IslaNumerosScene.ts` | Create | Internal island map with concept nodes, node states from store, path rendering |
| `src/game/transitions/TransitionCoordinator.ts` | Create | Manages scene transitions with zoom-in/out/fade, respects reduced-motion |
| `src/stores/useGameStore.ts` | Create | Zustand store: activeScene, shipPosition, activeIsland, conceptStates, actions |
| `src/components/game/GameWorld.tsx` | Create | "use client" wrapper, dynamic import PhaserGame, useEffect lifecycle |
| `src/components/game/PhaserGame.tsx` | Create | Creates/destroys Phaser.Game, mount target ref, cleanup on unmount |
| `src/hooks/useReducedMotion.ts` | Create | Reads prefers-reduced-motion, syncs to Zustand store |
| `src/app/(game)/page.tsx` | Modify | Renders `<GameWorld />` as main game route |
| `src/app/(game)/island/[id]/page.tsx` | Create | Island internal view route (Server Component shell) |
| `public/assets/sprites/` | Create | Ship sprite variants (4), node sprites, island thumbnails |
| `public/assets/backgrounds/` | Create | Cosmic ocean background, island backgrounds |
| `public/assets/audio/` | Create | Ship navigation sounds, transition sounds |
| `package.json` | Modify | Add `phaser` dependency |
| `next.config.mjs` | Modify | Asset headers config for Phaser sprites if needed |
| `src/game/__tests__/useGameStore.test.ts` | Create | Zustand store unit tests |
| `src/game/__tests__/TransitionCoordinator.test.ts` | Create | Transition config tests, reduced-motion tests |
| `src/components/game/__tests__/GameWorld.test.tsx` | Create | Mount/unmount lifecycle tests, memory leak detection |

## Interfaces / Contracts

```ts
// src/game/constants.ts
export type ConceptState = 'locked' | 'available' | 'in_progress' | 'mastered';
export type TransitionType = 'world_to_island' | 'island_to_world' | 'island_to_exercise';
export type GameScene = 'boot' | 'world' | 'island';
export type ShipTitle = 'novato' | 'marinero' | 'capitán' | 'almirante';

export const TRANSITION_CONFIG: Record<TransitionType, TransitionConfig> = { ... };
export const NODE_STATE_CONFIG: Record<ConceptState, NodeVisualConfig> = { ... };
export const SHIP_VARIANTS: Record<ShipTitle, ShipVariantConfig> = { ... };

// src/game/transitions/TransitionCoordinator.ts
export class TransitionCoordinator {
  constructor(scene: Phaser.Scene, reducedMotion: boolean);
  play(type: TransitionType, targetScene: string, data?: object): Promise<void>;
  cancel(): void;
}

// src/stores/useGameStore.ts
export interface GameStore { /* as defined in AD-09 */ }
export const useGameStore: UseBoundStore<StoreApi<GameStore>>;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useGameStore` actions, state transitions, `conceptStates` updates | Vitest — test store in isolation |
| Unit | `TransitionCoordinator` config selection, reduced-motion override | Vitest — mock Phaser.Scene |
| Unit | `NODE_STATE_CONFIG`, `SHIP_VARIANTS`, `TRANSITION_CONFIG` values | Vitest — pure data assertions |
| Unit | `useReducedMotion` hook | Vitest + @testing-library/react |
| Integration | `GameWorld` mount/unmount lifecycle (no memory leaks) | Vitest + jsdom — verify Phaser.Game destroy called |
| Integration | 20+ navigation cycles without state loss | Vitest — simulate navigateToIsland/navigateToWorld cycles, assert store consistent |
| E2E | Game route loads, islands visible, FPS target | Playwright — verify canvas renders, measure performance |

## Migration / Rollout

No migration required. Assets are static files in `public/`. Phaser is a new npm dependency added in commit 1.

Rollback per commit:
1. Remove phaser dep — `pnpm remove phaser && git reset`
2. Remove game/ dir — file-only removal
3. Remove store — Zustand stays as dep, remove useGameStore
4. Remove routes — revert page.tsx changes
5. Remove all — `git reset --hard` to pre-change hash

## Commit Plan

1. **`feat(phaser): install phaser 4 and configure game scaffold`** — Phaser dependency, config.ts, constants.ts, BootScene skeleton, GameWorld/PhaserGame component shells, Zustand store shape. Means: `pnpm typecheck` passes, game renders empty canvas.

2. **`feat(phaser): implement MundoGlobalScene with ship and islands`** — Cosmic ocean background, floating islands (2 placeholder), ship sprite with title variants, navigation to island on click, store navigation actions. Means: alumno can see ocean, islands, and navigate.

3. **`feat(phaser): implement IslaNumerosScene with concept nodes`** — Island internal map, serpentine path, concept node states (locked/available/in_progress/mastered), back-to-world button, store integration for node selection. Means: alumno sees concept progression on island map.

4. **`feat(phaser): implement digetic transitions and TransitionCoordinator`** — Zoom-in (world→island 800ms), zoom-out (island→world 600ms), fade (island→exercise 400ms), prefers-reduced-motion support, test coverage. Means: all transitions animate smoothly, disabled when reduced-motion active.

5. **`test(phaser): add integration tests and performance baseline`** — Store round-trip tests, mount/unmount leak tests, navigation cycle tests (20+), FPS measurement helper. Means: confidence in no state loss, no memory leaks.

## Open Questions

- [ ] Phaser 4 vs Phaser 3.87: confirm exact npm package name and API for `SpriteGPULayer` (may be `Phaser.GameObjects.SpriteGPULayer` or Phaser 4 specific)
- [ ] Asset sourcing: confirm Kenney.nl sprites for Ola 1 placeholder or use procedural generation for cosmic background
- [ ] Island map layout: serpentine path (Candy Crush style) vs free-form exploration — proposal says "camino serpenteante", confirm visual specifics