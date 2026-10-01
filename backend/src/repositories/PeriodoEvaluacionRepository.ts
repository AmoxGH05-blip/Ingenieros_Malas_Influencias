import { AppDataSource } from "../config/data-source";
import { PeriodoEvaluacion } from "../entities";

export const PeriodoEvaluacionRepository = AppDataSource.getRepository(PeriodoEvaluacion).extend({
  /** El periodo de evaluacion vigente (se asume uno solo activo a la vez). */
  findActivo() {
    return this.findOne({ where: { activo: true }, order: { id: "DESC" } });
  },
});
