# Checklist de seguridad — Autenticación

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-30
**Alcance:** módulo de autenticación (login, sesiones, recuperación de contraseña) — `backend/src/services/AuthService.ts` y relacionados.

> Verificado el 17-sep-2026 revisando el código real y corriendo la suite de pruebas automatizadas (`backend/npm test`, 16 pruebas, ver `docs/pruebas-autenticacion.md`).

| # | Punto de control | Estado | Evidencia |
|---|---|---|---|
| 1 | Las contraseñas se almacenan con hash, nunca en texto plano | ✅ Cumple | `bcryptjs`, costo 10, en `AuthService.login` (verificación) y `AuthService.restablecerPassword` (`bcrypt.hash(nuevaPassword, 10)`). Probado en `AuthService.test.ts`. |
| 2 | El hash de contraseña usa un algoritmo lento y con salt (no MD5/SHA plano) | ✅ Cumple | bcrypt genera salt por hash automáticamente; costo 10 es razonable para este volumen de usuarios. |
| 3 | Las respuestas de login no revelan si el error fue "cuenta no existe" o "contraseña incorrecta" | ✅ Cumple | `AuthController.login` siempre responde `"Numero de cuenta o contrasena incorrectos"` (401), sin distinguir el caso. Probado en `AuthService.test.ts`. |
| 4 | `forgot-password` no revela si un correo está registrado | ✅ Cumple | Mismo mensaje genérico exista o no el usuario; `EmailService` solo se invoca si existe. Probado en `AuthService.test.ts`. |
| 5 | Los tokens de recuperación son de un solo uso y con vigencia corta | ✅ Cumple | 30 minutos (`RESET_TOKEN_DURATION_MINUTOS`), columna `Usado` se marca tras usarse; reutilizar el mismo token falla (probado manualmente en SCRUM-27 contra el servidor real). |
| 6 | El token de recuperación nunca se guarda en texto plano en la base de datos | ✅ Cumple | Solo se guarda `SHA-256(token)`; el valor crudo únicamente viaja en el correo. Probado en `AuthService.test.ts` (`tokenHash` de 64 caracteres hex, distinto del token). |
| 7 | Al resetear la contraseña, las sesiones previas quedan invalidadas | ✅ Cumple | `restablecerPassword` llama `SesionRepository.desactivarTodasDeUsuario`. Probado en `AuthService.test.ts` y manualmente contra el servidor real (SCRUM-27). |
| 8 | El JWT está firmado con un secreto fuera del código fuente | ✅ Cumple | `JWT_SECRET` viene de `backend/.env` (gitignored), nunca hardcodeado. `signToken`/`verifyToken` fallan explícitamente si falta. Probado en `jwt.test.ts`. |
| 9 | El JWT tiene expiración | ✅ Cumple | `SESSION_DURATION_HOURS` (8h por defecto) controla tanto el `expiresIn` del JWT como la `FechaExpiracion` de la fila en `Sesion`. |
| 10 | Un JWT manipulado o firmado con otro secreto es rechazado | ✅ Cumple | Probado en `jwt.test.ts` (token alterado y token firmado con otro secreto). |
| 11 | Las credenciales de BD/JWT/SMTP no están en el repositorio | ✅ Cumple | Solo en `backend/.env` (gitignored); `.env.example` sin valores. Verificado con `git status`/`git log` en cada tarea de este sprint. |
| 12 | Dependencias sin vulnerabilidades conocidas | ✅ Cumple | `npm audit` → 0 vulnerabilidades (se corrigió una alta en `nodemailer` durante SCRUM-27, actualizando a la v10). |
| 13 | Autorización por rol en rutas del backend | ⚠️ Pendiente | Middleware de control de acceso por roles es **SCRUM-62** (Sprint 6, EP10) — todavía no existe; hoy cualquier request autenticado podría llamar cualquier endpoint si se construyeran más rutas. Documentado como riesgo a cerrar antes de Sprint 6. |
| 14 | Sesión no se puede revocar del lado del cliente sin backend | ⚠️ Pendiente | El frontend guarda el JWT en `localStorage` (ver `frontend/README.md`) — funcional pero no es el patrón más seguro (expuesto a robo vía XSS). Anotado como mejora futura, no bloqueante para el sprint actual. |
| 15 | Bitácora de auditoría de acciones sensibles | ⚠️ Pendiente | Parte de SCRUM-62 (Sprint 6). Hoy no hay registro de intentos de login fallidos ni de cambios de contraseña más allá de las filas de `Sesion`/`PasswordResetToken`. |

## Resumen

12 de 15 controles cumplidos para el alcance actual del módulo de autenticación (Sprint 1). Los 3 pendientes (autorización por rol, revocación de sesión más robusta, bitácora de auditoría) están correctamente diferidos a EP10/SCRUM-62 en Sprint 6 — no son regresiones, son trabajo que el backlog ya tenía planeado más adelante.
