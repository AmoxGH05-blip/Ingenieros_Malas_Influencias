import { AppDataSource } from "../config/data-source";
import { RespuestaEvaluacion } from "../entities";

export const RespuestaEvaluacionRepository = AppDataSource.getRepository(RespuestaEvaluacion).extend({
  findByEvaluacionId(evaluacionId: number) {
    return this.findBy({ evaluacionId });
  },
});
