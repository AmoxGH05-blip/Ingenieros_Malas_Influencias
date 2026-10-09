/* Borra los alumnos demo de seed_demo_coordinacion.sql (DEMO0002 a DEMO0005) y todo lo que cuelga de ellos. */

DELETE FROM "P_EvaluacionDocente_RespuestaEvaluacion"
WHERE "EvaluacionId" IN (
    SELECT ev."Id" FROM "P_EvaluacionDocente_Evaluacion" ev
    JOIN "P_EvaluacionDocente_Estudiante" e ON e."Id" = ev."EstudianteId"
    WHERE e."Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005'));

DELETE FROM "P_EvaluacionDocente_Evaluacion"
WHERE "EstudianteId" IN (SELECT "Id" FROM "P_EvaluacionDocente_Estudiante" WHERE "Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005'));

DELETE FROM "P_EvaluacionDocente_Inscripcion"
WHERE "EstudianteId" IN (SELECT "Id" FROM "P_EvaluacionDocente_Estudiante" WHERE "Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005'));

DELETE FROM "P_EvaluacionDocente_Sesion"
WHERE "UsuarioId" IN (SELECT "UsuarioId" FROM "P_EvaluacionDocente_Estudiante" WHERE "Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005'));

DELETE FROM "P_EvaluacionDocente_UsuarioRol"
WHERE "UsuarioId" IN (SELECT "UsuarioId" FROM "P_EvaluacionDocente_Estudiante" WHERE "Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005'));

DELETE FROM "P_EvaluacionDocente_Estudiante" WHERE "Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005');

DELETE FROM "P_EvaluacionDocente_Usuario"
WHERE "CorreoElectronico" IN ('demo2@dygsis.local', 'demo3@dygsis.local', 'demo4@dygsis.local', 'demo5@dygsis.local');
