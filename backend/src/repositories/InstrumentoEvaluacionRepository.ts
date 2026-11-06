import { AppDataSource } from "../config/data-source";
import { InstrumentoEvaluacion } from "../entities";

export const InstrumentoEvaluacionRepository = AppDataSource.getRepository(InstrumentoEvaluacion).extend({
  findById(id: number) {
    return this.findOneBy({ id });
  },
  /** El instrumento vigente de un tipo (el mas reciente activo); para los de talleres no hay ciclo que lo fije. */
  findActivoDeTipo(tipoEvaluado: "Docente" | "Autoevaluacion" | "Coordinador" | "Taller") {
    return this.findOne({ where: { tipoEvaluado, activo: true }, order: { id: "DESC" } });
  },
});
