-- =====================================================================
-- Migracion 007 (PostgreSQL / Supabase): login por numero de cuenta
-- Jira: SCRUM-78. Requisito de la revision con la coordinadora: no iniciar sesion con correos
-- personales; todos los roles entran con numero de cuenta.
--
--   * Usuario.NumeroCuenta: unico y obligatorio, en MAYUSCULAS. Se rellena con la matricula (alumnos)
--     o el numero de empleado (docentes); la cuenta de coordinacion demo queda como COORD0001.
--   * Usuario.DebeCambiarPassword: la contrasena la puso otra persona (alta o cuenta inicial) y debe
--     cambiarse en el primer inicio de sesion. Las cuentas existentes quedan en false.
--
-- El correo se conserva como dato de contacto, pero ya no sirve para entrar.
-- Es repetible. Reversa:
--   ALTER TABLE "P_EvaluacionDocente_Usuario" DROP CONSTRAINT "uq_P_EvaluacionDocente_Usuario_NumeroCuenta";
--   ALTER TABLE "P_EvaluacionDocente_Usuario" DROP COLUMN "NumeroCuenta", DROP COLUMN "DebeCambiarPassword";
-- =====================================================================

ALTER TABLE "P_EvaluacionDocente_Usuario" ADD COLUMN IF NOT EXISTS "NumeroCuenta" VARCHAR(20);
ALTER TABLE "P_EvaluacionDocente_Usuario" ADD COLUMN IF NOT EXISTS "DebeCambiarPassword" BOOLEAN NOT NULL DEFAULT false;

UPDATE "P_EvaluacionDocente_Usuario" u
SET "NumeroCuenta" = UPPER(e."Matricula")
FROM "P_EvaluacionDocente_Estudiante" e
WHERE e."UsuarioId" = u."Id" AND u."NumeroCuenta" IS NULL;

UPDATE "P_EvaluacionDocente_Usuario" u
SET "NumeroCuenta" = UPPER(d."NumeroEmpleado")
FROM "P_EvaluacionDocente_Docente" d
WHERE d."UsuarioId" = u."Id" AND u."NumeroCuenta" IS NULL;

UPDATE "P_EvaluacionDocente_Usuario"
SET "NumeroCuenta" = 'COORD0001'
WHERE "CorreoElectronico" = 'coordinacion@dygsis.local' AND "NumeroCuenta" IS NULL;

-- Cualquier otra cuenta sin matricula ni numero de empleado recibe un numero provisional.
UPDATE "P_EvaluacionDocente_Usuario"
SET "NumeroCuenta" = 'U' || LPAD("Id"::text, 6, '0')
WHERE "NumeroCuenta" IS NULL;

ALTER TABLE "P_EvaluacionDocente_Usuario" ALTER COLUMN "NumeroCuenta" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_P_EvaluacionDocente_Usuario_NumeroCuenta') THEN
        ALTER TABLE "P_EvaluacionDocente_Usuario"
            ADD CONSTRAINT "uq_P_EvaluacionDocente_Usuario_NumeroCuenta" UNIQUE ("NumeroCuenta");
    END IF;
END $$;
