import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Estudiante } from "../entities";

export const EstudianteRepository = AppDataSource.getRepository(Estudiante).extend({
  findByMatricula(matricula: string) {
    return this.findOneBy({ matricula });
  },
  findByUsuarioId(usuarioId: number) {
    return this.findOneBy({ usuarioId });
  },
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
