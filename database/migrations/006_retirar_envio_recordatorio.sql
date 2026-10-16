-- =====================================================================
-- Migracion 006 (PostgreSQL / Supabase): retirar el registro de recordatorios por correo
-- Jira: SCRUM-40 cambio de alcance (16-oct-2026): los avisos se muestran al iniciar sesion y ya no
-- se envian correos, asi que la tabla de envios (migracion 005) deja de usarse. Nunca tuvo datos
-- reales: el unico envio de prueba se borro.
--
-- Reversa: volver a ejecutar database/migrations/005_envio_recordatorio.sql.
-- =====================================================================

DROP TABLE IF EXISTS "P_EvaluacionDocente_EnvioRecordatorio";
