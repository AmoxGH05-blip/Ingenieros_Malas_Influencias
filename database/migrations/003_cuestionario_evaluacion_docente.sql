/* =====================================================================
   SUPERADO (18-sep-2026): incorporado a database/postgres_schema.sql tras
   la migracion de Azure SQL Server a Supabase (PostgreSQL). Se conserva
   solo como referencia historica.
   =====================================================================

   Sistema de Informacion de Evaluacion Docente Institucional Adaptable
   Migracion 003: cuestionario oficial de evaluacion docente (borrador)
   Jira: SCRUM-32

   Las tablas y relaciones ya existian desde la migracion 001 (modelo
   adaptable InstrumentoEvaluacion -> SeccionInstrumento -> Pregunta ->
   OpcionRespuesta). Esta migracion es DATOS, no esquema: siembra el
   instrumento real de 15 preguntas con la escala oficial 0/2.5/5/7.5/10.

   Es un BORRADOR estandar (dominio del tema, metodologia, puntualidad,
   trato) - reemplazar con el cuestionario oficial de la institucion si
   ya existe uno aprobado. Editable despues sin tocar el esquema: basta
   con actualizar/insertar filas en Pregunta/OpcionRespuesta.

   Requiere un Usuario existente como CreadoPorUsuarioId. Se crea aqui
   una cuenta de Coordinador (coordinacion@dygsis.local / Demo2026!)
   para ese fin, y para que el equipo pueda probar el rol Coordinador.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Usuario Coordinador (dueno del instrumento + cuenta de prueba)
   --------------------------------------------------------------------- */

INSERT INTO dbo.P_EvaluacionDocente_Usuario (CorreoElectronico, ContrasenaHash)
VALUES (N'coordinacion@dygsis.local', N'$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'); -- Demo2026!
GO

DECLARE @CoordinadorUsuarioId INT = (
    SELECT Id FROM dbo.P_EvaluacionDocente_Usuario WHERE CorreoElectronico = N'coordinacion@dygsis.local'
);

INSERT INTO dbo.P_EvaluacionDocente_UsuarioRol (UsuarioId, RolId)
SELECT @CoordinadorUsuarioId, Id FROM dbo.P_EvaluacionDocente_Rol WHERE Nombre = N'Coordinador';
GO

/* ---------------------------------------------------------------------
   2. Instrumento de evaluacion
   --------------------------------------------------------------------- */

DECLARE @CoordinadorUsuarioId2 INT = (
    SELECT Id FROM dbo.P_EvaluacionDocente_Usuario WHERE CorreoElectronico = N'coordinacion@dygsis.local'
);

INSERT INTO dbo.P_EvaluacionDocente_InstrumentoEvaluacion (CreadoPorUsuarioId, Nombre, TipoEvaluado, Version, Activo)
VALUES (@CoordinadorUsuarioId2, N'Evaluacion Docente 2026 (borrador estandar)', N'Docente', 1, 1);
GO

/* ---------------------------------------------------------------------
   3. Secciones
   --------------------------------------------------------------------- */

DECLARE @InstrumentoId INT = (
    SELECT TOP 1 Id FROM dbo.P_EvaluacionDocente_InstrumentoEvaluacion
    WHERE Nombre = N'Evaluacion Docente 2026 (borrador estandar)'
    ORDER BY Id DESC
);

INSERT INTO dbo.P_EvaluacionDocente_SeccionInstrumento (InstrumentoId, Nombre, Orden) VALUES
    (@InstrumentoId, N'Dominio y organizacion de la materia', 1),
    (@InstrumentoId, N'Metodologia y evaluacion', 2),
    (@InstrumentoId, N'Puntualidad y responsabilidad', 3),
    (@InstrumentoId, N'Trato y comunicacion', 4);
GO

/* ---------------------------------------------------------------------
   4. Preguntas (15) - todas EscalaLikert, escala oficial 0/2.5/5/7.5/10
   --------------------------------------------------------------------- */

