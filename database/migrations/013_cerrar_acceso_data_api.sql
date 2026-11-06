/* =====================================================================
   Migracion 013 - Cierra el acceso de la Data API de Supabase (SCRUM-81)

   PROBLEMA: Supabase da por defecto privilegios totales (SELECT/INSERT/UPDATE/DELETE) sobre las tablas
   y vistas de `public` a los roles `anon` y `authenticated`. La URL del proyecto y la clave anon son
   publicas por diseno, asi que cualquiera con esa clave podia leer y escribir, p. ej., la tabla
   "P_EvaluacionDocente_Usuario" (hashes de contrasena) y "..._Sesion" a traves de la API REST de Supabase,
   saltandose por completo el backend y su control de roles.

   QUE HACE (todo idempotente: se puede ejecutar varias veces):
   1. Activa RLS en todas las tablas del proyecto. Sin politicas, RLS niega todo a anon/authenticated.
   2. Revoca todos los privilegios de tablas, vistas, secuencias y funciones del proyecto a anon,
      authenticated y PUBLIC (la funcion de clasificacion ya estaba cerrada desde la 009).
   3. ALTER DEFAULT PRIVILEGES: los objetos que se creen despues con el rol que corre las migraciones
      (postgres) ya no se abren solos a anon/authenticated. Asi una tabla nueva queda cerrada sin tener
      que acordarse de cerrarla.

   LO QUE NO CAMBIA: el backend se conecta como `postgres`, que es dueno de los objetos y tiene BYPASSRLS,
   asi que RLS y los REVOKE no le afectan. El proyecto no usa la Data API ni Supabase Auth: no hay
   politicas porque no debe existir ningun acceso desde anon/authenticated.

   ALCANCE: solo objetos con prefijo P_EvaluacionDocente_ / V_EvaluacionDocente_ / F_EvaluacionDocente_
   del esquema public. No toca ningun otro objeto de la base.

   REVERTIR (si hiciera falta; reabre el acceso, no se recomienda):
     GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;  -- y ALTER ... DISABLE ROW LEVEL SECURITY
   ===================================================================== */

DO $$
DECLARE
    objeto RECORD;
    rol    TEXT;
BEGIN
    -- 1) RLS en todas las tablas del proyecto
    FOR objeto IN
        SELECT c.relname
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'P\_EvaluacionDocente\_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', objeto.relname);
    END LOOP;

    -- 2) Revocar privilegios de tablas, vistas y secuencias del proyecto
    FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
            FOR objeto IN
                SELECT c.relname, c.relkind
                FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND ((c.relkind IN ('r', 'v', 'm') AND (c.relname LIKE 'P\_EvaluacionDocente\_%' OR c.relname LIKE 'V\_EvaluacionDocente\_%'))
                    OR (c.relkind = 'S' AND c.relname LIKE 'P\_EvaluacionDocente\_%'))
            LOOP
                IF objeto.relkind = 'S' THEN
                    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I', objeto.relname, rol);
                ELSE
                    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', objeto.relname, rol);
                END IF;
            END LOOP;

            -- Funciones del proyecto
            FOR objeto IN
                SELECT p.oid::regprocedure AS firma
                FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname LIKE 'F\_EvaluacionDocente\_%'
            LOOP
                EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I', objeto.firma, rol);
            END LOOP;

            -- 3) Privilegios por defecto de lo que cree postgres de aqui en adelante
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM %I', rol);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', rol);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', rol);
        END IF;
    END LOOP;
END
$$;

-- Verificacion: no debe devolver filas (ningun objeto del proyecto accesible a anon/authenticated ni sin RLS)
SELECT c.relname AS objeto_aun_abierto
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'v', 'm')
  AND (c.relname LIKE 'P\_EvaluacionDocente\_%' OR c.relname LIKE 'V\_EvaluacionDocente\_%')
  AND ((EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE'))
    OR (EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AND has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'))
    OR (c.relkind = 'r' AND NOT c.relrowsecurity));
