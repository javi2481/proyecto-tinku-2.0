# Delta Spec: project-bootstrap (MODIFIED)

## Capability
`project-bootstrap` — Integración de seeds de gamificación en el flujo de seed de Supabase.

## MODIFIED Requirements

### REQ-PB-GAME-01: Seeds de gamificación en flujo de seeding

**RFC 2119**: MUST

**Given** el flujo de seeding de Supabase existente (Fase 1.2)
**When** se ejecuta el seed de datos del proyecto
**Then** el flujo MUST incluir la aplicación de `seeds/levels.yml` (50 niveles con XP y títulos navales)
**And** MUST incluir la aplicación de `seeds/coins.yml` (23 monedas provinciales con datos culturales y concept_id)
**And** MUST incluir la aplicación de `seeds/missions.yml` (misiones diarias, semanales y exploratorias)
**And** los seeds MUST ser idempotentes (re-ejecutables sin duplicar datos)

---

### REQ-PB-GAME-02: Archivos YAML de seed versionados

**RFC 2119**: MUST

**Given** los archivos de seed de gamificación
**When** se inspeccionan los archivos en el repositorio
**Then** MUST existir `seeds/levels.yml` con la definición completa de 50 niveles, curva de XP y títulos navales
**And** MUST existir `seeds/coins.yml` con la definición de 23 monedas provinciales
**And** MUST existir `seeds/missions.yml` con la definición de tipos de misiones
**And** los archivos MUST estar versionados en Git junto con el código