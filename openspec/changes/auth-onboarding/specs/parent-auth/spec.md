# Delta Spec: parent-auth (ADDED)

## Capability
`parent-auth` — Registro y login de padres con email+password y Google OAuth. Incluye Server Actions para mutations y rutas protegidas.

## ADDED Requirements

### REQ-PA-001: Parent Sign-Up with Email and Password

**RFC 2119**: MUST

El sistema DEBE permitir que un padre se registre con email y contraseña via Supabase Auth.

#### Scenario: Registro exitoso de padre

- **Given** un padre no autenticado en la pantalla `/auth/register`
- **When** completa el formulario con email válido y contraseña de mínimo 8 caracteres
- **And** presiona "Registrarse"
- **Then** el sistema MUST llamar al Server Action `signUp`
- **And** MUST crear un usuario en `auth.users`
- **And** el trigger en `auth.users` MUST crear una fila en `public.users` con `role = 'parent'`
- **And** MUST redirigir a `/onboarding`

#### Scenario: Email duplicado

- **Given** un email ya registrado en `auth.users`
- **When** un nuevo padre intenta registrarse con ese email
- **Then** el Server Action MUST retornar error: "Email ya registrado"
- **And** MUST NO crear una segunda fila en `auth.users`

#### Scenario: Contraseña demasiado corta

- **Given** un padre completando el formulario de registro
- **When** ingresa una contraseña de menos de 8 caracteres
- **Then** el formulario MUST mostrar error de validación en el cliente
- **And** MUST NO enviar el formulario al Server Action

---

### REQ-PA-002: Parent Login with Email and Password

**RFC 2119**: MUST

El sistema DEBE permitir que un padre inicie sesión con email y contraseña.

#### Scenario: Login exitoso de padre

- **Given** un padre registrado en `/auth/login`
- **When** ingresa email y contraseña correctos
- **And** presiona "Ingresar"
- **Then** el Server Action `signIn` MUST autenticar al padre via Supabase Auth
- **And** MUST establecer session con cookies
- **And** MUST redirigir a `/dashboard`

#### Scenario: Credenciales incorrectas

- **Given** un padre en `/auth/login`
- **When** ingresa email o contraseña incorrectos
- **Then** el Server Action MUST retornar error: "Credenciales inválidas"
- **And** MUST NO establecer session
- **And** MUST NO revelar si el email existe (mensaje genérico)

---

### REQ-PA-003: Parent Google OAuth

**RFC 2119**: MUST

El sistema DEBE permitir que un padre se registre/login con Google OAuth via Supabase Auth.

#### Scenario: Registro/login con Google exitoso

- **Given** un padre en `/auth/login` o `/auth/register`
- **When** presiona el botón "Ingresar con Google"
- **Then** el sistema MUST iniciar flujo OAuth de Google via Supabase
- **And** tras callback exitoso, MUST establecer session
- **And** si es primer login, el trigger MUST crear fila en `public.users` con `role = 'parent'`
- **And** MUST redirigir a `/onboarding` (primer login) o `/dashboard` (logins subsecuentes)

#### Scenario: Google OAuth cancelado

- **Given** un padre en flujo OAuth de Google
- **When** el usuario cancela o deniega permisos en Google
- **Then** el sistema MUST redirigir de vuelta a `/auth/login` con mensaje informativo
- **And** MUST NO crear ninguna fila en la DB

---

### REQ-PA-004: Auth Server Actions

**RFC 2119**: MUST

Las mutations de autenticación DEBEN implementarse como Server Actions (`"use server"`), no como API routes.

#### Scenario: Server Actions existen y están tipados

- **Given** el directorio `src/lib/auth/`
- **When** se inspeccionan los archivos
- **Then** MUST existir Server Actions exportadas: `signUp`, `signIn`, `signOut`
- **And** cada Server Action MUST tener signature tipada (input, output, errores)
- **And** MUST NO existir rutas en `/api/` para autenticación

#### Scenario: Sign-Out funciona

- **Given** un padre autenticado
- **When** ejecuta el Server Action `signOut`
- **Then** la session MUST ser eliminada
- **And** MUST redirigir a `/auth/login`

---

### REQ-PA-005: Auth Routes and Components

**RFC 2119**: MUST

Las rutas de autenticación DEBEN usar shadcn/ui y ser Server/Client Components según necesidad de interactividad.

#### Scenario: Rutas de auth existen

- **Given** la app compilada
- **When** se navega a `/auth/login`
- **Then** MUST mostrar el formulario de login con campos de email, contraseña y botón de Google
- **And** MUST existir link a `/auth/register`

#### Scenario: Ruta de registro existe

- **Given** la app compilada
- **When** se navega a `/auth/register`
- **Then** MUST mostrar formulario de registro con campos de email, contraseña y confirmación
- **And** MUST existir link a `/auth/login`

#### Scenario: Componentes usan shadcn/ui

- **Given** los componentes en `src/components/auth/`
- **Then** `LoginForm`, `RegisterForm` MUST usar componentes de shadcn/ui (Button, Input, Card, Label)
- **And** los components interactivos (formularios) MUST tener `"use client"`