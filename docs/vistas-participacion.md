# Vistas de participación (SCRUM-41)

Tres vistas de PostgreSQL (Supabase) que calculan **qué porcentaje de las evaluaciones debidas ya se envió**, por grupo, por carrera y por ciclo. No tocan tablas ni datos. Son el insumo de la API de agregación (SCRUM-55), los gráficos institucionales (SCRUM-57) y el reporte PDF (SCRUM-63).

- Script: [`database/migrations/004_vistas_participacion.sql`](../database/migrations/004_vistas_participacion.sql) (también en la sección 11 de `database/postgres_schema.sql`).
- Es repetible (`CREATE OR REPLACE VIEW`). Reversa: los tres `DROP VIEW` están en el encabezado del script.

## Qué significa "participación"

Participación = `Completadas / Inscripciones × 100`.

- **Inscripción** = un alumno inscrito en un grupo. Es una evaluación que el alumno *debe* enviar.
- **Completada** = existe su `Evaluacion` con `Completada = true` para ese grupo y ese periodo de evaluación.

Las vistas parten de `Inscripcion`, no de `Evaluacion`: las filas de `Evaluacion` se crean cuando el alumno abre su dashboard, así que quien nunca entró no tiene fila y quedaría fuera del conteo.

Un grupo sin inscritos devuelve 0 % (no hay división entre cero).

## Columnas

| Vista | Una fila por | Columnas propias |
|---|---|---|
| `V_EvaluacionDocente_ParticipacionGrupo` | grupo × periodo de evaluación | `GrupoId`, `MateriaId`, `Materia`, `ProgramaEducativoId`, `DocenteId`, `Docente`, `Seccion` |
| `V_EvaluacionDocente_ParticipacionCarrera` | carrera **del alumno** × periodo | `ProgramaEducativoId`, `ProgramaEducativo`, `Alumnos`, `AlumnosParticipantes` |
| `V_EvaluacionDocente_ParticipacionCiclo` | periodo de evaluación | `PeriodoEvaluacion`, `Grupos`, `Alumnos`, `AlumnosParticipantes` |

Todas incluyen `PeriodoEvaluacionId`, `Inscripciones`, `Completadas`, `Pendientes` y `PorcentajeParticipacion` (0–100, 2 decimales).

`AlumnosParticipantes` = alumnos con al menos una evaluación enviada (coincide con "concluidos + parciales" del dashboard de coordinación).

Nota: la vista de carrera agrupa por la carrera del *alumno*; la de grupo expone la carrera de la *materia*. Pueden diferir si un alumno cursa materias de otra carrera.

## Consultas de ejemplo

```sql
-- Ciclo: totales institucionales del periodo
SELECT "PeriodoEvaluacion", "Grupos", "Alumnos", "AlumnosParticipantes",
       "Inscripciones", "Completadas", "Pendientes", "PorcentajeParticipacion"
FROM "V_EvaluacionDocente_ParticipacionCiclo";

-- Carrera: ranking de participación
SELECT "ProgramaEducativo", "Inscripciones", "Completadas", "PorcentajeParticipacion"
FROM "V_EvaluacionDocente_ParticipacionCarrera"
ORDER BY "PorcentajeParticipacion" DESC;

-- Grupo: los que menos han participado de un periodo
SELECT "Materia", "Docente", "Seccion", "Inscripciones", "Completadas", "PorcentajeParticipacion"
FROM "V_EvaluacionDocente_ParticipacionGrupo"
WHERE "PeriodoEvaluacionId" = 1
ORDER BY "PorcentajeParticipacion" ASC;
```

Los identificadores van entre comillas dobles y con la mayúscula exacta (regla de PostgreSQL).

## Cómo verificar

1. Aplicar el script en Supabase (SQL Editor, o `psql -f database/migrations/004_vistas_participacion.sql`).
2. Con los datos demo (`seed_demo_coordinacion.sql`) la vista de ciclo debe dar 5 alumnos, 4 participantes, 25 inscripciones, 9 completadas, 16 pendientes y 36.00 %.
3. Contraste independiente: `SELECT COUNT(*) FROM "P_EvaluacionDocente_Evaluacion" WHERE "Completada" = true;` debe coincidir con `Completadas`.
4. Los alumnos participantes deben coincidir con `concluidos + parciales` de `GET /api/coordinacion/avance`.
