import { AppDataSource } from "../config/data-source";
import { ProgramaEducativo } from "../entities";

export const ProgramaEducativoRepository = AppDataSource.getRepository(ProgramaEducativo).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
});
