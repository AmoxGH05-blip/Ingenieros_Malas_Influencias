# Acceso y cuentas (SCRUM-78)

Requisito de la revisión con la coordinadora: no iniciar sesión con correos personales. **Todos los roles entran con número de cuenta**, como en la universidad (por ejemplo, la matrícula `010181605`).

## Iniciar sesión

- Se teclea el **número de cuenta** y la contraseña. Mayúsculas y espacios alrededor no importan; el número se guarda en mayúsculas.
- El correo **ya no sirve** para entrar (responde 401). Se conserva en la cuenta solo como dato de contacto.
- Un número de cuenta puede tener solo letras y números, sin espacios, hasta 20 caracteres. Es único entre todos los roles.
- El tipo de cuenta que ve la interfaz sale del rol de mayor prioridad (Administrador, Coordinador, Docente, Estudiante); las cuentas con varios roles pueden cambiar de vista.

## Contraseña temporal: cambio obligatorio

Cuando otra persona pone la contraseña (alta de usuario o cuenta inicial), la cuenta nace marcada con `DebeCambiarPassword`:

1. Al iniciar sesión, el sistema lleva a **"Elige tu contraseña"** (`/cambiar-password`) y no deja entrar a nada más.
2. La API lo refuerza: mientras la marca esté activa, **todas las rutas responden 403** con el código `CAMBIO_PASSWORD_REQUERIDO`, salvo `POST /api/auth/cambiar-password`.
3. El cambio pide la contraseña temporal, la nueva y su confirmación (ver la política abajo, y debe ser distinta de la actual). Marca como cerradas las sesiones anteriores y entrega una sesión nueva, ya sin restricción. Ojo: los tokens ya emitidos siguen valiendo hasta que expiren (ver "Riesgos aceptados").

Las cuentas demo existentes **no** tienen la marca, para no estorbar las demostraciones.

## Cuenta inicial de Administrador

Para una base real, la primera cuenta se crea con un script. La contraseña se lee de una variable de entorno; con `read -rs` se escribe sin mostrarse y **no queda en el historial** de la terminal (no la pongas en la propia línea del comando, porque ahí sí quedaría). Desde `backend/`, en Git Bash:

```bash
read -rs ADMIN_PASSWORD && export ADMIN_PASSWORD && npm run admin:inicial
```

En PowerShell: `$s = Read-Host -AsSecureString; $env:ADMIN_PASSWORD = [Net.NetworkCredential]::new('', $s).Password` y luego `npm run admin:inicial`.

Opcionales: `ADMIN_NUMERO_CUENTA` (por defecto `ADMIN0001`) y `ADMIN_CORREO` (por defecto `<cuenta>@dygsis.local`). La cuenta queda con cambio obligatorio. El script **nunca pisa** una cuenta existente: si el número de cuenta o el correo ya están en uso, no cambia nada.

Para ejecutarlo contra producción usa las mismas variables `DB_*` de `backend/.env` (apuntan a la base de Supabase).

## Política de contraseñas

Mínimo 8 caracteres y **máximo 72 bytes**. Se miden bytes y no caracteres porque bcrypt solo usa los primeros 72 bytes, y la ñ, los acentos y los emojis ocupan más de uno (una contraseña de 40 `ñ` mide 80 bytes y se rechaza). Dos contraseñas que solo difieren después del byte 72 cuentan como la misma. La misma regla se aplica al cambio, al alta de usuarios, a la cuenta inicial y a la recuperación por correo.

## Límite de intentos

Los números de cuenta son predecibles y las contraseñas temporales las elige una persona, así que el login y el cambio de contraseña limitan los intentos **fallidos** en ventanas de 15 minutos. Pasado el límite responden `429` y ni la contraseña correcta entra hasta que termine la ventana.

| Ruta | Límite |
|---|---|
| `POST /api/auth/login` | 5 por IP y número de cuenta, y 30 por IP en total |
| `POST /api/auth/cambiar-password` | 10 por usuario |
| `POST /api/auth/forgot-password` y `/reset-password` | 10 por IP (se retiran con SCRUM-80) |

Se cuenta por la IP real del cliente: en Render hay un Cloudflare delante, así que se lee `CF-Connecting-IP` (Cloudflare la reescribe en cada petición y el cliente no puede falsearla); sin ese encabezado, como en local, se usa la IP de la conexión. Los inicios de sesión correctos no cuentan. Los contadores viven en memoria y Render gratuito reinicia el servicio al dormirlo, así que el límite se reinicia con él; frena la fuerza bruta continua, no es un bloqueo permanente.

## Alta de usuarios (panel del Administrador)

En **Usuarios → Nuevo usuario**:

