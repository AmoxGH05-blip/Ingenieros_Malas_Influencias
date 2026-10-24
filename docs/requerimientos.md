# Requerimientos funcionales y no funcionales

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-18
**Formalizado a partir de:** el backlog de épicas y sprints cargado en Jira (`documentacion.pdf` del repo).
**Última actualización:** 23 de octubre de 2026 (revisión con la coordinadora del proyecto, SCRUM-40 y SCRUM-78 a 80).

> Este documento formaliza los requerimientos que ya estaban distribuidos como tareas en el backlog Scrum, para tenerlos en un solo lugar consultable independiente de Jira. La columna **Estado** se actualiza al cerrar cada tarea.

## 1. Alcance

Sistema web para la evaluación de docentes por parte de estudiantes, con instrumentos de evaluación **configurables** (secciones, preguntas, tipos de pregunta y escalas de respuesta, sin tocar el esquema de base de datos), seguimiento de avance, avisos de evaluaciones pendientes, indicadores históricos por docente, evaluación de talleres/laboratorios, estadísticas institucionales y reportes en PDF.

Roles del sistema: **Administrador, Coordinador, Docente, Estudiante** (ver `docs/casos_de_uso.md` para el detalle por rol). Todos inician sesión con su **número de cuenta**; el sistema parte de una sola cuenta de Administrador y las demás se dan de alta desde la página (ver `docs/altas-y-grupos.md`).

### Cambios de alcance desde la versión anterior

| Fecha | Cambio | Motivo |
|---|---|---|
| 16-oct-2026 | Los recordatorios por **correo** (RF05) pasan a **avisos al iniciar sesión** (ventana y campana de notificaciones). | Revisión con la coordinadora: las cuentas de alumnos y docentes son números de cuenta sin buzón real; además el servidor gratuito bloquea el envío de correo. |
| 16-oct-2026 | El inicio de sesión es **solo por número de cuenta** (se retira el correo). | Revisión con la coordinadora: no usar correos personales como usuario. |
| 16-oct-2026 | Altas **jerárquicas**: el Administrador crea coordinadores; el Coordinador crea alumnos, docentes, materias y grupos (nuevo RF10). | Misma revisión: partir de una sola cuenta y dar de alta el resto desde la página. |
| 16-oct-2026 | El cambio de contraseña pasa a **solicitud con aprobación** del coordinador o administrador en lugar de enlace por correo (nuevo RF11). | Las cuentas no tienen correo real, así que la recuperación por enlace no aplica. |

## 2. Requerimientos funcionales

| ID | Épica | Requerimiento | Estado al 23-oct-2026 |
|---|---|---|---|
| RF01 | EP1 · Autenticación y gestión de usuarios | El sistema debe permitir iniciar sesión por **número de cuenta** (matrícula, número de empleado o el asignado al coordinador y administrador) y contraseña, emitiendo un token de sesión (JWT). Las cuentas con contraseña temporal deben cambiarla en su primer acceso, y el sistema debe limitar los intentos fallidos. | **Implementado** (SCRUM-26, 78). Pendiente: editar y desactivar cuentas. |
| RF02 | EP2 · Evaluación docente | El sistema debe presentar al estudiante la lista de docentes que le corresponde evaluar (según sus grupos inscritos en el ciclo del periodo activo) y permitirle responder el cuestionario de evaluación correspondiente. | **Implementado** (SCRUM-33, 35). |
| RF03 | EP2 · Evaluación docente | El cuestionario debe soportar preguntas de distintos tipos (escala Likert, opción múltiple, sí/no, texto abierto, numérica), con una escala oficial de 0/2.5/5/7.5/10 para las preguntas de escala. El sistema debe bloquear que un estudiante evalúe dos veces al mismo docente/grupo en el mismo periodo de evaluación. | **Implementado** (SCRUM-32, 33, 35). |
| RF04 | EP3 · Seguimiento de avance | El sistema debe mostrarle al estudiante cuáles evaluaciones tiene completadas y cuáles pendientes. | **Implementado** (SCRUM-34, 36). |
| RF05 | EP4 · Notificaciones | El sistema debe avisar a los estudiantes con evaluaciones pendientes al iniciar sesión, desde 7 días antes del cierre del periodo de evaluación (ventana de aviso y campana de notificaciones; sin correos, ver `docs/notificaciones.md`). | **Implementado** con el alcance nuevo (SCRUM-40). |
| RF06 | EP5 · Coordinación académica / EP8 · Estadísticas institucionales | El sistema debe darle a coordinación visibilidad del avance de evaluaciones (concluidos / parciales / no iniciados), con filtros por carrera, grupo y ciclo, y un dashboard de estadísticas institucionales (participación, promedios, ranking) con gráficos. | **Parcial.** Avance en vivo, filtros y vistas de participación implementados (SCRUM-39, 41, 42). Pendiente: estadísticas con gráficos (Sprint 5). |
| RF07 | EP6 · Indicadores docentes e históricos | El sistema debe calcular, por docente, el promedio, ranking y clasificación (Excelente / Bueno / Suficiente / No suficiente) por periodo, y permitir consultar el histórico de ciclos anteriores. Los casos límite de clasificación (ej. 6.9/7.0, 8.9/9.0) deben resolverse contra la tabla oficial de rangos. | **Pendiente** (Sprint 4). |
| RF08 | EP7 · Talleres y laboratorios | El sistema debe permitir configurar, por carrera, qué talleres/laboratorios existen y sus criterios de evaluación, y habilitar/deshabilitar la evaluación de talleres de forma configurable por carrera. | **Pendiente** (Sprint 5). |
| RF09 | EP9 · Reportes en PDF | El sistema debe generar 5 reportes en PDF: avance de evaluaciones, participación, resultados por docente, comparativo histórico, y resultados de talleres/laboratorios, filtrables y descargables. | **Pendiente** (Sprint 6). |
| RF10 | EP1 · Autenticación y gestión de usuarios | **(Nuevo)** El Administrador debe poder dar de alta coordinadores y administradores, y el Coordinador alumnos y docentes, buscando primero el número de cuenta: si es nuevo se crea con contraseña temporal, y si ya existe se le agrega un rol sin tocar su contraseña. El Coordinador debe poder crear materias y grupos (con cupo opcional) e inscribir alumnos, también al darlos de alta. El Coordinador no puede crear ni gestionar cuentas de Coordinador o Administrador. | **Implementado** (SCRUM-43, 79). Pendiente: quitar inscripciones y editar o desactivar. |
| RF11 | EP1 · Autenticación y gestión de usuarios | **(Nuevo)** Un alumno o docente que olvide su contraseña debe poder solicitar el cambio escribiendo la nueva; no se aplica hasta que el Coordinador o Administrador la apruebe desde su panel, y al iniciar sesión estos ven un aviso con las solicitudes pendientes. | **Pendiente** (SCRUM-80). |

