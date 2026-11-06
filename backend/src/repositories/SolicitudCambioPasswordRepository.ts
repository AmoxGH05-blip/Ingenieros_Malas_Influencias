import { AppDataSource } from "../config/data-source";
import { SolicitudCambioPassword } from "../entities";

/** Tope de solicitudes que se cargan a la vez: una avalancha de solicitudes no debe volver lento cada aviso de coordinacion. */
export const MAX_SOLICITUDES_LISTADAS = 200;

export const SolicitudCambioPasswordRepository = AppDataSource.getRepository(SolicitudCambioPassword).extend({
  /** Pendientes mas nuevas que `desde` (las anteriores ya vencieron), de la mas antigua a la mas reciente. */
  findPendientesDesde(desde: Date) {
    return this.createQueryBuilder("s")
      .where("s.estado = :estado", { estado: "Pendiente" })
      .andWhere("s.fechaSolicitud > :desde", { desde })
      .orderBy("s.fechaSolicitud", "ASC")
      .take(MAX_SOLICITUDES_LISTADAS)
      .getMany();
  },

  /** Solicitudes de estas cuentas que una solicitud mas nueva reemplazo desde `desde`. */
  findReemplazadasDesde(usuarioIds: number[], desde: Date) {
    return this.createQueryBuilder("s")
      .where("s.usuarioId IN (:...usuarioIds)", { usuarioIds })
      .andWhere("s.estado = :estado", { estado: "Reemplazada" })
      .andWhere("s.fechaResolucion > :desde", { desde })
      .getMany();
  },
});
