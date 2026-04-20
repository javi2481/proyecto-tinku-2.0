# Delta Spec: project-bootstrap (MODIFIED by phaser-world)

## ADDED Requirements

### REQ-PW-PB-01: Phaser 4 Dependency and Build Config

El proyecto MUST incluir `phaser` (4.x) como dependencia de producción. La configuración de build de Next.js MUST permitir serving de assets estáticos de Phaser (sprites, atlas, audio) desde `public/assets/`.

#### Scenario: Phaser como dependencia de producción

- **Given** el `package.json` del proyecto
- **When** se lee `dependencies`
- **Then** `phaser` MUST estar declarado con versión `^4.x`
- **And** `pnpm install` MUST completar sin errores

#### Scenario: Assets de Phaser servidos correctamente

- **Given** el build de producción
- **When** se accede a `/assets/sprites/` o `/assets/backgrounds/`
- **Then** los archivos estáticos MUST ser servidos con headers correctos
- **And** NO MUST haber errores 404 en assets referenciados por Phaser scenes

## MODIFIED Requirements

### Requirement: Build Producción Exitoso

El comando `pnpm build` DEBE producir un build de producción sin errores, incluyendo la dependencia Phaser y el dynamic import ssr: false del componente GameWorld.
(Previously: El comando pnpm build DEBE producir un build de producción sin errores — sin mención de Phaser ni dynamic imports)

#### Scenario: Build compila

- **Given** el proyecto bootstrappeado con deps instaladas (incluyendo phaser)
- **When** se ejecuta `pnpm build`
- **Then** MUST salir con código 0
- **And** MUST crear el directorio `.next/`
- **And** NO DEBE haber warnings de TS ni ESLint que fallen el build
- **And** el componente `<GameWorld />` importado con `ssr: false` MUST compilar correctamente

#### Scenario: Typecheck pasa con Phaser

- **Given** el proyecto con Phaser como dependencia
- **When** se ejecuta `pnpm typecheck`
- **Then** MUST salir con código 0
- **And** `src/game/` y `src/stores/useGameStore.ts` MUST compilar sin errores TS