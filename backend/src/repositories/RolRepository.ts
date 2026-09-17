import { AppDataSource } from "../config/data-source";
import { Rol } from "../entities";

export const RolRepository = AppDataSource.getRepository(Rol).extend({
  findAllOrderedByName() {
    return this.find({ order: { nombre: "ASC" } });
  },
});
