# Notificaciones al iniciar sesión (SCRUM-40)

El sistema no envía correos. Los avisos se muestran dentro de la página, al iniciar sesión.

**Por qué sin correos:** las cuentas de alumnos y docentes son números de cuenta que asigna coordinación, sin buzón real al que mandar nada; además Render gratuito bloquea los puertos SMTP y el remitente de Brevo no se pudo validar. El primer enfoque (recordatorios por correo con un cron) se construyó y se retiró; el historial está en los commits `02df399` a `f83509e`.

## Qué ve cada rol

| Rol | Aviso |
|---|---|
| Alumno | Cuando faltan **7 días o menos** para el cierre del periodo de evaluación y tiene evaluaciones pendientes: título con los días, mensaje con la cantidad y la fecha de cierre, y la lista de materias pendientes con su docente. |
| Docente, Coordinador, Administrador | Ninguno por ahora. Los avisos de solicitudes de contraseña de SCRUM-80 usarán este mismo mecanismo. |

La gravedad sube con la cercanía del cierre: normal (4 a 7 días), aviso (2 a 3) y urgente (hoy o mañana). El mismo día del cierre el título es "Hoy cierra la evaluación docente".

## Dónde aparece

- **Ventana al entrar:** una sola vez por inicio de sesión (la marca se guarda junto a la sesión, así que otra pestaña con la misma sesión no la repite). Se cierra con "Cerrar", con Escape o al hacer clic fuera. "Ir a evaluar" lleva al listado de evaluaciones.
- **Campana de la barra superior:** muestra un punto rojo y el número de avisos, y al abrirla lista los avisos con enlace. Si no hay, dice "No tienes avisos nuevos"; si la API falla, lo indica y la app sigue funcionando.
- Los avisos se piden al entrar y otra vez al volver a la pestaña, para que una pestaña olvidada no quede desactualizada.

## Cómo funciona

- `GET /api/notificaciones` (requiere sesión) responde `{ "notificaciones": [...] }` según los roles del JWT.
- Para el alumno, `NotificacionService` toma el periodo de evaluación activo y cuenta los **días de calendario** hasta `FechaFin` en hora de Ciudad de México (0 = cierra hoy, 1 = mañana), de modo que "Faltan 3 días" siempre coincide con la fecha que se muestra. Si ya empezó, no ha cerrado y faltan 7 o menos, lista las materias de sus inscripciones del ciclo que no tienen evaluación completada.
- **Solo lee.** A diferencia del dashboard, no crea filas de `Evaluacion`, así que consultar avisos no cambia datos. Parte de `Inscripcion` (quién debe evaluar), de modo que también avisa a quien nunca abrió su dashboard.
- Respuesta de ejemplo:

```json
{
  "notificaciones": [
    {
      "id": "evaluaciones-pendientes:5",
      "tipo": "evaluaciones-pendientes",
      "severidad": "aviso",
      "titulo": "Faltan 3 días para cerrar la evaluación docente",
      "mensaje": "Tienes 2 evaluaciones pendientes. La evaluación cierra el 18 de diciembre.",
      "enlace": "/estudiante/evaluaciones",
      "diasRestantes": 3,
      "pendientes": ["Base de Datos (Perez, Luis)", "Redes (Gomez, Rosa)"]
    }
  ]
}
```

## Ping diario para Render y Supabase

El workflow `.github/workflows/mantener-activo.yml` llama una vez al día (09:00 hora de México) a `GET /api/health/db`, que ejecuta `SELECT 1`. Así Supabase gratuito no se pausa por 7 días sin actividad. Render gratuito sí se sigue durmiendo tras 15 minutos sin tráfico (el primer acceso del día tarda cerca de 1 minuto). No usa secretos, y la respuesta se guarda 30 s con tope de 5 s para que un abuso anónimo no sature la base. Se puede lanzar a mano desde GitHub → Actions → "Mantener activo". GitHub desactiva los workflows programados de un repo público tras 60 días sin actividad en el repo.

## Verificación hecha

- 12 pruebas del servicio de notificaciones (ventana de 7 días, gravedad, cierre hoy, días de calendario, lo completado y los grupos de otro ciclo no cuentan, periodo sin empezar o cerrado, sin periodo activo, sin perfil de alumno, roles que no son alumno) y 5 de la utilidad de fechas. 69/69 en el backend.
- Contra Supabase: la API real devuelve `[]` para una cuenta demo (el periodo cierra el 18-dic-2026, faltan más de 7 días), `401` sin token, y `GET /api/health/db` responde `200`.
- En el navegador, con la respuesta de la API simulada: la ventana aparece con el aviso y el foco en "Cerrar"; Escape la cierra y no reaparece al refrescar; la campana muestra el contador, el punto rojo y el aviso con enlace; el clic navega y cierra el menú; con la API caída muestra el error y sin avisos muestra el texto vacío y quita el punto rojo. Sin errores en consola.

## Limitaciones

- Con una sola ventana por sesión, un alumno que deja la sesión abierta días no vuelve a ver la ventana, pero sí la campana, que se actualiza al volver a la pestaña y al enviar una evaluación.
- El dashboard del alumno (`construirAsignaciones`) no filtra los grupos por ciclo, y el aviso sí. Con inscripciones de ciclos viejos el contador del menú lateral y el aviso podrían diferir. Hoy hay un solo ciclo, así que no se nota; queda anotado para corregir en el dashboard.
- Los avisos de docentes y coordinadores llegan con SCRUM-80.