## 3. Requerimientos no funcionales (EP10 · Seguridad y no funcionales)

| ID | Categoría | Requerimiento | Estado al 23-oct-2026 |
|---|---|---|---|
| RNF01 | Seguridad | Las contraseñas se almacenan como hash (bcrypt), nunca en texto plano, con política de mínimo 8 caracteres y máximo 72 bytes. Se limitan los intentos fallidos de inicio de sesión (5 por cuenta y 30 por IP cada 15 minutos). Los tokens de recuperación por correo (de un solo uso, 30 minutos) se retiran con RF11. | **Implementado** (SCRUM-26, 27, 78). |
| RNF02 | Seguridad | Control de acceso por roles (Administrador, Coordinador, Docente, Estudiante) validado en el servidor, con trazabilidad de quién da de alta cada cuenta y bitácora de auditoría de acciones sensibles. | **Parcial.** Roles y trazabilidad de altas implementados; bitácora de auditoría pendiente (SCRUM-62). |
| RNF03 | Seguridad | Las evaluaciones pueden marcarse como anónimas de cara a reportes, preservando el dato en base para trazabilidad si se requiere auditar. | **Parcial.** El dato existe en el modelo; se aplica en los reportes (Sprint 6). |
| RNF04 | Rendimiento | Los endpoints y consultas deben responder en menos de 3 segundos bajo condiciones normales de carga. | **Por verificar** (SCRUM-58 y 68). |
| RNF05 | Disponibilidad / Escalabilidad | El sistema debe soportar múltiples campus y carreras configurables sin requerir cambios de código. | **Parcial.** El modelo ya separa facultades, carreras y periodos; pruebas de escalabilidad pendientes (SCRUM-70). |
| RNF06 | Usabilidad | Las interfaces deben ser responsivas (compatibles con escritorio, tablet y móvil). | **Parcial.** Login y paneles se adaptan a móvil; ajustes finales en SCRUM-64. |
| RNF07 | Integridad de datos | Los borrados son lógicos (columnas `Activo`/`Completada`), no físicos: no se usan `ON DELETE CASCADE` en la base de datos, para evitar pérdidas accidentales de historial. | **Implementado** en el modelo. |
| RNF08 | Adaptabilidad | Agregar una nueva pregunta, sección, escala de respuesta o un instrumento de evaluación completo debe ser posible insertando datos (catálogos), sin alterar el esquema de la base de datos. | **Implementado** en el modelo de datos. |
| RNF09 | Operación | **(Nuevo)** El sistema debe poder desplegarse en servicios gratuitos sin que se pause por inactividad: un ping diario mantiene activa la base de datos. | **Implementado** (SCRUM-40). |

## 4. Trazabilidad con la base de datos y el backend

- Modelo de datos: `database/postgres_schema.sql` (esquema consolidado de PostgreSQL en Supabase, 22 tablas y 3 vistas de participación) y `database/migrations/` (migraciones 002 a 008, repetibles y con su reversa). `database/evaluacion_docente_schema.sql` es historia de la versión de SQL Server.
- Backend: `backend/src/` por capas (entidades, repositorios, servicios, controladores y rutas), con 236 pruebas automatizadas.
- Documentación por tema: `docs/acceso-y-cuentas.md` (RF01, RNF01), `docs/altas-y-grupos.md` (RF10), `docs/notificaciones.md` (RF05) y `docs/vistas-participacion.md` (RF06).
- El avance tarea por tarea, con "qué se hizo / cómo se hizo", está en `PROGRESS.md`.
