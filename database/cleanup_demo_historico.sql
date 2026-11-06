/* =====================================================================
   Borra los datos demo creados por seed_demo_historico.sql
   (ciclos "DEMO ...", sus grupos, evaluaciones y respuestas).

   - Todo ocurre en una transaccion: o se borra completo o no se toca nada.
   - Solo borra ciclos "DEMO ..." que estan INACTIVOS; los ids se fijan una
     vez al principio, no se vuelve a buscar por nombre.
   - Se detiene si alguien inscribio alumnos en un grupo demo: esas
     inscripciones no se borran solas, hay que quitarlas antes a mano.
   - Orden con los otros scripts demo: correr ESTE antes que
     cleanup_demo_coordinacion.sql (ese borra las evaluaciones de DEMO0002 a
     DEMO0005 en todos los ciclos y dejaria el historico a medias).
   ===================================================================== */

BEGIN;

CREATE TEMP TABLE _demo_academicos ON COMMIT DROP AS
SELECT "Id" FROM "P_EvaluacionDocente_PeriodoAcademico" WHERE "Nombre" LIKE 'DEMO %' AND "Activo" = false;

CREATE TEMP TABLE _demo_evaluacion ON COMMIT DROP AS
SELECT "Id" FROM "P_EvaluacionDocente_PeriodoEvaluacion"
WHERE "Nombre" LIKE 'DEMO %' AND "Activo" = false AND "PeriodoAcademicoId" IN (SELECT "Id" FROM _demo_academicos);

CREATE TEMP TABLE _demo_grupos ON COMMIT DROP AS
SELECT "Id" FROM "P_EvaluacionDocente_Grupo" WHERE "PeriodoAcademicoId" IN (SELECT "Id" FROM _demo_academicos);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "P_EvaluacionDocente_Inscripcion" WHERE "GrupoId" IN (SELECT "Id" FROM _demo_grupos)) THEN
        RAISE EXCEPTION 'Hay alumnos inscritos en grupos demo del historico; quita esas inscripciones antes de limpiar';
    END IF;
END
$$;

DELETE FROM "P_EvaluacionDocente_RespuestaEvaluacion"
WHERE "EvaluacionId" IN (
    SELECT "Id" FROM "P_EvaluacionDocente_Evaluacion" WHERE "PeriodoEvaluacionId" IN (SELECT "Id" FROM _demo_evaluacion)
);

DELETE FROM "P_EvaluacionDocente_Evaluacion" WHERE "PeriodoEvaluacionId" IN (SELECT "Id" FROM _demo_evaluacion);

DELETE FROM "P_EvaluacionDocente_Grupo" WHERE "Id" IN (SELECT "Id" FROM _demo_grupos);

DELETE FROM "P_EvaluacionDocente_PeriodoEvaluacion" WHERE "Id" IN (SELECT "Id" FROM _demo_evaluacion);

DELETE FROM "P_EvaluacionDocente_PeriodoAcademico" WHERE "Id" IN (SELECT "Id" FROM _demo_academicos);

COMMIT;
