/* =====================================================================
   Sistema de Informacion de Evaluacion Docente Institucional Adaptable
   Modelo fisico - PostgreSQL (Supabase, proyecto propio)
   Equipo: Ingenieros Malas Influencias

   Reemplaza a database/evaluacion_docente_schema.sql + migrations/002 y
   003 (que documentan el modelo original en Microsoft SQL Server / Azure,
   dado de baja por costo). Este archivo consolida TODO el esquema y los
   datos semilla en un solo script, listo para pegar en el SQL Editor de
   Supabase (o correr con psql) sobre un proyecto nuevo y vacio.

   Convenciones (se mantienen igual que en la version SQL Server):
   - Todas las tablas van prefijadas con P_EvaluacionDocente_.
   - Constraints en minusculas: pk_<Tabla>, fk_<Tabla>_<TablaReferenciada>,
     uq_<Tabla>_<Campo(s)>, ck_<Tabla>_<Regla>, ix_<Tabla>_<Campo>.
   - Claves primarias: INTEGER GENERATED ALWAYS AS IDENTITY.
   - VARCHAR para texto; VARCHAR sin longitud (equivalente a NVARCHAR(MAX))
     solo para respuestas abiertas. DECIMAL(5,2) para promedios/pesos.
     TIMESTAMPTZ para timestamps.
   - Sin ON DELETE CASCADE; los borrados se manejan logicamente con
     columnas Activo/Completada.

   IMPORTANTE: todos los identificadores (tablas, columnas) van entre
   comillas dobles con el mismo mayusculas/minusculas que usan las
   entidades de TypeORM (backend/src/entities). PostgreSQL vuelve
   minusculas cualquier identificador SIN comillas, y TypeORM siempre
   genera SQL con los nombres exactos entrecomillados - si aqui se
   crean sin comillas, el backend no va a encontrar las tablas/columnas.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Estructura academica
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_Facultad" (
    "Id"        INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "Nombre"    VARCHAR(150)    NOT NULL,
    "Siglas"    VARCHAR(20)     NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_Facultad" PRIMARY KEY ("Id")
);

CREATE TABLE "P_EvaluacionDocente_ProgramaEducativo" (
    "Id"                INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "FacultadId"        INTEGER         NOT NULL,
    "Nombre"            VARCHAR(150)    NOT NULL,
    "NivelEducativo"    VARCHAR(50)     NOT NULL, -- Licenciatura, Posgrado, etc.
    CONSTRAINT "pk_P_EvaluacionDocente_ProgramaEducativo" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_ProgramaEducativo_Facultad" FOREIGN KEY ("FacultadId")
        REFERENCES "P_EvaluacionDocente_Facultad" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_ProgramaEducativo_FacultadId" ON "P_EvaluacionDocente_ProgramaEducativo" ("FacultadId");

CREATE TABLE "P_EvaluacionDocente_Materia" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "ProgramaEducativoId"   INTEGER         NOT NULL,
    "Clave"                 VARCHAR(20)     NOT NULL,
    "Nombre"                VARCHAR(150)    NOT NULL,
    "Creditos"              SMALLINT        NOT NULL DEFAULT 0,
    CONSTRAINT "pk_P_EvaluacionDocente_Materia" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Materia_Clave" UNIQUE ("Clave"),
    CONSTRAINT "fk_P_EvaluacionDocente_Materia_ProgramaEducativo" FOREIGN KEY ("ProgramaEducativoId")
        REFERENCES "P_EvaluacionDocente_ProgramaEducativo" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Materia_ProgramaEducativoId" ON "P_EvaluacionDocente_Materia" ("ProgramaEducativoId");

CREATE TABLE "P_EvaluacionDocente_PeriodoAcademico" (
    "Id"            INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "Nombre"        VARCHAR(50)     NOT NULL,   -- ej. '2026-2027 Semestre 1'
    "FechaInicio"   DATE            NOT NULL,
    "FechaFin"      DATE            NOT NULL,
    "Activo"        BOOLEAN         NOT NULL DEFAULT true,
    CONSTRAINT "pk_P_EvaluacionDocente_PeriodoAcademico" PRIMARY KEY ("Id"),
    CONSTRAINT "ck_P_EvaluacionDocente_PeriodoAcademico_Fechas" CHECK ("FechaFin" > "FechaInicio")
);

/* ---------------------------------------------------------------------
   2. Usuarios, roles, docentes y estudiantes
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_Usuario" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "CorreoElectronico"     VARCHAR(150)    NOT NULL,
    "ContrasenaHash"        VARCHAR(256)    NOT NULL,
    "Activo"                BOOLEAN         NOT NULL DEFAULT true,
    "FechaCreacion"         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_Usuario" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Usuario_Correo" UNIQUE ("CorreoElectronico")
);

CREATE TABLE "P_EvaluacionDocente_Rol" (
    "Id"        INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "Nombre"    VARCHAR(50)     NOT NULL, -- Administrador, Coordinador, Docente, Estudiante
    CONSTRAINT "pk_P_EvaluacionDocente_Rol" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Rol_Nombre" UNIQUE ("Nombre")
);

CREATE TABLE "P_EvaluacionDocente_UsuarioRol" (
    "UsuarioId" INTEGER NOT NULL,
    "RolId"     INTEGER NOT NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_UsuarioRol" PRIMARY KEY ("UsuarioId", "RolId"),
    CONSTRAINT "fk_P_EvaluacionDocente_UsuarioRol_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_UsuarioRol_Rol" FOREIGN KEY ("RolId")
        REFERENCES "P_EvaluacionDocente_Rol" ("Id")
);

CREATE TABLE "P_EvaluacionDocente_Docente" (
    "Id"                INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "UsuarioId"         INTEGER         NOT NULL,
    "FacultadId"        INTEGER         NOT NULL,
    "NumeroEmpleado"    VARCHAR(20)     NOT NULL,
    "Nombre"            VARCHAR(100)    NOT NULL,
    "ApellidoPaterno"   VARCHAR(100)    NOT NULL,
    "ApellidoMaterno"   VARCHAR(100)    NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_Docente" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Docente_NumeroEmpleado" UNIQUE ("NumeroEmpleado"),
    CONSTRAINT "uq_P_EvaluacionDocente_Docente_UsuarioId" UNIQUE ("UsuarioId"),
    CONSTRAINT "fk_P_EvaluacionDocente_Docente_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Docente_Facultad" FOREIGN KEY ("FacultadId")
        REFERENCES "P_EvaluacionDocente_Facultad" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Docente_FacultadId" ON "P_EvaluacionDocente_Docente" ("FacultadId");

CREATE TABLE "P_EvaluacionDocente_Estudiante" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "UsuarioId"             INTEGER         NOT NULL,
    "ProgramaEducativoId"   INTEGER         NOT NULL,
    "Matricula"             VARCHAR(20)     NOT NULL,
    "Nombre"                VARCHAR(100)    NOT NULL,
    "ApellidoPaterno"       VARCHAR(100)    NOT NULL,
    "ApellidoMaterno"       VARCHAR(100)    NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_Estudiante" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Estudiante_Matricula" UNIQUE ("Matricula"),
    CONSTRAINT "uq_P_EvaluacionDocente_Estudiante_UsuarioId" UNIQUE ("UsuarioId"),
    CONSTRAINT "fk_P_EvaluacionDocente_Estudiante_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Estudiante_ProgramaEducativo" FOREIGN KEY ("ProgramaEducativoId")
        REFERENCES "P_EvaluacionDocente_ProgramaEducativo" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Estudiante_ProgramaEducativoId" ON "P_EvaluacionDocente_Estudiante" ("ProgramaEducativoId");

/* ---------------------------------------------------------------------
   3. Grupos e inscripciones
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_Grupo" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "MateriaId"             INTEGER         NOT NULL,
    "DocenteId"             INTEGER         NOT NULL,
    "PeriodoAcademicoId"    INTEGER         NOT NULL,
    "Seccion"               VARCHAR(10)     NOT NULL,  -- ej. 'A', '01'
    "CupoMaximo"            SMALLINT        NOT NULL DEFAULT 0,
    CONSTRAINT "pk_P_EvaluacionDocente_Grupo" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Grupo_Oferta" UNIQUE ("MateriaId", "DocenteId", "PeriodoAcademicoId", "Seccion"),
    CONSTRAINT "fk_P_EvaluacionDocente_Grupo_Materia" FOREIGN KEY ("MateriaId")
        REFERENCES "P_EvaluacionDocente_Materia" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Grupo_Docente" FOREIGN KEY ("DocenteId")
        REFERENCES "P_EvaluacionDocente_Docente" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Grupo_PeriodoAcademico" FOREIGN KEY ("PeriodoAcademicoId")
        REFERENCES "P_EvaluacionDocente_PeriodoAcademico" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Grupo_DocenteId" ON "P_EvaluacionDocente_Grupo" ("DocenteId");
CREATE INDEX "ix_P_EvaluacionDocente_Grupo_PeriodoAcademicoId" ON "P_EvaluacionDocente_Grupo" ("PeriodoAcademicoId");

CREATE TABLE "P_EvaluacionDocente_Inscripcion" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "EstudianteId"          INTEGER         NOT NULL,
    "GrupoId"               INTEGER         NOT NULL,
    "FechaInscripcion"      DATE            NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT "pk_P_EvaluacionDocente_Inscripcion" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Inscripcion_Estudiante_Grupo" UNIQUE ("EstudianteId", "GrupoId"),
    CONSTRAINT "fk_P_EvaluacionDocente_Inscripcion_Estudiante" FOREIGN KEY ("EstudianteId")
        REFERENCES "P_EvaluacionDocente_Estudiante" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Inscripcion_Grupo" FOREIGN KEY ("GrupoId")
        REFERENCES "P_EvaluacionDocente_Grupo" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Inscripcion_GrupoId" ON "P_EvaluacionDocente_Inscripcion" ("GrupoId");

/* ---------------------------------------------------------------------
   4. Instrumentos de evaluacion adaptables (formularios dinamicos)
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_InstrumentoEvaluacion" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "CreadoPorUsuarioId"    INTEGER         NOT NULL,
    "Nombre"                VARCHAR(150)    NOT NULL,
    "TipoEvaluado"          VARCHAR(30)     NOT NULL, -- 'Docente', 'Autoevaluacion', 'Coordinador'
    "Version"               SMALLINT        NOT NULL DEFAULT 1,
    "Activo"                BOOLEAN         NOT NULL DEFAULT true,
    "FechaCreacion"         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_InstrumentoEvaluacion" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_InstrumentoEvaluacion_Usuario" FOREIGN KEY ("CreadoPorUsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "ck_P_EvaluacionDocente_InstrumentoEvaluacion_TipoEvaluado"
        CHECK ("TipoEvaluado" IN ('Docente', 'Autoevaluacion', 'Coordinador'))
);

CREATE TABLE "P_EvaluacionDocente_SeccionInstrumento" (
    "Id"            INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "InstrumentoId" INTEGER         NOT NULL,
    "Nombre"        VARCHAR(150)    NOT NULL,   -- ej. 'Dominio del tema', 'Puntualidad'
    "Orden"         SMALLINT        NOT NULL DEFAULT 1,
    CONSTRAINT "pk_P_EvaluacionDocente_SeccionInstrumento" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_SeccionInstrumento_Instrumento" FOREIGN KEY ("InstrumentoId")
        REFERENCES "P_EvaluacionDocente_InstrumentoEvaluacion" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_SeccionInstrumento_InstrumentoId" ON "P_EvaluacionDocente_SeccionInstrumento" ("InstrumentoId");

CREATE TABLE "P_EvaluacionDocente_TipoPregunta" (
    "Id"        INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "Nombre"    VARCHAR(50)     NOT NULL, -- EscalaLikert, OpcionMultiple, SiNo, TextoAbierto, Numerica
    CONSTRAINT "pk_P_EvaluacionDocente_TipoPregunta" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_TipoPregunta_Nombre" UNIQUE ("Nombre")
);

CREATE TABLE "P_EvaluacionDocente_Pregunta" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "SeccionInstrumentoId"  INTEGER         NOT NULL,
    "TipoPreguntaId"        INTEGER         NOT NULL,
    "Texto"                 VARCHAR(500)    NOT NULL,
    "Orden"                 SMALLINT        NOT NULL DEFAULT 1,
    "Obligatoria"           BOOLEAN         NOT NULL DEFAULT true,
    "PesoPonderacion"       DECIMAL(5,2)    NOT NULL DEFAULT 1.00,
    CONSTRAINT "pk_P_EvaluacionDocente_Pregunta" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Pregunta_SeccionInstrumento" FOREIGN KEY ("SeccionInstrumentoId")
        REFERENCES "P_EvaluacionDocente_SeccionInstrumento" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Pregunta_TipoPregunta" FOREIGN KEY ("TipoPreguntaId")
        REFERENCES "P_EvaluacionDocente_TipoPregunta" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Pregunta_SeccionInstrumentoId" ON "P_EvaluacionDocente_Pregunta" ("SeccionInstrumentoId");

CREATE TABLE "P_EvaluacionDocente_OpcionRespuesta" (
    "Id"            INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "PreguntaId"    INTEGER         NOT NULL,
    "Texto"         VARCHAR(200)    NOT NULL,  -- ej. 'Totalmente de acuerdo'
    "Valor"         DECIMAL(5,2)    NOT NULL,  -- valor numerico de la opcion (ej. 5, 4, 3...)
    "Orden"         SMALLINT        NOT NULL DEFAULT 1,
    CONSTRAINT "pk_P_EvaluacionDocente_OpcionRespuesta" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_OpcionRespuesta_Pregunta" FOREIGN KEY ("PreguntaId")
        REFERENCES "P_EvaluacionDocente_Pregunta" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_OpcionRespuesta_PreguntaId" ON "P_EvaluacionDocente_OpcionRespuesta" ("PreguntaId");

/* ---------------------------------------------------------------------
   5. Aplicacion de evaluaciones y respuestas
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_PeriodoEvaluacion" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "PeriodoAcademicoId"    INTEGER         NOT NULL,
    "InstrumentoId"         INTEGER         NOT NULL,
    "Nombre"                VARCHAR(150)    NOT NULL, -- ej. 'Evaluacion Docente 2026-2027-1'
    "FechaInicio"           TIMESTAMPTZ     NOT NULL,
    "FechaFin"              TIMESTAMPTZ     NOT NULL,
    "Activo"                BOOLEAN         NOT NULL DEFAULT true,
    CONSTRAINT "pk_P_EvaluacionDocente_PeriodoEvaluacion" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_PeriodoEvaluacion_PeriodoAcademico" FOREIGN KEY ("PeriodoAcademicoId")
        REFERENCES "P_EvaluacionDocente_PeriodoAcademico" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_PeriodoEvaluacion_Instrumento" FOREIGN KEY ("InstrumentoId")
        REFERENCES "P_EvaluacionDocente_InstrumentoEvaluacion" ("Id"),
    CONSTRAINT "ck_P_EvaluacionDocente_PeriodoEvaluacion_Fechas" CHECK ("FechaFin" > "FechaInicio")
);
CREATE INDEX "ix_P_EvaluacionDocente_PeriodoEvaluacion_PeriodoAcademicoId" ON "P_EvaluacionDocente_PeriodoEvaluacion" ("PeriodoAcademicoId");

CREATE TABLE "P_EvaluacionDocente_Evaluacion" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "PeriodoEvaluacionId"   INTEGER         NOT NULL,
    "EstudianteId"          INTEGER         NOT NULL,
    "GrupoId"               INTEGER         NOT NULL,
    "FechaRespuesta"        TIMESTAMPTZ     NULL,
    "Completada"            BOOLEAN         NOT NULL DEFAULT false,
    "Anonima"               BOOLEAN         NOT NULL DEFAULT true,
    CONSTRAINT "pk_P_EvaluacionDocente_Evaluacion" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Evaluacion_Estudiante_Grupo_Periodo" UNIQUE ("EstudianteId", "GrupoId", "PeriodoEvaluacionId"),
    CONSTRAINT "fk_P_EvaluacionDocente_Evaluacion_PeriodoEvaluacion" FOREIGN KEY ("PeriodoEvaluacionId")
        REFERENCES "P_EvaluacionDocente_PeriodoEvaluacion" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Evaluacion_Estudiante" FOREIGN KEY ("EstudianteId")
        REFERENCES "P_EvaluacionDocente_Estudiante" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Evaluacion_Grupo" FOREIGN KEY ("GrupoId")
        REFERENCES "P_EvaluacionDocente_Grupo" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Evaluacion_GrupoId" ON "P_EvaluacionDocente_Evaluacion" ("GrupoId");
CREATE INDEX "ix_P_EvaluacionDocente_Evaluacion_PeriodoEvaluacionId" ON "P_EvaluacionDocente_Evaluacion" ("PeriodoEvaluacionId");

CREATE TABLE "P_EvaluacionDocente_RespuestaEvaluacion" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "EvaluacionId"          INTEGER         NOT NULL,
    "PreguntaId"            INTEGER         NOT NULL,
    "OpcionRespuestaId"     INTEGER         NULL,      -- si la pregunta es de opcion/escala
    "RespuestaTexto"        VARCHAR         NULL,       -- si la pregunta es abierta (sin limite, equivalente a NVARCHAR(MAX))
    "RespuestaNumerica"     DECIMAL(9,2)    NULL,       -- si la pregunta es numerica
    CONSTRAINT "pk_P_EvaluacionDocente_RespuestaEvaluacion" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_RespuestaEvaluacion_Evaluacion_Pregunta" UNIQUE ("EvaluacionId", "PreguntaId"),
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacion_Evaluacion" FOREIGN KEY ("EvaluacionId")
        REFERENCES "P_EvaluacionDocente_Evaluacion" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacion_Pregunta" FOREIGN KEY ("PreguntaId")
        REFERENCES "P_EvaluacionDocente_Pregunta" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacion_OpcionRespuesta" FOREIGN KEY ("OpcionRespuestaId")
        REFERENCES "P_EvaluacionDocente_OpcionRespuesta" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_RespuestaEvaluacion_PreguntaId" ON "P_EvaluacionDocente_RespuestaEvaluacion" ("PreguntaId");

/* ---------------------------------------------------------------------
   6. Resultados agregados (para dashboards / reportes)
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_ResultadoDocente" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "DocenteId"             INTEGER         NOT NULL,
    "GrupoId"               INTEGER         NOT NULL,
    "PeriodoEvaluacionId"   INTEGER         NOT NULL,
    "PromedioGeneral"       DECIMAL(5,2)    NOT NULL DEFAULT 0,
    "TotalRespuestas"       INTEGER         NOT NULL DEFAULT 0,
    "FechaCalculo"          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_ResultadoDocente" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_ResultadoDocente_Grupo_Periodo" UNIQUE ("GrupoId", "PeriodoEvaluacionId"),
    CONSTRAINT "fk_P_EvaluacionDocente_ResultadoDocente_Docente" FOREIGN KEY ("DocenteId")
        REFERENCES "P_EvaluacionDocente_Docente" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_ResultadoDocente_Grupo" FOREIGN KEY ("GrupoId")
        REFERENCES "P_EvaluacionDocente_Grupo" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_ResultadoDocente_PeriodoEvaluacion" FOREIGN KEY ("PeriodoEvaluacionId")
        REFERENCES "P_EvaluacionDocente_PeriodoEvaluacion" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_ResultadoDocente_DocenteId" ON "P_EvaluacionDocente_ResultadoDocente" ("DocenteId");

/* ---------------------------------------------------------------------
   7. Sesiones y recuperacion de contrasena (antes migracion 002)
   --------------------------------------------------------------------- */

