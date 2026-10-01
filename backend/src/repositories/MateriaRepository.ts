import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Materia } from "../entities";

export const MateriaRepository = AppDataSource.getRepository(Materia).extend({
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
