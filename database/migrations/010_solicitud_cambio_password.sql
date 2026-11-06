/* =====================================================================
   Migracion 010 - Cambio de contrasena con aprobacion (SCRUM-80, RF11)
   Un alumno o docente que olvido su contrasena escribe la nueva; queda
   PENDIENTE (ya cifrada con bcrypt, nunca en texto plano) y no se aplica
   hasta que quien gestiona esa cuenta la aprueba. Reemplaza la
   recuperacion por correo, que se retira (ver migracion 011).

   Estados: Pendiente -> Aprobada | Rechazada | Reemplazada
   (Reemplazada: la misma cuenta mando otra solicitud antes de que se resolviera la anterior).
   Solo puede haber UNA solicitud pendiente por cuenta (indice unico parcial).

   Seguridad: la tabla guarda hashes, asi que se cierra a los roles de la Data API de Supabase
   (anon / authenticated) con RLS sin politicas y sin permisos; el backend, que se conecta con el
   rol duenio, es el unico que la lee y la escribe.

   Repetible. Reversa:
     DROP TABLE IF EXISTS "P_EvaluacionDocente_SolicitudCambioPassword";
   ===================================================================== */

BEGIN;

CREATE TABLE IF NOT EXISTS "P_EvaluacionDocente_SolicitudCambioPassword" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "UsuarioId"             INTEGER         NOT NULL,
    "NuevaPasswordHash"     VARCHAR(256)    NOT NULL,
    "Estado"                VARCHAR(12)     NOT NULL DEFAULT 'Pendiente',
    "FechaSolicitud"        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    "FechaResolucion"       TIMESTAMPTZ     NULL,
    "ResueltaPorUsuarioId"  INTEGER         NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_SolicitudCambioPassword" PRIMARY KEY ("Id"),
    CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_Estado"
        CHECK ("Estado" IN ('Pendiente', 'Aprobada', 'Rechazada', 'Reemplazada')),
    CONSTRAINT "ck_P_EvaluacionDocente_SolicitudCambioPassword_Resolucion"
        CHECK (("Estado" = 'Pendiente') = ("FechaResolucion" IS NULL)),
    CONSTRAINT "fk_P_EvaluacionDocente_SolicitudCambioPassword_Usuario" FOREIGN KEY ("UsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_SolicitudCambioPassword_ResueltaPor" FOREIGN KEY ("ResueltaPorUsuarioId")
        REFERENCES "P_EvaluacionDocente_Usuario" ("Id")
);

-- Una sola solicitud pendiente por cuenta: si dos llegan a la vez, una de las dos falla con 23505.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_P_EvaluacionDocente_SolicitudCambioPassword_Pendiente"
    ON "P_EvaluacionDocente_SolicitudCambioPassword" ("UsuarioId") WHERE "Estado" = 'Pendiente';
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_SolicitudCambioPassword_Estado"
    ON "P_EvaluacionDocente_SolicitudCambioPassword" ("Estado", "FechaSolicitud");

ALTER TABLE "P_EvaluacionDocente_SolicitudCambioPassword" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON "P_EvaluacionDocente_SolicitudCambioPassword" FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON "P_EvaluacionDocente_SolicitudCambioPassword" FROM authenticated;
    END IF;
END
$$;

COMMIT;