DECLARE @TipoLikertId INT = (SELECT Id FROM dbo.P_EvaluacionDocente_TipoPregunta WHERE Nombre = N'EscalaLikert');

DECLARE @Seccion1 INT = (SELECT Id FROM dbo.P_EvaluacionDocente_SeccionInstrumento WHERE Nombre = N'Dominio y organizacion de la materia');
DECLARE @Seccion2 INT = (SELECT Id FROM dbo.P_EvaluacionDocente_SeccionInstrumento WHERE Nombre = N'Metodologia y evaluacion');
DECLARE @Seccion3 INT = (SELECT Id FROM dbo.P_EvaluacionDocente_SeccionInstrumento WHERE Nombre = N'Puntualidad y responsabilidad');
DECLARE @Seccion4 INT = (SELECT Id FROM dbo.P_EvaluacionDocente_SeccionInstrumento WHERE Nombre = N'Trato y comunicacion');

INSERT INTO dbo.P_EvaluacionDocente_Pregunta (SeccionInstrumentoId, TipoPreguntaId, Texto, Orden) VALUES
    (@Seccion1, @TipoLikertId, N'El docente domina los temas que imparte.', 1),
    (@Seccion1, @TipoLikertId, N'El docente explica los temas con claridad.', 2),
    (@Seccion1, @TipoLikertId, N'El docente relaciona la teoria con ejemplos practicos.', 3),
    (@Seccion1, @TipoLikertId, N'El docente cumple con el temario y los objetivos del curso.', 4),
    (@Seccion2, @TipoLikertId, N'El docente utiliza materiales y recursos didacticos adecuados.', 1),
    (@Seccion2, @TipoLikertId, N'Las actividades y tareas asignadas contribuyen a mi aprendizaje.', 2),
    (@Seccion2, @TipoLikertId, N'Los criterios de evaluacion fueron claros desde el inicio del curso.', 3),
    (@Seccion2, @TipoLikertId, N'La forma de evaluar (examenes, tareas, proyectos) fue justa.', 4),
    (@Seccion3, @TipoLikertId, N'El docente es puntual al iniciar y terminar la clase.', 1),
    (@Seccion3, @TipoLikertId, N'El docente asiste regularmente a sus clases.', 2),
    (@Seccion3, @TipoLikertId, N'El docente entrega calificaciones y retroalimentacion en tiempo razonable.', 3),
    (@Seccion4, @TipoLikertId, N'El docente muestra respeto hacia los estudiantes.', 1),
    (@Seccion4, @TipoLikertId, N'El docente fomenta la participacion en clase.', 2),
    (@Seccion4, @TipoLikertId, N'El docente esta disponible para resolver dudas fuera de clase.', 3),
    (@Seccion4, @TipoLikertId, N'En general, recomendaria a este docente a otros estudiantes.', 4);
GO

/* ---------------------------------------------------------------------
   5. Opciones de respuesta (5 por pregunta, escala oficial 0/2.5/5/7.5/10)
   --------------------------------------------------------------------- */

INSERT INTO dbo.P_EvaluacionDocente_OpcionRespuesta (PreguntaId, Texto, Valor, Orden)
SELECT p.Id, escala.Texto, escala.Valor, escala.Orden
FROM dbo.P_EvaluacionDocente_Pregunta p
CROSS JOIN (VALUES
    (N'Totalmente en desacuerdo', 0.00, 1),
    (N'En desacuerdo', 2.50, 2),
    (N'Neutral', 5.00, 3),
    (N'De acuerdo', 7.50, 4),
    (N'Totalmente de acuerdo', 10.00, 5)
) AS escala(Texto, Valor, Orden)
WHERE p.SeccionInstrumentoId IN (
    SELECT Id FROM dbo.P_EvaluacionDocente_SeccionInstrumento
    WHERE InstrumentoId = (
        SELECT TOP 1 Id FROM dbo.P_EvaluacionDocente_InstrumentoEvaluacion
        WHERE Nombre = N'Evaluacion Docente 2026 (borrador estandar)'
        ORDER BY Id DESC
    )
);
GO
