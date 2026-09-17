import { AppDataSource } from "../config/data-source";
import { Usuario } from "../entities";

export const UsuarioRepository = AppDataSource.getRepository(Usuario).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
});
