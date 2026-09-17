# Frontend — DYGSIS

Estructura base (Vite + React + TypeScript + Tailwind v4 + shadcn/ui) para que Nieto Guerra Emiliano (Integrante 2) continúe con las pantallas reales de cada sprint. **Esto es un andamiaje básico, no el diseño final** — el objetivo era desbloquear SCRUM-28/29 (vencidas) con algo funcional, no definir la dirección visual del producto.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # VITE_API_URL vacío = usa el proxy /api hacia localhost:3000 en dev
npm run dev
```

Necesitas el backend corriendo en paralelo (`../backend`, `npm run dev`, puerto 3000) — el proxy de Vite (`vite.config.ts`) redirige `/api/*` ahí en desarrollo.

`npm run build` compila TypeScript y genera `dist/`. `npm run lint` corre `oxlint`.

## Estructura

```
src/
├── components/ui/     # shadcn/ui (Button, Input, Label, Card) — agregar más con `npx shadcn add <componente>`
├── context/            # AuthContext: token, usuario, login(), logout()
├── layouts/            # AppLayout: header con usuario + logout, envuelve las rutas protegidas
├── lib/
│   ├── api.ts          # fetch wrapper genérico (ApiError, base URL)
│   └── auth-api.ts     # llamadas a /api/auth/*
├── pages/
│   ├── auth/            # Login, ForgotPassword, ResetPassword — YA FUNCIONALES contra el backend real
│   └── dashboards/       # un placeholder por rol — aquí entra el trabajo de cada sprint
├── routes/
│   ├── ProtectedRoute.tsx  # exige sesión y, opcionalmente, un rol específico
│   └── RoleRedirect.tsx    # "/" manda a cada usuario a su dashboard según su rol
└── App.tsx              # todas las rutas
```

## Qué ya funciona

- Login real (`POST /api/auth/login`), recuperación de contraseña (`forgot-password` / `reset-password`) — probado contra el backend y la base de datos reales.
- Rutas protegidas por rol: `/estudiante`, `/docente`, `/coordinador`, `/administrador`. Si no hay sesión, redirige a `/login`; si el rol no coincide, redirige a su propio dashboard.
- Modo oscuro automático (sigue `prefers-color-scheme`, variables CSS en `src/index.css`).

## Qué falta (por sprint — ver `PROGRESS.md` en la raíz del repo)

Cada `*DashboardPage.tsx` en `pages/dashboards/` es un placeholder con un comentario de qué SCRUM le corresponde. Reemplazar el contenido de `DashboardPlaceholder` por las pantallas reales conforme avancen los sprints.

## Decisiones a revisar (no bloqueantes, pero anótalas)

- **El JWT se guarda en `localStorage`** (`AuthContext.tsx`) por simplicidad, ya que el backend actual regresa el token en el body de la respuesta, no en una cookie. Es un patrón común pero no es el más seguro (vulnerable a robo de token vía XSS) — si hay tiempo en el sprint de seguridad (SCRUM-30/65), vale la pena evaluar mover la sesión a una cookie `httpOnly` (requeriría cambios también en el backend).
- No hay manejo de expiración del token en el cliente (si el JWT expira, las llamadas a la API fallarán con 401 pero la UI no lo detecta todavía y no redirige a `/login` automáticamente). Vale la pena agregar un interceptor en `lib/api.ts` que haga `logout()` ante un 401.
- Sin pruebas automatizadas todavía (fuera del alcance de este setup inicial).
