import { AppDataSource } from "../config/data-source";
import { EnvioRecordatorio } from "../entities";

export const EnvioRecordatorioRepository = AppDataSource.getRepository(EnvioRecordatorio).extend({
  /**
   * Reserva el aviso antes de enviarlo: la clave unica garantiza que dos corridas simultaneas
   * no manden el mismo correo. Devuelve false si ya estaba reservado o enviado.
   */
  async reservar(periodoEvaluacionId: number, usuarioId: number, diasAntes: number): Promise<boolean> {
    const resultado = await this.createQueryBuilder()
      .insert()
      .values({ periodoEvaluacionId, usuarioId, diasAntes })
      .orIgnore()
      .returning('"Id"')
      .execute();
    return resultado.raw.length > 0;
  },
  /** Libera la reserva cuando el envio fallo, para reintentar en la siguiente corrida. */
  async liberar(periodoEvaluacionId: number, usuarioId: number, diasAntes: number) {
    await this.delete({ periodoEvaluacionId, usuarioId, diasAntes });
  },
});
