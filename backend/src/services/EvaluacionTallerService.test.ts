import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/EstudianteRepository", () => ({ EstudianteRepository: { findByUsuarioId: vi.fn() } }));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({ ProgramaEducativoRepository: { findById: vi.fn() } }));
vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({ PeriodoEvaluacionRepository: { findActivo: vi.fn() } }));
vi.mock("../repositories/InstrumentoEvaluacionRepository", () => ({ InstrumentoEvaluacionRepository: { findActivoDeTipo: vi.fn() } }));
vi.mock("../repositories/OpcionRespuestaRepository", () => ({ OpcionRespuestaRepository: { findByPreguntaIds: vi.fn() } }));
vi.mock("../repositories/TallerRepository", () => ({
  TallerRepository: { findById: vi.fn(), findByCarrera: vi.fn(), evaluadosPorAlumno: vi.fn(), guardarEvaluacion: vi.fn() },
}));
vi.mock("./armarInstrumento", () => ({ armarInstrumento: vi.fn() }));

import { EvaluacionTallerService } from "./EvaluacionTallerService";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { InstrumentoEvaluacionRepository } from "../repositories/InstrumentoEvaluacionRepository";
import { OpcionRespuestaRepository } from "../repositories/OpcionRespuestaRepository";
import { TallerRepository } from "../repositories/TallerRepository";
import { armarInstrumento } from "./armarInstrumento";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError } from "../utils/errores";

const estudiante = vi.mocked(EstudianteRepository);
const carrera = vi.mocked(ProgramaEducativoRepository);
const periodo = vi.mocked(PeriodoEvaluacionRepository);
const instrumento = vi.mocked(InstrumentoEvaluacionRepository);
const opciones = vi.mocked(OpcionRespuestaRepository);
const taller = vi.mocked(TallerRepository);
const armar = vi.mocked(armarInstrumento);

const RESPUESTAS_OK = { 10: 10, 11: 7.5 };

beforeEach(() => {
  vi.clearAllMocks();
  estudiante.findByUsuarioId.mockResolvedValue({ id: 4, programaEducativoId: 2 } as never);
  carrera.findById.mockResolvedValue({ id: 2, evaluaTalleres: true } as never);
  periodo.findActivo.mockResolvedValue({ id: 1, nombre: "Evaluacion 2026-1" } as never);
  instrumento.findActivoDeTipo.mockResolvedValue({ id: 2 } as never);
  taller.findById.mockResolvedValue({ id: 5, programaEducativoId: 2, activo: true } as never);
  taller.guardarEvaluacion.mockResolvedValue(undefined as never);
  armar.mockResolvedValue({ nombre: "T", escala: [], secciones: [{ id: 1, nombre: "S", preguntas: [{ id: 10, texto: "a" }, { id: 11, texto: "b" }] }] });
  opciones.findByPreguntaIds.mockResolvedValue([
    { id: 100, preguntaId: 10, valor: "10.00" }, { id: 101, preguntaId: 10, valor: "7.50" },
    { id: 110, preguntaId: 11, valor: "10.00" }, { id: 111, preguntaId: 11, valor: "7.50" },
  ] as never);
});

