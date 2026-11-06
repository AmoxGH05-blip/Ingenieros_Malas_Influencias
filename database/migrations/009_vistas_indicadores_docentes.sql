/* =====================================================================
   Migracion 009 - Indicadores docentes (SCRUM-46, RF07)
   Promedio, ranking y clasificacion por docente y periodo de evaluacion,
   calculados al vuelo desde las respuestas reales (nada que sincronizar).

   Reglas de calculo
   - Promedio = suma(Valor de la opcion elegida * PesoPonderacion de la pregunta)
                / suma(PesoPonderacion), sobre las preguntas de escala u opcion
                de las evaluaciones COMPLETADAS. El Valor va de 0 a 10.
   - Clasificacion (funcion F_EvaluacionDocente_Clasificar), sobre el promedio
     redondeado a 2 decimales:
         >= 9.00  Excelente      >= 8.00  Bueno
         >= 7.00  Suficiente      < 7.00  No suficiente
     Sin respuestas: NULL ("sin evaluaciones", no es 0).
   - Ranking por periodo, 1 = mejor promedio; empates comparten lugar (RANK).
     Se calcula sobre el promedio ya redondeado a 2 decimales, igual que la
     clasificacion. Los docentes sin respuestas no entran al ranking.

   Repetible: todo va en una transaccion y las vistas se recrean desde cero
   (DROP VIEW IF EXISTS, la dependiente primero), asi que se puede correr de
   nuevo aunque cambien las columnas. Las vistas y la funcion no se exponen a
   los roles de la Data API de Supabase (anon / authenticated): el backend se
   conecta con el rol duenio y es el unico que las lee.

   Reversa:
     DROP VIEW IF EXISTS "V_EvaluacionDocente_IndicadorDocente";
     DROP VIEW IF EXISTS "V_EvaluacionDocente_PromedioDocenteGrupo";
     DROP FUNCTION IF EXISTS "F_EvaluacionDocente_Clasificar"(NUMERIC);
   ===================================================================== */

BEGIN;

DROP VIEW IF EXISTS "V_EvaluacionDocente_IndicadorDocente";
DROP VIEW IF EXISTS "V_EvaluacionDocente_PromedioDocenteGrupo";

CREATE OR REPLACE FUNCTION "F_EvaluacionDocente_Clasificar"(promedio NUMERIC)
RETURNS VARCHAR
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT CASE
        WHEN promedio IS NULL            THEN NULL
        WHEN ROUND(promedio, 2) >= 9.00  THEN 'Excelente'
        WHEN ROUND(promedio, 2) >= 8.00  THEN 'Bueno'
        WHEN ROUND(promedio, 2) >= 7.00  THEN 'Suficiente'
        ELSE 'No suficiente'
    END
$$;

-- Una fila por grupo y periodo de evaluacion (los grupos sin respuestas salen con Promedio NULL).
-- SumaPonderada y SumaPesos se exponen para que el promedio del docente se agregue bien
-- (ponderado por respuestas, no un promedio de promedios).
CREATE VIEW "V_EvaluacionDocente_PromedioDocenteGrupo" AS
SELECT
    pev."Id"                                        AS "PeriodoEvaluacionId",
    g."Id"                                          AS "GrupoId",
    g."DocenteId"                                   AS "DocenteId",
    m."Id"                                          AS "MateriaId",
    m."Nombre"                                      AS "Materia",
    m."ProgramaEducativoId"                         AS "ProgramaEducativoId",
    g."Seccion"                                     AS "Seccion",
    COUNT(DISTINCT ev."Id")                         AS "EvaluacionesCompletadas",
    COUNT(o."Id")                                   AS "TotalRespuestas",
    COALESCE(SUM(o."Valor" * p."PesoPonderacion"), 0)::DECIMAL(12,4) AS "SumaPonderada",
    COALESCE(SUM(p."PesoPonderacion") FILTER (WHERE o."Id" IS NOT NULL), 0)::DECIMAL(12,4) AS "SumaPesos",
    ROUND(SUM(o."Valor" * p."PesoPonderacion") / NULLIF(SUM(p."PesoPonderacion") FILTER (WHERE o."Id" IS NOT NULL), 0), 2)::DECIMAL(5,2) AS "Promedio"
