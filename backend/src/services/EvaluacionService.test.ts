import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { findByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/InscripcionRepository", () => ({
  InscripcionRepository: { findByEstudianteId: vi.fn() },
}));
vi.mock("../repositories/GrupoRepository", () => ({
  GrupoRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { findActivo: vi.fn() },
}));
vi.mock("../repositories/InstrumentoEvaluacionRepository", () => ({
  InstrumentoEvaluacionRepository: { findById: vi.fn() },
}));
vi.mock("../repositories/SeccionInstrumentoRepository", () => ({
  SeccionInstrumentoRepository: { findByInstrumentoId: vi.fn() },
}));
vi.mock("../repositories/PreguntaRepository", () => ({
  PreguntaRepository: { findBySeccionIds: vi.fn() },
}));
vi.mock("../repositories/OpcionRespuestaRepository", () => ({
  OpcionRespuestaRepository: { findByPreguntaIds: vi.fn() },
}));
vi.mock("../repositories/EvaluacionRepository", () => ({
  EvaluacionRepository: {
    findByEstudianteAndPeriodo: vi.fn(),
    findByIdAndEstudiante: vi.fn(),
    create: vi.fn((entity) => entity),
    save: vi.fn((entity) => Promise.resolve({ id: 99, ...entity })),
  },
}));
vi.mock("../repositories/RespuestaEvaluacionRepository", () => ({
  RespuestaEvaluacionRepository: {
    create: vi.fn((entity) => entity),
    save: vi.fn(),
  },
}));

import {
  EvaluacionService,
  EstudianteNoEncontradoError,
  AsignacionNoEncontradaError,
  EvaluacionYaCompletadaError,
  RespuestasIncompletasError,
} from "./EvaluacionService";
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

const ESTUDIANTE = { id: 10, usuarioId: 1 };
const PERIODO = { id: 5, instrumentoId: 7, periodoAcademicoId: 1, nombre: "Periodo", fechaInicio: new Date(), fechaFin: new Date(), activo: true };
const DOCENTE = { id: 2, usuarioId: 20, facultadId: 1, numeroEmpleado: "EMP01", nombre: "Ana", apellidoPaterno: "Garcia", apellidoMaterno: "Lopez" };
const MATERIA = { id: 3, programaEducativoId: 1, clave: "BD301", nombre: "Base de Datos", creditos: 8 };
const GRUPO = { id: 4, materiaId: 3, docenteId: 2, periodoAcademicoId: 1, seccion: "3A", cupoMaximo: 30 };
const INSCRIPCION = { id: 8, estudianteId: 10, grupoId: 4, fechaInscripcion: "2026-08-01" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue(ESTUDIANTE as never);
});

describe("EvaluacionService.listarAsignaciones", () => {
  it("rechaza cuando la cuenta no tiene perfil de estudiante", async () => {
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue(null);
    await expect(EvaluacionService.listarAsignaciones(1)).rejects.toThrow(EstudianteNoEncontradoError);
  });

  it("devuelve lista vacia cuando no hay periodo de evaluacion activo", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(null);
    const resultado = await EvaluacionService.listarAsignaciones(1);
    expect(resultado).toEqual([]);
    expect(InscripcionRepository.findByEstudianteId).not.toHaveBeenCalled();
  });

  it("crea la Evaluacion (pendiente) cuando el alumno esta inscrito pero aun no tiene fila de evaluacion", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
    vi.mocked(InscripcionRepository.findByEstudianteId).mockResolvedValue([INSCRIPCION] as never);
    vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO] as never);
    vi.mocked(MateriaRepository.findByIds).mockResolvedValue([MATERIA] as never);
    vi.mocked(DocenteRepository.findByIds).mockResolvedValue([DOCENTE] as never);
    vi.mocked(EvaluacionRepository.findByEstudianteAndPeriodo).mockResolvedValue([]);

    const resultado = await EvaluacionService.listarAsignaciones(1);

    expect(EvaluacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ estudianteId: 10, grupoId: 4, completada: false })
    );
    expect(resultado).toEqual([
      { id: 99, docente: "Garcia Lopez, Ana", materia: "Base de Datos", grupo: "3A", completada: false, fechaEvaluacion: null },
    ]);
  });

  it("no crea una fila nueva cuando ya existe una Evaluacion para ese grupo", async () => {
    const evaluacionExistente = { id: 55, periodoEvaluacionId: 5, estudianteId: 10, grupoId: 4, completada: true, fechaRespuesta: new Date("2026-09-15"), anonima: true };
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
    vi.mocked(InscripcionRepository.findByEstudianteId).mockResolvedValue([INSCRIPCION] as never);
    vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO] as never);
    vi.mocked(MateriaRepository.findByIds).mockResolvedValue([MATERIA] as never);
    vi.mocked(DocenteRepository.findByIds).mockResolvedValue([DOCENTE] as never);
    vi.mocked(EvaluacionRepository.findByEstudianteAndPeriodo).mockResolvedValue([evaluacionExistente] as never);

    const resultado = await EvaluacionService.listarAsignaciones(1);

    expect(EvaluacionRepository.save).not.toHaveBeenCalled();
    expect(resultado[0]).toEqual(
      expect.objectContaining({ id: 55, completada: true, fechaEvaluacion: "2026-09-15" })
    );
  });
});

