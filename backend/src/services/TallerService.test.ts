import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/TallerRepository", () => ({
  TallerRepository: {
    find: vi.fn(), findById: vi.fn(), create: vi.fn((x) => x), save: vi.fn(async (x) => ({ id: 9, ...x })),
    existeNombre: vi.fn(), carreras: vi.fn(), resultadosDelCiclo: vi.fn(), criteriosDelCiclo: vi.fn(),
  },
}));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({ ProgramaEducativoRepository: { findById: vi.fn(), update: vi.fn() } }));
vi.mock("../repositories/PeriodoEvaluacionRepository", () => ({ PeriodoEvaluacionRepository: { findActivo: vi.fn(), findOneBy: vi.fn() } }));
vi.mock("../repositories/InstrumentoEvaluacionRepository", () => ({ InstrumentoEvaluacionRepository: { findActivoDeTipo: vi.fn() } }));

import { MINIMO_RESPUESTAS_PUBLICAS, TallerService } from "./TallerService";
import { TallerRepository } from "../repositories/TallerRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { InstrumentoEvaluacionRepository } from "../repositories/InstrumentoEvaluacionRepository";
import { ConflictoError, DatosInvalidosError, NoEncontradoError } from "../utils/errores";

const taller = vi.mocked(TallerRepository);
const carrera = vi.mocked(ProgramaEducativoRepository);
const periodo = vi.mocked(PeriodoEvaluacionRepository);
const instrumento = vi.mocked(InstrumentoEvaluacionRepository);

beforeEach(() => {
  vi.clearAllMocks();
  taller.create.mockImplementation(((x: object) => x) as never);
  taller.save.mockImplementation((async (x: object) => ({ id: 9, ...x })) as never);
  taller.existeNombre.mockResolvedValue(false);
  carrera.findById.mockResolvedValue({ id: 2, nombre: "Ingenieria", evaluaTalleres: false } as never);
});

describe("TallerService.crear", () => {
  it("da de alta un taller activo con tipo Taller por defecto", async () => {
    const creado = await TallerService.crear({ programaEducativoId: 2, nombre: "  Taller de redes " });
    expect(creado).toEqual({ id: 9, nombre: "Taller de redes", tipo: "Taller", activo: true });
  });

  it("rechaza datos invalidos con 400", async () => {
    await expect(TallerService.crear(null)).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.crear({ nombre: "X" })).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.crear({ programaEducativoId: "0x2", nombre: "X" })).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.crear({ programaEducativoId: 2, nombre: "   " })).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.crear({ programaEducativoId: 2, nombre: "X", tipo: "Aula" })).rejects.toBeInstanceOf(DatosInvalidosError);
  });

  it("404 si la carrera no existe y 409 si el nombre ya esta en la carrera", async () => {
    carrera.findById.mockResolvedValueOnce(null as never);
    await expect(TallerService.crear({ programaEducativoId: 2, nombre: "X" })).rejects.toBeInstanceOf(NoEncontradoError);
    taller.existeNombre.mockResolvedValueOnce(true);
    await expect(TallerService.crear({ programaEducativoId: 2, nombre: "X" })).rejects.toBeInstanceOf(ConflictoError);
  });

  it("traduce la violacion de unicidad de la base (altas simultaneas) a 409", async () => {
    taller.save.mockRejectedValueOnce({ code: "23505" } as never);
    await expect(TallerService.crear({ programaEducativoId: 2, nombre: "X" })).rejects.toBeInstanceOf(ConflictoError);
  });
});

describe("TallerService.actualizar", () => {
  const existente = { id: 5, programaEducativoId: 2, nombre: "Laboratorio de fisica", tipo: "Laboratorio", activo: true };

  it("da de baja sin tocar lo demas", async () => {
    taller.findById.mockResolvedValue(existente as never);
    const r = await TallerService.actualizar("5", { activo: false });
    expect(r).toMatchObject({ id: 5, nombre: "Laboratorio de fisica", tipo: "Laboratorio", activo: false });
    expect(taller.existeNombre).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo sin cambios, un booleano que no lo es y un id invalido", async () => {
    await expect(TallerService.actualizar("5", {})).rejects.toBeInstanceOf(DatosInvalidosError);
    taller.findById.mockResolvedValue(existente as never);
    await expect(TallerService.actualizar("5", { activo: "false" })).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.actualizar("abc", { activo: true })).rejects.toBeInstanceOf(DatosInvalidosError);
  });

  it("404 si no existe y 409 si el nuevo nombre ya lo tiene otro taller de la carrera", async () => {
    taller.findById.mockResolvedValueOnce(null as never);
    await expect(TallerService.actualizar("5", { activo: true })).rejects.toBeInstanceOf(NoEncontradoError);
    taller.findById.mockResolvedValue(existente as never);
    taller.existeNombre.mockResolvedValueOnce(true);
    await expect(TallerService.actualizar("5", { nombre: "Otro" })).rejects.toBeInstanceOf(ConflictoError);
    expect(taller.existeNombre).toHaveBeenCalledWith(2, "Otro", 5);
  });
});

