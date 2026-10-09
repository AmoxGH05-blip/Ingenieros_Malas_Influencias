# Recordatorios automáticos de evaluación (SCRUM-40)

Cada día un cron avisa por correo a los alumnos que aún tienen evaluaciones pendientes cuando faltan **7, 3 y 1 días** para el cierre del periodo de evaluación.

## Cómo funciona

1. **GitHub Actions** (`.github/workflows/recordatorios.yml`) corre todos los días a las 15:00 UTC (09:00 de Ciudad de México). Despierta al backend de Render y llama a `POST /api/admin/recordatorios/ejecutar` con la cabecera `x-cron-secret`.
2. El backend revisa los periodos activos. Para cada uno calcula los días que faltan para `FechaFin` (redondeados hacia arriba) y elige el aviso que toca:

   | Días restantes | Aviso |
   |---|---|
   | 8 o más | ninguno |
   | 4 a 7 | aviso de 7 |
   | 2 a 3 | aviso de 3 |
   | 1 | aviso de 1 |
   | 0 o cerrado | ninguno |

   Si un día el cron falla, el aviso se manda en cuanto vuelve a correr (con el número real de días que faltan en el texto). Nunca se manda antes de los 7 días ni después del cierre.
3. Envía el correo solo a quien tiene al menos una evaluación sin completar. El cálculo parte de `Inscripcion` (quién debe evaluar) y no de `Evaluacion`, así que también avisa a quien nunca abrió su dashboard.
4. **No repite avisos.** Antes de enviar, el backend reserva la fila en `P_EvaluacionDocente_EnvioRecordatorio` (clave única periodo + usuario + aviso). Si el envío falla, libera la reserva y la siguiente corrida lo reintenta. Los fallos salen en la respuesta y en el log del backend. Si algún correo no sale, el workflow termina en rojo para que se note.

Como el workflow toca el backend y la base de datos todos los días, también evita que Supabase (plan gratuito) se pause por inactividad.

## Configuración (una sola vez)

El secreto debe ser el mismo en tres lugares:

| Dónde | Nombre | Cómo |
|---|---|---|
| `backend/.env` (local) | `CRON_SECRET` | ya generado en esta máquina |
| Render → dygsis-backend → Environment | `CRON_SECRET` | pegar el mismo valor y guardar |
| GitHub → repo → Settings → Secrets and variables → Actions | secret `CRON_SECRET` | pegar el mismo valor |

Opcional: la variable de Actions `BACKEND_URL` cambia la URL del backend (por defecto `https://dygsis-backend.onrender.com`).

Sin `CRON_SECRET` en el backend, la vía del cron queda cerrada y solo un Administrador con sesión puede ejecutar el endpoint.

## Cómo probarlo

**Simulación** (lista a quién le tocaría el aviso, sin enviar ni registrar nada):

- GitHub → Actions → "Recordatorios de evaluación" → Run workflow (por defecto `simular` viene activado).
- O con curl:

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" "https://dygsis-backend.onrender.com/api/admin/recordatorios/ejecutar?simular=true"
```

La respuesta trae, por periodo: días restantes, aviso (`umbral`), `enviados`, `omitidosYaEnviado`, `omitidosSinPendientes`, `fallidos` y, en simulación, `destinatarios`. Si no hay periodos en ventana, `periodos` viene vacío.

**Envío real:** Run workflow con `simular` desactivado, o la ejecución diaria programada. Solo manda correos cuando un periodo activo está a 7 días o menos de cerrar.

## Verificación hecha

- 14 pruebas del servicio (ventanas, deduplicación, fallo de envío, fallo de BD al reservar o liberar, simulación, usuarios inactivos) y 5 del control de acceso.
- Contra Supabase con datos reales (periodo que cierra el 18-dic-2026), moviendo la fecha de referencia: a 10 días no avisa; a 5, 2 y 0.5 días elige los avisos 7, 3 y 1 y lista a los 4 alumnos con pendientes, omitiendo al que ya terminó.
- La reserva en la tabla responde `true`, `false` (duplicado) y `true` (tras liberar).
- Acceso: sin credenciales y con secreto incorrecto dan `401`; el secreto correcto abre solo este endpoint (`/api/admin/usuarios` sigue pidiendo sesión); `simular` inválido da `400`.

## Limitaciones conocidas

- El envío es en serie dentro de la petición (límite de 5 min en el workflow); con cientos de alumnos habría que enviar en lotes o en segundo plano.
- Si el proceso del backend se reinicia justo entre reservar el aviso y enviarlo, ese alumno no lo recibe en ese umbral. Es raro y no se cubre por ahora.
- El workflow solo imprime conteos (los correos de los alumnos no se vuelcan al log de Actions).

### Correo en producción

El envío usa Gmail SMTP (puerto 465). Render puede bloquear puertos SMTP salientes en su plan gratuito: hay que probar un envío real desde producción. Si falla, la salida es cambiar `EmailService` a un servicio de correo por API HTTP.
