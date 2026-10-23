import { AppDataSource } from "../config/data-source";
import { Sesion } from "../entities";

export const SesionRepository = AppDataSource.getRepository(Sesion).extend({
  async desactivarTodasDeUsuario(usuarioId: number): Promise<void> {
    await this.update({ usuarioId, activa: true }, { activa: false, fechaCierre: new Date() });
  },
});