describe("EvaluacionService.progreso", () => {
  it("cuenta completadas y pendientes a partir de las asignaciones", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
    vi.mocked(InscripcionRepository.findByEstudianteId).mockResolvedValue([INSCRIPCION] as never);
    vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO] as never);
    vi.mocked(MateriaRepository.findByIds).mockResolvedValue([MATERIA] as never);
    vi.mocked(DocenteRepository.findByIds).mockResolvedValue([DOCENTE] as never);
    vi.mocked(EvaluacionRepository.findByEstudianteAndPeriodo).mockResolvedValue([
      { id: 1, grupoId: 4, completada: true, fechaRespuesta: new Date() },
    ] as never);

    const resultado = await EvaluacionService.progreso(1);
    expect(resultado).toEqual({ total: 1, completadas: 1, pendientes: 0 });
  });
});

describe("EvaluacionService.obtenerInstrumentoActivo", () => {
  it("arma la escala a partir de las opciones de las preguntas, sin duplicados", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
    vi.mocked(InstrumentoEvaluacionRepository.findById).mockResolvedValue({ id: 7, nombre: "Evaluacion Docente 2026" } as never);
    vi.mocked(SeccionInstrumentoRepository.findByInstrumentoId).mockResolvedValue([
      { id: 1, instrumentoId: 7, nombre: "Seccion 1", orden: 1 },
    ] as never);
    vi.mocked(PreguntaRepository.findBySeccionIds).mockResolvedValue([
      { id: 100, seccionInstrumentoId: 1, texto: "Pregunta A", orden: 1 },
      { id: 101, seccionInstrumentoId: 1, texto: "Pregunta B", orden: 2 },
    ] as never);
    vi.mocked(OpcionRespuestaRepository.findByPreguntaIds).mockResolvedValue([
      { id: 1, preguntaId: 100, texto: "Totalmente en desacuerdo", valor: "0.00", orden: 1 },
      { id: 2, preguntaId: 100, texto: "Totalmente de acuerdo", valor: "10.00", orden: 5 },
      { id: 3, preguntaId: 101, texto: "Totalmente en desacuerdo", valor: "0.00", orden: 1 },
      { id: 4, preguntaId: 101, texto: "Totalmente de acuerdo", valor: "10.00", orden: 5 },
    ] as never);

    const instrumento = await EvaluacionService.obtenerInstrumentoActivo();

    expect(instrumento?.escala).toEqual([
      { texto: "Totalmente en desacuerdo", valor: 0 },
      { texto: "Totalmente de acuerdo", valor: 10 },
    ]);
    expect(instrumento?.secciones[0].preguntas).toHaveLength(2);
  });
});

describe("EvaluacionService.registrarRespuesta", () => {
  function mockInstrumentoDeUnaPregunta() {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
    vi.mocked(InstrumentoEvaluacionRepository.findById).mockResolvedValue({ id: 7, nombre: "Evaluacion Docente 2026" } as never);
    vi.mocked(SeccionInstrumentoRepository.findByInstrumentoId).mockResolvedValue([{ id: 1, instrumentoId: 7, nombre: "S1", orden: 1 }] as never);
    vi.mocked(PreguntaRepository.findBySeccionIds).mockResolvedValue([{ id: 100, seccionInstrumentoId: 1, texto: "Pregunta A", orden: 1 }] as never);
    vi.mocked(OpcionRespuestaRepository.findByPreguntaIds).mockResolvedValue([
      { id: 1, preguntaId: 100, texto: "Totalmente en desacuerdo", valor: "0.00", orden: 1 },
      { id: 2, preguntaId: 100, texto: "Totalmente de acuerdo", valor: "10.00", orden: 5 },
    ] as never);
  }

  it("rechaza cuando la asignacion no existe o no pertenece al estudiante", async () => {
    vi.mocked(EvaluacionRepository.findByIdAndEstudiante).mockResolvedValue(null);
    await expect(EvaluacionService.registrarRespuesta(1, 999, { 100: 10 })).rejects.toThrow(AsignacionNoEncontradaError);
  });

  it("bloquea una evaluacion duplicada", async () => {
    vi.mocked(EvaluacionRepository.findByIdAndEstudiante).mockResolvedValue({
      id: 1, estudianteId: 10, grupoId: 4, periodoEvaluacionId: 5, completada: true, fechaRespuesta: new Date(), anonima: true,
    } as never);

    await expect(EvaluacionService.registrarRespuesta(1, 1, { 100: 10 })).rejects.toThrow(EvaluacionYaCompletadaError);
    expect(RespuestaEvaluacionRepository.save).not.toHaveBeenCalled();
  });

  it("rechaza cuando faltan preguntas por responder", async () => {
    vi.mocked(EvaluacionRepository.findByIdAndEstudiante).mockResolvedValue({
      id: 1, estudianteId: 10, grupoId: 4, periodoEvaluacionId: 5, completada: false, fechaRespuesta: null, anonima: true,
    } as never);
    mockInstrumentoDeUnaPregunta();

    await expect(EvaluacionService.registrarRespuesta(1, 1, {})).rejects.toThrow(RespuestasIncompletasError);
    expect(RespuestaEvaluacionRepository.save).not.toHaveBeenCalled();
  });

  it("guarda las respuestas y marca la evaluacion como completada", async () => {
    const evaluacion = { id: 1, estudianteId: 10, grupoId: 4, periodoEvaluacionId: 5, completada: false, fechaRespuesta: null, anonima: true };
    vi.mocked(EvaluacionRepository.findByIdAndEstudiante).mockResolvedValue(evaluacion as never);
    mockInstrumentoDeUnaPregunta();

    await EvaluacionService.registrarRespuesta(1, 1, { 100: 10 });

    expect(RespuestaEvaluacionRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ evaluacionId: 1, preguntaId: 100, opcionRespuestaId: 2 }),
    ]);
    expect(evaluacion.completada).toBe(true);
    expect(evaluacion.fechaRespuesta).toBeInstanceOf(Date);
    expect(EvaluacionRepository.save).toHaveBeenCalledWith(evaluacion);
  });
});
