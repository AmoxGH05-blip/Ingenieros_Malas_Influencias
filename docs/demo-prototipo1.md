# Guion de demo — Prototipo 1

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-37/38
**Sprint 2:** Evaluación docente y seguimiento (14-sep a 25-sep) — entregado 01-oct-2026

## Qué se entrega

Todas las tareas de Sprint 2 están cerradas salvo SCRUM-36 (parcial: faltan las pantallas "Historial"/"Perfil") — ver `PROGRESS.md` para el detalle completo de cada una.

1. Cuestionario oficial de 15 preguntas (4 secciones, escala 0/2.5/5/7.5/10) cargado desde la base de datos real.
2. Flujo completo del alumno: ver docentes asignados → responder evaluación → ver avance actualizado.
3. Bloqueo de evaluación duplicada, aplicado en el servidor.
4. Infraestructura adicional entregada en el camino: branding, rediseño de login/paleta, migración de base de datos a Supabase.

## Preparación (antes de la demo)

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev        # http://localhost:3000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Necesitan `backend/.env` configurado contra Supabase (ver `.env.example` — pedir las credenciales a Amoxhua). También puede probarse directo en producción: https://ingenieros-malas-influencias.vercel.app

## Guion (≈8 minutos)

1. **Pruebas automatizadas** (1 min)
   ```bash
   cd backend && npm test
   ```
   26 pruebas verdes — mostrar `docs/pruebas-flujo-alumno.md`.

2. **Flujo del alumno en el navegador** (5 min)
   - Login con `DEMO0001` / `Demo2026!`.
   - Dashboard: mostrar las tarjetas de avance (pendientes/enviadas/docentes/% avance), todo con datos reales de Supabase.
   - Evaluar un docente pendiente → responder las 15 preguntas → enviar.
   - Mostrar que el dashboard actualizó el avance y que ese docente ya no aparece como pendiente.
   - Intentar evaluar al mismo docente otra vez → mostrar que la app ya no lo deja (redirige, porque el servidor rechazaría el reenvío con `409`).

3. **Base de datos** (2 min)
   - Mostrar `database/postgres_schema.sql` (esquema vigente en Supabase) y las tablas `Evaluacion`/`RespuestaEvaluacion` con la fila recién creada.

## Estado del tablero Jira

Sprint 2: SCRUM-32 a SCRUM-35 y SCRUM-37/38 completos. SCRUM-36 parcial (ver nota en `PROGRESS.md`). Backlog sincronizado con Jira y GitHub.

Siguiente: Sprint 3 (28-sep a 9-oct, ya en curso) — coordinación académica y notificaciones.
