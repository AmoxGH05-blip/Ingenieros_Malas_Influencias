import { AppDataSource } from "../config/data-source";
import { InstrumentoEvaluacion } from "../entities";

export const InstrumentoEvaluacionRepository = AppDataSource.getRepository(InstrumentoEvaluacion).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
});
