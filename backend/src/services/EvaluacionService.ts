import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { InstrumentoEvaluacionRepository } from "../repositories/InstrumentoEvaluacionRepository";
import { SeccionInstrumentoRepository } from "../repositories/SeccionInstrumentoRepository";
import { PreguntaRepository } from "../repositories/PreguntaRepository";
import { OpcionRespuestaRepository } from "../repositories/OpcionRespuestaRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";
import { RespuestaEvaluacionRepository } from "../repositories/RespuestaEvaluacionRepository";
import type { Docente, Grupo, Materia } from "../entities";

export class EstudianteNoEncontradoError extends Error {}
export class AsignacionNoEncontradaError extends Error {}
export class EvaluacionYaCompletadaError extends Error {}
export class RespuestasIncompletasError extends Error {}

export interface AsignacionDTO {
  id: number;
  docente: string;
  materia: string;
  grupo: string;
  completada: boolean;
  fechaEvaluacion: string | null;
}

export interface InstrumentoDTO {
  nombre: string;
  escala: { texto: string; valor: number }[];
  secciones: { id: number; nombre: string; preguntas: { id: number; texto: string }[] }[];
}

function nombreDocente(d: Docente): string {
  const apellidos = d.apellidoMaterno ? `${d.apellidoPaterno} ${d.apellidoMaterno}` : d.apellidoPaterno;
  return `${apellidos}, ${d.nombre}`;
}

function toNumber(valor: string | number): number {
  return typeof valor === "number" ? valor : Number(valor);
}

function toFechaISO(fecha: Date | null): string | null {
  return fecha ? fecha.toISOString().slice(0, 10) : null;
}

async function resolverEstudianteId(usuarioId: number): Promise<number> {
  const estudiante = await EstudianteRepository.findByUsuarioId(usuarioId);
  if (!estudiante) {
    throw new EstudianteNoEncontradoError("La cuenta no tiene un perfil de estudiante");
  }
  return estudiante.id;
}

/** Trae/crea (perezosamente) las Evaluacion de cada grupo inscrito en el periodo activo. */
async function construirAsignaciones(estudianteId: number): Promise<AsignacionDTO[]> {
  const periodo = await PeriodoEvaluacionRepository.findActivo();
  if (!periodo) return [];

  const inscripciones = await InscripcionRepository.findByEstudianteId(estudianteId);
  if (inscripciones.length === 0) return [];

  const grupos = await GrupoRepository.findByIds(inscripciones.map((i) => i.grupoId));
  const materias = await MateriaRepository.findByIds(grupos.map((g: Grupo) => g.materiaId));
  const docentes = await DocenteRepository.findByIds(grupos.map((g: Grupo) => g.docenteId));
  const materiaPorId = new Map(materias.map((m: Materia) => [m.id, m]));
  const docentePorId = new Map(docentes.map((d: Docente) => [d.id, d]));

  const existentes = await EvaluacionRepository.findByEstudianteAndPeriodo(estudianteId, periodo.id);
  const evaluacionPorGrupoId = new Map(existentes.map((e) => [e.grupoId, e]));

  const asignaciones: AsignacionDTO[] = [];
  for (const grupo of grupos) {
    let evaluacion = evaluacionPorGrupoId.get(grupo.id);
    if (!evaluacion) {
      evaluacion = await EvaluacionRepository.save(
        EvaluacionRepository.create({
          periodoEvaluacionId: periodo.id,
          estudianteId,
          grupoId: grupo.id,
          fechaRespuesta: null,
          completada: false,
          anonima: true,
        })
      );
    }

    const materia = materiaPorId.get(grupo.materiaId);
    const docente = docentePorId.get(grupo.docenteId);
    if (!materia || !docente) continue;

    asignaciones.push({
      id: evaluacion.id,
      docente: nombreDocente(docente),
      materia: materia.nombre,
      grupo: grupo.seccion,
      completada: evaluacion.completada,
      fechaEvaluacion: toFechaISO(evaluacion.fechaRespuesta),
    });
  }

  return asignaciones;
}

