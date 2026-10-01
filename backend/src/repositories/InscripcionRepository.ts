import { AppDataSource } from "../config/data-source";
import { Inscripcion } from "../entities";

export const InscripcionRepository = AppDataSource.getRepository(Inscripcion).extend({
  findByEstudianteId(estudianteId: number) {
    return this.findBy({ estudianteId });
  },
});
