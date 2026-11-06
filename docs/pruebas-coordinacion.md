# Pruebas de integración de coordinación y avisos (SCRUM-44)

**Alcance:** `/api/coordinacion/*` (SCRUM-39), el dashboard de coordinación (SCRUM-42), las vistas de participación (SCRUM-41) y los avisos al iniciar sesión (SCRUM-40).

**Cambio de alcance:** la tarea se llamaba "Pruebas de integración de coordinación y validación de **envío de correos**". El sistema ya no envía correos (decisión del 16-oct-2026, ver `docs/notificaciones.md`), así que esa parte se reemplazó por la validación de los **avisos en pantalla**.

## Qué se probó y cómo

| Capa | Dónde | Qué cubre |
|---|---|---|
| Lógica del servicio | `CoordinacionService.test.ts` (7 pruebas) | Sin ciclo activo, división entre cero, concluido / parcial / no iniciado (incluye a quien nunca abrió su dashboard), grupos de otros ciclos, filtros por carrera y por grupo, ciclo indicado en lugar del activo, armado de los filtros. |
| Permisos y validación por ruta | `coordinacion.routes.test.ts` (5 pruebas, nuevo) | Sin sesión 401; alumnos y docentes 403; coordinador y administrador 200; los filtros llegan al servicio solo como enteros positivos y los demás dan 400 sin consultar. |
| Avisos | `NotificacionService.test.ts` (15 pruebas) | Ventana de 7 días, gravedad, cierre hoy, ciclos, roles, y el aviso de solicitudes de contraseña del coordinador. |
| **Integración contra la API y la base reales** | `backend/scripts/verificar-coordinacion.js` (nuevo) | Contrasta lo que devuelve la API (calculado en la aplicación) con las vistas de participación de la base (calculadas en SQL, de forma independiente), y comprueba permisos y filtros con cuentas reales. Solo lee. |

El script se corre desde `backend/` con el `.env` de la base cargado; las cuentas y su contraseña van por variables de entorno (`COORD_CUENTA`, `ADMIN_CUENTA`, `ALUMNO_CUENTA`, `DOCENTE_CUENTA`, `CUENTAS_PASSWORD`) y `API_URL` indica a qué servidor apuntar.

## Resultado (6-nov-2026, contra producción y Supabase)

29 comprobaciones, 0 fallas:

- **Permisos:** `filtros` y `avance` responden 401 sin sesión, 403 a alumno y docente, 200 a coordinador y administrador.
- **Filtros inválidos:** `periodoId=abc`, `grupoId=0`, `programaEducativoId=-2` y `periodoId=1.5` dan 400.
- **API contra vistas SQL (ciclo activo):** alumnos 5 = 5; alumnos participantes 4 = 4; inscripciones 25 = 25 (suma por grupo de la API contra la vista del ciclo); los 5 grupos tienen los mismos inscritos que `V_EvaluacionDocente_ParticipacionGrupo`; concluidos + parciales + no iniciados = alumnos; el porcentaje queda entre 0 y 100.
- **Filtros:** filtrar por grupo deja solo ese grupo y sus alumnos coinciden con sus inscritos; filtrar por carrera coincide con `V_EvaluacionDocente_ParticipacionCarrera`.
- **Ciclos anteriores:** un ciclo demo anterior responde 200 y no mezcla alumnos del ciclo activo.
- **Avisos:** responden 200 con una lista para coordinador y docente, y 401 sin sesión.

## Limitaciones

- Los datos son los del ciclo demo (5 alumnos, 5 grupos, un solo programa), así que no se ejercita el filtro por carrera con varias carreras con alumnos.
- El script contrasta cifras que la propia aplicación y las vistas calculan con la misma regla de negocio (una inscripción cuenta como completada si hay evaluación completada del alumno en ese grupo y ciclo); detecta errores de implementación, no de interpretación de la regla.
- No hay pruebas automáticas del dashboard (React) de coordinación: se verificó a mano en SCRUM-42.
