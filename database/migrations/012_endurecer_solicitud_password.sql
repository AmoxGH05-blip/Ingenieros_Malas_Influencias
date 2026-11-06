/* =====================================================================
   Migracion 012 - Endurece la tabla de solicitudes de contrasena (SCRUM-80)
   Salio de las revisiones de seguridad y de SQL de la migracion 010.
   La tabla es nueva y estaba vacia al aplicar esta migracion.

   - CodigoHash: codigo de verificacion que ve UNA vez quien manda la solicitud (hash SHA-256).
     Quien aprueba debe teclearlo: asi una solicitud ajena que reemplaza a la real no se aprueba
     por error. Las solicitudes viejas no lo tienen (DEFAULT '' y luego sin default; la tabla estaba vacia).
   - NuevaPasswordHash pasa a ser NULL cuando la solicitud se resuelve o se reemplaza: solo la
     pendiente necesita el hash. Asi no se acumulan hashes de contrasenas reales en la tabla ni
     en los respaldos. ck_..._HashPendiente lo garantiza.
   - ck_..._ResueltaPor: una solicitud Aprobada o Rechazada tiene quien la resolvio; una
     Pendiente o Reemplazada no; y nadie resuelve su propia solicitud (tambien lo exige la app).
   - ck_..._HashBcrypt: lo guardado en NuevaPasswordHash tiene forma de hash bcrypt, para que un
     error que guardara la contrasena en claro falle en vez de pasar inadvertido.
   - Indices: las FK (convencion del proyecto) y la consulta real de pendientes, que solo mira
     las filas Pendiente (el indice anterior por Estado tambien indexaba las ya resueltas).
   - La secuencia de la identidad se cierra a anon / authenticated, igual que la tabla.

   Repetible. Reversa:
     ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
       DROP CONSTRAINT IF EXISTS "ck_P_EvaluacionDocente_SolicitudCambioPassword_ResueltaPor",
       DROP CONSTRAINT IF EXISTS "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashBcrypt",
       DROP CONSTRAINT IF EXISTS "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashPendiente",
       DROP COLUMN IF EXISTS "CodigoHash";
     (las solicitudes pendientes sin hash dejarian de poder aprobarse: pedir otra)
   ===================================================================== */

BEGIN;

ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
    ADD COLUMN IF NOT EXISTS "CodigoHash" VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword" ALTER COLUMN "CodigoHash" DROP DEFAULT;
ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword" ALTER COLUMN "NuevaPasswordHash" DROP NOT NULL;

DO $$
BEGIN
    -- Una version anterior de esta migracion uso un nombre de 64 caracteres, que PostgreSQL trunca a 63.
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_P_EvaluacionDocente_SolicitudCambioPassword_HashSoloPendient') THEN
        ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
            RENAME CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashSoloPendient"
            TO "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashPendiente";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_P_EvaluacionDocente_SolicitudCambioPassword_HashPendiente') THEN
        ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
            ADD CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashPendiente"
            CHECK (("Estado" = 'Pendiente') = ("NuevaPasswordHash" IS NOT NULL));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_P_EvaluacionDocente_SolicitudCambioPassword_ResueltaPor') THEN
        ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
            ADD CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_ResueltaPor"
            CHECK (("Estado" IN ('Aprobada', 'Rechazada')) = ("ResueltaPorUsuarioId" IS NOT NULL)
                   AND "ResueltaPorUsuarioId" IS DISTINCT FROM "UsuarioId");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_P_EvaluacionDocente_SolicitudCambioPassword_HashBcrypt') THEN
        ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword"
            ADD CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_HashBcrypt"
            CHECK ("NuevaPasswordHash" IS NULL OR "NuevaPasswordHash" ~ '^\$2[aby]\$[0-9]{2}\$.{53}$');
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_SolicitudCambioPassword_Usuario"
    ON "P_EvaluacionDocente_SolicitudCambioPassword" ("UsuarioId", "FechaSolicitud" DESC);
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_SolicitudCambioPassword_ResueltaPor"
    ON "P_EvaluacionDocente_SolicitudCambioPassword" ("ResueltaPorUsuarioId") WHERE "ResueltaPorUsuarioId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_SolicitudCambioPassword_Pendientes"
    ON "P_EvaluacionDocente_SolicitudCambioPassword" ("FechaSolicitud") WHERE "Estado" = 'Pendiente';
DROP INDEX IF EXISTS "ix_P_EvaluacionDocente_SolicitudCambioPassword_Estado";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON SEQUENCE "P_EvaluacionDocente_SolicitudCambioPassword_Id_seq" FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON SEQUENCE "P_EvaluacionDocente_SolicitudCambioPassword_Id_seq" FROM authenticated;
    END IF;
END
$$;

COMMIT;
