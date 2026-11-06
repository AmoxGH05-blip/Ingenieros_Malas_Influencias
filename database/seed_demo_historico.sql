/* =====================================================================
   Datos DEMO de dos ciclos anteriores, para ver el historico de
   indicadores docentes (SCRUM-47/48/49/50).

   Requiere seed_demo_asignaciones.sql y seed_demo_coordinacion.sql
   (usa los grupos del ciclo activo en los que estan inscritos los alumnos
   DEMO0001 a DEMO0005, con sus docentes; los grupos reales no se tocan).
   Todo va en una transaccion: si algo falla no queda nada a medias.

   Crea, marcados con "DEMO" en el nombre:
     - 2 periodos academicos y 2 periodos de evaluacion (inactivos)
     - los mismos 5 grupos de hoy, repetidos en cada ciclo
     - una evaluacion completada por alumno y grupo, con 15 respuestas
       cuyo promedio objetivo por docente cambia de un ciclo a otro
   NO crea inscripciones: el dashboard del alumno, los avisos y el avance
   de coordinacion (que parten de Inscripcion) no cambian.

   Promedios objetivo (por orden de Id del docente) en el ciclo 1 / ciclo 2:
     docente 1: 7.6 / 8.2    docente 2: 9.4 / 9.1    docente 3: 6.5 / 7.2
     docente 4: 8.6 / 8.3    docente 5: 7.4 / 6.9
   (los reales salen con algo de variacion: cada respuesta es 0, 2.5, 5, 7.5 o 10)

   Se puede correr una sola vez; para quitarlo: cleanup_demo_historico.sql
   (correrlo ANTES que cleanup_demo_coordinacion.sql).
   ===================================================================== */

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "P_EvaluacionDocente_PeriodoAcademico" WHERE "Nombre" LIKE 'DEMO %') THEN
        RAISE EXCEPTION 'Los datos demo del historico ya existen; corre cleanup_demo_historico.sql primero';
    END IF;
END
$$;

INSERT INTO "P_EvaluacionDocente_PeriodoAcademico" ("Nombre", "FechaInicio", "FechaFin", "Activo") VALUES
    ('DEMO 2025-2026 Semestre 1', '2025-08-18', '2025-12-12', false),
    ('DEMO 2025-2026 Semestre 2', '2026-01-19', '2026-06-12', false);

INSERT INTO "P_EvaluacionDocente_PeriodoEvaluacion" ("PeriodoAcademicoId", "InstrumentoId", "Nombre", "FechaInicio", "FechaFin", "Activo")
SELECT pa."Id",
       (SELECT "InstrumentoId" FROM "P_EvaluacionDocente_PeriodoEvaluacion" WHERE "Activo" = true ORDER BY "Id" DESC LIMIT 1),
       'DEMO Evaluacion Docente ' || replace(pa."Nombre", 'DEMO ', ''),
       CASE pa."Nombre" WHEN 'DEMO 2025-2026 Semestre 1' THEN timestamptz '2025-11-17 08:00-06'
                        ELSE timestamptz '2026-05-18 08:00-06' END,
       CASE pa."Nombre" WHEN 'DEMO 2025-2026 Semestre 1' THEN timestamptz '2025-12-05 23:59-06'
                        ELSE timestamptz '2026-06-05 23:59-06' END,
       false
FROM "P_EvaluacionDocente_PeriodoAcademico" pa
WHERE pa."Nombre" LIKE 'DEMO %';

-- Los grupos demo de hoy (los que tienen inscritos alumnos DEMO), con su materia, docente y seccion, en cada ciclo demo.
INSERT INTO "P_EvaluacionDocente_Grupo" ("MateriaId", "DocenteId", "PeriodoAcademicoId", "Seccion", "CupoMaximo")
SELECT g."MateriaId", g."DocenteId", pa."Id", g."Seccion", g."CupoMaximo"
FROM "P_EvaluacionDocente_Grupo" g
CROSS JOIN "P_EvaluacionDocente_PeriodoAcademico" pa
WHERE pa."Nombre" LIKE 'DEMO %'
  AND g."PeriodoAcademicoId" = (SELECT "PeriodoAcademicoId" FROM "P_EvaluacionDocente_PeriodoEvaluacion" WHERE "Activo" = true ORDER BY "Id" DESC LIMIT 1)
  AND EXISTS (
      SELECT 1 FROM "P_EvaluacionDocente_Inscripcion" i
      JOIN "P_EvaluacionDocente_Estudiante" e ON e."Id" = i."EstudianteId"
      WHERE i."GrupoId" = g."Id" AND e."Matricula" LIKE 'DEMO%'
  );

