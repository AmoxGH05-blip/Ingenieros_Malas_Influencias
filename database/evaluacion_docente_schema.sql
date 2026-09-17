/* =====================================================================
   Sistema de Informacion de Evaluacion Docente Institucional Adaptable
   Modelo fisico - Microsoft SQL Server (Azure SQL, base compartida "Central-Data")
   Equipo: Ingenieros Malas Influencias
   Jira: SCRUM-24

   Convenciones de esta base compartida (multiples proyectos conviven en
   la misma base de datos "Central-Data"):
   - Todas las tablas van prefijadas con P_EvaluacionDocente_ para evitar
     choques de nombres con otros proyectos (ej. P_Ferreteria_*).
   - Constraints en minusculas: pk_<Tabla>, fk_<Tabla>_<TablaReferenciada>,
     uq_<Tabla>_<Campo(s)>, ck_<Tabla>_<Regla>, ix_<Tabla>_<Campo>.
   - Claves primarias: INT IDENTITY(1,1).
   - NVARCHAR para texto (acentos/enie); NVARCHAR(MAX) solo para respuestas
     abiertas. DECIMAL(5,2) para promedios/pesos. DATETIME2 para timestamps.
   - Sin ON DELETE CASCADE (evita ciclos de cascada en SQL Server); los
     borrados se manejan logicamente con columnas Activo/Completada.
   - La "adaptabilidad" del sistema vive en:
       P_EvaluacionDocente_InstrumentoEvaluacion
         -> P_EvaluacionDocente_SeccionInstrumento
         -> P_EvaluacionDocente_Pregunta
         -> P_EvaluacionDocente_OpcionRespuesta
     Permite crear/versionar formularios de evaluacion (secciones,
     preguntas, tipos, escalas) insertando filas, sin alterar el esquema.

   USE [Central-Data];  -- la base ya existe, no se crea una nueva
   GO
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. Estructura academica
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_Facultad (
    Id              INT IDENTITY(1,1)   NOT NULL,
    Nombre          NVARCHAR(150)       NOT NULL,
    Siglas          NVARCHAR(20)        NULL,
    CONSTRAINT pk_P_EvaluacionDocente_Facultad PRIMARY KEY CLUSTERED (Id)
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_ProgramaEducativo (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    FacultadId          INT                 NOT NULL,
    Nombre              NVARCHAR(150)       NOT NULL,
    NivelEducativo      NVARCHAR(50)        NOT NULL, -- Licenciatura, Posgrado, etc.
    CONSTRAINT pk_P_EvaluacionDocente_ProgramaEducativo PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_ProgramaEducativo_Facultad FOREIGN KEY (FacultadId)
        REFERENCES dbo.P_EvaluacionDocente_Facultad (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_ProgramaEducativo_FacultadId ON dbo.P_EvaluacionDocente_ProgramaEducativo (FacultadId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Materia (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    ProgramaEducativoId     INT                 NOT NULL,
    Clave                   NVARCHAR(20)        NOT NULL,
    Nombre                  NVARCHAR(150)       NOT NULL,
    Creditos                TINYINT             NOT NULL DEFAULT 0,
    CONSTRAINT pk_P_EvaluacionDocente_Materia PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Materia_Clave UNIQUE (Clave),
    CONSTRAINT fk_P_EvaluacionDocente_Materia_ProgramaEducativo FOREIGN KEY (ProgramaEducativoId)
        REFERENCES dbo.P_EvaluacionDocente_ProgramaEducativo (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Materia_ProgramaEducativoId ON dbo.P_EvaluacionDocente_Materia (ProgramaEducativoId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_PeriodoAcademico (
    Id              INT IDENTITY(1,1)   NOT NULL,
    Nombre          NVARCHAR(50)        NOT NULL,   -- ej. '2026-2027 Semestre 1'
    FechaInicio     DATE                NOT NULL,
    FechaFin        DATE                NOT NULL,
    Activo          BIT                 NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_PeriodoAcademico PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT ck_P_EvaluacionDocente_PeriodoAcademico_Fechas CHECK (FechaFin > FechaInicio)
);
GO

/* ---------------------------------------------------------------------
   2. Usuarios, roles, docentes y estudiantes
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_Usuario (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    CorreoElectronico   NVARCHAR(150)       NOT NULL,
    ContrasenaHash      NVARCHAR(256)       NOT NULL,
    Activo              BIT                 NOT NULL DEFAULT 1,
    FechaCreacion       DATETIME2           NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_P_EvaluacionDocente_Usuario PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Usuario_Correo UNIQUE (CorreoElectronico)
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Rol (
    Id      INT IDENTITY(1,1)   NOT NULL,
    Nombre  NVARCHAR(50)        NOT NULL, -- Administrador, Coordinador, Docente, Estudiante
    CONSTRAINT pk_P_EvaluacionDocente_Rol PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Rol_Nombre UNIQUE (Nombre)
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_UsuarioRol (
    UsuarioId   INT NOT NULL,
    RolId       INT NOT NULL,
    CONSTRAINT pk_P_EvaluacionDocente_UsuarioRol PRIMARY KEY CLUSTERED (UsuarioId, RolId),
    CONSTRAINT fk_P_EvaluacionDocente_UsuarioRol_Usuario FOREIGN KEY (UsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id),
    CONSTRAINT fk_P_EvaluacionDocente_UsuarioRol_Rol FOREIGN KEY (RolId)
        REFERENCES dbo.P_EvaluacionDocente_Rol (Id)
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Docente (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    UsuarioId           INT                 NOT NULL,
    FacultadId          INT                 NOT NULL,
    NumeroEmpleado      NVARCHAR(20)        NOT NULL,
    Nombre              NVARCHAR(100)       NOT NULL,
    ApellidoPaterno     NVARCHAR(100)       NOT NULL,
    ApellidoMaterno     NVARCHAR(100)       NULL,
    CONSTRAINT pk_P_EvaluacionDocente_Docente PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Docente_NumeroEmpleado UNIQUE (NumeroEmpleado),
    CONSTRAINT uq_P_EvaluacionDocente_Docente_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT fk_P_EvaluacionDocente_Docente_Usuario FOREIGN KEY (UsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Docente_Facultad FOREIGN KEY (FacultadId)
        REFERENCES dbo.P_EvaluacionDocente_Facultad (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Docente_FacultadId ON dbo.P_EvaluacionDocente_Docente (FacultadId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Estudiante (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    UsuarioId               INT                 NOT NULL,
    ProgramaEducativoId     INT                 NOT NULL,
    Matricula               NVARCHAR(20)        NOT NULL,
    Nombre                  NVARCHAR(100)       NOT NULL,
    ApellidoPaterno         NVARCHAR(100)       NOT NULL,
    ApellidoMaterno         NVARCHAR(100)       NULL,
    CONSTRAINT pk_P_EvaluacionDocente_Estudiante PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Estudiante_Matricula UNIQUE (Matricula),
    CONSTRAINT uq_P_EvaluacionDocente_Estudiante_UsuarioId UNIQUE (UsuarioId),
    CONSTRAINT fk_P_EvaluacionDocente_Estudiante_Usuario FOREIGN KEY (UsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Estudiante_ProgramaEducativo FOREIGN KEY (ProgramaEducativoId)
        REFERENCES dbo.P_EvaluacionDocente_ProgramaEducativo (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Estudiante_ProgramaEducativoId ON dbo.P_EvaluacionDocente_Estudiante (ProgramaEducativoId);
GO

/* ---------------------------------------------------------------------
   3. Grupos e inscripciones
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_Grupo (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    MateriaId               INT                 NOT NULL,
    DocenteId               INT                 NOT NULL,
    PeriodoAcademicoId      INT                 NOT NULL,
    Seccion                 NVARCHAR(10)        NOT NULL,  -- ej. 'A', '01'
    CupoMaximo              SMALLINT            NOT NULL DEFAULT 0,
    CONSTRAINT pk_P_EvaluacionDocente_Grupo PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Grupo_Oferta UNIQUE (MateriaId, DocenteId, PeriodoAcademicoId, Seccion),
    CONSTRAINT fk_P_EvaluacionDocente_Grupo_Materia FOREIGN KEY (MateriaId)
        REFERENCES dbo.P_EvaluacionDocente_Materia (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Grupo_Docente FOREIGN KEY (DocenteId)
        REFERENCES dbo.P_EvaluacionDocente_Docente (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Grupo_PeriodoAcademico FOREIGN KEY (PeriodoAcademicoId)
        REFERENCES dbo.P_EvaluacionDocente_PeriodoAcademico (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Grupo_DocenteId ON dbo.P_EvaluacionDocente_Grupo (DocenteId);
CREATE INDEX ix_P_EvaluacionDocente_Grupo_PeriodoAcademicoId ON dbo.P_EvaluacionDocente_Grupo (PeriodoAcademicoId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Inscripcion (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    EstudianteId        INT                 NOT NULL,
    GrupoId              INT                 NOT NULL,
    FechaInscripcion    DATE                NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    CONSTRAINT pk_P_EvaluacionDocente_Inscripcion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Inscripcion_Estudiante_Grupo UNIQUE (EstudianteId, GrupoId),
    CONSTRAINT fk_P_EvaluacionDocente_Inscripcion_Estudiante FOREIGN KEY (EstudianteId)
        REFERENCES dbo.P_EvaluacionDocente_Estudiante (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Inscripcion_Grupo FOREIGN KEY (GrupoId)
        REFERENCES dbo.P_EvaluacionDocente_Grupo (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Inscripcion_GrupoId ON dbo.P_EvaluacionDocente_Inscripcion (GrupoId);
GO

/* ---------------------------------------------------------------------
   4. Instrumentos de evaluacion adaptables (formularios dinamicos)
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_InstrumentoEvaluacion (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    CreadoPorUsuarioId      INT                 NOT NULL,
    Nombre                  NVARCHAR(150)       NOT NULL,
    TipoEvaluado            NVARCHAR(30)        NOT NULL, -- 'Docente', 'Autoevaluacion', 'Coordinador'
    Version                 SMALLINT            NOT NULL DEFAULT 1,
    Activo                  BIT                 NOT NULL DEFAULT 1,
    FechaCreacion           DATETIME2           NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_P_EvaluacionDocente_InstrumentoEvaluacion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_InstrumentoEvaluacion_Usuario FOREIGN KEY (CreadoPorUsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id),
    CONSTRAINT ck_P_EvaluacionDocente_InstrumentoEvaluacion_TipoEvaluado
        CHECK (TipoEvaluado IN ('Docente', 'Autoevaluacion', 'Coordinador'))
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_SeccionInstrumento (
    Id              INT IDENTITY(1,1)   NOT NULL,
    InstrumentoId   INT                 NOT NULL,
    Nombre          NVARCHAR(150)       NOT NULL,   -- ej. 'Dominio del tema', 'Puntualidad'
    Orden           SMALLINT            NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_SeccionInstrumento PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_SeccionInstrumento_Instrumento FOREIGN KEY (InstrumentoId)
        REFERENCES dbo.P_EvaluacionDocente_InstrumentoEvaluacion (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_SeccionInstrumento_InstrumentoId ON dbo.P_EvaluacionDocente_SeccionInstrumento (InstrumentoId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_TipoPregunta (
    Id      INT IDENTITY(1,1)   NOT NULL,
    Nombre  NVARCHAR(50)        NOT NULL, -- EscalaLikert, OpcionMultiple, SiNo, TextoAbierto, Numerica
    CONSTRAINT pk_P_EvaluacionDocente_TipoPregunta PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_TipoPregunta_Nombre UNIQUE (Nombre)
);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Pregunta (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    SeccionInstrumentoId    INT                 NOT NULL,
    TipoPreguntaId          INT                 NOT NULL,
    Texto                   NVARCHAR(500)       NOT NULL,
    Orden                   SMALLINT            NOT NULL DEFAULT 1,
    Obligatoria             BIT                 NOT NULL DEFAULT 1,
    PesoPonderacion         DECIMAL(5,2)        NOT NULL DEFAULT 1.00,
    CONSTRAINT pk_P_EvaluacionDocente_Pregunta PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Pregunta_SeccionInstrumento FOREIGN KEY (SeccionInstrumentoId)
        REFERENCES dbo.P_EvaluacionDocente_SeccionInstrumento (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Pregunta_TipoPregunta FOREIGN KEY (TipoPreguntaId)
        REFERENCES dbo.P_EvaluacionDocente_TipoPregunta (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Pregunta_SeccionInstrumentoId ON dbo.P_EvaluacionDocente_Pregunta (SeccionInstrumentoId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_OpcionRespuesta (
    Id              INT IDENTITY(1,1)   NOT NULL,
    PreguntaId      INT                 NOT NULL,
    Texto           NVARCHAR(200)       NOT NULL,  -- ej. 'Totalmente de acuerdo'
    Valor           DECIMAL(5,2)        NOT NULL,  -- valor numerico de la opcion (ej. 5, 4, 3...)
    Orden           SMALLINT            NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_OpcionRespuesta PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_OpcionRespuesta_Pregunta FOREIGN KEY (PreguntaId)
        REFERENCES dbo.P_EvaluacionDocente_Pregunta (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_OpcionRespuesta_PreguntaId ON dbo.P_EvaluacionDocente_OpcionRespuesta (PreguntaId);
GO

/* ---------------------------------------------------------------------
   5. Aplicacion de evaluaciones y respuestas
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_PeriodoEvaluacion (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    PeriodoAcademicoId      INT                 NOT NULL,
    InstrumentoId           INT                 NOT NULL,
    Nombre                  NVARCHAR(150)       NOT NULL, -- ej. 'Evaluacion Docente 2026-2027-1'
    FechaInicio             DATETIME2           NOT NULL,
    FechaFin                DATETIME2           NOT NULL,
    Activo                  BIT                 NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_PeriodoEvaluacion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_PeriodoEvaluacion_PeriodoAcademico FOREIGN KEY (PeriodoAcademicoId)
        REFERENCES dbo.P_EvaluacionDocente_PeriodoAcademico (Id),
    CONSTRAINT fk_P_EvaluacionDocente_PeriodoEvaluacion_Instrumento FOREIGN KEY (InstrumentoId)
        REFERENCES dbo.P_EvaluacionDocente_InstrumentoEvaluacion (Id),
    CONSTRAINT ck_P_EvaluacionDocente_PeriodoEvaluacion_Fechas CHECK (FechaFin > FechaInicio)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_PeriodoEvaluacion_PeriodoAcademicoId ON dbo.P_EvaluacionDocente_PeriodoEvaluacion (PeriodoAcademicoId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_Evaluacion (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    PeriodoEvaluacionId     INT                 NOT NULL,
    EstudianteId            INT                 NOT NULL,
    GrupoId                 INT                 NOT NULL,
    FechaRespuesta          DATETIME2           NULL,
    Completada              BIT                 NOT NULL DEFAULT 0,
    Anonima                 BIT                 NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_Evaluacion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Evaluacion_Estudiante_Grupo_Periodo UNIQUE (EstudianteId, GrupoId, PeriodoEvaluacionId),
    CONSTRAINT fk_P_EvaluacionDocente_Evaluacion_PeriodoEvaluacion FOREIGN KEY (PeriodoEvaluacionId)
        REFERENCES dbo.P_EvaluacionDocente_PeriodoEvaluacion (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Evaluacion_Estudiante FOREIGN KEY (EstudianteId)
        REFERENCES dbo.P_EvaluacionDocente_Estudiante (Id),
    CONSTRAINT fk_P_EvaluacionDocente_Evaluacion_Grupo FOREIGN KEY (GrupoId)
        REFERENCES dbo.P_EvaluacionDocente_Grupo (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Evaluacion_GrupoId ON dbo.P_EvaluacionDocente_Evaluacion (GrupoId);
CREATE INDEX ix_P_EvaluacionDocente_Evaluacion_PeriodoEvaluacionId ON dbo.P_EvaluacionDocente_Evaluacion (PeriodoEvaluacionId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_RespuestaEvaluacion (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    EvaluacionId            INT                 NOT NULL,
    PreguntaId              INT                 NOT NULL,
    OpcionRespuestaId       INT                 NULL,      -- si la pregunta es de opcion/escala
    RespuestaTexto          NVARCHAR(MAX)       NULL,       -- si la pregunta es abierta
    RespuestaNumerica       DECIMAL(9,2)        NULL,       -- si la pregunta es numerica
    CONSTRAINT pk_P_EvaluacionDocente_RespuestaEvaluacion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_RespuestaEvaluacion_Evaluacion_Pregunta UNIQUE (EvaluacionId, PreguntaId),
    CONSTRAINT fk_P_EvaluacionDocente_RespuestaEvaluacion_Evaluacion FOREIGN KEY (EvaluacionId)
        REFERENCES dbo.P_EvaluacionDocente_Evaluacion (Id),
    CONSTRAINT fk_P_EvaluacionDocente_RespuestaEvaluacion_Pregunta FOREIGN KEY (PreguntaId)
        REFERENCES dbo.P_EvaluacionDocente_Pregunta (Id),
    CONSTRAINT fk_P_EvaluacionDocente_RespuestaEvaluacion_OpcionRespuesta FOREIGN KEY (OpcionRespuestaId)
        REFERENCES dbo.P_EvaluacionDocente_OpcionRespuesta (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_RespuestaEvaluacion_PreguntaId ON dbo.P_EvaluacionDocente_RespuestaEvaluacion (PreguntaId);
GO

/* ---------------------------------------------------------------------
   6. Resultados agregados (para dashboards / reportes)
   Nota: puede implementarse como VIEW o tabla materializada segun el
   volumen de datos; se deja como tabla para permitir precalculo por job.
   --------------------------------------------------------------------- */

