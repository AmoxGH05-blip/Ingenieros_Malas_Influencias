import { AppDataSource } from "../config/data-source";
import { SeccionInstrumento } from "../entities";

export const SeccionInstrumentoRepository = AppDataSource.getRepository(SeccionInstrumento).extend({
  findByInstrumentoId(instrumentoId: number) {
    return this.find({ where: { instrumentoId }, order: { orden: "ASC" } });
  },
});
