/* =====================================================================
   Migracion 014 - Talleres y laboratorios configurables por carrera (SCRUM-53, RF08)

   Un taller o laboratorio pertenece a una carrera y lo evaluan los alumnos de esa carrera, como una
   actividad de la carrera: NO esta ligado a un docente ni a un grupo. Por eso va en tablas propias y las
   evaluaciones de docentes, sus promedios, el ranking y las estadisticas no cambian.

   - ProgramaEducativo."EvaluaTalleres": interruptor por carrera (nace apagado).
   - Taller: catalogo por carrera (nombre unico dentro de la carrera). Se da de baja con Activo = false.
   - InstrumentoEvaluacion: se agrega el tipo 'Taller'. Los criterios son secciones y preguntas del instrumento
     de tipo Taller (mismo modelo configurable y misma escala 0 / 2.5 / 5 / 7.5 / 10 que el de docentes).
   - EvaluacionTaller / RespuestaEvaluacionTaller: una evaluacion por alumno, taller y ciclo. Solo existe la
     fila cuando el alumno envia la evaluacion (no hay filas pendientes) y la respuesta siempre es una opcion de
     la escala. Los resultados solo se muestran agregados.

   Todo es idempotente. Las tablas nuevas nacen con RLS y sin permisos para anon/authenticated (ver 013).
   ===================================================================== */

ALTER TABLE "P_EvaluacionDocente_ProgramaEducativo"
    ADD COLUMN IF NOT EXISTS "EvaluaTalleres" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_P_EvaluacionDocente_InstrumentoEvaluacion_TipoEvaluado') THEN
        ALTER TABLE "P_EvaluacionDocente_InstrumentoEvaluacion"
            DROP CONSTRAINT "ck_P_EvaluacionDocente_InstrumentoEvaluacion_TipoEvaluado";
    END IF;
    ALTER TABLE "P_EvaluacionDocente_InstrumentoEvaluacion"
        ADD CONSTRAINT "ck_P_EvaluacionDocente_InstrumentoEvaluacion_TipoEvaluado"
        CHECK ("TipoEvaluado" IN ('Docente', 'Autoevaluacion', 'Coordinador', 'Taller'));
END
$$;

CREATE TABLE IF NOT EXISTS "P_EvaluacionDocente_Taller" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "ProgramaEducativoId"   INTEGER         NOT NULL,
    "Nombre"                VARCHAR(150)    NOT NULL,
    "Tipo"                  VARCHAR(20)     NOT NULL DEFAULT 'Taller',
    "Activo"                BOOLEAN         NOT NULL DEFAULT true,
    "FechaCreacion"         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_Taller" PRIMARY KEY ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_Taller_ProgramaEducativo" FOREIGN KEY ("ProgramaEducativoId")
        REFERENCES "P_EvaluacionDocente_ProgramaEducativo" ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_Taller_Carrera_Nombre" UNIQUE ("ProgramaEducativoId", "Nombre"),
    CONSTRAINT "ck_P_EvaluacionDocente_Taller_Tipo" CHECK ("Tipo" IN ('Taller', 'Laboratorio')),
    CONSTRAINT "ck_P_EvaluacionDocente_Taller_Nombre" CHECK (length(btrim("Nombre")) > 0)
);

CREATE TABLE IF NOT EXISTS "P_EvaluacionDocente_EvaluacionTaller" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "PeriodoEvaluacionId"   INTEGER         NOT NULL,
    "EstudianteId"          INTEGER         NOT NULL,
    "TallerId"              INTEGER         NOT NULL,
    "FechaRespuesta"        TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT "pk_P_EvaluacionDocente_EvaluacionTaller" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_EvaluacionTaller_Alumno_Taller" UNIQUE ("EstudianteId", "TallerId", "PeriodoEvaluacionId"),
    CONSTRAINT "fk_P_EvaluacionDocente_EvaluacionTaller_PeriodoEvaluacion" FOREIGN KEY ("PeriodoEvaluacionId")
        REFERENCES "P_EvaluacionDocente_PeriodoEvaluacion" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_EvaluacionTaller_Estudiante" FOREIGN KEY ("EstudianteId")
        REFERENCES "P_EvaluacionDocente_Estudiante" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_EvaluacionTaller_Taller" FOREIGN KEY ("TallerId")
        REFERENCES "P_EvaluacionDocente_Taller" ("Id")
);

