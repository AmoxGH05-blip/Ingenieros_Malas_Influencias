import { AppDataSource } from "../config/data-source";
import { EvaluacionTaller, RespuestaEvaluacionTaller, Taller } from "../entities";
import { ConflictoError } from "../utils/errores";

/** Fila de carrera con su interruptor de talleres. Los conteos llegan como texto (pg). */
export interface FilaCarrera {
  Id: number;
  Nombre: string;
  EvaluaTalleres: boolean;
  Alumnos: string;
}

/** Resultados de un taller en un ciclo, agregados. Sin respuestas, Respuestas = "0" y Promedio = null. */
export interface FilaResultadoTaller {
  TallerId: number;
  ProgramaEducativoId: number;
  Nombre: string;
  Tipo: "Taller" | "Laboratorio";
  Activo: boolean;
  Respuestas: string;
  Promedio: string | null;
}

export interface FilaCriterio {
  TallerId: number;
  SeccionId: number;
  Seccion: string;
  Promedio: string | null;
}

export interface RespuestaAGuardar {
  preguntaId: number;
  opcionRespuestaId: number;
}

export const TallerRepository = AppDataSource.getRepository(Taller).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
  findByCarrera(programaEducativoId: number) {
    return this.find({ where: { programaEducativoId }, order: { nombre: "ASC", id: "ASC" } });
  },
  /** El nombre de un taller es unico dentro de su carrera sin distinguir mayusculas (la base solo distingue exactas). */
  async existeNombre(programaEducativoId: number, nombre: string, exceptoId?: number): Promise<boolean> {
    const filas: { Id: number }[] = await AppDataSource.query(
      `SELECT "Id" FROM "P_EvaluacionDocente_Taller"
       WHERE "ProgramaEducativoId" = $1 AND lower(btrim("Nombre")) = lower($2) AND ($3::int IS NULL OR "Id" <> $3)
       LIMIT 1`,
      [programaEducativoId, nombre, exceptoId ?? null]
    );
    return filas.length > 0;
  },

  /** Todas las carreras (con o sin talleres) con su interruptor y cuantos alumnos tienen. */
  carreras(): Promise<FilaCarrera[]> {
    return AppDataSource.query(
      `SELECT pe."Id", pe."Nombre", pe."EvaluaTalleres",
              (SELECT COUNT(*) FROM "P_EvaluacionDocente_Estudiante" e WHERE e."ProgramaEducativoId" = pe."Id") AS "Alumnos"
       FROM "P_EvaluacionDocente_ProgramaEducativo" pe
       ORDER BY pe."Nombre", pe."Id"`
    );
  },

  /** Talleres con el numero de evaluaciones enviadas y su promedio ponderado (suma valor x peso / suma de pesos) en un ciclo. */
  resultadosDelCiclo(periodoEvaluacionId: number): Promise<FilaResultadoTaller[]> {
    return AppDataSource.query(
      `SELECT t."Id" AS "TallerId", t."ProgramaEducativoId", t."Nombre", t."Tipo", t."Activo",
              COUNT(DISTINCT et."Id") AS "Respuestas",
              ROUND(SUM(o."Valor" * p."PesoPonderacion") / NULLIF(SUM(p."PesoPonderacion"), 0), 2)::DECIMAL(5,2) AS "Promedio"
       FROM "P_EvaluacionDocente_Taller" t
       LEFT JOIN "P_EvaluacionDocente_EvaluacionTaller" et ON et."TallerId" = t."Id" AND et."PeriodoEvaluacionId" = $1
       LEFT JOIN "P_EvaluacionDocente_RespuestaEvaluacionTaller" r ON r."EvaluacionTallerId" = et."Id"
       LEFT JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."Id" = r."OpcionRespuestaId"
       LEFT JOIN "P_EvaluacionDocente_Pregunta" p ON p."Id" = r."PreguntaId"
       GROUP BY t."Id"
       ORDER BY t."Nombre", t."Id"`,
      [periodoEvaluacionId]
    );
  },

  /** Promedio de cada criterio (seccion del instrumento) por taller en un ciclo; solo talleres con respuestas. */
  criteriosDelCiclo(periodoEvaluacionId: number): Promise<FilaCriterio[]> {
    return AppDataSource.query(
      `SELECT et."TallerId", s."Id" AS "SeccionId", s."Nombre" AS "Seccion",
              ROUND(SUM(o."Valor" * p."PesoPonderacion") / NULLIF(SUM(p."PesoPonderacion"), 0), 2)::DECIMAL(5,2) AS "Promedio"
       FROM "P_EvaluacionDocente_EvaluacionTaller" et
       JOIN "P_EvaluacionDocente_RespuestaEvaluacionTaller" r ON r."EvaluacionTallerId" = et."Id"
       JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."Id" = r."OpcionRespuestaId"
       JOIN "P_EvaluacionDocente_Pregunta" p ON p."Id" = r."PreguntaId"
       JOIN "P_EvaluacionDocente_SeccionInstrumento" s ON s."Id" = p."SeccionInstrumentoId"
       WHERE et."PeriodoEvaluacionId" = $1
       GROUP BY et."TallerId", s."Id", s."Nombre", s."Orden"
       ORDER BY et."TallerId", s."Orden", s."Id"`,
      [periodoEvaluacionId]
    );
  },

  /** Ids de los talleres que el alumno ya evaluo en el ciclo. */
  async evaluadosPorAlumno(estudianteId: number, periodoEvaluacionId: number): Promise<{ tallerId: number; fecha: Date }[]> {
    const filas: { TallerId: number; FechaRespuesta: Date }[] = await AppDataSource.query(
      `SELECT "TallerId", "FechaRespuesta" FROM "P_EvaluacionDocente_EvaluacionTaller"
       WHERE "EstudianteId" = $1 AND "PeriodoEvaluacionId" = $2`,
      [estudianteId, periodoEvaluacionId]
    );
    return filas.map((f) => ({ tallerId: f.TallerId, fecha: f.FechaRespuesta }));
  },

  /**
   * Guarda la evaluacion y todas sus respuestas en una sola transaccion: o queda completa o no queda nada.
   * Si el alumno ya la habia enviado (clave unica), la base lo rechaza y el error de unicidad sube al servicio.
   */
  guardarEvaluacion(
    datos: { periodoEvaluacionId: number; estudianteId: number; tallerId: number },
    respuestas: RespuestaAGuardar[]
  ): Promise<void> {
    return AppDataSource.transaction(async (manager) => {
      // Se vuelve a comprobar dentro de la transaccion y con bloqueo: entre la validacion del servicio y este punto alguien
      // pudo apagar la carrera, dar de baja el taller o cerrar el ciclo, y esa evaluacion ya no debe entrar.
      const vigente = await manager.query(
        `SELECT t."Id"
         FROM "P_EvaluacionDocente_Taller" t
         JOIN "P_EvaluacionDocente_ProgramaEducativo" pe ON pe."Id" = t."ProgramaEducativoId"
         JOIN "P_EvaluacionDocente_Estudiante" e ON e."ProgramaEducativoId" = pe."Id" AND e."Id" = $2
         JOIN "P_EvaluacionDocente_PeriodoEvaluacion" p ON p."Id" = $3
         WHERE t."Id" = $1 AND t."Activo" AND pe."EvaluaTalleres" AND p."Activo"
         FOR SHARE OF t, pe, p`,
        [datos.tallerId, datos.estudianteId, datos.periodoEvaluacionId]
      );
      if (vigente.length === 0) throw new ConflictoError("Ya no se puede evaluar este taller: cambio su configuracion o termino el ciclo");

      const evaluacion = await manager.save(
        manager.create(EvaluacionTaller, {
          periodoEvaluacionId: datos.periodoEvaluacionId,
          estudianteId: datos.estudianteId,
          tallerId: datos.tallerId,
        })
      );
      await manager.save(
        respuestas.map((r) =>
          manager.create(RespuestaEvaluacionTaller, {
            evaluacionTallerId: evaluacion.id,
            preguntaId: r.preguntaId,
            opcionRespuestaId: r.opcionRespuestaId,
          })
        )
      );
    });
  },
});