CREATE TABLE dbo.P_EvaluacionDocente_ResultadoDocente (
    Id                      INT IDENTITY(1,1)   NOT NULL,
    DocenteId               INT                 NOT NULL,
    GrupoId                 INT                 NOT NULL,
    PeriodoEvaluacionId     INT                 NOT NULL,
    PromedioGeneral         DECIMAL(5,2)        NOT NULL DEFAULT 0,
    TotalRespuestas         INT                 NOT NULL DEFAULT 0,
    FechaCalculo            DATETIME2           NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_P_EvaluacionDocente_ResultadoDocente PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_ResultadoDocente_Grupo_Periodo UNIQUE (GrupoId, PeriodoEvaluacionId),
    CONSTRAINT fk_P_EvaluacionDocente_ResultadoDocente_Docente FOREIGN KEY (DocenteId)
        REFERENCES dbo.P_EvaluacionDocente_Docente (Id),
    CONSTRAINT fk_P_EvaluacionDocente_ResultadoDocente_Grupo FOREIGN KEY (GrupoId)
        REFERENCES dbo.P_EvaluacionDocente_Grupo (Id),
    CONSTRAINT fk_P_EvaluacionDocente_ResultadoDocente_PeriodoEvaluacion FOREIGN KEY (PeriodoEvaluacionId)
        REFERENCES dbo.P_EvaluacionDocente_PeriodoEvaluacion (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_ResultadoDocente_DocenteId ON dbo.P_EvaluacionDocente_ResultadoDocente (DocenteId);
GO

/* ---------------------------------------------------------------------
   7. Datos semilla para catalogos base
   --------------------------------------------------------------------- */

INSERT INTO dbo.P_EvaluacionDocente_Rol (Nombre) VALUES
    ('Administrador'),
    ('Coordinador'),
    ('Docente'),
    ('Estudiante');
GO

INSERT INTO dbo.P_EvaluacionDocente_TipoPregunta (Nombre) VALUES
    ('EscalaLikert'),
    ('OpcionMultiple'),
    ('SiNo'),
    ('TextoAbierto'),
    ('Numerica');
GO
