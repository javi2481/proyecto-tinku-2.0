# Delta Spec: onboarding-flow (ADDED)

## Capability
`onboarding-flow` — Flujo completo de primer uso: padre registra cuenta → registra hijo → obtiene código → alumno entra con código → ve el mundo. Journey de onboarding end-to-end.

## ADDED Requirements

### REQ-OF-001: Parent Onboarding Wizard

**RFC 2119**: MUST

El sistema DEBE proveer un wizard multi-paso (3-4 pasos) para que el padre registre a su hijo después de crear su cuenta.

#### Scenario: Wizard de 3-4 pasos

- **Given** un padre recién autenticado redirigido a `/onboarding`
- **When** se renderiza el wizard
- **Then** MUST mostrar un stepper visible indicando el paso actual y los pasos restantes
- **And** los pasos MUST ser: (1) nombre del hijo, (2) fecha de nacimiento y grado estimado, (3) elección de avatar, (4) confirmación y código

#### Scenario: Paso 1 — Nombre del hijo

- **Given** el padre en paso 1 del wizard
- **When** ingresa el nombre del hijo (mínimo 2 caracteres)
- **And** presiona "Siguiente"
- **Then** el sistema MUST validar que el nombre no está vacío
- **And** MUST avanzar al paso 2

#### Scenario: Paso 2 — Fecha de nacimiento y grado

- **Given** el padre en paso 2 del wizard
- **When** ingresa fecha de nacimiento y selecciona grado estimado (1° a 7°)
- **And** presiona "Siguiente"
- **Then** el sistema MUST validar que la fecha de nacimiento es razonable (edad entre 4 y 15 años)
- **And** MUST avanzar al paso 3

#### Scenario: Paso 3 — Elección de avatar

- **Given** el padre en paso 3 del wizard
- **When** se muestran las opciones de avatar (8-10 pre-hechos)
- **And** el padre selecciona un avatar
- **Then** el avatar seleccionado MUST destacarse visualmente
- **And** el paso MUST permitir continuar solo si se seleccionó un avatar
- **And** el paso SHOULD permitir skipear con un avatar default

#### Scenario: Paso 4 — Confirmación y código

- **Given** el padre completó pasos 1-3
- **When** se renderiza el paso 4
- **Then** el Server Action `registerChild` MUST ejecutarse creando: (a) fila en `students`, (b) fila en `student_codes` con código único
- **And** el código de 6 caracteres MUST mostrarse al padre en formato legible (ej: "JKL-MNP")
- **And** MUST mostrar instrucciones claras para que el alumno use el código

---

### REQ-OF-002: Avatar Selection

**RFC 2119**: MUST

El sistema DEBE proveer una selección de 8-10 avatars pre-hechos para que el alumno elija durante el onboarding.

#### Scenario: Avatars disponibles

- **Given** el directorio `public/avatars/`
- **Then** MUST existir 8-10 archivos SVG/PNG de avatars
- **And** cada avatar MUST tener un identificador único (ej: `avatar_01`, `avatar_02`, etc.)
- **And** los avatars MUST ser apropiados para chicos de 6-12 años (diversidad de género, etnia, estilo)

#### Scenario: Avatar almacenado como string

- **Given** un padre seleccionando avatar en el onboarding
- **When** confirma la selección
- **Then** el identificador del avatar (ej: `"avatar_03"`) MUST guardarse en `students.avatar`
- **And** MUST NO subir imágenes — los avatars son assets estáticos pre-hechos

---

### REQ-OF-003: Welcome Placeholder Screen

**RFC 2119**: MUST

El sistema DEBE mostrar una pantalla welcome cuando el alumno ingresa por primera vez.

#### Scenario: Primera llegada del alumno

- **Given** un alumno que acaba de hacer login con su código por primera vez
- **When** es redirigido a `/welcome`
- **Then** la pantalla MUST mostrar un mensaje de bienvenida personalizado (usando el nombre del alumno)
- **And** MUST mostrar un placeholder visual del mapa con "Isla de los Números" accesible
- **And** MUST mostrar un botón "¡A jugar!" que redirige a `/world`

