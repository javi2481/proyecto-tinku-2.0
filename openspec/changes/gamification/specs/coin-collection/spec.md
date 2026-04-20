# Delta Spec: coin-collection (ADDED)

## Capability
`coin-collection` — Colección determinista de 23 monedas provinciales argentinas, cada una asignada a un concepto específico, ganada al dominar ese concepto.

## ADDED Requirements

### REQ-CC-01: Seed de 23 monedas provinciales

**RFC 2119**: MUST

**Given** el seed `seeds/coins.yml` ejecutado contra la tabla de monedas
**When** se consultan las monedas disponibles
**Then** MUST existir exactamente 23 monedas, una por provincia argentina
**And** cada moneda MUST tener: `id`, `name` (nombre de provincia), `symbol` (escudo provincial), `cultural_fact` (dato cultural breve)
**And** cada moneda MUST estar vinculada a un `concept_id` específico (1:1 concept→moneda)

---

### REQ-CC-02: Asignación determinista concepto→moneda

**RFC 2119**: MUST

**Given** un concepto pedagógico específico
**When** el alumno domina ese concepto (p_known ≥ 0.85) por primera vez
**Then** el sistema MUST otorgar la moneda provincial correspondiente a ese concepto
**And** la asignación MUST ser 100% determinista: mismo concepto → misma moneda, siempre
**And** MUST NO haber aleatoriedad, gacha, ni loot mechanics en la asignación de monedas

---

### REQ-CC-03: Server Action awardCoin

**RFC 2119**: MUST

**Given** un alumno que acaba de dominar un concepto
**When** se invoca `awardCoin(studentId, coinId)`
**Then** la Server Action MUST:
1. Verificar que el alumno no posee ya esa moneda (prevención de duplicados)
2. Si ya la posee, devolver `{ awarded: false }` sin error
3. Si no la posee, insertar el registro en `student_coins` con timestamp
4. Devolver `{ awarded: true, coinId, coinName, culturalFact }`
**And** MUST usar UPSERT o constraint UNIQUE en `(student_id, coin_id)` para prevenir duplicados por race condition

**Contract**:
```
awardCoin(studentId: string, coinId: string): Promise<{
  awarded: boolean;
  coinId?: string;
  coinName?: string;
  culturalFact?: string;
}>
```

---

### REQ-CC-04: Componente CoinCollection

**RFC 2119**: MUST

**Given** un alumno que ha ganado algunas monedas provinciales
**When** se renderiza `<CoinCollection />`
**Then** el componente MUST mostrar las 23 monedas
**And** las monedas ganadas MUST mostrarse con su escudo provincial, nombre y dato cultural
**And** las monedas no ganadas MUST mostrarse en gris o silueta, sin dato cultural visible
**And** al hacer tap/click en una moneda ganada, MUST revelar el dato cultural completo

---

### REQ-CC-05: Coleccionar todas las monedas requiere dominar los 23 conceptos madre

**RFC 2119**: MUST

**Given** el diseño del sistema de monedas y conceptos de Ola 1
**When** se evalúa la completitud de la colección
**Then** completar la colección de 23 monedas MUST requerir dominar los 23 conceptos madre de Ola 1
**And** no existe forma de ganar una moneda sin dominar su concepto asociado (no hay atajos, compras, ni alternativa)

---

### REQ-CC-06: Monedas son solo colección, sin economía funcional

**RFC 2119**: MUST

**Given** cualquier mecánica que involucre monedas
**When** se evalúa el diseño de monedas provinciales
**Then** las monedas MUST ser únicamente de colección y visualización
**And** MUST NO existir mecanismo de gasto, pérdida, intercambio, ni tienda
**And** las monedas MUST NO tener valor funcional (no desbloquean contenido, no compran cosméticos)
**And** la "sorpresa" del sistema viene de descubrir qué moneda provincial corresponde a cada concepto, NO de aleatoriedad

---

### REQ-CC-07: Trigger de awardCoin desde motor BKT

**RFC 2119**: SHOULD

**Given** el motor BKT (Fase 1.6) detecta que un alumno alcanzó p_known ≥ 0.85 en un concepto
**When** se emite el evento de dominio de concepto
**Then** el sistema SHOULD invocar `awardCoin` automáticamente con el `coinId` correspondiente al concepto dominado
**And** el evento SHOULD también disparar una celebración de nivel "medio" (capability `celebrations`, REQ-CEL-03)