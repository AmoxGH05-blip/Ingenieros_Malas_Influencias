# Requerimientos funcionales y no funcionales

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-18
**Formalizado a partir de:** el backlog de épicas y sprints ya cargado en Jira (`documentacion.pdf` del repo).

> Este documento formaliza los requerimientos que ya estaban distribuidos como tareas en el backlog Scrum, para tenerlos en un solo lugar consultable independiente de Jira.

## 1. Alcance

Sistema web para la evaluación de docentes por parte de estudiantes, con instrumentos de evaluación **configurables** por un coordinador (secciones, preguntas, tipos de pregunta y escalas de respuesta, sin tocar el esquema de base de datos), seguimiento de avance, notificaciones automáticas, indicadores históricos por docente, evaluación de talleres/laboratorios, estadísticas institucionales y reportes en PDF.

Roles del sistema: **Administrador, Coordinador, Docente, Estudiante** (ver `docs/casos_de_uso.md` para el detalle por rol).

## 2. Requerimientos funcionales

| ID | Épica | Requerimiento |
|---|---|---|
| RF01 | EP1 · Autenticación y gestión de usuarios | El sistema debe permitir iniciar sesión por número de cuenta (matrícula de estudiante o número de empleado de docente) y contraseña, emitiendo un token de sesión (JWT). Debe permitir recuperar la contraseña vía correo institucional mediante un enlace de un solo uso con vigencia limitada. Un administrador debe poder dar de alta/editar usuarios y asignarles roles. |
| RF02 | EP2 · Evaluación docente | El sistema debe presentar al estudiante la lista de docentes que le corresponde evaluar (según sus grupos inscritos) y permitirle responder el cuestionario de evaluación correspondiente. |
| RF03 | EP2 · Evaluación docente | El cuestionario de evaluación debe soportar preguntas de distintos tipos (escala Likert, opción múltiple, sí/no, texto abierto, numérica), con una escala oficial de 0/2.5/5/7.5/10 para las preguntas de escala. El sistema debe bloquear que un estudiante evalúe dos veces al mismo docente/grupo en el mismo periodo de evaluación. |
| RF04 | EP3 · Seguimiento de avance | El sistema debe mostrarle al estudiante cuáles evaluaciones tiene completadas y cuáles pendientes. |
| RF05 | EP4 · Notificaciones automáticas | El sistema debe enviar recordatorios automáticos por correo a los estudiantes con evaluaciones pendientes, 7, 3 y 1 día(s) antes del cierre del periodo de evaluación. |
| RF06 | EP5 · Coordinación académica / EP8 · Estadísticas institucionales | El sistema debe darle a coordinación visibilidad del avance de evaluaciones (concluidos / parciales / no iniciados), con filtros por carrera, grupo y ciclo, y un dashboard de estadísticas institucionales (participación, promedios, ranking) con gráficos. |
| RF07 | EP6 · Indicadores docentes e históricos | El sistema debe calcular, por docente, el promedio, ranking y clasificación (Excelente / Bueno / Suficiente / No suficiente) por periodo, y permitir consultar el histórico de ciclos anteriores. Los casos límite de clasificación (ej. 6.9/7.0, 8.9/9.0) deben resolverse contra la tabla oficial de rangos. |
| RF08 | EP7 · Talleres y laboratorios | El sistema debe permitir configurar, por carrera, qué talleres/laboratorios existen y sus criterios de evaluación, y habilitar/deshabilitar la evaluación de talleres de forma configurable por carrera. |
| RF09 | EP9 · Reportes en PDF | El sistema debe generar 5 reportes en PDF: avance de evaluaciones, participación, resultados por docente, comparativo histórico, y resultados de talleres/laboratorios — filtrables y descargables. |

## 3. Requerimientos no funcionales (EP10 · Seguridad y no funcionales)

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF01 | Seguridad | Las contraseñas se almacenan como hash (bcrypt), nunca en texto plano. Los tokens de recuperación de contraseña se almacenan hasheados (SHA-256) y son de un solo uso con vigencia de 30 minutos. |
| RNF02 | Seguridad | Control de acceso por roles (Administrador, Coordinador, Docente, Estudiante) mediante middleware, con bitácora de auditoría de acciones sensibles. |
| RNF03 | Seguridad | Las evaluaciones pueden marcarse como anónimas de cara a reportes, preservando el dato en base para trazabilidad si se requiere auditar. |
| RNF04 | Rendimiento | Los endpoints y consultas deben responder en menos de 3 segundos bajo condiciones normales de carga. |
| RNF05 | Disponibilidad / Escalabilidad | El sistema debe soportar múltiples campus y carreras configurables sin requerir cambios de código. |
| RNF06 | Usabilidad | Las interfaces deben ser responsivas (compatibles con escritorio, tablet y móvil). |
| RNF07 | Integridad de datos | Los borrados son lógicos (columnas `Activo`/`Completada`), no físicos — no se usan `ON DELETE CASCADE` en la base de datos, para evitar pérdidas accidentales de historial. |
| RNF08 | Adaptabilidad | Agregar una nueva pregunta, sección, escala de respuesta o un instrumento de evaluación completo debe ser posible insertando datos (catálogos), sin alterar el esquema de la base de datos. |

## 4. Trazabilidad con la base de datos y el backend

- Modelo de datos: `database/evaluacion_docente_schema.sql` (ver también `database/migrations/`).
- Backend (auth, RF01 parcial): `backend/src/`.
- El resto de los RF (RF02–RF09) se implementan progresivamente en los sprints 2 a 6 — ver `PROGRESS.md` para el estado actual de cada tarea.
