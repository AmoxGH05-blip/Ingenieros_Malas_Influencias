import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Usuario } from "../entities";

export const UsuarioRepository = AppDataSource.getRepository(Usuario).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
  findByIds(ids: number[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.findBy({ id: In(ids) });
  },
});