FROM "P_EvaluacionDocente_Grupo" g
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."PeriodoAcademicoId" = g."PeriodoAcademicoId"
JOIN "P_EvaluacionDocente_Materia" m ON m."Id" = g."MateriaId"
LEFT JOIN "P_EvaluacionDocente_Evaluacion" ev
       ON ev."GrupoId" = g."Id"
      AND ev."PeriodoEvaluacionId" = pev."Id"
      AND ev."Completada" = true
LEFT JOIN "P_EvaluacionDocente_RespuestaEvaluacion" r
       ON r."EvaluacionId" = ev."Id" AND r."OpcionRespuestaId" IS NOT NULL
LEFT JOIN "P_EvaluacionDocente_OpcionRespuesta" o
       ON o."Id" = r."OpcionRespuestaId" AND o."PreguntaId" = r."PreguntaId"
LEFT JOIN "P_EvaluacionDocente_Pregunta" p ON p."Id" = r."PreguntaId"
GROUP BY pev."Id", g."Id", g."DocenteId", m."Id", m."Nombre", m."ProgramaEducativoId", g."Seccion";

-- Una fila por docente y periodo de evaluacion: promedio, ranking y clasificacion.
-- PeriodoActivo permite distinguir el ciclo vigente de uno ya cerrado o aun por abrir.
CREATE VIEW "V_EvaluacionDocente_IndicadorDocente" AS
WITH base AS (
    SELECT
        pg."PeriodoEvaluacionId",
        pg."DocenteId",
        COUNT(*)                                        AS "Grupos",
        STRING_AGG(DISTINCT pg."Materia", ', ' ORDER BY pg."Materia") AS "Materias",
        SUM(pg."EvaluacionesCompletadas")               AS "Evaluaciones",
        SUM(pg."TotalRespuestas")                       AS "TotalRespuestas",
        ROUND(SUM(pg."SumaPonderada") / NULLIF(SUM(pg."SumaPesos"), 0), 2)::DECIMAL(5,2) AS "Promedio"
    FROM "V_EvaluacionDocente_PromedioDocenteGrupo" pg
    GROUP BY pg."PeriodoEvaluacionId", pg."DocenteId"
)
SELECT
    b."PeriodoEvaluacionId",
    pev."Nombre"                                        AS "PeriodoEvaluacion",
    pev."FechaInicio"                                   AS "PeriodoInicio",
    b."DocenteId",
    (d."ApellidoPaterno" || ', ' || d."Nombre")         AS "Docente",
    d."NumeroEmpleado"                                  AS "NumeroEmpleado",
    b."Grupos",
    b."Materias",
    b."Evaluaciones",
    b."TotalRespuestas",
    b."Promedio",
    "F_EvaluacionDocente_Clasificar"(b."Promedio")      AS "Clasificacion",
    CASE WHEN b."Promedio" IS NULL THEN NULL
         ELSE RANK() OVER (PARTITION BY b."PeriodoEvaluacionId" ORDER BY b."Promedio" DESC NULLS LAST) END AS "Ranking",
    COUNT(b."Promedio") OVER (PARTITION BY b."PeriodoEvaluacionId") AS "DocentesConPromedio",
    pev."Activo"                                        AS "PeriodoActivo"
FROM base b
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."Id" = b."PeriodoEvaluacionId"
JOIN "P_EvaluacionDocente_Docente" d ON d."Id" = b."DocenteId";

-- Solo el backend (rol duenio) lee estas vistas. Sin esto, la Data API de Supabase las expondria
-- con la clave publica "anon". Se omite si los roles no existen (por ejemplo, un PostgreSQL local).
REVOKE ALL ON FUNCTION "F_EvaluacionDocente_Clasificar"(NUMERIC) FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON "V_EvaluacionDocente_PromedioDocenteGrupo", "V_EvaluacionDocente_IndicadorDocente" FROM anon;
        REVOKE ALL ON FUNCTION "F_EvaluacionDocente_Clasificar"(NUMERIC) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON "V_EvaluacionDocente_PromedioDocenteGrupo", "V_EvaluacionDocente_IndicadorDocente" FROM authenticated;
        REVOKE ALL ON FUNCTION "F_EvaluacionDocente_Clasificar"(NUMERIC) FROM authenticated;
    END IF;
END
$$;

COMMIT;
