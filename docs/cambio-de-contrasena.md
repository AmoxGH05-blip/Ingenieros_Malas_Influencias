# Cambio de contraseña con aprobación (SCRUM-80, RF11)

**Qué resuelve:** un alumno o docente que olvidó su contraseña no tiene correo real al que llegue un enlace (las cuentas son números de cuenta que asigna coordinación). En lugar de eso, **pide la contraseña nueva y alguien con autoridad sobre su cuenta la aprueba**. Reemplaza la recuperación por correo, que se retiró.

## Flujo

```
1. La persona (sin sesión)  →  /solicitar-cambio-password: número de cuenta + contraseña nueva
2. Queda PENDIENTE           →  la contraseña se guarda ya cifrada (bcrypt); la cuenta no cambia
3. Quien la gestiona         →  ve un aviso al iniciar sesión (ventana y campana) y el panel
                                /coordinador/solicitudes
4. Confirma la identidad     →  fuera del sistema (en persona, por teléfono...)
5. Aprueba o rechaza         →  al aprobar, la contraseña pedida pasa a ser la de la cuenta
```

Mientras la solicitud está pendiente, **la contraseña anterior sigue valiendo** y la nueva todavía no entra.

## Quién aprueba qué

Se usa la misma regla que para las altas de cuentas (`docs/altas-y-grupos.md`): lo resuelve quien ya puede gestionar esa cuenta.

| Cuenta que pide el cambio | Quién la ve y la resuelve |
|---|---|
| Alumno o docente | Coordinador o Administrador |
| Coordinador o Administrador | Solo un Administrador |
| Cuenta sin ningún rol | Solo un Administrador |

Nadie resuelve **su propia** solicitud. Si el único administrador olvida su contraseña, no hay quien la apruebe: hay que restablecerla con un script de base de datos (ver Limitaciones).

## Reglas

- La contraseña pedida cumple la política de siempre: mínimo 8 caracteres y máximo 72 bytes.
- **Una sola solicitud pendiente por cuenta**: una nueva reemplaza a la anterior (la vieja queda como "Reemplazada"). Lo garantiza un índice único parcial en la base.
- **Vencen a los 7 días** sin resolverse; ya no se muestran ni se pueden aprobar. La persona debe pedirla de nuevo.
- Al **aprobar**: se aplica el hash a la cuenta, se quita el cambio obligatorio (la contraseña la eligió su dueño) y se cierran sus sesiones abiertas. Todo en una transacción, con la solicitud y la cuenta bloqueadas, y volviendo a comprobar los roles de la cuenta en ese momento.
- Al **rechazar**: solo se marca la solicitud; la contraseña no cambia.
- **No revela qué cuentas existen**: la respuesta de la solicitud es la misma exista o no la cuenta, y el cifrado se hace siempre, para que tampoco lo delate el tiempo de respuesta.

## Límites de ritmo (solicitud pública)

| Ruta | Límite |
|---|---|
| `POST /api/auth/solicitar-cambio-password` | 10 por IP y 3 por IP + cuenta, cada 15 minutos |
| `/api/solicitudes-password/*` | 200 por usuario cada 15 minutos |

## API

| Método y ruta | Quién | Para qué |
|---|---|---|
| `POST /api/auth/solicitar-cambio-password` | Pública | Deja la solicitud pendiente. Cuerpo: `numeroCuenta`, `nuevaPassword`. `400` si no cumple el formato o la política. |
| `GET /api/solicitudes-password` | Coordinador, Administrador | Solicitudes vigentes de las cuentas que el actor puede gestionar. |
| `POST /api/solicitudes-password/:id/aprobar` | Coordinador, Administrador | Aplica la contraseña. `404` no existe, `409` ya resuelta o vencida, `403` cuenta que no gestiona o la propia, `400` cuenta inactiva. |
| `POST /api/solicitudes-password/:id/rechazar` | Coordinador, Administrador | Marca la solicitud como rechazada (mismos errores). |

Alumnos y docentes reciben `403` en las rutas de gestión; sin sesión, `401`.

## Avisos

`NotificacionService` suma un aviso para Coordinador y Administrador cuando hay solicitudes por resolver: título, cuántas son, las primeras cinco cuentas con nombre y un botón "Revisar solicitudes". Aparece en la ventana al iniciar sesión y en la campana, y desaparece al resolverlas (el panel recarga los avisos). Ver `docs/notificaciones.md`.

## Base de datos

- Migración `database/migrations/010_solicitud_cambio_password.sql`: tabla `P_EvaluacionDocente_SolicitudCambioPassword` (`UsuarioId`, `NuevaPasswordHash`, `Estado`, `FechaSolicitud`, `FechaResolucion`, `ResueltaPorUsuarioId`), con `CHECK` de estados y de que un estado resuelto tenga fecha de resolución, e índice único parcial de una pendiente por cuenta. También en `postgres_schema.sql`.
- **RLS activado sin políticas** y permisos revocados a `anon` y `authenticated`: la tabla guarda hashes y solo el backend (rol dueño) la lee.
- Migración `011_retirar_password_reset_token.sql`: elimina la tabla de tokens de la recuperación por correo.

