# Despliegue — Render (backend) + Vercel (frontend)

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · relacionado con **SCRUM-71** (Sprint 7), adelantado para que el equipo pueda ver los avances sin correr nada localmente.

> El proyecto **no se modificó** para desplegarse — solo se agregaron archivos de configuración (`render.yaml`, `frontend/vercel.json`, `.node-version`). El backend ya usaba `process.env.PORT` y CORS abierto, así que no hizo falta tocar código.

## Por qué este orden importa

El backend no necesita saber la URL del frontend para funcionar (solo la usa para armar el link del correo de recuperación de contraseña), pero el frontend **sí** necesita saber la URL del backend para poder hacerle peticiones. Por eso:

1. Despliega primero el **backend en Render** → obtén su URL.
2. Despliega el **frontend en Vercel** usando esa URL.
3. Regresa a Render y actualiza `FRONTEND_URL` con la URL de Vercel que acabas de obtener.

Cada cuenta (Render, Vercel) hay que crearla ustedes mismos — inicien sesión con GitHub para que quede conectado directo al repo.

---

## 1. Backend en Render

1. Entra a [render.com](https://render.com) → **Sign up** con tu cuenta de GitHub.
2. **New +** → **Blueprint** → selecciona el repo `Ingenieros_Malas_Influencias`. Render va a leer `render.yaml` (ya está en la raíz del repo) y va a proponer crear el servicio `dygsis-backend` automáticamente.
3. Antes de confirmar, va a pedirte rellenar las variables marcadas como secretas (`sync: false` en el archivo). Ponlas así:

| Variable | Valor |
|---|---|
| `DB_HOST` | host del *Session pooler* de Supabase, ej. `aws-0-us-east-2.pooler.supabase.com` (Project → Connect → Session pooler) |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.<project-ref>` (incluye el ref del proyecto, lo da el pooler) |
| `DB_PASSWORD` | *(pídesela a Amoxhua si no la tienes)* |
| `JWT_SECRET` | *(genera una nueva — ver abajo)* |
| `SMTP_USER` | `pokego.cuentasecundaria1@gmail.com` |
| `SMTP_PASSWORD` | *(la contraseña de aplicación de Gmail — pídesela a Amoxhua)* |
| `SMTP_FROM` | `pokego.cuentasecundaria1@gmail.com` |
| `FRONTEND_URL` | déjalo vacío por ahora, lo llenas en el paso 3 de abajo |

   El resto de las variables (`DB_PORT`, `DB_SSL`, `SESSION_DURATION_HOURS`, `SMTP_HOST/PORT/SECURE`) ya vienen con su valor correcto en `render.yaml`, no hay que tocarlas.

   > **Migración a Supabase (18-sep-2026):** la base de datos se movió de Azure SQL Server a [Supabase](https://supabase.com) (PostgreSQL, plan Free) porque la suscripción de Azure superó los $15 USD/mes. El esquema completo (equivalente en PostgreSQL) vive en [`database/postgres_schema.sql`](../database/postgres_schema.sql) — se pega una sola vez en el SQL Editor de un proyecto nuevo de Supabase. Los archivos con el modelo original de SQL Server (`database/evaluacion_docente_schema.sql`, `database/migrations/`) se conservan solo como referencia histórica.

   **Genera un `JWT_SECRET` nuevo para producción** (no reuses el de tu `.env` local):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Confirma y espera el deploy (~2-3 min la primera vez). Al terminar, Render te da una URL tipo `https://dygsis-backend.onrender.com`.
5. Verifica que responde: abre `https://dygsis-backend.onrender.com/api/health` en el navegador → debe mostrar `{"status":"ok"}`. Si es la primera vez, puede tardar ~30-50s (el free tier "duerme" tras 15 min sin tráfico).

## 2. Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Sign up** con GitHub.
2. **Add New** → **Project** → importa `Ingenieros_Malas_Influencias`.
3. En la configuración del proyecto:
   - **Root Directory:** `frontend` (Vercel detecta automáticamente que es un proyecto Vite).
   - **Environment Variables:** agrega `VITE_API_URL` = la URL de Render del paso anterior (ej. `https://dygsis-backend.onrender.com`).
4. **Deploy**. Al terminar te da una URL tipo `https://ingenieros-malas-influencias.vercel.app`.

## 3. Cerrar el círculo

Regresa a Render → tu servicio `dygsis-backend` → **Environment** → edita `FRONTEND_URL` con la URL real de Vercel (ej. `https://ingenieros-malas-influencias.vercel.app`, sin `/` al final). Guarda — Render redeploya automáticamente.

## Verificación

1. Abre la URL de Vercel → debe cargar la pantalla de login.
2. Prueba "¿Olvidaste tu contraseña?" con un correo real → el enlace del correo debe apuntar a tu dominio de Vercel, no a `localhost`.
3. Inicia sesión con la cuenta de demo (`DEMO0001` / `Demo2026!`) → debe redirigir al dashboard.

## Actualizaciones automáticas

Ambas plataformas quedan conectadas a `main`: cada `git push` a `main` dispara un redeploy automático, tanto del backend (Render) como del frontend (Vercel). No hay que hacer nada manual después de la configuración inicial.

## El respaldo/versionado sigue siendo GitHub

El deploy no reemplaza el control de versiones — solo refleja automáticamente lo que hay en `main`. Si algo se rompe, el respaldo real es el historial de commits: `git log` para ver commits anteriores, `git revert <hash>` para deshacer uno específico sin perder el historial. Render y Vercel también guardan un historial de cada deploy por su cuenta, con botón de "rollback" a una versión anterior si hace falta revertir rápido mientras se arregla el commit en GitHub.

## Costo y límites del free tier

- **Render (free):** el servicio se duerme tras 15 min sin requests; el primer request después tarda ~30-50s en responder. Sin costo, sin tarjeta de crédito.
- **Vercel (free/Hobby):** sin sleep, CDN global, generoso para un proyecto escolar. Sin costo.
- Ninguno pide método de pago para este nivel de uso — si en algún momento se los pide, deténganse y pregunten antes de dar información de pago.
