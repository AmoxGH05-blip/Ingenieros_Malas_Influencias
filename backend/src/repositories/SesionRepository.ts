import { AppDataSource } from "../config/data-source";
import { Sesion } from "../entities";

export const SesionRepository = AppDataSource.getRepository(Sesion).extend({
  async desactivarTodasDeUsuario(usuarioId: number): Promise<void> {
    await this.createQueryBuilder()
      .update(Sesion)
      .set({ activa: false, fechaCierre: () => "SYSDATETIME()" })
      .where("UsuarioId = :usuarioId AND Activa = 1", { usuarioId })
      .execute();
  },
});