describe("EvaluacionTallerService.listar", () => {
  it("con la carrera apagada no hay talleres y avisa que no esta habilitado", async () => {
    carrera.findById.mockResolvedValue({ id: 2, evaluaTalleres: false } as never);
    expect(await EvaluacionTallerService.listar(1)).toEqual({ habilitado: false, periodo: null, talleres: [] });
    expect(taller.findByCarrera).not.toHaveBeenCalled();
  });

  it("lista los talleres activos de su carrera y marca los ya evaluados", async () => {
    taller.findByCarrera.mockResolvedValue([
      { id: 5, nombre: "Redes", tipo: "Taller", activo: true },
      { id: 6, nombre: "Fisica", tipo: "Laboratorio", activo: true },
      { id: 7, nombre: "Baja sin evaluar", tipo: "Taller", activo: false },
      { id: 8, nombre: "Baja evaluado", tipo: "Taller", activo: false },
    ] as never);
    taller.evaluadosPorAlumno.mockResolvedValue([{ tallerId: 5, fecha: new Date("2026-11-03T10:00:00Z") }, { tallerId: 8, fecha: new Date("2026-11-04T10:00:00Z") }]);
    const r = await EvaluacionTallerService.listar(1);
    expect(r.habilitado).toBe(true);
    expect(r.talleres.map((t) => [t.id, t.completada, t.fechaEvaluacion])).toEqual([[5, true, "2026-11-03"], [6, false, null], [8, true, "2026-11-04"]]);
  });

  it("sin ciclo activo no hay talleres por evaluar; sin perfil de alumno, 403", async () => {
    periodo.findActivo.mockResolvedValue(null as never);
    expect((await EvaluacionTallerService.listar(1)).talleres).toEqual([]);
    estudiante.findByUsuarioId.mockResolvedValue(null as never);
    await expect(EvaluacionTallerService.listar(1)).rejects.toBeInstanceOf(PermisoDenegadoError);
  });
});

describe("EvaluacionTallerService.registrar", () => {
  it("guarda una opcion por pregunta con el ciclo y el alumno", async () => {
    await EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK);
    expect(taller.guardarEvaluacion).toHaveBeenCalledWith(
      { periodoEvaluacionId: 1, estudianteId: 4, tallerId: 5 },
      [{ preguntaId: 10, opcionRespuestaId: 100 }, { preguntaId: 11, opcionRespuestaId: 111 }]
    );
  });

  it("403 si la carrera esta apagada; 404 si el taller es de otra carrera, esta de baja o no existe", async () => {
    carrera.findById.mockResolvedValueOnce({ id: 2, evaluaTalleres: false } as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(PermisoDenegadoError);
    taller.findById.mockResolvedValueOnce({ id: 5, programaEducativoId: 3, activo: true } as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(NoEncontradoError);
    taller.findById.mockResolvedValueOnce({ id: 5, programaEducativoId: 2, activo: false } as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(NoEncontradoError);
    taller.findById.mockResolvedValueOnce(null as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(NoEncontradoError);
    expect(taller.guardarEvaluacion).not.toHaveBeenCalled();
  });

  it("409 sin ciclo activo, sin instrumento o si ya lo evaluo (clave unica de la base)", async () => {
    periodo.findActivo.mockResolvedValueOnce(null as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(ConflictoError);
    instrumento.findActivoDeTipo.mockResolvedValueOnce(null as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(ConflictoError);
    taller.guardarEvaluacion.mockRejectedValueOnce({ code: "23505" } as never);
    await expect(EvaluacionTallerService.registrar(1, "5", RESPUESTAS_OK)).rejects.toBeInstanceOf(ConflictoError);
  });

  it("rechaza respuestas incompletas, de mas, fuera de la escala o con formato raro (400)", async () => {
    const casos: unknown[] = [undefined, null, [], "x", { 10: 10 }, { ...RESPUESTAS_OK, 99: 5 }, { 10: 10, 11: 6 }, { 10: "10", 11: 7.5 }, { 10: 10, "011": 7.5, 11: 7.5 }];
    for (const caso of casos) {
      await expect(EvaluacionTallerService.registrar(1, "5", caso), JSON.stringify(caso)).rejects.toBeInstanceOf(DatosInvalidosError);
    }
    expect(taller.guardarEvaluacion).not.toHaveBeenCalled();
  });

  it("valida el id del taller", async () => {
    await expect(EvaluacionTallerService.registrar(1, "5abc", RESPUESTAS_OK)).rejects.toBeInstanceOf(DatosInvalidosError);
  });
});

describe("EvaluacionTallerService.instrumento", () => {
  it("404 si no hay instrumento de talleres activo", async () => {
    instrumento.findActivoDeTipo.mockResolvedValue(null as never);
    await expect(EvaluacionTallerService.instrumento()).rejects.toBeInstanceOf(NoEncontradoError);
  });
});
