import { AppDataSource } from "../config/data-source";
import { Estudiante } from "../entities";

export const EstudianteRepository = AppDataSource.getRepository(Estudiante).extend({
  findByMatricula(matricula: string) {
    return this.findOneBy({ matricula });
  },
});
