# Pruebas de autenticación

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-30

## Cómo correrlas

```bash
cd backend
npm install
npm test              # corre la suite una vez
npm run test:coverage # con reporte de cobertura
```

No requieren conexión a la base de datos — la capa de repositorios se mockea con Vitest (`vi.mock`), así que corren rápido y de forma determinista en cualquier máquina, incluida CI si se configura más adelante.

## Qué cubren

Los archivos de abajo se ampliaron con SCRUM-78 (login por número de cuenta): ver también `docs/acceso-y-cuentas.md`. El conteo total de pruebas del backend está en `PROGRESS.md`.

### `src/services/AuthService.test.ts`

- **Login correcto:** genera el JWT, y registra la fila de `Sesion` correspondiente.
- **Número de cuenta inexistente:** rechazado con el mismo error genérico.
- **Identificador con formato inválido** (un correo, espacios, símbolos, más de 20 caracteres): rechazado sin consultar la base. El correo ya no sirve para entrar (SCRUM-78).
- **Mayúsculas y espacios:** se ignoran; el número se busca en mayúsculas.
- **Tipo de cuenta:** sale del rol de mayor prioridad (Administrador, Coordinador, Docente, Estudiante).
- **Cambio obligatorio:** la marca `debeCambiarPassword` llega en la respuesta y dentro del token.
- **Cambiar contraseña:** actual incorrecta, nueva demasiado corta o larga o igual a la actual, cuenta inexistente o inactiva; en el caso válido guarda el hash nuevo, quita la marca, cierra las sesiones anteriores y entrega un token sin restricción.
- **Contraseña incorrecta:** rechazada con el mismo error genérico (no revela si la cuenta existe).
- **Usuario inactivo:** rechazado aunque la contraseña sea correcta.
- _La recuperación por correo (token, hash SHA-256, envío) se retiró con SCRUM-80 y sus pruebas se eliminaron. Las del flujo nuevo están en `docs/cambio-de-contrasena.md`._

### `src/utils/jwt.test.ts`

- Firma y verifica un token, preservando el payload (incluido `jti`).
- Rechaza un token firmado con otro secreto.
- Rechaza un token manipulado.
- Falla explícitamente si `JWT_SECRET` no está configurado (en vez de firmar con un valor por defecto inseguro).

## Cobertura actual

`AuthService.ts`: 95.6% líneas · `jwt.ts`: 100% líneas. (`RolService.ts` sin cobertura: es un wrapper trivial, no lógica de seguridad).

## Pruebas manuales end-to-end (complementarias, ya realizadas en SCRUM-26/27/28/29)

Además de estas pruebas automatizadas, cada endpoint de auth se probó por HTTP contra el servidor real durante su desarrollo (el correo se retiró después, con SCRUM-80) — con datos de prueba insertados y eliminados en la misma sesión de trabajo. Ver el detalle en `PROGRESS.md` (SCRUM-26, SCRUM-27, SCRUM-29).

Ver también `docs/seguridad-checklist.md` para el checklist de seguridad asociado.
