/* =====================================================================
   Alumnos demo con avances distintos, para probar el avance de
   coordinacion (SCRUM-39) y el dashboard de coordinacion (SCRUM-42).

   Requiere haber corrido antes database/seed_demo_asignaciones.sql
   (usa sus 5 grupos y el periodo de evaluacion activo).
   Con DEMO0001 (1 de 5) el resultado esperado es:
     DEMO0002 -> 5/5 concluido     DEMO0003 -> 2/5 parcial
     DEMO0004 -> 1/5 parcial       DEMO0005 -> 0/5 no iniciado
                                   (sin filas de Evaluacion, como un alumno que nunca entro)
   Contrasena de todos: Demo2026!   Para borrarlos: cleanup_demo_coordinacion.sql
   ===================================================================== */

INSERT INTO "P_EvaluacionDocente_Usuario" ("CorreoElectronico", "ContrasenaHash") VALUES
    ('demo2@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('demo3@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('demo4@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('demo5@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW');

INSERT INTO "P_EvaluacionDocente_UsuarioRol" ("UsuarioId", "RolId")
SELECT u."Id", r."Id"
FROM "P_EvaluacionDocente_Usuario" u, "P_EvaluacionDocente_Rol" r
WHERE u."CorreoElectronico" IN ('demo2@dygsis.local', 'demo3@dygsis.local', 'demo4@dygsis.local', 'demo5@dygsis.local')
  AND r."Nombre" = 'Estudiante';

INSERT INTO "P_EvaluacionDocente_Estudiante" ("UsuarioId", "ProgramaEducativoId", "Matricula", "Nombre", "ApellidoPaterno")
SELECT u."Id", pe."Id", d.matricula, d.nombre, d.apellido
FROM "P_EvaluacionDocente_Usuario" u
JOIN (VALUES
    ('demo2@dygsis.local', 'DEMO0002', 'Carla', 'Concluida'),
    ('demo3@dygsis.local', 'DEMO0003', 'Diego', 'Parcial'),
    ('demo4@dygsis.local', 'DEMO0004', 'Eva', 'Parcial'),
    ('demo5@dygsis.local', 'DEMO0005', 'Fabian', 'NoIniciado')
) AS d(correo, matricula, nombre, apellido) ON d.correo = u."CorreoElectronico"
CROSS JOIN "P_EvaluacionDocente_ProgramaEducativo" pe
WHERE pe."Nombre" = 'Ingenieria en Sistemas Computacionales';

INSERT INTO "P_EvaluacionDocente_Inscripcion" ("EstudianteId", "GrupoId", "FechaInscripcion")
SELECT e."Id", g."Id", CURRENT_DATE
FROM "P_EvaluacionDocente_Estudiante" e
CROSS JOIN "P_EvaluacionDocente_Grupo" g
WHERE e."Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004', 'DEMO0005');

-- Evaluaciones completadas: los primeros N grupos (por Id) de cada alumno.
INSERT INTO "P_EvaluacionDocente_Evaluacion" ("PeriodoEvaluacionId", "EstudianteId", "GrupoId", "FechaRespuesta", "Completada", "Anonima")
SELECT pe."Id", e."Id", g."Id", now() - (g.rn * interval '1 day'), true, true
FROM (VALUES ('DEMO0002', 5), ('DEMO0003', 2), ('DEMO0004', 1)) AS c(matricula, cuantas)
JOIN "P_EvaluacionDocente_Estudiante" e ON e."Matricula" = c.matricula
JOIN (SELECT "Id", row_number() OVER (ORDER BY "Id") AS rn FROM "P_EvaluacionDocente_Grupo") g ON g.rn <= c.cuantas
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."Activo" = true;

-- Respuestas de esas evaluaciones (opcion "De acuerdo" = 7.5) para que los datos sean coherentes
-- con los calculos de promedio de sprints posteriores.
INSERT INTO "P_EvaluacionDocente_RespuestaEvaluacion" ("EvaluacionId", "PreguntaId", "OpcionRespuestaId")
SELECT ev."Id", p."Id", o."Id"
FROM "P_EvaluacionDocente_Evaluacion" ev
JOIN "P_EvaluacionDocente_Estudiante" e ON e."Id" = ev."EstudianteId"
JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."Id" = ev."PeriodoEvaluacionId"
JOIN "P_EvaluacionDocente_SeccionInstrumento" s ON s."InstrumentoId" = pe."InstrumentoId"
JOIN "P_EvaluacionDocente_Pregunta" p ON p."SeccionInstrumentoId" = s."Id"
JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."PreguntaId" = p."Id" AND o."Valor" = 7.5
WHERE e."Matricula" IN ('DEMO0002', 'DEMO0003', 'DEMO0004');
