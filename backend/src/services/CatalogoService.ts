import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";
import { PeriodoAcademicoRepository } from "../repositories/PeriodoAcademicoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";

export const CatalogoService = {
  /** Todo lo que necesitan las pantallas de altas de cuentas y de grupos para llenar sus listas desplegables. */
  async obtener() {
    const [programas, facultades, periodos, materias, docentes] = await Promise.all([
      ProgramaEducativoRepository.find(),
      FacultadRepository.find(),
      PeriodoAcademicoRepository.find(),
      MateriaRepository.find(),
      DocenteRepository.find(),
    ]);
    return {
      programasEducativos: programas.map((p) => ({ id: p.id, nombre: p.nombre, nivelEducativo: p.nivelEducativo })),
      facultades: facultades.map((f) => ({ id: f.id, nombre: f.nombre })),
      periodosAcademicos: periodos.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo })),
      materias: materias.map((m) => ({ id: m.id, clave: m.clave, nombre: m.nombre, creditos: m.creditos, programaEducativoId: m.programaEducativoId })),
      docentes: docentes.map((d) => ({ id: d.id, numeroEmpleado: d.numeroEmpleado, nombre: `${d.apellidoPaterno}, ${d.nombre}` })),
    };
  },
};
