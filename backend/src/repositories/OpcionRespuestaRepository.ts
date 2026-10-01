import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { OpcionRespuesta } from "../entities";

export const OpcionRespuestaRepository = AppDataSource.getRepository(OpcionRespuesta).extend({
  findByPreguntaIds(preguntaIds: number[]) {
    if (preguntaIds.length === 0) return Promise.resolve([]);
    return this.find({ where: { preguntaId: In(preguntaIds) }, order: { orden: "ASC" } });
  },
});