export const EvaluacionService = {
  async listarAsignaciones(usuarioId: number): Promise<AsignacionDTO[]> {
    const estudianteId = await resolverEstudianteId(usuarioId);
    return construirAsignaciones(estudianteId);
  },

  async obtenerAsignacion(usuarioId: number, asignacionId: number): Promise<AsignacionDTO | null> {
    const asignaciones = await this.listarAsignaciones(usuarioId);
    return asignaciones.find((a) => a.id === asignacionId) ?? null;
  },

  async progreso(usuarioId: number): Promise<{ total: number; completadas: number; pendientes: number }> {
    const asignaciones = await this.listarAsignaciones(usuarioId);
    const completadas = asignaciones.filter((a) => a.completada).length;
    return { total: asignaciones.length, completadas, pendientes: asignaciones.length - completadas };
  },

  async obtenerInstrumentoActivo(): Promise<InstrumentoDTO | null> {
    const periodo = await PeriodoEvaluacionRepository.findActivo();
    if (!periodo) return null;

    const instrumento = await InstrumentoEvaluacionRepository.findById(periodo.instrumentoId);
    if (!instrumento) return null;

    const secciones = await SeccionInstrumentoRepository.findByInstrumentoId(instrumento.id);
    const preguntas = await PreguntaRepository.findBySeccionIds(secciones.map((s) => s.id));
    const opciones = await OpcionRespuestaRepository.findByPreguntaIds(preguntas.map((p) => p.id));

    const escalaPorValor = new Map<number, string>();
    for (const opcion of opciones) {
      escalaPorValor.set(toNumber(opcion.valor), opcion.texto);
    }
    const escala = [...escalaPorValor.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([valor, texto]) => ({ texto, valor }));

    return {
      nombre: instrumento.nombre,
      escala,
      secciones: secciones.map((seccion) => ({
        id: seccion.id,
        nombre: seccion.nombre,
        preguntas: preguntas
          .filter((p) => p.seccionInstrumentoId === seccion.id)
          .map((p) => ({ id: p.id, texto: p.texto })),
      })),
    };
  },

  async registrarRespuesta(usuarioId: number, asignacionId: number, respuestas: Record<number, number>): Promise<void> {
    const estudianteId = await resolverEstudianteId(usuarioId);
    const evaluacion = await EvaluacionRepository.findByIdAndEstudiante(asignacionId, estudianteId);
    if (!evaluacion) {
      throw new AsignacionNoEncontradaError("Asignacion no encontrada");
    }
    if (evaluacion.completada) {
      throw new EvaluacionYaCompletadaError("Esta evaluacion ya fue registrada");
    }

    const instrumento = await this.obtenerInstrumentoActivo();
    const todasLasPreguntas = instrumento?.secciones.flatMap((s) => s.preguntas) ?? [];
    const preguntaIds = todasLasPreguntas.map((p) => p.id);

    const respondidas = Object.keys(respuestas).map(Number);
    const faltantes = preguntaIds.filter((id) => !respondidas.includes(id));
    if (preguntaIds.length === 0 || faltantes.length > 0) {
      throw new RespuestasIncompletasError("Faltan preguntas por responder");
    }

    const opciones = await OpcionRespuestaRepository.findByPreguntaIds(preguntaIds);

    const nuevasRespuestas = preguntaIds.map((preguntaId) => {
      const valor = respuestas[preguntaId];
      const opcion = opciones.find((o) => o.preguntaId === preguntaId && toNumber(o.valor) === valor);
      return RespuestaEvaluacionRepository.create({
        evaluacionId: evaluacion.id,
        preguntaId,
        opcionRespuestaId: opcion?.id ?? null,
        respuestaTexto: null,
        respuestaNumerica: opcion ? null : valor,
      });
    });

    await RespuestaEvaluacionRepository.save(nuevasRespuestas);

    evaluacion.completada = true;
    evaluacion.fechaRespuesta = new Date();
    await EvaluacionRepository.save(evaluacion);
  },
};
