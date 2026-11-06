# Indicadores docentes (RF07)

**Tareas:** SCRUM-46 (vistas), 47 y 48 (API), 49 y 50 (pantallas), 51 (reglas de clasificación), 52 (esta documentación).
**Qué entrega:** por docente y ciclo, el promedio de sus evaluaciones, su lugar en el ranking y su categoría (Excelente, Bueno, Suficiente o No suficiente), más el histórico de ciclos anteriores y el comparativo del ciclo actual contra el anterior y los últimos 3.

## 1. Cómo se calcula

Todo se calcula **al vuelo en la base de datos**, desde las respuestas reales; no hay nada que sincronizar ni una tabla de resultados que se pueda desactualizar. (La tabla `ResultadoDocente` del modelo original no se usa.)

| Dato | Regla |
|---|---|
| Promedio de un docente en un ciclo | suma(valor de la opción elegida × `PesoPonderacion` de la pregunta) ÷ suma(`PesoPonderacion`), sobre las preguntas de escala de las evaluaciones **completadas** de todos sus grupos del ciclo. El valor va de 0 a 10. |
| Ponderación entre grupos | Por respuestas, no un promedio de promedios: un grupo con más evaluaciones pesa más. |
| Sin respuestas | `NULL` ("sin evaluaciones"). No es 0, y el docente no entra al ranking. |
| Ranking | `RANK()` por ciclo, 1 = mejor promedio, sobre el promedio ya redondeado a 2 decimales (igual que la clasificación). Los empates comparten lugar (1, 2, 2, 4). |
| Clasificación | Sobre el promedio **redondeado a 2 decimales**. |

### Rangos de clasificación

| Categoría | Promedio |
|---|---|
| Excelente | 9.00 a 10.00 |
| Bueno | 8.00 a 8.99 |
| Suficiente | 7.00 a 7.99 |
| No suficiente | menor a 7.00 |

> **Pendiente de confirmar:** la tabla oficial de rangos no está en el repositorio ni en `documentacion.pdf`; solo menciona los casos límite 6.9/7.0 y 8.9/9.0. Estos rangos son una suposición acordada (5-nov-2026). Viven en un solo lugar, la función SQL `F_EvaluacionDocente_Clasificar` de la migración 009: si la oficial es distinta, se cambia ahí y las vistas, la API y las pantallas la siguen.

**Casos límite** (comprobados por `database/verificar_clasificacion.sql`, 18 casos): 6.99 es No suficiente y 7.00 es Suficiente; 7.99 es Suficiente y 8.00 es Bueno; 8.99 es Bueno y 9.00 es Excelente; 6.995, 7.995 y 8.995 redondean hacia arriba y suben de categoría; un promedio `NULL` queda sin clasificar.

## 2. Base de datos (migración 009)

| Objeto | Contenido |
|---|---|
| `F_EvaluacionDocente_Clasificar(numeric)` | La regla de la tabla anterior. Inmutable, la usa la vista. |
| `V_EvaluacionDocente_PromedioDocenteGrupo` | Una fila por grupo y ciclo: evaluaciones completadas, respuestas, `SumaPonderada`, `SumaPesos` y `Promedio`. Se exponen las sumas para poder agregar bien por docente. |
| `V_EvaluacionDocente_IndicadorDocente` | Una fila por docente y ciclo: materias, grupos, evaluaciones, promedio, clasificación, ranking y cuántos docentes tienen promedio. |

La migración va en una transacción y recrea las vistas desde cero (`DROP VIEW IF EXISTS`, la dependiente primero), así que se puede correr de nuevo aunque cambien las columnas; su reversa está en el encabezado. También está en la sección 12 de `postgres_schema.sql`. `V_EvaluacionDocente_IndicadorDocente` incluye `PeriodoActivo` para distinguir el ciclo vigente.

**Permisos:** las dos vistas y la función se cierran a los roles `anon` y `authenticated` de la Data API de Supabase; solo el backend (rol dueño) las lee.

## 3. API

Todas piden sesión (`401` sin token) y respetan el rol (`403` si no corresponde).

