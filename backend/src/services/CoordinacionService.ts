import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";

export interface FiltrosAvance {
  periodoId?: number;
  programaEducativoId?: number;
  grupoId?: number;
}

export interface Contadores {
  concluidos: number;
  parciales: number;
  noIniciados: number;
}

export interface AvanceDTO {
  periodo: { id: number; nombre: string } | null;
  resumen: Contadores & { alumnos: number; porcentajeParticipacion: number };
  porGrupo: (Contadores & { grupoId: number; materia: string; docente: string; seccion: string; inscritos: number })[];
}

type EstadoAlumno = keyof Contadores;

const VACIO: Contadores = { concluidos: 0, parciales: 0, noIniciados: 0 };

function estadoDe(total: number, completadas: number): EstadoAlumno {
  if (completadas === 0) return "noIniciados";
  return completadas === total ? "concluidos" : "parciales";
}

function contar(estados: EstadoAlumno[]): Contadores {
  const resultado = { ...VACIO };
  for (const estado of estados) resultado[estado] += 1;
  return resultado;
}

export const CoordinacionService = {
  async obtenerFiltros() {
    const [periodos, programas, grupos] = await Promise.all([
      PeriodoEvaluacionRepository.find({ order: { id: "DESC" } }),
      ProgramaEducativoRepository.find(),
      GrupoRepository.find(),
    ]);
    const materias = await MateriaRepository.findByIds(grupos.map((g) => g.materiaId));
    const nombreMateria = new Map(materias.map((m) => [m.id, m.nombre]));

    return {
      periodos: periodos.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo })),
      programasEducativos: programas.map((p) => ({ id: p.id, nombre: p.nombre })),
      grupos: grupos.map((g) => ({
        id: g.id,
        nombre: `${nombreMateria.get(g.materiaId) ?? "Materia"} · ${g.seccion}`,
        periodoAcademicoId: g.periodoAcademicoId,
      })),
    };
  },

  /**
   * Parte de Inscripcion (quien DEBE evaluar) y no de Evaluacion: las filas de Evaluacion se crean
   * perezosamente cuando el alumno abre su dashboard, asi que quien nunca entro no tendria fila.
   */
  async obtenerAvance(filtros: FiltrosAvance): Promise<AvanceDTO> {
    const periodo = filtros.periodoId
      ? await PeriodoEvaluacionRepository.findOneBy({ id: filtros.periodoId })
      : await PeriodoEvaluacionRepository.findActivo();
    if (!periodo) {
      return { periodo: null, resumen: { ...VACIO, alumnos: 0, porcentajeParticipacion: 0 }, porGrupo: [] };
    }

    const todosGrupos = await GrupoRepository.find();
    const grupos = todosGrupos.filter(
      (g) => g.periodoAcademicoId === periodo.periodoAcademicoId && (!filtros.grupoId || g.id === filtros.grupoId)
    );
    const grupoIds = new Set(grupos.map((g) => g.id));

    const [inscripcionesTodas, estudiantes, evaluaciones] = await Promise.all([
      InscripcionRepository.find(),
      EstudianteRepository.find(),
      EvaluacionRepository.find({ where: { periodoEvaluacionId: periodo.id, completada: true } }),
    ]);

    const estudiantesValidos = new Set(
      estudiantes
        .filter((e) => !filtros.programaEducativoId || e.programaEducativoId === filtros.programaEducativoId)
        .map((e) => e.id)
    );
    const inscripciones = inscripcionesTodas.filter((i) => grupoIds.has(i.grupoId) && estudiantesValidos.has(i.estudianteId));
    const completadas = new Set(evaluaciones.map((e) => `${e.estudianteId}:${e.grupoId}`));

    const gruposPorAlumno = new Map<number, number[]>();
    for (const i of inscripciones) {
      gruposPorAlumno.set(i.estudianteId, [...(gruposPorAlumno.get(i.estudianteId) ?? []), i.grupoId]);
    }
    const estadoPorAlumno = new Map<number, EstadoAlumno>();
    for (const [alumnoId, gIds] of gruposPorAlumno) {
      const hechas = gIds.filter((gId) => completadas.has(`${alumnoId}:${gId}`)).length;
      estadoPorAlumno.set(alumnoId, estadoDe(gIds.length, hechas));
    }

    const [materias, docentes] = await Promise.all([
      MateriaRepository.findByIds(grupos.map((g) => g.materiaId)),
      DocenteRepository.findByIds(grupos.map((g) => g.docenteId)),
    ]);
    const materiaPorId = new Map(materias.map((m) => [m.id, m]));
    const docentePorId = new Map(docentes.map((d) => [d.id, d]));

    const porGrupo = grupos.map((g) => {
      const alumnosDelGrupo = inscripciones.filter((i) => i.grupoId === g.id).map((i) => i.estudianteId);
      const docente = docentePorId.get(g.docenteId);
      return {
        grupoId: g.id,
        materia: materiaPorId.get(g.materiaId)?.nombre ?? "",
        docente: docente ? `${docente.apellidoPaterno}, ${docente.nombre}` : "",
        seccion: g.seccion,
        inscritos: alumnosDelGrupo.length,
        ...contar(alumnosDelGrupo.map((id) => estadoPorAlumno.get(id)!)),
      };
    });

    const totales = contar([...estadoPorAlumno.values()]);
    const alumnos = estadoPorAlumno.size;
    const participacion = alumnos === 0 ? 0 : Math.round(((totales.concluidos + totales.parciales) / alumnos) * 100);

    return {
      periodo: { id: periodo.id, nombre: periodo.nombre },
      resumen: { ...totales, alumnos, porcentajeParticipacion: participacion },
      porGrupo,
    };
  },
};
