import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { UsuarioRol, Rol } from "../entities";

export const UsuarioRolRepository = AppDataSource.getRepository(UsuarioRol).extend({
  async findRoleNamesByUsuarioId(usuarioId: number): Promise<string[]> {
    const rolRepository = AppDataSource.getRepository(Rol);
    const asignaciones = await this.findBy({ usuarioId });
    if (asignaciones.length === 0) {
      return [];
    }
    const rolIds = asignaciones.map((asignacion) => asignacion.rolId);
    const roles = await rolRepository.findBy({ id: In(rolIds) });
    return roles.map((rol) => rol.nombre);
  },
});
