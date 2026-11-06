import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/IndicadorRepository", () => ({
  IndicadorRepository: { porPeriodo: vi.fn(), porDocente: vi.fn() },
}));
vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({
  PeriodoEvaluacionRepository: { findActivo: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findOneBy: vi.fn(), findByUsuarioId: vi.fn() },
}));

import { IndicadorService } from "./IndicadorService";
import { IndicadorRepository } from "../repositories/IndicadorRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { DatosInvalidosError, NoEncontradoError } from "../utils/errores";

/** Fila de la vista tal como la entrega pg: conteos y decimales en texto. */
function fila(extra: Record<string, unknown> = {}) {
  return {
    PeriodoEvaluacionId: 5,
    PeriodoEvaluacion: "Evaluacion 2026-1",
    PeriodoInicio: new Date("2026-10-01T00:00:00Z"),
    DocenteId: 1,
    Docente: "Garcia, Ana",
    NumeroEmpleado: "EMP0001",
    Grupos: "2",
    Materias: "Redes, Bases de datos",
    Evaluaciones: "4",
    TotalRespuestas: "60",
    Promedio: "8.13",
    Clasificacion: "Bueno",
    Ranking: "1",
    DocentesConPromedio: "3",
    PeriodoActivo: true,
    ...extra,
  };
}

const DOCENTE = { id: 1, usuarioId: 20, nombre: "Ana", apellidoPaterno: "Garcia", apellidoMaterno: "Lopez", numeroEmpleado: "EMP0001" };

const repoIndicador = vi.mocked(IndicadorRepository);
const repoPeriodo = vi.mocked(PeriodoEvaluacionRepository);
const repoDocente = vi.mocked(DocenteRepository);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("IndicadorService.ranking", () => {
  it("usa el ciclo activo, convierte los textos de la vista a numeros y cuenta la distribucion", async () => {
    repoPeriodo.findActivo.mockResolvedValue({ id: 5, nombre: "Evaluacion 2026-1" } as never);
    repoIndicador.porPeriodo.mockResolvedValue([
      fila({ DocenteId: 1, Promedio: "9.30", Clasificacion: "Excelente", Ranking: "1" }),
      fila({ DocenteId: 2, Docente: "Perez, Luis", Promedio: "8.00", Clasificacion: "Bueno", Ranking: "2" }),
      fila({ DocenteId: 3, Docente: "Ruiz, Eva", Promedio: "6.50", Clasificacion: "No suficiente", Ranking: "3" }),
      fila({ DocenteId: 4, Docente: "Sosa, Tomas", Promedio: null, Clasificacion: null, Ranking: null, Evaluaciones: "0", TotalRespuestas: "0" }),
    ] as never);

    const resultado = await IndicadorService.ranking();

    expect(repoIndicador.porPeriodo).toHaveBeenCalledWith(5);
    expect(resultado.periodo).toEqual({ id: 5, nombre: "Evaluacion 2026-1" });
    expect(resultado.docentes[0]).toMatchObject({ docenteId: 1, promedio: 9.3, clasificacion: "Excelente", ranking: 1, grupos: 2, evaluaciones: 4 });
    expect(resultado.resumen).toEqual({
      docentes: 4,
      docentesConPromedio: 3,
      sinEvaluaciones: 1,
      promedioInstitucional: 7.93,
      distribucion: { Excelente: 1, Bueno: 1, Suficiente: 0, "No suficiente": 1 },
    });
  });

  it("deja a un docente sin respuestas con promedio null (no 0) y fuera del ranking", async () => {
    repoPeriodo.findActivo.mockResolvedValue({ id: 5, nombre: "C" } as never);
    repoIndicador.porPeriodo.mockResolvedValue([fila({ Promedio: null, Clasificacion: null, Ranking: null })] as never);

    const { docentes, resumen } = await IndicadorService.ranking();

    expect(docentes[0]).toMatchObject({ promedio: null, clasificacion: null, ranking: null });
    expect(resumen.promedioInstitucional).toBeNull();
    expect(resumen.sinEvaluaciones).toBe(1);
  });

  it("con un periodoId busca ese ciclo y no el activo", async () => {
    repoPeriodo.findOneBy.mockResolvedValue({ id: 3, nombre: "Ciclo anterior" } as never);
    repoIndicador.porPeriodo.mockResolvedValue([]);

    const resultado = await IndicadorService.ranking("3");

    expect(repoPeriodo.findOneBy).toHaveBeenCalledWith({ id: 3 });
    expect(repoPeriodo.findActivo).not.toHaveBeenCalled();
    expect(resultado.periodo?.id).toBe(3);
  });

  it("devuelve un resumen vacio si no hay ciclo activo", async () => {
    repoPeriodo.findActivo.mockResolvedValue(null);

    const resultado = await IndicadorService.ranking();

    expect(resultado.periodo).toBeNull();
    expect(resultado.docentes).toEqual([]);
    expect(repoIndicador.porPeriodo).not.toHaveBeenCalled();
  });

  it("responde 404 si el ciclo pedido no existe y 400 si el id no es valido", async () => {
    repoPeriodo.findOneBy.mockResolvedValue(null);
    await expect(IndicadorService.ranking("99")).rejects.toBeInstanceOf(NoEncontradoError);
    await expect(IndicadorService.ranking("abc")).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(IndicadorService.ranking("-1")).rejects.toBeInstanceOf(DatosInvalidosError);
  });
});

