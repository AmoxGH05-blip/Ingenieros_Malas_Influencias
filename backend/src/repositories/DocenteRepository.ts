import { AppDataSource } from "../config/data-source";
import { Docente } from "../entities";

export const DocenteRepository = AppDataSource.getRepository(Docente).extend({
  findByNumeroEmpleado(numeroEmpleado: string) {
    return this.findOneBy({ numeroEmpleado });
  },
});
