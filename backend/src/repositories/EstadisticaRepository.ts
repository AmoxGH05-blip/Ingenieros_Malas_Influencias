import { AppDataSource } from "../config/data-source";

/** Cuantos ciclos recientes (hasta el elegido) entran a la tendencia. */
export const CICLOS_EN_TENDENCIA = 6;

/** Participacion de un ciclo (V_EvaluacionDocente_ParticipacionCiclo). pg devuelve los conteos como texto. */
export interface FilaParticipacionCiclo {
  Alumnos: string;
  AlumnosParticipantes: string;
  Inscripciones: string;
  Completadas: string;
  Pendientes: string;
}

export interface FilaCarrera {
  ProgramaEducativoId: number;
  ProgramaEducativo: string;
  Alumnos: string;
  AlumnosParticipantes: string;
  Inscripciones: string;
  Completadas: string;
  /** Promedio ponderado por respuestas de las materias de la carrera; null si aun no tienen respuestas. */
  Promedio: string | null;
  /** Categoria del promedio, con la misma funcion SQL que usan los indicadores docentes. */
  Clasificacion: string | null;
}

/** Resumen y reparto por categoria de los docentes de un ciclo, en una sola pasada sobre la vista. */
export interface FilaResumenDocentes {
  DocentesConPromedio: string;
  PromedioInstitucional: string | null;
  Excelente: string;
  Bueno: string;
  Suficiente: string;
  NoSuficiente: string;
}

export interface FilaTendencia {
  PeriodoEvaluacionId: number;
  PeriodoEvaluacion: string;
  DocentesConPromedio: string;
  PromedioInstitucional: string | null;
  Inscripciones: string;
  Completadas: string;
}

/** Lecturas agregadas para las estadisticas institucionales: todo sale de las vistas de participacion e indicadores. */
export const EstadisticaRepository = {
  async participacionDelCiclo(periodoEvaluacionId: number): Promise<FilaParticipacionCiclo | null> {
    const filas: FilaParticipacionCiclo[] = await AppDataSource.query(
      `SELECT "Alumnos", "AlumnosParticipantes", "Inscripciones", "Completadas", "Pendientes"
       FROM "V_EvaluacionDocente_ParticipacionCiclo" WHERE "PeriodoEvaluacionId" = $1`,
      [periodoEvaluacionId]
    );
    return filas[0] ?? null;
  },

  /**
   * Una fila por carrera, tenga o no alumnos inscritos en el ciclo. La participacion es por la carrera del ALUMNO
   * y el promedio por la carrera de la MATERIA evaluada.
   */
  porCarrera(periodoEvaluacionId: number): Promise<FilaCarrera[]> {
    return AppDataSource.query(
      `SELECT pe."Id" AS "ProgramaEducativoId", pe."Nombre" AS "ProgramaEducativo",
              COALESCE(pc."Alumnos", 0) AS "Alumnos", COALESCE(pc."AlumnosParticipantes", 0) AS "AlumnosParticipantes",
              COALESCE(pc."Inscripciones", 0) AS "Inscripciones", COALESCE(pc."Completadas", 0) AS "Completadas",
              pr."Promedio", "F_EvaluacionDocente_Clasificar"(pr."Promedio") AS "Clasificacion"
       FROM "P_EvaluacionDocente_ProgramaEducativo" pe
       LEFT JOIN "V_EvaluacionDocente_ParticipacionCarrera" pc
              ON pc."ProgramaEducativoId" = pe."Id" AND pc."PeriodoEvaluacionId" = $1
       LEFT JOIN (
           SELECT "ProgramaEducativoId",
                  ROUND(SUM("SumaPonderada") / NULLIF(SUM("SumaPesos"), 0), 2)::DECIMAL(5,2) AS "Promedio"
           FROM "V_EvaluacionDocente_PromedioDocenteGrupo"
           WHERE "PeriodoEvaluacionId" = $1
           GROUP BY "ProgramaEducativoId"
       ) pr ON pr."ProgramaEducativoId" = pe."Id"
       ORDER BY pe."Nombre", pe."Id"`,
      [periodoEvaluacionId]
    );
  },

  /**
   * Promedio institucional = promedio de los promedios de cada docente (cada docente cuenta una vez), igual que el
   * ranking, y cuantos docentes hay en cada categoria. Una sola fila siempre, aunque el ciclo no tenga docentes.
   */
  async resumenDeDocentes(periodoEvaluacionId: number): Promise<FilaResumenDocentes> {
    const filas: FilaResumenDocentes[] = await AppDataSource.query(
      `SELECT COUNT("Promedio") AS "DocentesConPromedio",
              ROUND(AVG("Promedio"), 2)::DECIMAL(5,2) AS "PromedioInstitucional",
              COUNT(*) FILTER (WHERE "Clasificacion" = 'Excelente') AS "Excelente",
              COUNT(*) FILTER (WHERE "Clasificacion" = 'Bueno') AS "Bueno",
              COUNT(*) FILTER (WHERE "Clasificacion" = 'Suficiente') AS "Suficiente",
              COUNT(*) FILTER (WHERE "Clasificacion" = 'No suficiente') AS "NoSuficiente"
       FROM "V_EvaluacionDocente_IndicadorDocente" WHERE "PeriodoEvaluacionId" = $1`,
      [periodoEvaluacionId]
    );
    return filas[0];
  },

  /** Los ultimos ciclos hasta el indicado, del mas antiguo al mas reciente. */
  tendencia(periodoEvaluacionId: number): Promise<FilaTendencia[]> {
    // Comparar (fecha, id) y no solo la fecha: dos ciclos con el mismo inicio no deben colar uno posterior al elegido.
    // Los agregados van en LATERAL para calcular solo los ciclos recientes, no todo el historial.
    return AppDataSource.query(
      `SELECT recientes."Id" AS "PeriodoEvaluacionId", recientes."Nombre" AS "PeriodoEvaluacion",
              COALESCE(ind."DocentesConPromedio", 0) AS "DocentesConPromedio", ind."PromedioInstitucional",
              COALESCE(pc."Inscripciones", 0) AS "Inscripciones", COALESCE(pc."Completadas", 0) AS "Completadas"
       FROM (
           SELECT p."Id", p."Nombre", p."FechaInicio"
           FROM "P_EvaluacionDocente_PeriodoEvaluacion" p
           WHERE (p."FechaInicio", p."Id") <= (
               SELECT "FechaInicio", "Id" FROM "P_EvaluacionDocente_PeriodoEvaluacion" WHERE "Id" = $1
           )
           ORDER BY p."FechaInicio" DESC, p."Id" DESC
           LIMIT $2
       ) recientes
       LEFT JOIN LATERAL (
           SELECT COUNT("Promedio") AS "DocentesConPromedio", ROUND(AVG("Promedio"), 2)::DECIMAL(5,2) AS "PromedioInstitucional"
           FROM "V_EvaluacionDocente_IndicadorDocente" WHERE "PeriodoEvaluacionId" = recientes."Id"
       ) ind ON true
       LEFT JOIN LATERAL (
           SELECT "Inscripciones", "Completadas"
           FROM "V_EvaluacionDocente_ParticipacionCiclo" WHERE "PeriodoEvaluacionId" = recientes."Id"
       ) pc ON true
       ORDER BY recientes."FechaInicio" ASC, recientes."Id" ASC`,
      [periodoEvaluacionId, CICLOS_EN_TENDENCIA]
    );
  },
};
