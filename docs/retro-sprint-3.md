# Retro del Sprint 3 — Coordinación académica y avisos (SCRUM-45)

**Fechas planeadas:** 28 de septiembre al 9 de octubre de 2026. **Cierre real:** 6 de noviembre (28 días después). Retro escrita el 6-nov-2026.

## Qué se entregó

| Tarea | Responsable (Jira) | Cierre | Resultado |
|---|---|---|---|
| SCRUM-39 API de coordinación | Juan Antonio | 9-oct | Concluidos / parciales / no iniciados con filtros por carrera, grupo y ciclo. |
| SCRUM-41 Vistas de participación | Amoxhua | 9-oct | Tres vistas SQL (grupo, carrera, ciclo). |
| SCRUM-42 Dashboard de coordinación | Óscar | 9-oct | Avance en vivo (actualización cada 30 s) con filtros. |
| SCRUM-43 Panel de usuarios | Óscar | 9-oct | Alta de cuentas por rol (luego rediseñada en SCRUM-79). |
| SCRUM-40 Avisos | Juan Antonio | 16-oct | Rehecha: de correos a avisos en pantalla, con ping diario a la base. |
| SCRUM-44 Pruebas de integración | Mauricio | 6-nov | Ver `docs/pruebas-coordinacion.md`. |
| SCRUM-45 Retro y backlog | Mauricio | 6-nov | Este documento. |

Cuatro de las siete tareas cerraron en la fecha del sprint. Las otras tres cerraron entre 7 y 28 días tarde.

## Qué salió bien

- **Contrastar dos cálculos independientes.** Las vistas SQL (SCRUM-41) y el servicio de coordinación (SCRUM-39) calculan lo mismo por caminos distintos, y el script de SCRUM-44 los compara contra datos reales. Ambos parten de `Inscripcion` y no de `Evaluacion`, para no dejar fuera a quien nunca abrió su dashboard.
- **Verificar contra la base real, no solo con datos simulados.** Cada tarea se probó contra Supabase y en el navegador antes de cerrarla, y se dejaron scripts de datos demo con su limpieza.
- **Documentar el "cómo" junto con el "qué".** `PROGRESS.md` y los documentos por tema permitieron retomar el trabajo sin depender de la memoria de nadie.
- **Revisiones antes de subir.** Las revisiones de código, seguridad y SQL encontraron errores reales (interbloqueos al inscribir, un coordinador desactivado que seguía aprobando) antes de que llegaran a producción. También señalaron los permisos de Supabase abiertos a `anon`, que sigue pendiente.

## Qué salió mal

- **Se construyó sobre un supuesto sin validar.** SCRUM-40 se hizo con correos automáticos y solo en producción se descubrió que Render gratuito bloquea el correo (puertos 25, 465 y 587) y que el remitente de Brevo no se podía validar. Se perdió trabajo y hubo que rehacerla.
- **Los requisitos cambiaron tarde.** En la revisión con la coordinadora (16-oct) se pidió iniciar sesión con número de cuenta, altas jerárquicas y cambio de contraseña con aprobación. Eso creó SCRUM-78, 79 y 80, que consumieron el Sprint 4 completo, y obligó a rediseñar lo que SCRUM-43 acababa de entregar.
- **Dos tareas de QA y documentación quedaron abiertas cuatro semanas.** SCRUM-44 conservó un título obsoleto ("validación de envío de correos") que nadie actualizó cuando cambió el alcance, y SCRUM-45 (la retro) no se hizo al cierre del sprint.
- **El tablero no reflejó la realidad a tiempo.** Los sprints 3 y 4 aparecían con fechas vencidas sin que hubiera una decisión de reprogramar.
- **Riesgos que se acumularon sin dueño:** cuentas demo con contraseña pública en un repositorio público, y permisos de Supabase abiertos a `anon` desde el inicio.

## Acciones para los siguientes sprints

| Acción | Responsable sugerido |
|---|---|
| Validar las restricciones del entorno (correo, límites de Render y Supabase) antes de diseñar con ellas. | Quien tome la tarea |
| Revisar los requisitos con la coordinadora a mitad de cada sprint, no al final. | Mauricio (Scrum Master) |
| Actualizar el título y la descripción de la tarea de Jira en cuanto cambie el alcance. | Quien tome la tarea |
| Cerrar la retro y la actualización del backlog el último día del sprint. | Mauricio |
| Congelar el alcance a mitad de sprint: lo nuevo entra al sprint siguiente. | Todo el equipo |
| Incluir revisión de código y de seguridad en la definición de terminado de lo que toca acceso o datos. | Todo el equipo |

## Actualización del backlog (6-nov-2026)

**Cambios hechos:**

- SCRUM-44 se renombró: "Pruebas de integración de coordinación y avisos" (ya no hay correos).
- Se agregaron y cerraron SCRUM-78 (acceso por número de cuenta) y SCRUM-79 (altas jerárquicas, materias y grupos), y se cerró SCRUM-80 (cambio de contraseña con aprobación).
- Los sprints 3 y 4 quedaron completos (7 de 7 cada uno). Siguen sin cerrar los sprints 5 a 8 (25 tareas).

**Tareas nuevas** (salen de las revisiones de seguridad y de lo que quedó fuera de alcance), creadas en Jira como SCRUM-81 a SCRUM-86 en este orden, sin responsable asignado:

1. Cerrar los permisos de las tablas y vistas de Supabase a los roles públicos `anon` y `authenticated` (activar RLS).
2. Validar los tokens de sesión contra la tabla de sesiones en cada petición (hoy un token vale 8 horas aunque se cierre la sesión).
3. Editar y desactivar cuentas, materias y grupos, y quitar inscripciones.
4. Carga masiva de alumnos por CSV.
5. Mostrar promedio y lugar al docente solo con un mínimo de evaluaciones (privacidad de los alumnos).
6. Desactivar las cuentas demo y crear el administrador real antes de la entrega final.

**Pendiente de decisión del equipo:** reprogramar o no los sprints 5 a 8. El Prototipo 2 estaba fijado para el 6-nov y el Sprint 5 no tiene tareas cerradas.
