import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { InstrumentoEvaluacionRepository } from "../repositories/InstrumentoEvaluacionRepository";
import { OpcionRespuestaRepository } from "../repositories/OpcionRespuestaRepository";
import { TallerRepository, type RespuestaAGuardar } from "../repositories/TallerRepository";
import { armarInstrumento, type InstrumentoDTO } from "./armarInstrumento";
import type { InstrumentoEvaluacion, TipoTaller } from "../entities";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError, esViolacionDeUnicidad } from "../utils/errores";
import { entero } from "../utils/validaciones";

export interface TallerDelAlumnoDTO {
  id: number;
  nombre: string;
  tipo: TipoTaller;
  completada: boolean;
  fechaEvaluacion: string | null;
}

export interface TalleresDelAlumnoDTO {
  /** false si la carrera del alumno no tiene encendida la evaluacion de talleres. */
  habilitado: boolean;
  periodo: { id: number; nombre: string } | null;
  talleres: TallerDelAlumnoDTO[];
}

const aNumero = (valor: string | number): number => (typeof valor === "number" ? valor : Number(valor));

async function estudianteDe(usuarioId: number) {
  const estudiante = await EstudianteRepository.findByUsuarioId(usuarioId);
  if (!estudiante) throw new PermisoDenegadoError("Esta cuenta no tiene un perfil de estudiante");
  return estudiante;
}

/** Cruza lo que mando el alumno con el instrumento: todas las preguntas, ninguna de mas y cada valor debe ser de la escala. */
async function respuestasValidas(instrumento: InstrumentoEvaluacion, respuestas: unknown): Promise<RespuestaAGuardar[]> {
  if (typeof respuestas !== "object" || respuestas === null || Array.isArray(respuestas)) {
    throw new DatosInvalidosError("respuestas es requerido");
  }
  const enviadas = respuestas as Record<string, unknown>;
  const dto = await armarInstrumento(instrumento);
  const preguntaIds = dto.secciones.flatMap((s) => s.preguntas.map((p) => p.id));

  const clavesValidas = new Set(preguntaIds.map(String));
  const sobrantes = Object.keys(enviadas).filter((k) => !clavesValidas.has(k));
  if (sobrantes.length > 0) throw new DatosInvalidosError("Hay respuestas a preguntas que no son del instrumento");
  if (preguntaIds.length === 0 || preguntaIds.some((pid) => enviadas[pid] === undefined)) {
    throw new DatosInvalidosError("Faltan preguntas por responder");
  }

  const opciones = await OpcionRespuestaRepository.findByPreguntaIds(preguntaIds);
  return preguntaIds.map((preguntaId) => {
    const valor = enviadas[preguntaId];
    const opcion = typeof valor === "number" ? opciones.find((o) => o.preguntaId === preguntaId && aNumero(o.valor) === valor) : undefined;
    if (!opcion) throw new DatosInvalidosError("Hay una respuesta que no es una opcion de la escala");
    return { preguntaId, opcionRespuestaId: opcion.id };
  });
}

export const EvaluacionTallerService = {
  /** Talleres de la carrera del alumno que puede evaluar en el ciclo activo, y cuales ya evaluo. */
  async listar(usuarioId: number): Promise<TalleresDelAlumnoDTO> {
    const estudiante = await estudianteDe(usuarioId);
    const carrera = await ProgramaEducativoRepository.findById(estudiante.programaEducativoId);
    const periodo = await PeriodoEvaluacionRepository.findActivo();
    if (!carrera?.evaluaTalleres) return { habilitado: false, periodo: null, talleres: [] };
    if (!periodo) return { habilitado: true, periodo: null, talleres: [] };

    const [talleres, evaluados] = await Promise.all([
      TallerRepository.findByCarrera(carrera.id),
      TallerRepository.evaluadosPorAlumno(estudiante.id, periodo.id),
    ]);
    const fechaPorTaller = new Map(evaluados.map((e) => [e.tallerId, e.fecha]));
    return {
      habilitado: true,
      periodo: { id: periodo.id, nombre: periodo.nombre },
      talleres: talleres
        .filter((t) => t.activo || fechaPorTaller.has(t.id))
        .map((t) => {
          const fecha = fechaPorTaller.get(t.id);
          return { id: t.id, nombre: t.nombre, tipo: t.tipo, completada: fecha !== undefined, fechaEvaluacion: fecha ? fecha.toISOString().slice(0, 10) : null };
        }),
    };
  },

  async instrumento(): Promise<InstrumentoDTO> {
    const instrumento = await InstrumentoEvaluacionRepository.findActivoDeTipo("Taller");
    if (!instrumento) throw new NoEncontradoError("No hay un instrumento de evaluacion de talleres activo");
    return armarInstrumento(instrumento);
  },

  /**
   * Registra la evaluacion de un taller. Exige el ciclo activo, la carrera habilitada, un taller activo de la
   * carrera del alumno, una sola evaluacion por taller y ciclo, y una respuesta valida para cada pregunta.
   */
  async registrar(usuarioId: number, tallerId: unknown, respuestas: unknown): Promise<void> {
    const id = entero(tallerId, "id");
    const estudiante = await estudianteDe(usuarioId);
    const carrera = await ProgramaEducativoRepository.findById(estudiante.programaEducativoId);
    if (!carrera?.evaluaTalleres) throw new PermisoDenegadoError("La evaluacion de talleres no esta habilitada para tu carrera");

    const taller = await TallerRepository.findById(id);
    // Un taller de otra carrera o dado de baja no se distingue de uno inexistente.
    if (!taller || !taller.activo || taller.programaEducativoId !== carrera.id) throw new NoEncontradoError("Taller no encontrado");

    const periodo = await PeriodoEvaluacionRepository.findActivo();
    if (!periodo) throw new ConflictoError("No hay un ciclo de evaluacion activo");

    const instrumento = await InstrumentoEvaluacionRepository.findActivoDeTipo("Taller");
    if (!instrumento) throw new ConflictoError("No hay un instrumento de evaluacion de talleres activo");

    const guardar = await respuestasValidas(instrumento, respuestas);
    try {
      await TallerRepository.guardarEvaluacion({ periodoEvaluacionId: periodo.id, estudianteId: estudiante.id, tallerId: taller.id }, guardar);
    } catch (error) {
      if (esViolacionDeUnicidad(error)) throw new ConflictoError("Ya evaluaste este taller en este ciclo");
      throw error;
    }
  }
};
