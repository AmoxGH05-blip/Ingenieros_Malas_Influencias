# Talleres y laboratorios (RF08)

**Tareas:** SCRUM-53 (tablas y criterios), SCRUM-54 (API, con activación por carrera) y SCRUM-56 (formulario de evaluación).
**Quién:** Coordinador y Administrador configuran y ven resultados (`/coordinador/talleres`); el alumno evalúa los de su carrera (`/estudiante/talleres`).

## Cómo funciona

Un taller o laboratorio es una **actividad de la carrera**: lo evalúan los alumnos de esa carrera y **no está ligado a un docente ni a un grupo**. Por eso va en tablas propias: las evaluaciones de docentes, sus promedios, el ranking y las estadísticas no cambian.

- **Interruptor por carrera.** Cada carrera tiene "Evaluación de talleres", apagada al principio. Con la carrera apagada, sus alumnos no ven talleres y no pueden evaluarlos. Para encenderla tiene que existir un instrumento de talleres activo.
- **Talleres de la carrera.** Se dan de alta con nombre y tipo (Taller o Laboratorio). El nombre es único dentro de la carrera sin distinguir mayúsculas. **Dar de baja** oculta el taller a los alumnos pero conserva las evaluaciones ya enviadas.
- **Criterios.** Son las secciones y preguntas del **instrumento de tipo Taller**, el mismo modelo configurable que el de docentes y la misma escala (0 / 2.5 / 5 / 7.5 / 10). Hay un solo instrumento para todas las carreras. El instrumento inicial es un borrador de 5 criterios con 2 preguntas cada uno: equipamiento e instalaciones, materiales e insumos, seguridad e higiene, apoyo del responsable y utilidad para la formación. **Son supuestos y se pueden cambiar** (hoy desde la base; no hay pantalla para editar instrumentos).
- **Evaluación del alumno.** Solo con el ciclo de evaluación activo, la carrera encendida y un taller activo de **su** carrera. Es una evaluación por alumno, taller y ciclo; solo existe la fila cuando se envía (no hay evaluaciones "pendientes" guardadas), y se guarda completa o no se guarda nada.
- **Resultados.** Por ciclo (el activo por defecto) y por carrera: número de evaluaciones, participación (alumnos de la carrera que lo evaluaron sobre los alumnos de la carrera), promedio ponderado y promedio por criterio. **Los promedios de talleres van aparte** y no se mezclan con los de docentes ni con el promedio institucional.
- **Privacidad.** Los resultados son solo agregados y no traen datos de quién respondió. **Con menos de 5 evaluaciones, o en una carrera con menos de 5 alumnos, no se muestra nada**: ni el promedio, ni los criterios, ni el conteo, ni la participación (solo el aviso de por qué). Sale de la revisión de seguridad: con un umbral bajo y resultados en vivo, comparando el resultado antes y después de cada envío (o con cuentas ficticias creadas para completar el mínimo) se podía deducir la calificación de una persona. **Honesto:** la base sí guarda quién envió cada evaluación (hace falta para impedir enviarla dos veces); el anonimato está en cómo se muestran los resultados, y el cuestionario lo dice así.

## API

Coordinación (Coordinador y Administrador; alumno y docente reciben `403`, sin sesión `401`):

| Método y ruta | Qué hace |
|---|---|
| `GET /api/talleres` | Carreras con su interruptor, alumnos y talleres (activos y de baja). |
| `POST /api/talleres` | Alta: `programaEducativoId`, `nombre`, `tipo` (opcional, Taller por defecto). `201`; `409` si el nombre ya está en la carrera; `404` si la carrera no existe. |
| `PATCH /api/talleres/:id` | Cambia `nombre`, `tipo` o `activo` (booleano estricto). |
| `PATCH /api/talleres/carreras/:id` | `{ "evaluaTalleres": true/false }`. Encender sin instrumento activo da `409`. |
| `GET /api/talleres/resultados?periodoId=` | Resultados del ciclo. `404` si el ciclo no existe, `400` si `periodoId` no es válido (también repetido). |

