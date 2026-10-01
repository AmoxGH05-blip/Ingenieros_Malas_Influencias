import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Grupo } from "../entities";

export const GrupoRepository = AppDataSource.getRepository(Grupo).extend({
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
