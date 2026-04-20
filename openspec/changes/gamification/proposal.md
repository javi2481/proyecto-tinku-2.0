# Proposal: Gamificación — Niveles, Monedas, Misiones, Celebraciones

## Intent

Implementar el sistema de gamificación completo de Tinku 2.0 (Ola 1, Fase 1.8): niveles 1-50 con títulos navales, colección de 23 monedas provinciales, misiones diarias/semanales/exploratorias, y celebraciones jerarquizadas. El alumno que completa una sesión recibe XP, sube de nivel, colecciona monedas al dominar conceptos, completa misiones, ve celebraciones proporcionales, y observa cómo su nave evoluciona.

Fundamento ético (TINKU.md §9, §15): NO hay mecánicas extractivas — sin vidas, sin loot boxes, sin FOMO, sin leaderboards públicos. La gamificación está al servicio de la pedagogía, no al revés.

## Scope

### In Scope
- Seed de niveles 1-50 con curva de XP y títulos navales (`seeds/levels.yml`)
- Server Action `awardXp(studentId, amount)` con recálculo de nivel y detección de levelup
- Componente `<LevelBadge />` con título y nivel actual
- Seed de 23 monedas provinciales con datos culturales (`seeds/coins.yml`)
- Server Action `awardCoin(studentId, coinId)` con prevención de duplicados
- Componente `<CoinCollection />` para visualizar la colección
- Seed de 5 misiones diarias + 3 semanales (`seeds/missions.yml`)
- Server Actions `getActiveMissions()` + `checkMissionProgress()`
- Componente `<MissionsWidget />` en el mundo global
- Celebraciones jerarquizadas: `<CelebrationModal />` con 4 variantes (acierto, dominio, racha 7d, levelup)
- Integración de Lottie para celebraciones de nivel alto
- Seed de 5 apariencias de nave según título naval
- 5 piezas coleccionables de nave ganables por misiones exploratorias

### Out of Scope
- Misiones creativas (Ola 2+, documentadas pero no activas)
- Modo desafío con temporizador (future feature)
- Leaderboards o cualquier mecánica competitiva/social
- Colecciones 2-3 (personajes, animales — Ola 2+)
- Animación extendida de isla completada (requiere Phaser integrado)

## Capabilities

### New Capabilities
- `gamification-engine`: sistema de XP, niveles, curva de progresión, detección de levelup
- `coin-collection`: monedas provinciales, asignación determinista concepto→moneda, prevención de duplicados
- `mission-system`: misiones diarias/semanales/exploratorias, rotación, tracking de progreso
- `celebrations`: celebraciones jerarquizadas con 4 niveles de intensidad, Lottie para niveles altos
- `ship-upgrades`: apariencias de nave ligadas a título naval, piezas coleccionables

### Modified Capabilities
- `project-bootstrap`: integración de seeds de gamificación en el flujo de seed de Supabase

## Approach

Arquitectura en capas: seeds YAML → Server Actions (mutations) → Zustand store (client state) → React components. Las tablas `student_levels`, `student_coins`, `student_missions`, `missions` ya existen en el schema de Fase 1.2, este change implementa la lógica y UI que las consume.

XP se calcula en Server Action con reglas de TINKU.md §9.2 (primer intento = base, segundo = mitad, tras hint = tercio, dominio = bonus, misión = por tipo, racha = bonus pequeño). La curva de niveles se calibra para que un alumno dedicado avance perceptiblemente cada sesión sin poder farmear.

Monedas son DETERMINISTAS: cada concepto mapea a exactamente una moneda provincial. Sin aleatoriedad, sin gacha.

Celebraciones usan Motion para nivel bajo (bounce, tick) y Lottie para nivel medio/alto. La jerarquía estricta viene de TINKU.md §9.6: acierto sutil, dominio medio, racha/levelup único, isla completada máximo.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `seeds/levels.yml` | New | Definición de 50 niveles con curva de XP y títulos navales |
| `seeds/coins.yml` | New | 23 monedas provinciales con datos culturales |
| `seeds/missions.yml` | New | 5 misiones diarias tipo + 3 semanales tipo |
| `src/app/actions/gamification.ts` | New | Server Actions: awardXp, awardCoin, getActiveMissions, checkMissionProgress |
| `src/lib/gamification/xp.ts` | New | Cálculo de XP según reglas de TINKU.md |
| `src/lib/gamification/levels.ts` | New | Curva de niveles y títulos navales |
| `src/components/gamification/` | New | LevelBadge, CoinCollection, MissionsWidget, CelebrationModal |
| `src/stores/gamification-store.ts` | New | Zustand store para estado de gamificación en cliente |
| `supabase/` | Modified | Seeds aplicados contra tablas existentes de Fase 1.2 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Curva de XP mal calibrada (demasiado rápida/lenta) | Med | Seed con valores tuneables, test unitarios que validen progresión típica |
| Celebraciones interrumpen flujo pedagógico | Med | Jerarquía estricta: solo acierto sutil sin modal, modales solo para logros mayores |
| Lottie bundles inflan tamaño | Bajo | Lazy loading de animaciones Lottie, solo cargar cuando se necesita |
| Duplicación de monedas por race condition | Bajo | Server Action con UPSERT y constraint UNIQUE en (student_id, coin_id) |
| Misiones diarias no rotan correctamente | Med | Seed con pool de misiones y lógica de rotación con fecha como seed |

## Rollback Plan

Los seeds son idempotentes — se pueden re-ejecutar. Las Server Actions son aditivas (no destructivas). Si la gamificación causa problemas, se puede desactivar el MissionsWidget y CelebrationModal sin tocar XP/monedas (que son pasivos). Para rollback completo: eliminar los componentes del mundo global y las calls a Server Actions, las tablas quedan pero no se consumen.

## Dependencies

- **Fase 1.2**: schema de `student_levels`, `student_coins`, `missions`, `student_missions` debe estar migrado
- **Fase 1.6**: motor BKT para saber cuándo un concepto se domina (trigger de `awardCoin` y `awardXp` con bonus de dominio)
- **Fase 1.7**: componentes de ejercicio para detectar acierto/fallo y trigger de celebraciones

## Success Criteria

- [ ] Alumno completa ejercicio correctamente → recibe XP, si levelup se detecta y notifica
- [ ] Alumno domina concepto → gana moneda provincial específica, ve `<CelebrationModal />` nivel medio
- [ ] Alumno con racha de 7 días → ve celebración nivel único con Lottie
- [ ] `<LevelBadge />` muestra título naval correcto según nivel actual
- [ ] `<CoinCollection />` muestra 23 monedas, las ganadas con datos culturales, las no ganadas en gris
- [ ] `<MissionsWidget />` muestra misiones diarias/semanales activas con progreso
- [ ] Celebraciones son jerarquizadas: acierto sutil, dominio medio, racha/levelup único, NADA de confetti para cosas menores
- [ ] No hay mecánicas extractivas: sin vidas, sin FOMO, sin loot boxes, sin leaderboards
- [ ] Nave del alumno cambia visualmente al subir de título naval