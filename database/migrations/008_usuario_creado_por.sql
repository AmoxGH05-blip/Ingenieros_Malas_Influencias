-- =====================================================================
-- Migracion 008 (PostgreSQL / Supabase): quien dio de alta cada cuenta
-- Jira: SCRUM-79 (altas jerarquicas). El Administrador crea coordinadores y el Coordinador crea alumnos
-- y docentes; guardar quien lo hizo deja trazabilidad. Es NULL en las cuentas anteriores y en la cuenta
-- inicial creada por script. Es repetible. Reversa:
--   ALTER TABLE "P_EvaluacionDocente_Usuario" DROP CONSTRAINT "fk_P_EvaluacionDocente_Usuario_CreadoPor";
--   ALTER TABLE "P_EvaluacionDocente_Usuario" DROP COLUMN "CreadoPorUsuarioId";
-- =====================================================================

ALTER TABLE "P_EvaluacionDocente_Usuario" ADD COLUMN IF NOT EXISTS "CreadoPorUsuarioId" INTEGER NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_P_EvaluacionDocente_Usuario_CreadoPor') THEN
        ALTER TABLE "P_EvaluacionDocente_Usuario"
            ADD CONSTRAINT "fk_P_EvaluacionDocente_Usuario_CreadoPor" FOREIGN KEY ("CreadoPorUsuarioId")
            REFERENCES "P_EvaluacionDocente_Usuario" ("Id");
    END IF;
END $$;
