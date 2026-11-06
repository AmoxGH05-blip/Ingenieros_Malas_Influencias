import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/EstadisticaRepository", () => ({
  EstadisticaRepository: {
    participacionDelCiclo: vi.fn(),
    porCarrera: vi.fn(),
    resumenDeDocentes: vi.fn(),
    tendencia: vi.fn(),
  },
}));
vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { findActivo: vi.fn(), findOneBy: vi.fn() },
}));

import { EstadisticaService } from "./EstadisticaService";
import { EstadisticaRepository } from "../repositories/EstadisticaRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { DatosInvalidosError, NoEncontradoError } from "../utils/errores";

const repo = vi.mocked(EstadisticaRepository);
const repoPeriodo = vi.mocked(PeriodoEvaluacionRepository);

/** Datos tal como los entrega pg: conteos y decimales en texto. */
function prepararCiclo() {
  repoPeriodo.findActivo.mockResolvedValue({ id: 1, nombre: "Evaluacion 2026-1" } as never);
  repo.participacionDelCiclo.mockResolvedValue({ Alumnos: "5", AlumnosParticipantes: "4", Inscripciones: "25", Completadas: "9", Pendientes: "16" });
  repo.porCarrera.mockResolvedValue([
    { ProgramaEducativoId: 2, ProgramaEducativo: "Ingenieria", Alumnos: "5", AlumnosParticipantes: "4", Inscripciones: "25", Completadas: "9", Promedio: "7.63", Clasificacion: "Suficiente" },
    { ProgramaEducativoId: 3, ProgramaEducativo: "Derecho", Alumnos: "0", AlumnosParticipantes: "0", Inscripciones: "0", Completadas: "0", Promedio: null, Clasificacion: null },
  ]);
  repo.resumenDeDocentes.mockResolvedValue({
    DocentesConPromedio: "5", PromedioInstitucional: "7.46", Excelente: "0", Bueno: "1", Suficiente: "3", NoSuficiente: "1",
  });
  repo.tendencia.mockResolvedValue([
    { PeriodoEvaluacionId: 0, PeriodoEvaluacion: "Ciclo historico", DocentesConPromedio: "5", PromedioInstitucional: "7.80", Inscripciones: "0", Completadas: "0" },
    { PeriodoEvaluacionId: 1, PeriodoEvaluacion: "Evaluacion 2026-1", DocentesConPromedio: "5", PromedioInstitucional: "7.46", Inscripciones: "25", Completadas: "9" },
  ]);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("EstadisticaService.institucional", () => {
  it("usa el ciclo activo, convierte los textos de la base a numeros y calcula los dos porcentajes por separado", async () => {
    prepararCiclo();

    const r = await EstadisticaService.institucional();

    expect(repo.participacionDelCiclo).toHaveBeenCalledWith(1);
    expect(r.periodo).toEqual({ id: 1, nombre: "Evaluacion 2026-1" });
    expect(r.resumen).toEqual({
      alumnos: 5,
      alumnosParticipantes: 4,
      participacionAlumnos: 80, // 4 de 5 alumnos enviaron al menos una evaluacion
      inscripciones: 25,
      completadas: 9,
      pendientes: 16,
      avanceEvaluaciones: 36, // 9 de 25 evaluaciones enviadas
      docentesConPromedio: 5,
      promedioInstitucional: 7.46,
    });
  });

  it("arma la distribucion con las cuatro categorias, en cero las que nadie tiene", async () => {
    prepararCiclo();

    const { distribucion } = await EstadisticaService.institucional();

    expect(distribucion).toEqual({ Excelente: 0, Bueno: 1, Suficiente: 3, "No suficiente": 1 });
  });

  it("incluye las carreras sin alumnos con porcentajes null (no 0) y promedio null", async () => {
    prepararCiclo();

    const { porCarrera } = await EstadisticaService.institucional();

    expect(porCarrera[0]).toMatchObject({ nombre: "Ingenieria", participacionAlumnos: 80, avanceEvaluaciones: 36, promedio: 7.63, clasificacion: "Suficiente" });
    expect(porCarrera[1]).toMatchObject({ nombre: "Derecho", alumnos: 0, participacionAlumnos: null, avanceEvaluaciones: null, promedio: null, clasificacion: null });
  });

  it("la tendencia deja el avance en null en un ciclo sin inscripciones, aunque tenga promedio", async () => {
    prepararCiclo();

    const { tendencia } = await EstadisticaService.institucional();

    expect(tendencia.map((t) => [t.nombre, t.promedioInstitucional, t.avanceEvaluaciones])).toEqual([
      ["Ciclo historico", 7.8, null],
      ["Evaluacion 2026-1", 7.46, 36],
    ]);
  });

  it("con un periodoId busca ese ciclo y no el activo", async () => {
    prepararCiclo();
    repoPeriodo.findOneBy.mockResolvedValue({ id: 7, nombre: "Ciclo anterior" } as never);

    const r = await EstadisticaService.institucional("7");

    expect(repoPeriodo.findOneBy).toHaveBeenCalledWith({ id: 7 });
    expect(repoPeriodo.findActivo).not.toHaveBeenCalled();
    expect(repo.participacionDelCiclo).toHaveBeenCalledWith(7);
    expect(r.periodo?.id).toBe(7);
  });

  it("un ciclo sin datos de participacion ni docentes da ceros y null, sin fallar", async () => {
    repoPeriodo.findActivo.mockResolvedValue({ id: 1, nombre: "Vacio" } as never);
    repo.participacionDelCiclo.mockResolvedValue(null);
    repo.porCarrera.mockResolvedValue([]);
    repo.resumenDeDocentes.mockResolvedValue({
      DocentesConPromedio: "0", PromedioInstitucional: null, Excelente: "0", Bueno: "0", Suficiente: "0", NoSuficiente: "0",
    });
    repo.tendencia.mockResolvedValue([]);

    const r = await EstadisticaService.institucional();

    expect(r.resumen).toMatchObject({ alumnos: 0, participacionAlumnos: null, avanceEvaluaciones: null, promedioInstitucional: null, docentesConPromedio: 0 });
    expect(r.porCarrera).toEqual([]);
  });

  it("sin ciclo activo devuelve una respuesta vacia y no consulta nada mas", async () => {
    repoPeriodo.findActivo.mockResolvedValue(null);

    const r = await EstadisticaService.institucional();

    expect(r.periodo).toBeNull();
    expect(r.distribucion).toEqual({ Excelente: 0, Bueno: 0, Suficiente: 0, "No suficiente": 0 });
    expect(repo.participacionDelCiclo).not.toHaveBeenCalled();
  });

  it("responde 404 si el ciclo pedido no existe y 400 si el id no es valido", async () => {
    repoPeriodo.findOneBy.mockResolvedValue(null);
    await expect(EstadisticaService.institucional("99")).rejects.toBeInstanceOf(NoEncontradoError);
    await expect(EstadisticaService.institucional("abc")).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(EstadisticaService.institucional("-1")).rejects.toBeInstanceOf(DatosInvalidosError);
  });
});
