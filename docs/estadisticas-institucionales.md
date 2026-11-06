# Estadísticas institucionales (RF06)

**Tareas:** SCRUM-55 (API de agregación) y SCRUM-57 (dashboard con gráficos y concentrado por carrera).
**Para quién:** Coordinador y Administrador, en `/coordinador/estadisticas` ("Estadísticas" en el menú). El alumno y el docente reciben `403`.

## Qué muestra

Para un ciclo de evaluación (el activo por defecto, con selector para los demás):

| Pieza | Qué es |
|---|---|
| **Alumnos que participaron** | Alumnos con al menos una evaluación enviada, sobre el total de alumnos inscritos en el ciclo (la misma cifra que el dashboard de coordinación). |
| **Evaluaciones enviadas** | Evaluaciones enviadas sobre las que se debían enviar (una por alumno y grupo). |
| **Promedio institucional** | Promedio de los promedios de cada docente (cada docente cuenta una vez), de 0 a 10; el mismo número que el ranking de indicadores. |
| **Docentes con promedio** | Cuántos docentes ya tienen respuestas. |
| **Docentes por categoría** | Dona y lista: cuántos docentes hay en Excelente, Bueno, Suficiente y No suficiente. |
| **Promedio institucional por ciclo** | Línea con los últimos 6 ciclos (hasta el elegido) y tabla con las mismas cifras. |
| **Concentrado por carrera** | Barras de participación y avance, y tabla con alumnos, participación, evaluaciones enviadas y promedio con su barra. |

Hay **dos porcentajes distintos a propósito**: "alumnos que participaron" (80 % = 4 de 5 alumnos) y "evaluaciones enviadas" (40 % = 10 de 25). Una cosa no implica la otra: un alumno que evaluó 1 de 5 docentes ya cuenta como participante. Por eso van rotulados con su fracción. Cuando no hay nada que medir (por ejemplo, un ciclo histórico cargado sin inscripciones) se muestra un guion, no 0 %.

## API

`GET /api/estadisticas/institucional?periodoId=` (sesión de Coordinador o Administrador).

| Código | Cuándo |
|---|---|
| 200 | Estadísticas del ciclo (el activo si no se indica `periodoId`). Sin ciclo activo devuelve todo en cero y `periodo: null`. |
| 400 | `periodoId` no es un entero positivo. |
| 401 / 403 | Sin sesión / alumno o docente. |
| 404 | El ciclo no existe. |

Respuesta: `periodo`, `resumen` (alumnos, participantes, `participacionAlumnos`, inscripciones, completadas, pendientes, `avanceEvaluaciones`, docentes con promedio, promedio institucional), `distribucion` (las cuatro categorías), `porCarrera` (una fila por carrera, con o sin alumnos) y `tendencia`.

## Cómo se calcula

No hay tablas ni vistas nuevas: `EstadisticaRepository` consulta, con SQL parametrizado, las vistas que ya existían.

- Participación del ciclo y por carrera: `V_EvaluacionDocente_ParticipacionCiclo` y `…Carrera` (SCRUM-41). La carrera es la **del alumno**.
- Promedio por docente, distribución y promedio institucional: `V_EvaluacionDocente_IndicadorDocente` (SCRUM-46). La **categoría de cada carrera** sale de la misma función `F_EvaluacionDocente_Clasificar`, así que los rangos siguen en un solo lugar y el frontend no los repite.
- Promedio de una carrera: suma ponderada sobre suma de pesos de las respuestas de las **materias de esa carrera** (`V_EvaluacionDocente_PromedioDocenteGrupo`). Es un promedio por respuestas, no por docente, y así se rotula.
- Tendencia: los 6 ciclos más recientes con inicio anterior o igual al elegido, del más antiguo al más reciente.

## Gráficas

Recharts (`recharts` 3). Sin animaciones, para respetar a quien prefiere menos movimiento. Las gráficas son decorativas para el lector de pantalla (`aria-hidden`); su versión accesible son la lista de categorías y las tablas de tendencia y de carreras, que repiten todas las cifras. La pantalla se carga con `React.lazy`: las gráficas (unos 427 kB) solo se descargan al abrirla y el paquete principal no crece.

## Pruebas

- `EstadisticaService.test.ts` (8 pruebas): conversión de los textos de pg, los dos porcentajes por separado, distribución con las cuatro categorías, carreras sin alumnos con `null`, ciclo sin inscripciones en la tendencia, ciclo indicado contra el activo, ciclo vacío, sin ciclo activo, `404` y `400`.
- `estadisticas.routes.test.ts` (3 pruebas): 401 sin sesión, 403 a alumno y docente, 200 a coordinador y administrador.
- Contra Supabase, `backend/scripts/verificar-estadisticas.js` (solo lee; cuentas y contraseña por variables de entorno, ver el encabezado del script), 26 comprobaciones: las cifras de la API coinciden con consultas independientes sobre las **tablas** (no sobre las vistas): alumnos, inscripciones, evaluaciones enviadas, participantes, docentes con promedio y promedio institucional; además coinciden con el ranking de indicadores; la ventana de 6 ciclos de la tendencia coincide con una consulta aparte; `periodoId` repetido responde 400; la suma por carrera cuadra con el total; la tendencia termina en el ciclo elegido; y un ciclo anterior responde sin mezclar alumnos del activo.
- En el navegador: el botón «Reintentar» tras un error de carga y el aviso del `ErrorBoundary` (probado forzando un error de render) en vez de pantalla en blanco; las tres gráficas se dibujan, vista móvil sin desbordes y navegación desde el menú de Coordinador y de Administrador.

## Limitaciones

- Cada llamada ejecuta cuatro consultas que recalculan las vistas, sin transacción común (las cifras pueden diferir en un instante si alguien envía una evaluación justo en medio); con el volumen del proyecto es instantáneo, pero con muchos miles de respuestas habría que revisar índices o materializar.
- Las dos fuentes no coinciden en los ciclos históricos demo: el avance y la participación salen de las inscripciones, y los promedios, de las evaluaciones. Un ciclo con respuestas pero sin inscripciones muestra promedio y un guion en el avance.
- Si no hay ningún ciclo activo, la pantalla avisa que se elija uno de la lista y no muestra tarjetas en cero.
- La categoría de cada carrera se muestra como texto junto a la barra, no solo con color.
- Solo hay una carrera con alumnos en los datos demo, así que el concentrado por carrera no se ha visto con varias carreras con datos.
- El pool de conexiones tiene tope explícito (`DB_POOL_MAX`, 10 por defecto) y falla a los 10 s si no hay conexión libre, para no agotar las de Supabase ni colgar la petición.
- No hay filtro por carrera ni por facultad: el concentrado muestra todas las carreras a la vez.
- Los ciclos históricos demo no tienen inscripciones, por eso su avance de evaluaciones aparece como guion.
