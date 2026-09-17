# Guion de demo interna — Sprint 1

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-31
**Sprint 1:** Cimientos técnicos — autenticación y base de datos (31-ago a 13-sep)

## Qué se entrega este sprint

Todas las tareas de Sprint 1 (SCRUM-24 a SCRUM-31) están cerradas — ver `PROGRESS.md` para el detalle completo de cada una.

1. Base de datos física completa (20 tablas + sesiones + recuperación de contraseña) en el servidor real.
2. Backend con arquitectura por capas, autenticación completa (login, recuperación de contraseña, sesiones persistentes).
3. Frontend base con rutas por rol y pantallas de login/recuperación funcionales.
4. Pruebas automatizadas + checklist de seguridad del módulo de autenticación.

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

Necesitan `backend/.env` y `frontend/.env` configurados (ver `.env.example` de cada uno) — pedir las credenciales reales a Amoxhua si no las tienen.

## Guion (≈10 minutos)

1. **Base de datos** (2 min)
   - Mostrar `database/evaluacion_docente_schema.sql` y `database/migrations/002_sesiones_y_reset_password.sql`.
   - Abrir SSMS/Azure Data Studio contra `Central-Data` y mostrar las 22 tablas `P_EvaluacionDocente_*` ya creadas.

2. **Backend — pruebas automatizadas** (1 min)
   ```bash
   cd backend && npm test
   ```
   16 pruebas verdes, sin tocar la base de datos real — mostrar `docs/pruebas-autenticacion.md`.

3. **Flujo completo en el navegador** (5 min)
   - Ir a `http://localhost:5173` → pantalla de login.
   - Mostrar `/forgot-password` → pedir recuperación con un correo real → revisar que llega el correo.
   - Iniciar sesión con una cuenta de prueba → mostrar la redirección automática al dashboard según el rol.
   - Intentar entrar a la URL de otro rol (ej. `/coordinador` estando logueado como estudiante) → mostrar que rebota.
   - Cerrar sesión.

4. **Seguridad** (2 min)
   - Mostrar `docs/seguridad-checklist.md`: 12/15 controles cumplidos, 3 diferidos a EP10/Sprint 6 (con justificación).

## Estado del tablero Jira

Sprint 1 completo (SCRUM-24 a SCRUM-31, 8/8). Backlog actualizado y sincronizado con `PROGRESS.md` y GitHub — cada tarea tiene su comentario en Jira enlazando al commit correspondiente.

Siguiente: Sprint 2 (14-sep a 25-sep) — cuestionario de evaluación, seguimiento de avance. Entrega: Prototipo 1, 25-sep.
