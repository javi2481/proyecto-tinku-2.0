# Delta Spec: student-auth (ADDED)

## Capability
`student-auth` — Login del alumno con código de 6 caracteres. Incluye `signInAnonymously()` de Supabase, asociación de session al `student_id`, y validación de código.

## ADDED Requirements

### REQ-SA-001: Student Code Generation

**RFC 2119**: MUST

El sistema DEBE generar códigos alfanuméricos únicos de 6 caracteres para cada alumno registrado.

#### Scenario: Código generado al registrar alumno

- **Given** un padre completando el onboarding que registra un hijo
- **When** el Server Action `registerChild` inserta una fila en `students`
- **Then** el sistema MUST generar un código de 6 caracteres en `student_codes`
- **And** el código MUST usar el charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin 0/O, 1/I/l)
- **And** el código MUST ser único en la tabla `student_codes` (UNIQUE constraint)

#### Scenario: Colisión de código manejo

- **Given** un código generado que ya existe en `student_codes`
- **When** se intenta insertar el código duplicado
- **Then** el sistema MUST automáticamente reintentar con un nuevo código aleatorio
- **And** MUST reintentar hasta 5 veces antes de fallar con error

#### Scenario: Caracteres confusos excluidos

- **Given** el charset de generación de códigos
- **Then** MUST NO contener: `0`, `O`, `1`, `I`, `l`
- **And** el charset resultante MUST tener al menos 32 caracteres (32^6 ≈ 1.07B combinaciones)

---

### REQ-SA-002: Student Login with Code

**RFC 2119**: MUST

El sistema DEBE permitir que un alumno inicie sesión ingresando su código de 6 caracteres.

#### Scenario: Login exitoso con código

- **Given** un alumno en la pantalla de login con_code
- **When** ingresa un código válido de 6 caracteres
- **And** presiona "Entrar"
- **Then** el Server Action `loginStudent` MUST validar el código contra `student_codes`
- **And** MUST llamar `supabase.auth.signInAnonymously()`
- **And** MUST asociar la session anónima con el `student_id` correspondiente al código
- **And** MUST redirigir a `/welcome` (primer login) o `/world` (logins subsecuentes)

#### Scenario: Código inválido

- **Given** un alumno en la pantalla de login con código
- **When** ingresa un código que no existe en `student_codes`
- **Then** el Server Action MUST retornar error: "Código no válido"
- **And** MUST NO crear session anónima
- **And** MUST NO revelar información sobre si el código existió alguna vez

#### Scenario: Código ya usado (sesión activa)

- **Given** un alumno que ya tiene una session anónima activa asociada a ese código
- **When** otro dispositivo intenta usar el mismo código
- **Then** el sistema SHOULD permitir el login (múltiples sesiones permitidas para el mismo alumno, no es concurrent conflict)
- **And** la nueva session ALSO MUST asociarse al mismo `student_id`

---

### REQ-SA-003: Anonymous Session Association

**RFC 2119**: MUST

La session anónima creada por `signInAnonymously()` DEBE asociarse correctamente al `student_id`.

#### Scenario: Asociación de session a student_id

- **Given** un código válido en `student_codes` con `student_id = X`
- **When** el alumno hace login con ese código
- **Then** la session anónima creada MUST tener metadata con `student_id = X`
- **And** las queries posteriores del alumno via RLS MUST filtrar por ese `student_id`

#### Scenario: Session sin student_id es huérfana

- **Given** una session anónima sin `student_id` asociado
- **When** se consulta `students` via RLS
- **Then** la session MUST NO ver ninguna fila en `students` (RLS bloquea porque no hay match en `parent_id` ni `student_id`)

---

### REQ-SA-004: Student Code Validation Component

**RFC 2119**: MUST

El componente `CodeInput` DEBE permitir ingreso de código de 6 caracteres con validación en tiempo real.

#### Scenario: Componente de código existe

- **Given** la ruta `/auth/student-login` (o equivalente)
- **When** se renderiza la página
- **Then** MUST mostrar un input para código de 6 caracteres
- **And** MUST mostrar feedback visual de longitud (ej: 6 casillas individuales)
- **And** el input MUST aceptar solo caracteres del charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
- **And** MUST transformar input a UPPERCASE automáticamente

#### Scenario: Validación en tiempo real

- **Given** un alumno escribiendo en el CodeInput
- **When** ingresa menos de 6 caracteres
- **Then** el botón "Entrar" MUST estar deshabilitado
- **When** ingresa exactamente 6 caracteres del charset válido
- **Then** el botón "Entrar" MUST habilitarse

---

### REQ-SA-005: Anonymous Session Cleanup

**RFC 2119**: SHOULD

El sistema SHOULD limpiar sessions anónimas huérfanas (sin `student_id` asociado) que tengan más de 24 horas de antigüedad.

#### Scenario: Limpieza de sessions huérfanas

- **Given** sessions anónimas en `auth.users` sin `student_id` asociado y con `created_at` > 24 horas
- **When** se ejecuta un cleanup (Edge Function cron o pg_cron)
- **Then** esas sessions SHOULD ser eliminadas
- **And** sesiones con `student_id` asociado MUST NO ser eliminadas

*(Nota: Este requisito es SHOULD, no MUST, porque puede implementarse como Edge Function en un cambio posterior si el cron no está listo en Phase 1.4)*