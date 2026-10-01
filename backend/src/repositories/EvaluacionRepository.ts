import { AppDataSource } from "../config/data-source";
import { Evaluacion } from "../entities";

export const EvaluacionRepository = AppDataSource.getRepository(Evaluacion).extend({
  findByEstudianteAndPeriodo(estudianteId: number, periodoEvaluacionId: number) {
    return this.findBy({ estudianteId, periodoEvaluacionId });
  },
  findOneByEstudianteGrupoPeriodo(estudianteId: number, grupoId: number, periodoEvaluacionId: number) {
    return this.findOneBy({ estudianteId, grupoId, periodoEvaluacionId });
  },
  findByIdAndEstudiante(id: number, estudianteId: number) {
    return this.findOneBy({ id, estudianteId });
  },
});