describe("TallerService.habilitarCarrera", () => {
  it("enciende la carrera si hay instrumento de talleres activo", async () => {
    instrumento.findActivoDeTipo.mockResolvedValue({ id: 2 } as never);
    expect(await TallerService.habilitarCarrera("2", { evaluaTalleres: true })).toEqual({ programaEducativoId: 2, evaluaTalleres: true });
    expect(carrera.update).toHaveBeenCalledWith({ id: 2 }, { evaluaTalleres: true });
  });

  it("no la enciende sin instrumento (409), pero si deja apagarla", async () => {
    instrumento.findActivoDeTipo.mockResolvedValue(null as never);
    await expect(TallerService.habilitarCarrera("2", { evaluaTalleres: true })).rejects.toBeInstanceOf(ConflictoError);
    expect(await TallerService.habilitarCarrera("2", { evaluaTalleres: false })).toEqual({ programaEducativoId: 2, evaluaTalleres: false });
  });

  it("valida el id, el booleano y que la carrera exista", async () => {
    await expect(TallerService.habilitarCarrera("x", { evaluaTalleres: true })).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(TallerService.habilitarCarrera("2", { evaluaTalleres: "si" })).rejects.toBeInstanceOf(DatosInvalidosError);
    carrera.findById.mockResolvedValueOnce(null as never);
    await expect(TallerService.habilitarCarrera("2", { evaluaTalleres: false })).rejects.toBeInstanceOf(NoEncontradoError);
  });
});

describe("TallerService.configuracion", () => {
  it("reparte los talleres en su carrera y convierte los conteos de pg", async () => {
    taller.carreras.mockResolvedValue([
      { Id: 2, Nombre: "Ingenieria", EvaluaTalleres: true, Alumnos: "5" },
      { Id: 3, Nombre: "Derecho", EvaluaTalleres: false, Alumnos: "0" },
    ]);
    taller.find.mockResolvedValue([{ id: 1, programaEducativoId: 2, nombre: "Redes", tipo: "Taller", activo: true }] as never);
    const r = await TallerService.configuracion();
    expect(r[0]).toMatchObject({ programaEducativoId: 2, evaluaTalleres: true, alumnos: 5, talleres: [{ id: 1, nombre: "Redes" }] });
    expect(r[1].talleres).toEqual([]);
  });
});

describe("TallerService.resultados", () => {
  function preparar(respuestas: string) {
    periodo.findActivo.mockResolvedValue({ id: 1, nombre: "Evaluacion 2026-1" } as never);
    taller.carreras.mockResolvedValue([{ Id: 2, Nombre: "Ingenieria", EvaluaTalleres: true, Alumnos: "5" }]);
    taller.resultadosDelCiclo.mockResolvedValue([
      { TallerId: 1, ProgramaEducativoId: 2, Nombre: "Redes", Tipo: "Taller", Activo: true, Respuestas: respuestas, Promedio: "8.25" },
      { TallerId: 2, ProgramaEducativoId: 2, Nombre: "Viejo", Tipo: "Laboratorio", Activo: false, Respuestas: "0", Promedio: null },
    ]);
    taller.criteriosDelCiclo.mockResolvedValue([{ TallerId: 1, SeccionId: 7, Seccion: "Seguridad", Promedio: "9.00" }]);
  }

  it("muestra promedio, criterios y participacion cuando hay suficientes evaluaciones", async () => {
    preparar(String(MINIMO_RESPUESTAS_PUBLICAS));
    const r = await TallerService.resultados();
    const redes = r.carreras[0].talleres[0];
    expect(redes).toMatchObject({ respuestas: 5, participacion: 100, promedio: 8.25, ocultoPorPocasRespuestas: false });
    expect(redes.criterios).toEqual([{ seccionId: 7, nombre: "Seguridad", promedio: 9 }]);
  });

  it("con menos evaluaciones que el minimo oculta promedio, criterios, conteo y participacion (no se puede deducir quien respondio)", async () => {
    preparar(String(MINIMO_RESPUESTAS_PUBLICAS - 1));
    const redes = (await TallerService.resultados()).carreras[0].talleres[0];
    expect(redes).toMatchObject({ respuestas: null, participacion: null, promedio: null, criterios: [], ocultoPorPocasRespuestas: true });
  });

  it("en una carrera con menos alumnos que el minimo nunca se publica el promedio, aunque todos hayan evaluado", async () => {
    preparar("3");
    taller.carreras.mockResolvedValue([{ Id: 2, Nombre: "Ingenieria", EvaluaTalleres: true, Alumnos: "3" }]);
    const redes = (await TallerService.resultados()).carreras[0].talleres[0];
    expect(redes).toMatchObject({ respuestas: null, promedio: null, ocultoPorPocasRespuestas: true });
  });

  it("un taller sin evaluaciones muestra 0 y no se marca como oculto", async () => {
    preparar("0");
    const redes = (await TallerService.resultados()).carreras[0].talleres[0];
    expect(redes).toMatchObject({ respuestas: 0, promedio: null, ocultoPorPocasRespuestas: false });
  });

  it("no lista los talleres dados de baja sin evaluaciones", async () => {
    preparar("5");
    expect((await TallerService.resultados()).carreras[0].talleres.map((t) => t.nombre)).toEqual(["Redes"]);
  });

  it("sin ciclo activo devuelve vacio; con un ciclo que no existe, 404; con id invalido, 400", async () => {
    periodo.findActivo.mockResolvedValue(null as never);
    expect((await TallerService.resultados()).periodo).toBeNull();
    periodo.findOneBy.mockResolvedValue(null as never);
    await expect(TallerService.resultados("9")).rejects.toBeInstanceOf(NoEncontradoError);
    await expect(TallerService.resultados(["1", "2"])).rejects.toBeInstanceOf(DatosInvalidosError);
  });

  it("participacion null si la carrera no tiene alumnos", async () => {
    preparar("5");
    taller.carreras.mockResolvedValue([{ Id: 2, Nombre: "Ingenieria", EvaluaTalleres: true, Alumnos: "0" }]);
    expect((await TallerService.resultados()).carreras[0].talleres[0].participacion).toBeNull();
  });
});
