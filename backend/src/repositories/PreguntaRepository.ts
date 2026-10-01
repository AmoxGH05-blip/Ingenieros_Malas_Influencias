import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Pregunta } from "../entities";

export const PreguntaRepository = AppDataSource.getRepository(Pregunta).extend({
  findBySeccionIds(seccionIds: number[]) {
    if (seccionIds.length === 0) return Promise.resolve([]);
    return this.find({ where: { seccionInstrumentoId: In(seccionIds) }, order: { orden: "ASC" } });
  },
});