Alumno (con sesión y perfil de alumno):

| Método y ruta | Qué hace |
|---|---|
| `GET /api/estudiante/talleres` | `habilitado`, ciclo y los talleres que puede evaluar, con cuáles ya evaluó. |
| `GET /api/estudiante/talleres/instrumento` | Criterios y escala. |
| `POST /api/estudiante/talleres/:id/respuestas` | `{ "respuestas": { "<preguntaId>": valor } }`. Debe traer todas las preguntas, ninguna de más y cada valor de la escala; `201`. `403` carrera apagada, `404` taller de otra carrera, de baja o inexistente, `409` ya evaluado / sin ciclo activo, `400` respuestas inválidas. |

Las rutas de coordinación y las de talleres del alumno pasan por el limitador de gestión (200 peticiones por usuario cada 15 minutos). El envío se revalida **dentro de la transacción y con bloqueo** (carrera encendida, taller activo, ciclo activo): si algo cambió entre la validación y el guardado, responde `409`.

## Base de datos (migraciones 014 y 015)

**014:** `ProgramaEducativo."EvaluaTalleres"`, `Taller`, `EvaluacionTaller` y `RespuestaEvaluacionTaller`; el `CHECK` de `InstrumentoEvaluacion."TipoEvaluado"` admite `'Taller'`; instrumento semilla (lo firma cualquier cuenta activa de Coordinador o Administrador y, si falta algo, la migración falla en vez de dejar un instrumento sin preguntas). Las tablas nuevas nacen con RLS y sin permisos para `anon` y `authenticated` (ver `docs/seguridad-base-de-datos.md`).

**015 (sale de las revisiones):** nombre de taller único por carrera **sin distinguir mayúsculas ni espacios en los extremos**, ahora garantizado por la base, y clave foránea compuesta para que una respuesta solo pueda apuntar a una opción **de su propia pregunta**. Ambas son idempotentes. El esquema consolidado (`postgres_schema.sql`) trae las secciones 15 y 16.

## Pruebas

- Unitarias: `TallerService.test.ts`, `EvaluacionTallerService.test.ts` y `talleres.routes.test.ts` (permisos por rol y umbral de privacidad). 325 pruebas en backend en total.
- Contra la API y la base reales: `backend/scripts/verificar-talleres.js` recorre el flujo completo con datos temporales (permisos, alta, duplicados, interruptor, validaciones, otra carrera, el mismo alumno dos veces, umbral de privacidad, promedio contrastado con SQL independiente y calculado a mano, rechazo de la base a una opción de otra pregunta y a un nombre repetido con otras mayúsculas, baja y apagado) y **borra todo lo que crea**. Modifica la base mientras corre.
- En el navegador: configuración, evaluación como alumno y resultados como Coordinador, sin desbordes en móvil. Tres revisiones (código, seguridad y SQL): sin hallazgos críticos; se corrigieron el umbral de privacidad, el límite de peticiones, la revalidación en la transacción, las restricciones de la base y la accesibilidad.

## Limitaciones

- Un solo instrumento para todas las carreras; criterios por carrera quedarían para después. No hay pantalla para editar los criterios.
- La participación usa como base a **todos** los alumnos de la carrera, no solo a los inscritos en el ciclo.
- No hay edición del nombre en la pantalla (la API sí lo permite) ni reportes en PDF de talleres (RF09, Sprint 6).
- Un alumno ya evaluó "para siempre" en ese ciclo: no hay forma de corregir una evaluación enviada.
- Los resultados se calculan en vivo con los valores y pesos actuales del instrumento: si se editan preguntas que ya tienen respuestas, los ciclos pasados cambian. Regla: un instrumento con respuestas no se modifica, se crea uno nuevo.
- **Pendiente de decisión:** publicar los resultados solo con el ciclo cerrado (recomendado por la revisión de seguridad para cerrar del todo el ataque por diferencias). Hoy se publican en vivo, con el mínimo de 5.
