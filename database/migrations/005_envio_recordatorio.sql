-- =====================================================================
-- Migracion 005 (PostgreSQL / Supabase): registro de recordatorios enviados
-- Jira: SCRUM-40 (correos automaticos 7 / 3 / 1 dias antes del cierre).
--
-- Una fila por (periodo de evaluacion, usuario, aviso). La clave unica evita
-- que el mismo aviso se mande dos veces aunque el proceso corra varias veces.
-- DiasAntes es el umbral del aviso (7, 3 o 1), no los dias exactos restantes.
--
-- Reversa:
--   DROP TABLE "P_EvaluacionDocente_EnvioRecordatorio";
-- =====================================================================

CREATE TABLE IF NOT EXISTS "P_EvaluacionDocente_EnvioRecordatorio" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "PeriodoEvaluacionId"   INTEGER         NOT NULL,
    "UsuarioId"             INTEGER         NOT NULL,
    "DiasAntes"             SMALLINT        NOT NULL,
    "FechaEnvio"            TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_EnvioRecordatorio" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_EnvioRecordatorio_PeriodoEvaluacion" FOREIGN KEY ("PeriodoEvaluacionId")
        REFERENCES "P_EvaluacionDocente_PeriodoEvaluacion" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_EnvioRecordatorio_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_EnvioRecordatorio_Periodo_Usuario_Dias" UNIQUE ("PeriodoEvaluacionId", "UsuarioId", "DiasAntes"),
    CONSTRAINT "ck_P_EvaluacionDocente_EnvioRecordatorio_DiasAntes" CHECK ("DiasAntes" IN (1, 3, 7))
);
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_EnvioRecordatorio_UsuarioId" ON "P_EvaluacionDocente_EnvioRecordatorio" ("UsuarioId");
