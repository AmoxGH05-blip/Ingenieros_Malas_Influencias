import { AppDataSource } from "../config/data-source";
import { Facultad } from "../entities";

export const FacultadRepository = AppDataSource.getRepository(Facultad).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
});
