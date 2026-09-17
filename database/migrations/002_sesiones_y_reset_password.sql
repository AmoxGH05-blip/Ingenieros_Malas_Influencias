/* =====================================================================
   Sistema de Informacion de Evaluacion Docente Institucional Adaptable
   Migracion 002: sesiones y recuperacion de contrasena
   Jira: SCRUM-26 (sesiones) / SCRUM-27 (recuperacion)

   Mismas convenciones que database/evaluacion_docente_schema.sql:
   prefijo P_EvaluacionDocente_, constraints pk_/fk_/uq_/ix_ en minusculas.
   ===================================================================== */

CREATE TABLE dbo.P_EvaluacionDocente_Sesion (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    UsuarioId           INT                 NOT NULL,
    Jti                 NVARCHAR(64)        NOT NULL,  -- id de sesion embebido como claim "jti" en el JWT
    FechaInicio         DATETIME2           NOT NULL DEFAULT SYSDATETIME(),
    FechaExpiracion     DATETIME2           NOT NULL,
    FechaCierre         DATETIME2           NULL,      -- se llena al hacer logout o al invalidarse (ej. reset de password)
    Activa              BIT                 NOT NULL DEFAULT 1,
    CONSTRAINT pk_P_EvaluacionDocente_Sesion PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT uq_P_EvaluacionDocente_Sesion_Jti UNIQUE (Jti),
    CONSTRAINT fk_P_EvaluacionDocente_Sesion_Usuario FOREIGN KEY (UsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_Sesion_UsuarioId ON dbo.P_EvaluacionDocente_Sesion (UsuarioId);
GO

CREATE TABLE dbo.P_EvaluacionDocente_PasswordResetToken (
    Id                  INT IDENTITY(1,1)   NOT NULL,
    UsuarioId           INT                 NOT NULL,
    TokenHash           NVARCHAR(256)       NOT NULL,  -- SHA-256 del token enviado por correo (el token en si nunca se guarda)
    FechaCreacion       DATETIME2           NOT NULL DEFAULT SYSDATETIME(),
    FechaExpiracion     DATETIME2           NOT NULL,
    Usado               BIT                 NOT NULL DEFAULT 0,
    CONSTRAINT pk_P_EvaluacionDocente_PasswordResetToken PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT fk_P_EvaluacionDocente_PasswordResetToken_Usuario FOREIGN KEY (UsuarioId)
        REFERENCES dbo.P_EvaluacionDocente_Usuario (Id)
);
GO
CREATE INDEX ix_P_EvaluacionDocente_PasswordResetToken_UsuarioId ON dbo.P_EvaluacionDocente_PasswordResetToken (UsuarioId);
GO