CREATE TABLE "P_EvaluacionDocente_Sesion" (
    "Id"                INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "UsuarioId"         INTEGER         NOT NULL,
    "Jti"               VARCHAR(64)     NOT NULL,  -- id de sesion embebido como claim "jti" en el JWT
    "FechaInicio"       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    "FechaExpiracion"   TIMESTAMPTZ     NOT NULL,
    "FechaCierre"       TIMESTAMPTZ     NULL,      -- se llena al hacer logout o al invalidarse (ej. reset de password)
    "Activa"            BOOLEAN         NOT NULL DEFAULT true,
    CONSTRAINT "pk_P_EvaluacionDocente_Sesion" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Sesion_Jti" UNIQUE ("Jti"),
    CONSTRAINT "fk_P_EvaluacionDocente_Sesion_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_Sesion_UsuarioId" ON "P_EvaluacionDocente_Sesion" ("UsuarioId");

CREATE TABLE "P_EvaluacionDocente_PasswordResetToken" (
    "Id"                INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "UsuarioId"         INTEGER         NOT NULL,
    "TokenHash"         VARCHAR(256)    NOT NULL,  -- SHA-256 del token enviado por correo (el token en si nunca se guarda)
    "FechaCreacion"     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    "FechaExpiracion"   TIMESTAMPTZ     NOT NULL,
    "Usado"             BOOLEAN         NOT NULL DEFAULT false,
    CONSTRAINT "pk_P_EvaluacionDocente_PasswordResetToken" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_PasswordResetToken_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id")
);
CREATE INDEX "ix_P_EvaluacionDocente_PasswordResetToken_UsuarioId" ON "P_EvaluacionDocente_PasswordResetToken" ("UsuarioId");

/* ---------------------------------------------------------------------
   8. Datos semilla para catalogos base
   --------------------------------------------------------------------- */

INSERT INTO "P_EvaluacionDocente_Rol" ("Nombre") VALUES
    ('Administrador'),
    ('Coordinador'),
    ('Docente'),
    ('Estudiante');

INSERT INTO "P_EvaluacionDocente_TipoPregunta" ("Nombre") VALUES
    ('EscalaLikert'),
    ('OpcionMultiple'),
    ('SiNo'),
    ('TextoAbierto'),
    ('Numerica');

/* ---------------------------------------------------------------------
   9. Cuestionario oficial de evaluacion docente (antes migracion 003)
   Borrador estandar de 15 preguntas, escala oficial 0/2.5/5/7.5/10.
   Crea tambien la cuenta de prueba Coordinador (coordinacion@dygsis.local
   / Demo2026!) para que el equipo pueda probar ese rol.
   --------------------------------------------------------------------- */

INSERT INTO "P_EvaluacionDocente_Usuario" ("CorreoElectronico", "ContrasenaHash")
VALUES ('coordinacion@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'); -- Demo2026!

INSERT INTO "P_EvaluacionDocente_UsuarioRol" ("UsuarioId", "RolId")
SELECT u."Id", r."Id"
FROM "P_EvaluacionDocente_Usuario" u, "P_EvaluacionDocente_Rol" r
WHERE u."CorreoElectronico" = 'coordinacion@dygsis.local' AND r."Nombre" = 'Coordinador';

INSERT INTO "P_EvaluacionDocente_InstrumentoEvaluacion" ("CreadoPorUsuarioId", "Nombre", "TipoEvaluado", "Version", "Activo")
SELECT u."Id", 'Evaluacion Docente 2026 (borrador estandar)', 'Docente', 1, true
FROM "P_EvaluacionDocente_Usuario" u
WHERE u."CorreoElectronico" = 'coordinacion@dygsis.local';

INSERT INTO "P_EvaluacionDocente_SeccionInstrumento" ("InstrumentoId", "Nombre", "Orden")
SELECT i."Id", s.nombre, s.orden
FROM "P_EvaluacionDocente_InstrumentoEvaluacion" i
CROSS JOIN (VALUES
    ('Dominio y organizacion de la materia', 1),
    ('Metodologia y evaluacion', 2),
    ('Puntualidad y responsabilidad', 3),
    ('Trato y comunicacion', 4)
) AS s(nombre, orden)
WHERE i."Nombre" = 'Evaluacion Docente 2026 (borrador estandar)';

INSERT INTO "P_EvaluacionDocente_Pregunta" ("SeccionInstrumentoId", "TipoPreguntaId", "Texto", "Orden")
SELECT sec."Id", tp."Id", preg.texto, preg.orden
FROM "P_EvaluacionDocente_SeccionInstrumento" sec
JOIN "P_EvaluacionDocente_TipoPregunta" tp ON tp."Nombre" = 'EscalaLikert'
JOIN (VALUES
    ('Dominio y organizacion de la materia', 'El docente domina los temas que imparte.', 1),
    ('Dominio y organizacion de la materia', 'El docente explica los temas con claridad.', 2),
    ('Dominio y organizacion de la materia', 'El docente relaciona la teoria con ejemplos practicos.', 3),
    ('Dominio y organizacion de la materia', 'El docente cumple con el temario y los objetivos del curso.', 4),
    ('Metodologia y evaluacion', 'El docente utiliza materiales y recursos didacticos adecuados.', 1),
    ('Metodologia y evaluacion', 'Las actividades y tareas asignadas contribuyen a mi aprendizaje.', 2),
    ('Metodologia y evaluacion', 'Los criterios de evaluacion fueron claros desde el inicio del curso.', 3),
    ('Metodologia y evaluacion', 'La forma de evaluar (examenes, tareas, proyectos) fue justa.', 4),
    ('Puntualidad y responsabilidad', 'El docente es puntual al iniciar y terminar la clase.', 1),
    ('Puntualidad y responsabilidad', 'El docente asiste regularmente a sus clases.', 2),
    ('Puntualidad y responsabilidad', 'El docente entrega calificaciones y retroalimentacion en tiempo razonable.', 3),
    ('Trato y comunicacion', 'El docente muestra respeto hacia los estudiantes.', 1),
    ('Trato y comunicacion', 'El docente fomenta la participacion en clase.', 2),
    ('Trato y comunicacion', 'El docente esta disponible para resolver dudas fuera de clase.', 3),
    ('Trato y comunicacion', 'En general, recomendaria a este docente a otros estudiantes.', 4)
) AS preg(seccion, texto, orden) ON preg.seccion = sec."Nombre"
WHERE sec."InstrumentoId" = (
    SELECT "Id" FROM "P_EvaluacionDocente_InstrumentoEvaluacion"
    WHERE "Nombre" = 'Evaluacion Docente 2026 (borrador estandar)'
);

INSERT INTO "P_EvaluacionDocente_OpcionRespuesta" ("PreguntaId", "Texto", "Valor", "Orden")
SELECT p."Id", escala.texto, escala.valor, escala.orden
FROM "P_EvaluacionDocente_Pregunta" p
CROSS JOIN (VALUES
    ('Totalmente en desacuerdo', 0.00, 1),
    ('En desacuerdo', 2.50, 2),
    ('Neutral', 5.00, 3),
    ('De acuerdo', 7.50, 4),
    ('Totalmente de acuerdo', 10.00, 5)
) AS escala(texto, valor, orden)
WHERE p."SeccionInstrumentoId" IN (
    SELECT "Id" FROM "P_EvaluacionDocente_SeccionInstrumento"
    WHERE "InstrumentoId" = (
        SELECT "Id" FROM "P_EvaluacionDocente_InstrumentoEvaluacion"
        WHERE "Nombre" = 'Evaluacion Docente 2026 (borrador estandar)'
    )
);

/* ---------------------------------------------------------------------
   10. Cuenta de prueba Estudiante (DEMO0001 / Demo2026!) para verificar
   el despliegue de inmediato, igual que se tenia en Azure.
   --------------------------------------------------------------------- */

INSERT INTO "P_EvaluacionDocente_Usuario" ("CorreoElectronico", "ContrasenaHash")
VALUES ('demo@dygsis.local', '$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW'); -- Demo2026!

INSERT INTO "P_EvaluacionDocente_UsuarioRol" ("UsuarioId", "RolId")
SELECT u."Id", r."Id"
FROM "P_EvaluacionDocente_Usuario" u, "P_EvaluacionDocente_Rol" r
WHERE u."CorreoElectronico" = 'demo@dygsis.local' AND r."Nombre" = 'Estudiante';

INSERT INTO "P_EvaluacionDocente_Facultad" ("Nombre", "Siglas") VALUES ('Facultad de Ingenieria', 'FI');

INSERT INTO "P_EvaluacionDocente_ProgramaEducativo" ("FacultadId", "Nombre", "NivelEducativo")
SELECT "Id", 'Ingenieria en Sistemas Computacionales', 'Licenciatura' FROM "P_EvaluacionDocente_Facultad" WHERE "Nombre" = 'Facultad de Ingenieria';

INSERT INTO "P_EvaluacionDocente_Estudiante" ("UsuarioId", "ProgramaEducativoId", "Matricula", "Nombre", "ApellidoPaterno")
SELECT u."Id", pe."Id", 'DEMO0001', 'Estudiante', 'Demo'
FROM "P_EvaluacionDocente_Usuario" u, "P_EvaluacionDocente_ProgramaEducativo" pe
WHERE u."CorreoElectronico" = 'demo@dygsis.local'
  AND pe."Nombre" = 'Ingenieria en Sistemas Computacionales';

/* ---------------------------------------------------------------------
   11. Vistas de participacion (migracion 004, SCRUM-41)
   Participacion = % de inscripciones (alumno en grupo) con evaluacion
   enviada. Ver database/migrations/004_vistas_participacion.sql.
   --------------------------------------------------------------------- */

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
