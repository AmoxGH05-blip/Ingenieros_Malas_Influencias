# Seguridad de la base de datos (SCRUM-81)

## El problema que había

Supabase expone por defecto una API REST (Data API) sobre el esquema `public`, y le da privilegios totales a dos roles públicos: `anon` (cualquiera con la clave pública del proyecto) y `authenticated`. La clave y la URL del proyecto son públicas por diseño. Con los privilegios por defecto, quien las tuviera podía leer y escribir las tablas del proyecto saltándose el backend, incluidas `Usuario` (hashes de contraseña) y `Sesion`.

## Qué se hizo (migración `013_cerrar_acceso_data_api.sql`)

1. **RLS activado** en todas las tablas `P_EvaluacionDocente_*`. Sin políticas, RLS niega todo a quien no sea dueño.
2. **Privilegios revocados** a `anon` y `authenticated` en tablas, vistas, secuencias y funciones del proyecto.
3. **`ALTER DEFAULT PRIVILEGES`**: lo que cree el rol `postgres` desde ahora no se abre solo a esos roles.

No hay políticas a propósito: el proyecto no usa la Data API ni Supabase Auth. El único acceso a los datos es el backend.

## Por qué el backend no se afecta

El backend se conecta como `postgres`, dueño de los objetos y con `BYPASSRLS`. Ni RLS ni los `REVOKE` le aplican.

## Cómo verificarlo

- Como `anon` o `authenticated`, `SELECT` sobre cualquier tabla del proyecto responde `permission denied`.
- Una tabla nueva creada por `postgres` no da acceso a ninguno de los dos.
- La migración es idempotente: se puede ejecutar varias veces, y termina con una consulta que debe devolver cero filas (objetos aún abiertos).

## Reglas para tablas nuevas

Tras `CREATE TABLE`, activar RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Los privilegios ya no se abren solos, pero RLS es la segunda barrera si alguien concediera permisos por error.

## Pendiente opcional

En Supabase, Settings > API > *Exposed schemas*, quitar `public`: así la Data API deja de exponer el esquema por completo.
