/* =====================================================================
   Migracion 015 - Endurece talleres y laboratorios (SCRUM-53/54)
   Sale de las revisiones de SQL y seguridad de la migracion 014. Todo es idempotente.

   - Nombre unico por carrera SIN distinguir mayusculas ni espacios en los extremos, ahora en la base: antes solo lo
     comprobaba la aplicacion y dos altas simultaneas ("Lab" y "lab") pasaban las dos.
   - Una respuesta solo puede apuntar a una opcion DE SU PREGUNTA: FK compuesta (PreguntaId, OpcionRespuestaId) hacia
     OpcionRespuesta (PreguntaId, Id). Antes dos FK independientes permitian guardar la opcion de otra pregunta y el
     promedio salia mal sin ningun error.
   ===================================================================== */

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "P_EvaluacionDocente_Taller"
        GROUP BY "ProgramaEducativoId", lower(btrim("Nombre")) HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Hay talleres duplicados (mismo nombre sin distinguir mayusculas en la misma carrera): resuelvelos antes de aplicar la 015.';
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_P_EvaluacionDocente_Taller_Carrera_NombreNormalizado"
    ON "P_EvaluacionDocente_Taller" ("ProgramaEducativoId", lower(btrim("Nombre")));

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_P_EvaluacionDocente_OpcionRespuesta_Pregunta_Id') THEN
        ALTER TABLE "P_EvaluacionDocente_OpcionRespuesta"
            ADD CONSTRAINT "uq_P_EvaluacionDocente_OpcionRespuesta_Pregunta_Id" UNIQUE ("PreguntaId", "Id");
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "P_EvaluacionDocente_RespuestaEvaluacionTaller" r
        JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."Id" = r."OpcionRespuestaId"
        WHERE o."PreguntaId" <> r."PreguntaId"
    ) THEN
        RAISE EXCEPTION 'Hay respuestas de talleres con una opcion de otra pregunta: corrigelas antes de aplicar la 015.';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_P_EvaluacionDocente_RespuestaEvaluacionTaller_Opcion') THEN
        ALTER TABLE "P_EvaluacionDocente_RespuestaEvaluacionTaller"
            DROP CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacionTaller_Opcion";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_P_EvaluacionDocente_RespuestaTaller_PreguntaOpcion') THEN
        ALTER TABLE "P_EvaluacionDocente_RespuestaEvaluacionTaller"
            ADD CONSTRAINT "fk_P_EvaluacionDocente_RespuestaTaller_PreguntaOpcion" FOREIGN KEY ("PreguntaId", "OpcionRespuestaId")
            REFERENCES "P_EvaluacionDocente_OpcionRespuesta" ("PreguntaId", "Id");
    END IF;
END
$$;
