# Backend — DYGSIS

Node.js + Express + TypeScript + TypeORM, arquitectura por capas: `entities → repositories → services → controllers → routes`.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # pide las credenciales reales (BD, JWT, SMTP) al equipo si no las tienes
npm run dev             # http://localhost:3000
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor en modo desarrollo (`ts-node-dev`, recarga automática) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Corre el build compilado (`dist/server.js`) |
| `npm test` | Corre la suite de pruebas (Vitest) |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Pruebas con reporte de cobertura |

## Estructura

```
src/
├── entities/        # Modelos TypeORM, mapeados 1:1 a las tablas P_EvaluacionDocente_* (ver database/)
├── repositories/     # Acceso a datos — un archivo por entidad, extiende el Repository de TypeORM
├── services/          # Lógica de negocio (AuthService, RolService, EmailService)
├── controllers/       # Reciben el Request/Response de Express, delegan a services
├── routes/             # Definición de endpoints por módulo
├── middlewares/        # asyncHandler (captura errores async para el error handler global)
├── utils/               # jwt.ts, resetToken.ts — utilidades puras, con sus propias pruebas
├── config/               # data-source.ts (conexión TypeORM)
├── app.ts                # Configuración de Express (middlewares, rutas, error handler)
└── server.ts              # Punto de entrada: inicializa la conexión a BD y levanta el servidor
```

## Base de datos

Servidor Azure SQL **compartido** con otros proyectos (`Central-Data`) — todas las tablas de este proyecto van prefijadas `P_EvaluacionDocente_`. Ver `../database/evaluacion_docente_schema.sql` y `../database/migrations/` para el esquema completo y las reglas de nombres (`pk_/fk_/uq_/ck_/ix_`).

## Pruebas

Ver `../docs/pruebas-autenticacion.md` para el detalle de qué cubre la suite actual. Las pruebas mockean la capa de repositorios — no requieren conexión a la base de datos real.

## Convenciones

Ver `../docs/convenciones-desarrollo.md` (ramas, commits, ambiente compartido) y `../PROGRESS.md` (qué está hecho, qué falta, cómo se hizo cada tarea).
