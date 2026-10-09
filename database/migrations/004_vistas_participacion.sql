-- =====================================================================
-- Migracion 004 (PostgreSQL / Supabase): vistas agregadas de participacion
-- Jira: SCRUM-41. Insumo de SCRUM-55 (API de agregacion), SCRUM-57
-- (graficos institucionales) y SCRUM-63 (reporte PDF de participacion).
--
-- Participacion = porcentaje de INSCRIPCIONES (alumno en grupo) cuya
-- evaluacion ya fue enviada. Se parte de Inscripcion y no de Evaluacion
-- porque las filas de Evaluacion se crean cuando el alumno abre su
-- dashboard: quien nunca entro no tiene fila y quedaria fuera del conteo.
--
-- Solo crea vistas (no toca tablas ni datos) y es repetible gracias a
-- CREATE OR REPLACE. Reversa:
--   DROP VIEW "V_EvaluacionDocente_ParticipacionCiclo";
--   DROP VIEW "V_EvaluacionDocente_ParticipacionCarrera";
--   DROP VIEW "V_EvaluacionDocente_ParticipacionGrupo";
-- =====================================================================

-- Una fila por grupo y periodo de evaluacion (incluye grupos sin inscritos, con ceros).
CREATE OR REPLACE VIEW "V_EvaluacionDocente_ParticipacionGrupo" AS
SELECT
    pev."Id"                                        AS "PeriodoEvaluacionId",
    g."Id"                                          AS "GrupoId",
    m."Id"                                          AS "MateriaId",
    m."Nombre"                                      AS "Materia",
    m."ProgramaEducativoId"                         AS "ProgramaEducativoId",
    d."Id"                                          AS "DocenteId",
    (d."ApellidoPaterno" || ', ' || d."Nombre")     AS "Docente",
    g."Seccion"                                     AS "Seccion",
    COUNT(i."Id")                                   AS "Inscripciones",
    COUNT(ev."Id")                                  AS "Completadas",
    COUNT(i."Id") - COUNT(ev."Id")                  AS "Pendientes",
    COALESCE(ROUND(100.0 * COUNT(ev."Id") / NULLIF(COUNT(i."Id"), 0), 2), 0)::DECIMAL(5,2) AS "PorcentajeParticipacion"
FROM "P_EvaluacionDocente_Grupo" g
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."PeriodoAcademicoId" = g."PeriodoAcademicoId"
JOIN "P_EvaluacionDocente_Materia" m ON m."Id" = g."MateriaId"
JOIN "P_EvaluacionDocente_Docente" d ON d."Id" = g."DocenteId"
LEFT JOIN "P_EvaluacionDocente_Inscripcion" i ON i."GrupoId" = g."Id"
LEFT JOIN "P_EvaluacionDocente_Evaluacion" ev
       ON ev."EstudianteId" = i."EstudianteId"
      AND ev."GrupoId" = g."Id"
      AND ev."PeriodoEvaluacionId" = pev."Id"
      AND ev."Completada" = true
GROUP BY pev."Id", g."Id", m."Id", m."Nombre", m."ProgramaEducativoId", d."Id", d."ApellidoPaterno", d."Nombre", g."Seccion";

-- Una fila por carrera DEL ALUMNO y periodo de evaluacion.
CREATE OR REPLACE VIEW "V_EvaluacionDocente_ParticipacionCarrera" AS
SELECT
    pev."Id"                                        AS "PeriodoEvaluacionId",
    pe."Id"                                         AS "ProgramaEducativoId",
    pe."Nombre"                                     AS "ProgramaEducativo",
    COUNT(DISTINCT e."Id")                          AS "Alumnos",
    COUNT(DISTINCT e."Id") FILTER (WHERE ev."Id" IS NOT NULL) AS "AlumnosParticipantes",
    COUNT(i."Id")                                   AS "Inscripciones",
    COUNT(ev."Id")                                  AS "Completadas",
    COUNT(i."Id") - COUNT(ev."Id")                  AS "Pendientes",
    COALESCE(ROUND(100.0 * COUNT(ev."Id") / NULLIF(COUNT(i."Id"), 0), 2), 0)::DECIMAL(5,2) AS "PorcentajeParticipacion"
FROM "P_EvaluacionDocente_Estudiante" e
JOIN "P_EvaluacionDocente_ProgramaEducativo" pe ON pe."Id" = e."ProgramaEducativoId"
JOIN "P_EvaluacionDocente_Inscripcion" i ON i."EstudianteId" = e."Id"
JOIN "P_EvaluacionDocente_Grupo" g ON g."Id" = i."GrupoId"
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pev ON pev."PeriodoAcademicoId" = g."PeriodoAcademicoId"
LEFT JOIN "P_EvaluacionDocente_Evaluacion" ev
       ON ev."EstudianteId" = e."Id"
      AND ev."GrupoId" = g."Id"
      AND ev."PeriodoEvaluacionId" = pev."Id"
      AND ev."Completada" = true
GROUP BY pev."Id", pe."Id", pe."Nombre";

-- Una fila por periodo de evaluacion (ciclo): totales institucionales.
CREATE OR REPLACE VIEW "V_EvaluacionDocente_ParticipacionCiclo" AS
SELECT
    pev."Id"                                        AS "PeriodoEvaluacionId",
    pev."Nombre"                                    AS "PeriodoEvaluacion",
    COUNT(DISTINCT g."Id")                          AS "Grupos",
    COUNT(DISTINCT i."EstudianteId")                AS "Alumnos",
    COUNT(DISTINCT i."EstudianteId") FILTER (WHERE ev."Id" IS NOT NULL) AS "AlumnosParticipantes",
    COUNT(i."Id")                                   AS "Inscripciones",
    COUNT(ev."Id")                                  AS "Completadas",
    COUNT(i."Id") - COUNT(ev."Id")                  AS "Pendientes",
    COALESCE(ROUND(100.0 * COUNT(ev."Id") / NULLIF(COUNT(i."Id"), 0), 2), 0)::DECIMAL(5,2) AS "PorcentajeParticipacion"
FROM "P_EvaluacionDocente_PeriodoEvaluacion" pev
LEFT JOIN "P_EvaluacionDocente_Grupo" g ON g."PeriodoAcademicoId" = pev."PeriodoAcademicoId"
LEFT JOIN "P_EvaluacionDocente_Inscripcion" i ON i."GrupoId" = g."Id"
LEFT JOIN "P_EvaluacionDocente_Evaluacion" ev
       ON ev."EstudianteId" = i."EstudianteId"
      AND ev."GrupoId" = g."Id"
      AND ev."PeriodoEvaluacionId" = pev."Id"
      AND ev."Completada" = true
GROUP BY pev."Id", pev."Nombre";