-- Una evaluacion completada por alumno demo y grupo, en cada ciclo demo.
INSERT INTO "P_EvaluacionDocente_Evaluacion" ("PeriodoEvaluacionId", "EstudianteId", "GrupoId", "FechaRespuesta", "Completada", "Anonima")
SELECT pev."Id", e."Id", g."Id", pev."FechaInicio" + ((e."Id" + g."Id") % 10) * interval '1 day', true, true
FROM "P_EvaluacionDocente_PeriodoEvaluacion" pev
JOIN "P_EvaluacionDocente_Grupo" g ON g."PeriodoAcademicoId" = pev."PeriodoAcademicoId"
CROSS JOIN "P_EvaluacionDocente_Estudiante" e
WHERE pev."Nombre" LIKE 'DEMO %' AND e."Matricula" LIKE 'DEMO%';

-- Respuestas: por pregunta se elige la opcion de la escala (0, 2.5, 5, 7.5, 10) al azar pero repetible,
-- de modo que el promedio esperado sea el objetivo del docente (si el objetivo cae entre dos opciones,
-- la de arriba sale con probabilidad proporcional a lo cerca que esta).
INSERT INTO "P_EvaluacionDocente_RespuestaEvaluacion" ("EvaluacionId", "PreguntaId", "OpcionRespuestaId")
SELECT x."EvaluacionId", x."PreguntaId", o."Id"
FROM (
    SELECT ev."Id" AS "EvaluacionId",
           p."Id"  AS "PreguntaId",
           FLOOR(t.objetivo / 2.5) * 2.5 + CASE WHEN t.u < (t.objetivo - FLOOR(t.objetivo / 2.5) * 2.5) / 2.5 THEN 2.5 ELSE 0 END AS valor
    FROM "P_EvaluacionDocente_Evaluacion" ev
    JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."Id" = ev."PeriodoEvaluacionId"
    JOIN "P_EvaluacionDocente_Grupo" g ON g."Id" = ev."GrupoId"
    JOIN (SELECT DISTINCT "DocenteId", dense_rank() OVER (ORDER BY "DocenteId") AS pos
          FROM "P_EvaluacionDocente_Grupo" WHERE "PeriodoAcademicoId" IN (
              SELECT "Id" FROM "P_EvaluacionDocente_PeriodoAcademico" WHERE "Nombre" LIKE 'DEMO %')) dpos ON dpos."DocenteId" = g."DocenteId"
    JOIN "P_EvaluacionDocente_SeccionInstrumento" s ON s."InstrumentoId" = pev."InstrumentoId"
    JOIN "P_EvaluacionDocente_Pregunta" p ON p."SeccionInstrumentoId" = s."Id"
    CROSS JOIN LATERAL (
        SELECT (CASE dpos.pos
                    WHEN 1 THEN CASE pev."Nombre" WHEN 'DEMO Evaluacion Docente 2025-2026 Semestre 1' THEN 7.6 ELSE 8.2 END
                    WHEN 2 THEN CASE pev."Nombre" WHEN 'DEMO Evaluacion Docente 2025-2026 Semestre 1' THEN 9.4 ELSE 9.1 END
                    WHEN 3 THEN CASE pev."Nombre" WHEN 'DEMO Evaluacion Docente 2025-2026 Semestre 1' THEN 6.5 ELSE 7.2 END
                    WHEN 4 THEN CASE pev."Nombre" WHEN 'DEMO Evaluacion Docente 2025-2026 Semestre 1' THEN 8.6 ELSE 8.3 END
                    ELSE        CASE pev."Nombre" WHEN 'DEMO Evaluacion Docente 2025-2026 Semestre 1' THEN 7.4 ELSE 6.9 END
                END)::numeric AS objetivo,
               ((('x' || substr(md5(ev."Id"::text || '-' || p."Id"::text), 1, 8))::bit(32)::bigint % 10000) / 10000.0) AS u
    ) t
    WHERE pev."Nombre" LIKE 'DEMO %'
) x
JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."PreguntaId" = x."PreguntaId" AND o."Valor" = x.valor;

-- Comprobacion: cada evaluacion demo debe tener una respuesta por pregunta del instrumento
-- (si a una pregunta le faltara una opcion de la escala, el JOIN la omitiria sin error).
DO $$
DECLARE
    esperadas INTEGER;
    insertadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO esperadas
    FROM "P_EvaluacionDocente_Evaluacion" ev
    JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."Id" = ev."PeriodoEvaluacionId"
    JOIN "P_EvaluacionDocente_SeccionInstrumento" s ON s."InstrumentoId" = pev."InstrumentoId"
    JOIN "P_EvaluacionDocente_Pregunta" p ON p."SeccionInstrumentoId" = s."Id"
    WHERE pev."Nombre" LIKE 'DEMO %';

    SELECT COUNT(*) INTO insertadas
    FROM "P_EvaluacionDocente_RespuestaEvaluacion" r
    JOIN "P_EvaluacionDocente_Evaluacion" ev ON ev."Id" = r."EvaluacionId"
    JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."Id" = ev."PeriodoEvaluacionId"
    WHERE pev."Nombre" LIKE 'DEMO %';

    IF esperadas = 0 OR esperadas <> insertadas THEN
        RAISE EXCEPTION 'Datos demo incompletos: % respuestas esperadas, % creadas', esperadas, insertadas;
    END IF;
END
$$;

COMMIT;