| Ruta | Quién | Qué devuelve |
|---|---|---|
| `GET /api/indicadores/docentes?periodoId=` | Coordinador, Administrador | Ranking del ciclo (el activo si no se indica): resumen (promedio institucional, distribución por categoría, docentes sin evaluaciones) y la lista ordenada. `404` si el ciclo no existe, `400` si el id no es válido. |
| `GET /api/indicadores/docentes/:id/historico?ultimos=` | Coordinador, Administrador | Ciclos del docente del más antiguo al más reciente, cada uno con su `activo` (ciclo vigente) y su `variacion` contra el ciclo anterior que tuvo promedio. `ultimos` (1 a 20) deja solo los N más recientes. `404` si el docente no existe. |
| `GET /api/indicadores/mio` | Docente | Lo mismo, del docente que inició sesión. **No recibe un id**: se toma de la sesión, así que un docente no puede ver los indicadores de otro. `404` si la cuenta no tiene perfil de docente. |

Un alumno recibe `403` en las tres. Código: `IndicadorRepository` (lee las vistas), `IndicadorService`, `IndicadorController` y `indicadores.routes.ts`.

## 4. Pantallas

El "ciclo actual" de un docente es el ciclo **activo**; si ninguno lo está, el más reciente. Un ciclo futuro con grupos ya asignados no cuenta como actual, y los comparativos solo miran hasta el actual.

| Ruta | Rol | Contenido |
|---|---|---|
| `/docente` | Docente | **Mi perfil** (SCRUM-49): ciclo actual con promedio, categoría, lugar, evaluaciones y grupos, y el histórico por ciclo con barras de 0 a 10. |
| `/docente/comparativo` | Docente | **Comparativo histórico** (SCRUM-50): ciclo actual, ciclo anterior con su variación, promedio de los últimos 3 ciclos y la tabla de esos ciclos. |
| `/coordinador/indicadores` | Coordinador, Administrador | Ranking del ciclo con filtro de ciclo, promedio institucional, distribución por categoría y una fila por docente. |
| `/coordinador/indicadores/:id` | Coordinador, Administrador | Perfil, comparativo e histórico de un docente. |

## 5. Datos demo del histórico

Hoy la base solo tiene un ciclo real, así que el histórico saldría vacío. `database/seed_demo_historico.sql` crea dos ciclos anteriores marcados con "DEMO" (periodos académicos y de evaluación inactivos, los mismos 5 grupos de hoy y una evaluación completada por alumno demo y grupo, con promedios objetivo distintos por docente). **No crea inscripciones**: el dashboard del alumno, los avisos y el avance de coordinación no cambian. Todo va en una transacción. Se quita con `database/cleanup_demo_historico.sql` (también transaccional: borra por ids fijados al inicio, solo ciclos "DEMO" inactivos, y se detiene si alguien inscribió alumnos en esos grupos). **Orden:** correr este cleanup **antes** que `cleanup_demo_coordinacion.sql`, porque ese borra las evaluaciones de DEMO0002 a DEMO0005 en todos los ciclos y dejaría el histórico a medias. Los grupos demo se crean solo a partir de los grupos en que hay alumnos DEMO inscritos, así que los grupos reales no se tocan.

## 6. Pruebas

- 12 pruebas del servicio (`IndicadorService.test.ts`): ranking con el ciclo activo o uno indicado, promedio `null` y fuera del ranking, distribución, variación entre ciclos (saltando los que no tienen promedio), ciclo activo, `ultimos`, validación de parámetros, `404` y el caso del docente que solo ve lo suyo.
- 5 pruebas de permisos por ruta (`indicadores.routes.test.ts`): sin sesión 401; el docente solo entra a `/mio`; el alumno recibe 403 en todas; coordinador y administrador no entran a `/mio`; una cuenta con dos roles entra a las dos.
- `database/verificar_clasificacion.sql`: los 18 casos límite contra la base real.
- Verificado contra Supabase y en el navegador: ranking y histórico de los datos reales y demo, `403` para docente y alumno en las rutas de coordinación, `401` sin token, `404` y `400`, y un docente que abre la pantalla de coordinación es redirigido a su inicio.

## 7. Limitaciones

- Solo cuenta las preguntas de escala u opción (con `OpcionRespuestaId`); las abiertas y numéricas no entran al promedio.
- El ranking es institucional por ciclo; todavía no se filtra por carrera ni por facultad.
- **Privacidad pendiente de decidir:** un docente ve su promedio aunque tenga una sola evaluación completada, y mientras el ciclo sigue abierto; con las evaluaciones anónimas eso puede identificar a un alumno. Opciones: mostrar promedio y lugar solo con un mínimo de evaluaciones (por ejemplo 3 a 5) y/o hasta que cierre el ciclo.
- Las vistas calculan al consultar. Con el volumen del proyecto es instantáneo; con muchos miles de respuestas habría que revisar índices o materializarlas.