#### Scenario: Pantalla welcome solo la primera vez

- **Given** un alumno que ya ha visto la pantalla welcome
- **When** hace login subsecuente
- **Then** el sistema MUST redirigir directamente a `/world` (saltar `/welcome`)

---

### REQ-OF-004: Route Guards and Redirects

**RFC 2119**: MUST

El middleware DEBE proteger rutas basándose en auth state y role del usuario.

#### Scenario: Usuario no autenticado → login

- **Given** un usuario no autenticado
- **When** intenta acceder a cualquier ruta protegida (`/dashboard`, `/world`, `/onboarding`, `/welcome`)
- **Then** MUST ser redirigido a `/auth/login`

#### Scenario: Padre autenticado → dashboard

- **Given** un padre autenticado
- **When** accede a la raíz `/`
- **Then** MUST ser redirigido a `/dashboard`

#### Scenario: Alumno autenticado → world

- **Given** un alumno autenticado
- **When** accede a la raíz `/`
- **Then** MUST ser redirigido a `/world`

#### Scenario: Padre no ve rutas de alumno

- **Given** un padre autenticado (role = parent)
- **When** intenta acceder a `/world` o `/welcome`
- **Then** MUST ser redirigido a `/dashboard` (o recibir 403)

#### Scenario: Alumno no ve rutas de padre

- **Given** un alumno autenticado
- **When** intenta acceder a `/dashboard`
- **Then** MUST ser redirigido a `/world` (o recibir 403)

#### Scenario: Rutas públicas accesibles sin auth

- **Given** un usuario no autenticado
- **When** accede a `/` (landing page) o `/auth/login` o `/auth/register`
- **Then** MUST renderizar la página sin redirección

---

### REQ-OF-005: Logout for Both Roles

**RFC 2119**: MUST

El sistema DEBE permitir logout para padres y alumnos.

#### Scenario: Padre logout

- **Given** un padre autenticado en `/dashboard`
- **When** presiona "Cerrar sesión"
- **Then** el Server Action `signOut` MUST eliminar la session
- **And** MUST redirigir a `/auth/login`

#### Scenario: Alumno logout

- **Given** un alumno autenticado en `/world`
- **When** presiona "Salir"
- **Then** la session anónima MUST ser eliminada
- **And** MUST redirigir a la pantalla de login con código

---

### REQ-OF-006: Auth Integration Tests

**RFC 2119**: MUST

El proyecto DEBE tener tests de integración que cubran el flujo end-to-end de autenticación.

#### Scenario: Flujo padre end-to-end

- **Given** los tests de `tests/integration/auth/`
- **When** se ejecuta `pnpm test`
- **Then** MUST existir un test que: (1) registra un padre, (2) login, (3) registra un hijo via onboarding, (4) obtiene código
- **And** el test MUST verificar que el código es válido de 6 caracteres del charset correcto

#### Scenario: Flujo alumno end-to-end

- **Given** un padre con un hijo registrado y código generado
- **When** el alumno hace login con el código
- **Then** el test MUST verificar que la session se asocia al `student_id` correcto
- **And** el test MUST verificar que el alumno puede acceder a `/world`

#### Scenario: Aislamiento de roles

- **Given** un padre autenticado y un alumno autenticado
- **When** el padre intenta acceder a `/world`
- **Then** el test MUST verificar que recibe 403 o redirect a `/dashboard`
- **And** cuando el alumno intenta acceder a `/dashboard`
- **Then** el test MUST verificar que recibe 403 o redirect a `/world`

#### Scenario: Rutas protegidas sin auth

- **Given** un usuario no autenticado
- **When** intenta acceder a `/dashboard`, `/world`, `/onboarding`
- **Then** cada ruta MUST responder con redirect a `/auth/login` o 401