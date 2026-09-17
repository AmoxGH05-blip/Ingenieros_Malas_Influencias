# Convenciones de ramas, commits y ambiente de desarrollo

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-23

> Esto formaliza lo que ya se ha venido siguiendo en los commits de este repo desde SCRUM-24 en adelante — no son reglas nuevas, es dejarlas escritas para que todo el equipo (y cualquier Claude Code que trabaje aquí) las siga igual.

## 1. Ramas

Somos 4 personas y el repo es chico — no usamos un modelo de ramas pesado (git-flow, etc.). En su lugar:

- **`main` es la rama de trabajo por defecto.** Para cambios pequeños y de una sola tarea (la mayoría de las tareas del backlog), commitea y pushea directo a `main`.
- **Usa una rama solo cuando el cambio es grande, riesgoso, o te va a tomar varios commits a medio terminar** (por ejemplo, un módulo completo nuevo que tocará muchos archivos a la vez). Nombra la rama `feature/SCRUM-XX-descripcion-corta` (ej. `feature/SCRUM-42-dashboard-coordinacion`), y ábrela como Pull Request hacia `main` cuando esté lista — así el resto del equipo puede revisar antes de que se integre.
- **Nunca hagas force-push a `main`.** Si necesitas deshacer algo ya subido, habla con el equipo primero.

## 2. Mensajes de commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/), en español, referenciando la tarea de Jira:

```
<tipo>: <descripción corta en minúsculas>

<cuerpo opcional explicando qué se hizo y cómo, si el cambio no es obvio>

Co-Authored-By: ... (si aplica)
```

**Tipos que usamos** (igual que en el historial ya existente):

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Funcionalidad nueva (endpoint, pantalla, tabla) |
| `fix` | Corrección de un bug |
| `docs` | Solo documentación (`docs/`, `PROGRESS.md`, READMEs) |
| `test` | Solo pruebas |
| `refactor` | Reordenar/limpiar código sin cambiar comportamiento |
| `chore` | Tareas de mantenimiento (dependencias, configuración) |

Ejemplos reales de este repo: `feat: crear base de datos en SQL Server e implementar modelo físico completo`, `test: pruebas de autenticación + checklist de seguridad`.

- Menciona el número de tarea de Jira en el cuerpo del commit o en el mensaje cuando aplique (`(SCRUM-XX)`).
- Un commit = un cambio coherente. Evita mezclar dos tareas distintas en un solo commit.

## 3. Ambiente de desarrollo compartido

### Herramientas

- **Node.js 24.x** y **npm** (viene con Node). Si tienes una versión distinta y algo no corre igual, avisa al equipo antes de asumir que es un bug de código.
- **Git**, obviamente.
- Para tocar la base de datos directo (fuera de la app): `sqlcmd` (Microsoft SQL Server Tools) o Azure Data Studio / SSMS.

### Estructura del repo (monorepo)

```
├── backend/       # Node + Express + TypeScript + TypeORM — ver backend/README.md
├── frontend/      # Vite + React + TypeScript + Tailwind — ver frontend/README.md
├── database/      # Scripts SQL versionados (schema.sql + migrations/)
├── docs/          # Requerimientos, casos de uso, seguridad, este archivo, etc.
└── PROGRESS.md    # Tracker de todas las tareas del backlog — LÉELO PRIMERO
```

### Credenciales

**Nunca van en el repo.** Cada carpeta (`backend/`, `frontend/`) tiene su `.env.example` como plantilla — cópialo a `.env` y pide las credenciales reales (servidor SQL, JWT secret, SMTP) a Amoxhua si no las tienes. Los `.env` están en `.gitignore`; si `git status` te muestra un `.env` como cambio para commitear, **detente** y revisa tu `.gitignore` antes de continuar.

### Levantar todo en paralelo

```bash
# Terminal 1
cd backend && npm install && npm run dev      # http://localhost:3000

# Terminal 2
cd frontend && npm install && npm run dev     # http://localhost:5173 (proxy /api -> backend)
```

### Antes de dar una tarea de backend por terminada

1. Corre `npm test` en `backend/` si tocaste lógica de negocio.
2. Si tocaste la base de datos, pruébalo contra el servidor real con datos de prueba, y **bórralos al terminar** — `Central-Data` es compartida con otro equipo, no debe quedar basura.
3. Actualiza `PROGRESS.md` (ver la instrucción obligatoria hasta arriba de ese archivo), Jira, y sube tu código a GitHub.

## 4. Revisión de código

Con 4 personas y el tiempo que tenemos, no es obligatorio un PR para cada commit — pero sí es buena práctica pedirle a alguien del equipo que le eche un ojo cuando el cambio toca algo que usan varios módulos (ej. el esquema de base de datos, la autenticación). Si tienes duda de si algo necesita revisión, mejor pregunta en el chat del equipo antes de subirlo.
