# Delta Spec: project-bootstrap (MODIFIED by bkt-engine)

## ADDED Requirements

### REQ-BKT-PB-01: Database Migration for student_concept_state

El proyecto MUST incluir una migración Supabase que crea la tabla `student_concept_state` con las columnas requeridas por el motor BKT. La migración MUST incluir RLS policies que restringen acceso al propio alumno.

#### Scenario: Migración crea tabla student_concept_state

- **Given** el proyecto con Supabase configurado
- **When** se aplica la migración
- **Then** la tabla `student_concept_state` MUST existir con columnas: `student_id`, `concept_id`, `p_known`, `attempts`, `correct_count`, `last_seen`, `status`, `created_at`, `updated_at`
- **And** `p_known` MUST tener default `0.0`
- **And** `status` MUST ser enum CHECK: `('locked', 'available', 'in_progress', 'mastered')`

#### Scenario: RLS protege datos del alumno

- **Given** la tabla `student_concept_state` con RLS habilitado
- **When** un alumno autenticado consulta sus propios datos
- **Then** MUST poder leer y escribir solo sus registros (WHERE `student_id = auth.uid()`)
- **And** otro alumno MUST NO poder acceder a registros ajenos

## MODIFIED Requirements

(No se modifican requirements existentes — `bkt-engine` es lógica pura en TypeScript sin nuevas dependencias npm)