CREATE TABLE IF NOT EXISTS "P_EvaluacionDocente_RespuestaEvaluacionTaller" (
    "Id"                    INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL,
    "EvaluacionTallerId"    INTEGER         NOT NULL,
    "PreguntaId"            INTEGER         NOT NULL,
    "OpcionRespuestaId"     INTEGER         NOT NULL,
    CONSTRAINT "pk_P_EvaluacionDocente_RespuestaEvaluacionTaller" PRIMARY KEY ("Id"),
    CONSTRAINT "uq_P_EvaluacionDocente_RespuestaTaller_Evaluacion_Pregunta" UNIQUE ("EvaluacionTallerId", "PreguntaId"),
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacionTaller_Evaluacion" FOREIGN KEY ("EvaluacionTallerId")
        REFERENCES "P_EvaluacionDocente_EvaluacionTaller" ("Id") ON DELETE CASCADE,
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacionTaller_Pregunta" FOREIGN KEY ("PreguntaId")
        REFERENCES "P_EvaluacionDocente_Pregunta" ("Id"),
    CONSTRAINT "fk_P_EvaluacionDocente_RespuestaEvaluacionTaller_Opcion" FOREIGN KEY ("OpcionRespuestaId")
        REFERENCES "P_EvaluacionDocente_OpcionRespuesta" ("Id")
);

-- Los indices de las FK que no cubre ya una restriccion UNIQUE.
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_EvaluacionTaller_TallerId_Periodo"
    ON "P_EvaluacionDocente_EvaluacionTaller" ("TallerId", "PeriodoEvaluacionId");
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_EvaluacionTaller_PeriodoEvaluacionId"
    ON "P_EvaluacionDocente_EvaluacionTaller" ("PeriodoEvaluacionId");
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_RespuestaTaller_PreguntaId"
    ON "P_EvaluacionDocente_RespuestaEvaluacionTaller" ("PreguntaId");
CREATE INDEX IF NOT EXISTS "ix_P_EvaluacionDocente_RespuestaTaller_OpcionId"
    ON "P_EvaluacionDocente_RespuestaEvaluacionTaller" ("OpcionRespuestaId");

-- Cerrado a la Data API de Supabase, igual que el resto (migracion 013).
DO $$
DECLARE
    tabla TEXT;
    rol   TEXT;
BEGIN
    FOREACH tabla IN ARRAY ARRAY['P_EvaluacionDocente_Taller', 'P_EvaluacionDocente_EvaluacionTaller', 'P_EvaluacionDocente_RespuestaEvaluacionTaller'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabla);
        FOREACH rol IN ARRAY ARRAY['anon', 'authenticated'] LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
                EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', tabla, rol);
                EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I', tabla || '_Id_seq', rol);
            END IF;
        END LOOP;
    END LOOP;
END
$$;

/* Instrumento estandar de talleres y laboratorios (borrador): 5 criterios, 2 preguntas cada uno, con la escala del
   instrumento de docentes. Se crea solo si aun no hay uno de tipo Taller. Lo firma una cuenta activa de Coordinador o
   Administrador (no depende de un correo concreto) y, si falta algo necesario, la migracion FALLA en lugar de dejar un
   instrumento activo sin preguntas. Los criterios se pueden cambiar despues sin tocar el codigo. */