## Qué se retiró

La recuperación por correo completa: `forgot-password` y `reset-password` (rutas, controlador y servicio), `EmailService`, el generador de tokens, la entidad y repositorio de tokens, las pantallas `ForgotPasswordPage` y `ResetPasswordPage`, la dependencia `nodemailer` y las variables `SMTP_*` y `FRONTEND_URL` de `render.yaml` y `.env.example`. **Ya se pueden borrar las variables SMTP y `CRON_SECRET` del panel de Render y de los secrets de GitHub** (no se usan).

## Qué hace falta de quien aprueba

El sistema no puede saber si quien pidió el cambio es el dueño de la cuenta: **cualquiera que conozca un número de cuenta puede enviar una solicitud**. La defensa es que la contraseña no cambia hasta que una persona la aprueba, y esa persona debe **confirmar la identidad fuera del sistema** antes de aprobar (el panel lo recuerda y pide una segunda confirmación). Un rechazo no afecta a la cuenta. Los límites de ritmo frenan la inundación de solicitudes.

## Pruebas

- 24 pruebas del servicio (`SolicitudPasswordService.test.ts`): código y contraseña guardados cifrados, solicitud que reemplaza a la pendiente y le borra el hash, respuesta antes de guardar, misma respuesta con cuenta inexistente o inactiva, validación sin consultar la base, reintento ante dos solicitudes simultáneas, listado por jerarquía, solo vigentes, sin la propia solicitud, aviso de reemplazo, actor leído de la base (degradado o desactivado), aprobar con el código correcto (hash aplicado, sesiones cerradas, quién resolvió), códigos incorrectos o ausentes, rechazar sin código, bloqueos de la solicitud y la cuenta, roles frescos, autoaprobación, `404`/`409`/`400` y permisos.
- Pruebas de permisos por ruta (`solicitudesPassword.routes.test.ts`), del límite de ritmo (`limitadores.test.ts`) y del aviso (`NotificacionService.test.ts`). 277 pruebas en el backend.
- Contra Supabase, 25 comprobaciones de punta a punta: solicitud pública (con cuenta existente e inexistente), contraseña vieja vigente mientras está pendiente, aviso al coordinador, **ataque de reemplazo** (el código de la persona real no sirve para la solicitud del atacante, y sin código o con uno equivocado no se aprueba nada), aprobación con código en minúsculas y espacios, jerarquía (el coordinador no ve ni resuelve solicitudes de coordinadores), rechazo sin código y `400`/`401`/`403`/`404`/`409`. En la base se comprobó que las solicitudes resueltas o reemplazadas quedan sin hash.
- En el navegador: pantalla del alumno con el código, aviso y panel del coordinador, código equivocado (el error se queda visible y el formulario abierto) y aprobación con el código correcto. En producción: la solicitud pública responde con código y la ruta `forgot-password` ya no existe.

## Limitaciones

- **No hay restablecimiento para el único administrador.** Si olvida su contraseña, se restablece con un script (`UPDATE` del hash en la base). Un segundo administrador resuelve el problema por la vía normal.
- Los tokens JWT no se revocan: al aprobar se cierran las sesiones registradas, pero un token ya emitido sigue siendo válido hasta cumplir sus 8 horas (riesgo aceptado, igual que en el cierre de sesión).
- No hay historial visible de solicitudes resueltas en la pantalla (quedan en la tabla).
- Los límites de ritmo viven en memoria de un solo servidor.

## Actualización: código de verificación (revisión de seguridad, 5-nov-2026)

Para que una solicitud ajena que reemplaza a la real no se apruebe por error, la solicitud pública devuelve un **código de 6 caracteres que solo ve quien la manda** (se muestra una vez en su pantalla; se guarda su hash SHA-256). **Quien aprueba debe teclearlo** en el panel; rechazar no lo pide. Si la persona lo pierde, envía otra solicitud. Además:

- La solicitud responde antes de guardar, y entrega un código también si la cuenta no existe, para que ni la respuesta ni el tiempo revelen qué cuentas existen.
- La tarjeta avisa cuando una solicitud **reemplazó** a otra que seguía pendiente.
- Quien aprueba se lee de la base (cuenta activa y roles actuales), no del token: un coordinador desactivado o degradado ya no aprueba.
- Al resolver o reemplazar, la solicitud **pierde su hash** (solo la pendiente lo conserva); migración 012.
- El límite por IP sube a 30 (un campus puede salir por una sola IP); por IP y cuenta sigue en 3.
- Pendiente aparte: validar los tokens contra la tabla de sesiones en cada petición (hoy un token ya emitido vale hasta 8 horas).

