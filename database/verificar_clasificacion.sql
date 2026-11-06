/* =====================================================================
   Verificacion de la regla de clasificacion docente (SCRUM-51).
   Se corre contra la base (no cambia datos); falla con un error claro
   si algun caso limite no da la categoria esperada:
     psql "$DATABASE_URL" -f database/verificar_clasificacion.sql
   (o pegarlo en el SQL Editor de Supabase). Si todo esta bien termina con un aviso.
   ===================================================================== */

DO $$
DECLARE
    caso RECORD;
    obtenido VARCHAR;
BEGIN
    FOR caso IN
        SELECT * FROM (VALUES
            (10.00, 'Excelente'), (9.50, 'Excelente'), (9.00, 'Excelente'),
            (8.995, 'Excelente'),   -- redondea a 9.00
            (8.99, 'Bueno'), (8.90, 'Bueno'), (8.50, 'Bueno'), (8.00, 'Bueno'),
            (7.995, 'Bueno'),       -- redondea a 8.00
            (7.99, 'Suficiente'), (7.50, 'Suficiente'), (7.00, 'Suficiente'),
            (6.995, 'Suficiente'),  -- redondea a 7.00
            (6.99, 'No suficiente'), (6.90, 'No suficiente'), (5.00, 'No suficiente'), (0.00, 'No suficiente')
        ) AS t(promedio, esperado)
    LOOP
        obtenido := "F_EvaluacionDocente_Clasificar"(caso.promedio);
        IF obtenido IS DISTINCT FROM caso.esperado THEN
            RAISE EXCEPTION 'Clasificacion incorrecta: % dio %, se esperaba %', caso.promedio, obtenido, caso.esperado;
        END IF;
    END LOOP;

    IF "F_EvaluacionDocente_Clasificar"(NULL) IS NOT NULL THEN
        RAISE EXCEPTION 'Un promedio NULL (sin respuestas) debe quedar sin clasificar';
    END IF;

    RAISE NOTICE 'Clasificacion: casos limite correctos';
END
$$;
