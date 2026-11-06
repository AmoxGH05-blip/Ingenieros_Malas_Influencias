import { AppDataSource } from "../config/data-source";

/** Fila de V_EvaluacionDocente_IndicadorDocente (migracion 009). pg devuelve los conteos y decimales como texto. */
export interface FilaIndicador {
  PeriodoEvaluacionId: number;
  PeriodoEvaluacion: string;
  PeriodoInicio: Date;
  DocenteId: number;
  Docente: string;
  NumeroEmpleado: string;
  Grupos: string;
  Materias: string | null;
  Evaluaciones: string;
  TotalRespuestas: string;
  Promedio: string | null;
  Clasificacion: string | null;
  Ranking: string | null;
  DocentesConPromedio: string;
  PeriodoActivo: boolean;
}

const COLUMNAS = `"PeriodoEvaluacionId", "PeriodoEvaluacion", "PeriodoInicio", "DocenteId", "Docente", "NumeroEmpleado",
  "Grupos", "Materias", "Evaluaciones", "TotalRespuestas", "Promedio", "Clasificacion", "Ranking", "DocentesConPromedio", "PeriodoActivo"`;

/** Lecturas de las vistas de indicadores: el promedio, el ranking y la clasificacion se calculan en la base. */
export const IndicadorRepository = {
  /** Todos los docentes de un periodo de evaluacion, del mejor al peor; los que no tienen respuestas van al final. */
  porPeriodo(periodoEvaluacionId: number): Promise<FilaIndicador[]> {
    return AppDataSource.query(
      `SELECT ${COLUMNAS} FROM "V_EvaluacionDocente_IndicadorDocente"
       WHERE "PeriodoEvaluacionId" = $1
       ORDER BY "Ranking" ASC NULLS LAST, "Docente" ASC`,
      [periodoEvaluacionId]
    );
  },

  /** Un docente en todos los periodos donde tuvo grupos, del mas antiguo al mas reciente. */
  porDocente(docenteId: number): Promise<FilaIndicador[]> {
    return AppDataSource.query(
      `SELECT ${COLUMNAS} FROM "V_EvaluacionDocente_IndicadorDocente"
       WHERE "DocenteId" = $1
       ORDER BY "PeriodoInicio" ASC, "PeriodoEvaluacionId" ASC`,
      [docenteId]
    );
  },
};
