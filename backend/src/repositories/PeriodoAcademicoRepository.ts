import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PeriodoAcademico } from "../entities";

export const PeriodoAcademicoRepository = AppDataSource.getRepository(PeriodoAcademico).extend({
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
