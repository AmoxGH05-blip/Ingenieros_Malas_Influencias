import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { find: vi.fn(), findOneBy: vi.fn(), findActivo: vi.fn() },
}));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({
  ProgramaEducativoRepository: { find: vi.fn() },
}));
vi.mock("../repositories/GrupoRepository", () => ({
  GrupoRepository: { find: vi.fn() },
}));
vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByIds: vi.fn() },
}));
vi.mock("../repositories/InscripcionRepository", () => ({
  InscripcionRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EvaluacionRepository", () => ({
  EvaluacionRepository: { find: vi.fn() },
}));

import { CoordinacionService } from "./CoordinacionService";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";

const PERIODO = { id: 5, nombre: "Evaluacion 2026-1", periodoAcademicoId: 1, activo: true };
const GRUPO_A = { id: 10, materiaId: 1, docenteId: 1, periodoAcademicoId: 1, seccion: "3A" };
const GRUPO_B = { id: 11, materiaId: 2, docenteId: 2, periodoAcademicoId: 1, seccion: "3A" };
const GRUPO_OTRO_CICLO = { id: 99, materiaId: 1, docenteId: 1, periodoAcademicoId: 2, seccion: "1A" };

// Alumnos 1 y 2 en la carrera 7; alumno 3 y 4 en la carrera 8.
const ESTUDIANTES = [
  { id: 1, programaEducativoId: 7 },
  { id: 2, programaEducativoId: 7 },
  { id: 3, programaEducativoId: 8 },
  { id: 4, programaEducativoId: 8 },
];

function inscribir(...pares: [number, number][]) {
  vi.mocked(InscripcionRepository.find).mockResolvedValue(
    pares.map(([estudianteId, grupoId], i) => ({ id: i + 1, estudianteId, grupoId })) as never
  );
}

function completadas(...pares: [number, number][]) {
  vi.mocked(EvaluacionRepository.find).mockResolvedValue(
    pares.map(([estudianteId, grupoId]) => ({ estudianteId, grupoId, completada: true })) as never
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(PERIODO as never);
  vi.mocked(GrupoRepository.find).mockResolvedValue([GRUPO_A, GRUPO_B, GRUPO_OTRO_CICLO] as never);
  vi.mocked(EstudianteRepository.find).mockResolvedValue(ESTUDIANTES as never);
  vi.mocked(MateriaRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Base de Datos" }, { id: 2, nombre: "Redes" },
  ] as never);
  vi.mocked(DocenteRepository.findByIds).mockResolvedValue([
    { id: 1, nombre: "Ana", apellidoPaterno: "Garcia" }, { id: 2, nombre: "Beatriz", apellidoPaterno: "Ramirez" },
  ] as never);
});

describe("CoordinacionService.obtenerAvance", () => {
  it("devuelve todo en cero cuando no hay periodo de evaluacion activo", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findActivo).mockResolvedValue(null);
    const avance = await CoordinacionService.obtenerAvance({});
    expect(avance.periodo).toBeNull();
    expect(avance.resumen).toEqual({ concluidos: 0, parciales: 0, noIniciados: 0, alumnos: 0, porcentajeParticipacion: 0 });
    expect(avance.porGrupo).toEqual([]);
  });

  it("no cuenta alumnos sin inscripciones y evita dividir entre cero", async () => {
    inscribir();
    completadas();
    const avance = await CoordinacionService.obtenerAvance({});
    expect(avance.resumen.alumnos).toBe(0);
    expect(avance.resumen.porcentajeParticipacion).toBe(0);
  });

  it("clasifica concluido, parcial y no iniciado (incluye quien nunca abrio su dashboard)", async () => {
    // Alumno 1: 2/2 -> concluido. Alumno 2: 1/2 -> parcial. Alumno 3: 0/2 sin filas de Evaluacion -> no iniciado.
    inscribir([1, 10], [1, 11], [2, 10], [2, 11], [3, 10], [3, 11]);
    completadas([1, 10], [1, 11], [2, 10]);

    const avance = await CoordinacionService.obtenerAvance({});

    expect(avance.resumen).toEqual({ concluidos: 1, parciales: 1, noIniciados: 1, alumnos: 3, porcentajeParticipacion: 67 });
    expect(avance.periodo).toEqual({ id: 5, nombre: "Evaluacion 2026-1" });
  });

  it("ignora grupos de otros ciclos", async () => {
    inscribir([1, 10], [1, 99]);
    completadas([1, 10]);
    const avance = await CoordinacionService.obtenerAvance({});
    expect(avance.resumen.concluidos).toBe(1); // solo cuenta el grupo 10 (el 99 es de otro ciclo)
    expect(avance.porGrupo.map((g) => g.grupoId)).toEqual([10, 11]);
  });

  it("filtra por carrera", async () => {
    inscribir([1, 10], [3, 10]);
    completadas([1, 10]);
    const avance = await CoordinacionService.obtenerAvance({ programaEducativoId: 7 });
    expect(avance.resumen).toEqual(expect.objectContaining({ alumnos: 1, concluidos: 1, noIniciados: 0 }));
  });

  it("filtra por grupo y devuelve solo ese grupo en el desglose", async () => {
    inscribir([1, 10], [1, 11], [2, 11]);
    completadas([1, 11]);
    const avance = await CoordinacionService.obtenerAvance({ grupoId: 11 });
    expect(avance.porGrupo).toHaveLength(1);
    expect(avance.porGrupo[0]).toEqual(
      expect.objectContaining({ grupoId: 11, materia: "Redes", docente: "Ramirez, Beatriz", inscritos: 2, concluidos: 1, noIniciados: 1 })
    );
  });

  it("usa el periodo indicado en lugar del activo", async () => {
    vi.mocked(PeriodoEvaluacionRepository.findOneBy).mockResolvedValue({ ...PERIODO, id: 8 } as never);
    inscribir([1, 10]);
    completadas();
    const avance = await CoordinacionService.obtenerAvance({ periodoId: 8 });
    expect(PeriodoEvaluacionRepository.findOneBy).toHaveBeenCalledWith({ id: 8 });
    expect(avance.periodo?.id).toBe(8);
  });
});

describe("CoordinacionService.obtenerFiltros", () => {
  it("arma periodos, carreras y grupos con nombre legible", async () => {
    vi.mocked(PeriodoEvaluacionRepository.find).mockResolvedValue([PERIODO] as never);
    vi.mocked(ProgramaEducativoRepository.find).mockResolvedValue([{ id: 7, nombre: "Sistemas" }] as never);

    const filtros = await CoordinacionService.obtenerFiltros();

    expect(filtros.periodos).toEqual([{ id: 5, nombre: "Evaluacion 2026-1", activo: true }]);
    expect(filtros.programasEducativos).toEqual([{ id: 7, nombre: "Sistemas" }]);
    expect(filtros.grupos[0]).toEqual({ id: 10, nombre: "Base de Datos · 3A", periodoAcademicoId: 1 });
  });
});
