/* =====================================================================
   Datos de demo para probar el flujo de evaluacion del alumno (SCRUM-33/34)
   con la cuenta DEMO0001 / Demo2026!.

   Crea: periodo academico + periodo de evaluacion activo, 5 docentes,
   5 materias, 5 grupos (seccion '3A'), e inscribe al estudiante demo
   en los 5. Pensado para correr UNA VEZ sobre una base ya inicializada
   con database/postgres_schema.sql.
   ===================================================================== */

INSERT INTO "P_EvaluacionDocente_PeriodoAcademico" ("Nombre", "FechaInicio", "FechaFin", "Activo")
VALUES ('2026-2027 Semestre 1', '2026-08-21', '2026-12-18', true);

INSERT INTO "P_EvaluacionDocente_PeriodoEvaluacion" ("PeriodoAcademicoId", "InstrumentoId", "Nombre", "FechaInicio", "FechaFin", "Activo")
SELECT pa."Id", i."Id", 'Evaluacion Docente 2026-2027-1', '2026-09-01T00:00:00Z', '2026-12-18T23:59:59Z', true
FROM "P_EvaluacionDocente_PeriodoAcademico" pa, "P_EvaluacionDocente_InstrumentoEvaluacion" i
WHERE pa."Nombre" = '2026-2027 Semestre 1'
  AND i."Nombre" = 'Evaluacion Docente 2026 (borrador estandar)';

-- 5 docentes (usuarios propios, sin login funcional todavia -- solo para el catalogo)
INSERT INTO "P_EvaluacionDocente_Usuario" ("CorreoElectronico", "ContrasenaHash") VALUES
    ('docente1@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('docente2@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('docente3@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('docente4@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'),
    ('docente5@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW');

INSERT INTO "P_EvaluacionDocente_UsuarioRol" ("UsuarioId", "RolId")
SELECT u."Id", r."Id"
FROM "P_EvaluacionDocente_Usuario" u, "P_EvaluacionDocente_Rol" r
WHERE u."CorreoElectronico" IN ('docente1@dygsis.local','docente2@dygsis.local','docente3@dygsis.local','docente4@dygsis.local','docente5@dygsis.local')
  AND r."Nombre" = 'Docente';

INSERT INTO "P_EvaluacionDocente_Docente" ("UsuarioId", "FacultadId", "NumeroEmpleado", "Nombre", "ApellidoPaterno", "ApellidoMaterno")
SELECT u."Id", f."Id", datos.numEmpleado, datos.nombre, datos.apPaterno, datos.apMaterno
FROM "P_EvaluacionDocente_Usuario" u
JOIN "P_EvaluacionDocente_Facultad" f ON f."Nombre" = 'Facultad de Ingenieria'
JOIN (VALUES
    ('docente1@dygsis.local', 'EMP0001', 'Ana', 'García', 'López'),
    ('docente2@dygsis.local', 'EMP0002', 'Beatriz', 'Ramírez', 'Soto'),
    ('docente3@dygsis.local', 'EMP0003', 'Luis', 'Hernández', 'Cruz'),
    ('docente4@dygsis.local', 'EMP0004', 'Carlos', 'Martínez', 'Vega'),
    ('docente5@dygsis.local', 'EMP0005', 'Elena', 'Torres', 'Núñez')
) AS datos(correo, numEmpleado, nombre, apPaterno, apMaterno) ON datos.correo = u."CorreoElectronico";

INSERT INTO "P_EvaluacionDocente_Materia" ("ProgramaEducativoId", "Clave", "Nombre", "Creditos")
SELECT pe."Id", datos.clave, datos.nombre, 8
FROM "P_EvaluacionDocente_ProgramaEducativo" pe
JOIN (VALUES
    ('BD301', 'Base de Datos'),
    ('RC302', 'Redes de Computadoras'),
    ('IS303', 'Ingeniería de Software'),
    ('SO304', 'Sistemas Operativos'),
    ('CV305', 'Cálculo Vectorial')
) AS datos(clave, nombre) ON true
WHERE pe."Nombre" = 'Ingenieria en Sistemas Computacionales';

INSERT INTO "P_EvaluacionDocente_Grupo" ("MateriaId", "DocenteId", "PeriodoAcademicoId", "Seccion", "CupoMaximo")
SELECT m."Id", d."Id", pa."Id", '3A', 30
FROM "P_EvaluacionDocente_Materia" m
JOIN (VALUES
    ('BD301', 'EMP0001'),
    ('RC302', 'EMP0002'),
    ('IS303', 'EMP0003'),
    ('SO304', 'EMP0004'),
    ('CV305', 'EMP0005')
) AS pares(claveMateria, numEmpleado) ON pares.claveMateria = m."Clave"
JOIN "P_EvaluacionDocente_Docente" d ON d."NumeroEmpleado" = pares.numEmpleado
JOIN "P_EvaluacionDocente_PeriodoAcademico" pa ON pa."Nombre" = '2026-2027 Semestre 1';

INSERT INTO "P_EvaluacionDocente_Inscripcion" ("EstudianteId", "GrupoId", "FechaInscripcion")
SELECT e."Id", g."Id", CURRENT_DATE
FROM "P_EvaluacionDocente_Estudiante" e
JOIN "P_EvaluacionDocente_Usuario" u ON u."Id" = e."UsuarioId"
CROSS JOIN "P_EvaluacionDocente_Grupo" g
WHERE u."CorreoElectronico" = 'demo@dygsis.local';
