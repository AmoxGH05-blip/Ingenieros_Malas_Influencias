import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Docente } from "../entities";

export const DocenteRepository = AppDataSource.getRepository(Docente).extend({
  findByNumeroEmpleado(numeroEmpleado: string) {
    return this.findOneBy({ numeroEmpleado });
  },
  findByUsuarioId(usuarioId: number) {
    return this.findOneBy({ usuarioId });
  },
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
