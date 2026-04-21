# Testing Protocol — Ola 1 Beta

## Objetivo

Preparar la app para que los hijos de Javier (y 5 familias) puedan usar Tinku con fluidez durante 2 semanas, con el objetivo de validar que aprenden.

---

## 1. Deploy Checklist

### ✅ Pre-deploy (antes de subir a producción)

- [ ] `npm run build` pasa sin errores
- [ ] `npm run test` pasa (>90% coverage en BKT)
- [ ] Variables de ambiente configuradas en Vercel

### 📋 Environment Variables (Production)

```
NEXT_PUBLIC_SUPABASE_URL=https://rihbkanevxlvisanlvsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://tinku.com.ar  (o dominio temporal)
OPENROUTER_API_KEY=sk-or-v1-...
SENTRY_DSN=...
ADMIN_EMAILS=rjavierst@gmail.com,tinku-test-...@example.com
```

### 🔧 Post-deploy

- [ ] Homepage carga correctamente
- [ ] Parent puede crear cuenta
- [ ] Parent puede registrar hijo
- [ ] Niño puede entrar con código
- [ ] Puede hacer ejercicios (al menos 1 concepto)
- [ ] XP se otorga correctamente
- [ ] Daily review funciona
- [ ] Ari responde preguntas

---

## 2. Observación Protocol

### Sesión 1: Primer uso (hijo 1)

**Setup:**
- child's device (celular/tablet de Javier)
- Javier sentado cerca, pero SIN intervenir
- Laptop con notas拉开

**Observar y Registrar:**

| Momento | Qué observar |
|--------|------------|
| Onboarding | ¿Entiende qué hacer? ¿Se traba en algún paso? |
| Navegación | ¿Puede encontrar los conceptos? |
| Ejercicios | ¿Lee las preguntas? ¿Entiende el feedback? |
| Frustración | ¿Cuándo se frustra? ¿Qué hace? |
| Abandono | ¿Cuándo quiere parar? |

**Notas a tomar:**
- Tiempo hasta que completa primer concepto
- Cuántas veces pide ayuda
- Qué dice / qué чувства

### Sesión 2: Primer uso (hijo 2)

Mismo protocolo que Sesión 1.

### Observación Continua (2 semanas)

**Tracking Diario:**
- ¿Usó la app hoy?
- Cuántos ejercicios hizo?
- Dominó algún concepto?
- XP total acumulado?

**Preguntas Semanales:**
- "¿Qué te gusta?"
- "¿Qué te aburre?"
- "¿Qué cambiarías?"
- "¿Le contarías a un amigo?"

---

## 3. Feedback Gathering

### Week 1 Questions

1. "¿Te resulta fácil usar la app?"
2. "¿Entendés las instrucciones de los ejercicios?"
3. "¿Te sirve que Ari te.help?"
4. "¿Qué es lo más divertida?"
5. "¿Qué es lo más aburrida?"

### Week 2 Questions

1. "¿Notaste mejora en matemática?"
2. "¿ mejoraste en algún tema específico?"
3. "¿Seguirías usando la app?"
4. "¿Qué le agregaría?"
5. "¿Qué le sacaría?"

---

## 4. Success Metrics

| Métrica | Target |
|--------|--------|
| Retention d1 | ≥80% usados al día 1 |
| Retention d7 | ≥50% usados al día 7 |
| Ejercicios/semana | ≥30 por niño |
| Dominio/Semana | ≥2 conceptos domiandos |
| NPS | ≥40 (neutral+promoter) |
| Error rate | <5% crashes |

---

## 5. Known Issues to Watch

- [ ] ¿Phaser world carga? (si hay implement)
- [ ] ¿Daily review funciona?
- [ ] Timeout de sesión
- [ ] Login codes no funcionan
- [ ] XP no se acredita
- [ ] Ari no responde
- [ ] Slow load times (>3s)
- [ ] Mobile responsive issues

---

## 6. Contact Info

- **Javier** (padre beta #1): rjavierst@gmail.com
- **Tinku Team**: soporte@tinku.com.ar
- **WhatsApp**: +54 9 11 XXXX-XXXX

---

## Quick Deploy Commands

```bash
# Build local
npm run build

# Deploy (Vercel CLI)
vercel --prod

# Check env
vercel env pull production .env.production
```

---

*Documento vivo — actualizar basado en learnings reales.*