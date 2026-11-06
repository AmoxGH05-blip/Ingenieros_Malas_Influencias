/* =====================================================================
   Migracion 011 - Retira la recuperacion de contrasena por correo (SCRUM-80)
   La tabla de tokens (migracion 002) ya no la usa nada: el cambio de
   contrasena es ahora una solicitud con aprobacion (migracion 010).

   Aplicar DESPUES de desplegar el backend que ya no la usa.
   Reversa (solo estructura; los tokens eran de un solo uso y vencian a los 30 minutos):
     ver database/migrations/002_sesiones_y_reset_password.sql
   ===================================================================== */

BEGIN;

DROP TABLE IF EXISTS "P_EvaluacionDocente_PasswordResetToken";

COMMIT;