describe("IndicadorService.historico", () => {
  const ciclos = [
    fila({ PeriodoEvaluacionId: 1, PeriodoEvaluacion: "Ciclo 1", Promedio: "7.60", Clasificacion: "Suficiente", Ranking: "4" }),
    fila({ PeriodoEvaluacionId: 2, PeriodoEvaluacion: "Ciclo 2", Promedio: "8.20", Clasificacion: "Bueno", Ranking: "2" }),
    fila({ PeriodoEvaluacionId: 3, PeriodoEvaluacion: "Ciclo 3", Promedio: "7.10", Clasificacion: "Suficiente", Ranking: "3" }),
  ];

  it("entrega los ciclos en orden con la variacion respecto al ciclo anterior", async () => {
    repoDocente.findOneBy.mockResolvedValue(DOCENTE as never);
    repoIndicador.porDocente.mockResolvedValue(ciclos as never);

    const resultado = await IndicadorService.historico("1");

    expect(resultado.docente).toEqual({ id: 1, nombre: "Ana Garcia Lopez", numeroEmpleado: "EMP0001" });
    expect(resultado.ciclos.map((c) => [c.periodo, c.promedio, c.variacion])).toEqual([
      ["Ciclo 1", 7.6, null],
      ["Ciclo 2", 8.2, 0.6],
      ["Ciclo 3", 7.1, -1.1],
    ]);
  });

  it("marca cual ciclo es el activo", async () => {
    repoDocente.findOneBy.mockResolvedValue(DOCENTE as never);
    repoIndicador.porDocente.mockResolvedValue([
      fila({ PeriodoEvaluacionId: 1, PeriodoActivo: false }),
      fila({ PeriodoEvaluacionId: 2, PeriodoActivo: true }),
      fila({ PeriodoEvaluacionId: 3, PeriodoActivo: false, Promedio: null, Clasificacion: null, Ranking: null }),
    ] as never);

    const resultado = await IndicadorService.historico(1);

    expect(resultado.ciclos.map((c) => c.activo)).toEqual([false, true, false]);
  });

  it("salta los ciclos sin promedio al calcular la variacion", async () => {
    repoDocente.findOneBy.mockResolvedValue(DOCENTE as never);
    repoIndicador.porDocente.mockResolvedValue([
      ciclos[0],
      fila({ PeriodoEvaluacionId: 2, Promedio: null, Clasificacion: null, Ranking: null }),
      ciclos[2],
    ] as never);

    const resultado = await IndicadorService.historico(1);

    expect(resultado.ciclos.map((c) => c.variacion)).toEqual([null, null, -0.5]);
  });

  it("'ultimos' deja solo los ciclos mas recientes, pero la variacion sigue contando el anterior", async () => {
    repoDocente.findOneBy.mockResolvedValue(DOCENTE as never);
    repoIndicador.porDocente.mockResolvedValue(ciclos as never);

    const resultado = await IndicadorService.historico("1", "2");

    expect(resultado.ciclos.map((c) => c.periodo)).toEqual(["Ciclo 2", "Ciclo 3"]);
    expect(resultado.ciclos[0].variacion).toBe(0.6);
  });

  it("valida los parametros y responde 404 si el docente no existe", async () => {
    repoDocente.findOneBy.mockResolvedValue(null);
    await expect(IndicadorService.historico("7")).rejects.toBeInstanceOf(NoEncontradoError);
    await expect(IndicadorService.historico("x")).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(IndicadorService.historico("1", "0")).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(IndicadorService.historico("1", "21")).rejects.toBeInstanceOf(DatosInvalidosError);
    expect(repoIndicador.porDocente).not.toHaveBeenCalled();
  });
});

describe("IndicadorService.mio", () => {
  it("busca el perfil de docente de la sesion, nunca uno indicado por el cliente", async () => {
    repoDocente.findByUsuarioId.mockResolvedValue(DOCENTE as never);
    repoIndicador.porDocente.mockResolvedValue([fila()] as never);

    const resultado = await IndicadorService.mio(20);

    expect(repoDocente.findByUsuarioId).toHaveBeenCalledWith(20);
    expect(repoIndicador.porDocente).toHaveBeenCalledWith(1);
    expect(resultado.ciclos).toHaveLength(1);
  });

  it("responde 404 si la cuenta no es de un docente", async () => {
    repoDocente.findByUsuarioId.mockResolvedValue(null);
    await expect(IndicadorService.mio(99)).rejects.toBeInstanceOf(NoEncontradoError);
  });
});