DO $$
DECLARE
    creador     INTEGER;
    tipo        INTEGER;
    instrumento INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM "P_EvaluacionDocente_InstrumentoEvaluacion" WHERE "TipoEvaluado" = 'Taller') THEN
        RETURN;
    END IF;
    SELECT u."Id" INTO creador
    FROM "P_EvaluacionDocente_Usuario" u
    JOIN "P_EvaluacionDocente_UsuarioRol" ur ON ur."UsuarioId" = u."Id"
    JOIN "P_EvaluacionDocente_Rol" r ON r."Id" = ur."RolId" AND r."Nombre" IN ('Coordinador', 'Administrador')
    WHERE u."Activo"
    ORDER BY u."Id" LIMIT 1;
    IF creador IS NULL THEN
        RAISE EXCEPTION 'No hay una cuenta activa de Coordinador o Administrador que firme el instrumento de talleres.';
    END IF;
    SELECT "Id" INTO tipo FROM "P_EvaluacionDocente_TipoPregunta" WHERE "Nombre" = 'EscalaLikert';
    IF tipo IS NULL THEN
        RAISE EXCEPTION 'Falta el tipo de pregunta EscalaLikert: no se puede crear el instrumento de talleres.';
    END IF;

    INSERT INTO "P_EvaluacionDocente_InstrumentoEvaluacion" ("CreadoPorUsuarioId", "Nombre", "TipoEvaluado", "Version", "Activo")
    VALUES (creador, 'Evaluacion de Talleres y Laboratorios 2026 (borrador estandar)', 'Taller', 1, true)
    RETURNING "Id" INTO instrumento;

    INSERT INTO "P_EvaluacionDocente_SeccionInstrumento" ("InstrumentoId", "Nombre", "Orden")
    VALUES (instrumento, 'Equipamiento e instalaciones', 1), (instrumento, 'Materiales e insumos', 2),
           (instrumento, 'Seguridad e higiene', 3), (instrumento, 'Apoyo del responsable', 4),
           (instrumento, 'Utilidad para la formacion', 5);

    INSERT INTO "P_EvaluacionDocente_Pregunta" ("SeccionInstrumentoId", "TipoPreguntaId", "Texto", "Orden")
    SELECT sec."Id", tipo, preg.texto, preg.orden
    FROM "P_EvaluacionDocente_SeccionInstrumento" sec
    JOIN (VALUES
        ('Equipamiento e instalaciones', 'El equipo y las instalaciones estan en buen estado.', 1),
        ('Equipamiento e instalaciones', 'Hay equipo suficiente para el numero de alumnos.', 2),
        ('Materiales e insumos', 'Los materiales e insumos estan disponibles cuando se necesitan.', 1),
        ('Materiales e insumos', 'Los materiales corresponden a lo que se practica en la materia.', 2),
        ('Seguridad e higiene', 'El espacio cumple con las medidas de seguridad e higiene.', 1),
        ('Seguridad e higiene', 'Se explican las reglas de uso y seguridad antes de trabajar.', 2),
        ('Apoyo del responsable', 'El responsable del taller o laboratorio atiende mis dudas.', 1),
        ('Apoyo del responsable', 'Los horarios de uso permiten realizar las practicas.', 2),
        ('Utilidad para la formacion', 'Las practicas refuerzan lo visto en clase.', 1),
        ('Utilidad para la formacion', 'Lo que practico aqui me sirve para mi formacion profesional.', 2)
    ) AS preg(seccion, texto, orden) ON preg.seccion = sec."Nombre"
    WHERE sec."InstrumentoId" = instrumento;

    INSERT INTO "P_EvaluacionDocente_OpcionRespuesta" ("PreguntaId", "Texto", "Valor", "Orden")
    SELECT p."Id", escala.texto, escala.valor, escala.orden
    FROM "P_EvaluacionDocente_Pregunta" p
    JOIN "P_EvaluacionDocente_SeccionInstrumento" s ON s."Id" = p."SeccionInstrumentoId" AND s."InstrumentoId" = instrumento
    CROSS JOIN (VALUES
        ('Totalmente en desacuerdo', 0.00, 1), ('En desacuerdo', 2.50, 2), ('Neutral', 5.00, 3),
        ('De acuerdo', 7.50, 4), ('Totalmente de acuerdo', 10.00, 5)
    ) AS escala(texto, valor, orden);
END
$$;
