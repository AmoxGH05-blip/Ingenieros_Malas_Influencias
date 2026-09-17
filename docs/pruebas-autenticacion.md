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

No requieren conexión a la base de datos ni al SMTP real — la capa de repositorios y `EmailService` se mockean con Vitest (`vi.mock`), así que corren rápido y de forma determinista en cualquier máquina, incluida CI si se configura más adelante.

## Qué cubren (16 pruebas, 3 archivos)

### `src/services/AuthService.test.ts`

- **Login correcto:** genera el JWT, y registra la fila de `Sesion` correspondiente.
- **Número de cuenta inexistente:** rechazado, sin llegar a consultar `Usuario`.
- **Contraseña incorrecta:** rechazada con el mismo error genérico (no revela si la cuenta existe).
- **Usuario inactivo:** rechazado aunque la contraseña sea correcta.
- **Recuperación — correo no registrado:** no envía correo ni crea token (respuesta silenciosa).
- **Recuperación — correo registrado:** crea el token, guarda solo su hash SHA-256 (nunca el token crudo), y llama al envío de correo con el enlace correcto.
- **Reset — token inválido/expirado/usado:** rechazado, no toca la contraseña.
- **Reset — token válido:** actualiza el hash de la contraseña (verificado con `bcrypt.compare` contra la nueva contraseña en texto plano), marca el token como usado, y desactiva todas las sesiones activas del usuario.

### `src/utils/jwt.test.ts`

- Firma y verifica un token, preservando el payload (incluido `jti`).
- Rechaza un token firmado con otro secreto.
- Rechaza un token manipulado.
- Falla explícitamente si `JWT_SECRET` no está configurado (en vez de firmar con un valor por defecto inseguro).

### `src/utils/resetToken.test.ts`

- Cada token generado es distinto.
- El hash generado junto al token coincide con volver a hashear ese mismo token por separado.
- El token crudo nunca es igual a su hash.
- El hash tiene el formato esperado (SHA-256 hexadecimal, 64 caracteres).

## Cobertura actual

`AuthService.ts`: 95.6% líneas · `jwt.ts`: 100% líneas. (`EmailService.ts`/`RolService.ts` sin cobertura — son wrappers triviales, no lógica de seguridad; se dejan fuera del alcance de esta tarea).

## Pruebas manuales end-to-end (complementarias, ya realizadas en SCRUM-26/27/28/29)

Además de estas pruebas automatizadas, cada endpoint de auth se probó por HTTP contra el servidor real (`Central-Data`) y el SMTP real durante su desarrollo — con datos de prueba insertados y eliminados en la misma sesión de trabajo. Ver el detalle en `PROGRESS.md` (SCRUM-26, SCRUM-27, SCRUM-29).

Ver también `docs/seguridad-checklist.md` para el checklist de seguridad asociado.