| Rol | Campos |
|---|---|
| Estudiante | Matrícula (= número de cuenta), nombre, apellidos, programa educativo, contraseña temporal. El correo es opcional: vacío, se asigna `a<matrícula>@my.uvm.edu.mx`. |
| Docente | Número de empleado (= número de cuenta), nombre, apellidos, facultad, correo, contraseña temporal. |
| Coordinador / Administrador | Número de cuenta, correo, contraseña temporal. |

Toda cuenta creada así nace con cambio obligatorio. Las altas jerárquicas (el Administrador crea coordinadores, el Coordinador crea alumnos, docentes y grupos) llegan con SCRUM-79.

## Cuentas demo

Contraseña de todas: `Demo2026!` (sin cambio obligatorio).

| Número de cuenta | Rol | Para qué sirve |
|---|---|---|
| `DEMO0001` | Estudiante + Administrador | Vista de alumno y panel de administración |
| `COORD0001` | Coordinador | Dashboard de avance de evaluaciones (antes entraba por `coordinacion@dygsis.local`) |
| `DEMO0002` a `DEMO0005` | Estudiante | Alumnos con avance 5/5, 2/5, 1/5 y 0/5 |
| `EMP0001` a `EMP0005` | Docente | Catálogo de docentes (sin pantalla propia todavía) |

## Base de datos

Migración `database/migrations/007_numero_cuenta_login.sql`: agrega `Usuario.NumeroCuenta` (único y obligatorio, rellenado con la matrícula o el número de empleado) y `Usuario.DebeCambiarPassword`. Es repetible y trae la reversa en el encabezado.

## Verificación hecha

- 120 pruebas en backend, entre ellas: login por número de cuenta, rechazo de correos e identificadores raros, tipo de cuenta por prioridad, cambio de contraseña (actual incorrecta, nueva inválida, cuenta inactiva, sesiones marcadas como cerradas, marca en el token), bloqueo con 403 mientras la marca esté activa, política de 72 bytes, límites de intentos, altas simultáneas que chocan en la base y servicio de la cuenta inicial.
- Límite de intentos con el servidor real: 5 intentos fallidos dan 401 y el sexto 429; mayúsculas y minúsculas cuentan como la misma cuenta; otra cuenta sigue entrando.
- 26 comprobaciones de punta a punta contra Supabase con cuentas temporales que se borraron al terminar: script de cuenta inicial (crea, no pisa, exige contraseña), cambio obligatorio completo con 403 intermedio, sesiones viejas cerradas y alta de alumno con correo institucional.
- En el navegador: el login dice "Número de cuenta", una cuenta marcada no puede saltarse `/cambiar-password`, el error de confirmación y el cambio correcto funcionan, el menú superior muestra el número de cuenta y el formulario de alta cambia por rol.

## Riesgos aceptados y pendientes

Salieron de la revisión de seguridad de este cambio. Quedan documentados a propósito:

- **Cuentas demo con contraseña pública (pendiente antes de la entrega).** `DEMO0001` (con rol Administrador), `COORD0001` y las demás usan `Demo2026!`, que aparece en el repo y en los docs, y existen también en producción. Mientras sean datos de prueba, es aceptable; **antes de la entrega final hay que desactivarlas** (`UPDATE "P_EvaluacionDocente_Usuario" SET "Activo" = false WHERE "CorreoElectronico" LIKE '%@dygsis.local'`) y crear el administrador real con el script de arriba.
- **Los tokens valen hasta 8 horas aunque se cambie la contraseña o se desactive la cuenta.** `requireAuth` verifica la firma del token pero no consulta la tabla de sesiones, para no hacer una consulta a la base remota en cada petición. Desactivar las filas de `Sesion` queda registrado, pero no invalida tokens ya emitidos. Si SCRUM-80 (cambio de contraseña con aprobación) lo requiere, se puede validar el `jti` contra la tabla con una caché corta.
- **Tokens anteriores a este cambio no traen la marca de cambio obligatorio** y se tratan como sin marca. No es explotable (falsificar el token exige el secreto), y cerrarlo dejaría sin acceso a quien tenga una sesión abierta al desplegar; expiran solos en 8 horas.
- **`forgot-password` responde más lento cuando el correo existe** (envía el correo). Es código anterior que SCRUM-80 retira.

## Nota técnica

Al revisar este trabajo se encontró un resto de la migración desde SQL Server: `SesionRepository.desactivarTodasDeUsuario` usaba `SYSDATETIME()` y `Activa = 1`, que no existen en PostgreSQL. Habría hecho fallar el cambio de contraseña en producción (y la recuperación por correo que ya existía). Quedó corregido con la API de TypeORM.
