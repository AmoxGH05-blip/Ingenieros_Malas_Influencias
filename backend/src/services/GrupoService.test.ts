import { beforeEach, describe, expect, it, vi } from "vitest";

const manager = {
  findOne: vi.fn(),
  countBy: vi.fn(),
  create: vi.fn((_entidad: unknown, datos: object) => ({ ...datos })),
  save: vi.fn((_entidad: unknown, datos: object) => Promise.resolve({ id: 900, ...datos })),
};

vi.mock("../config/data-source", () => ({
  AppDataSource: { transaction: vi.fn((cb: (m: typeof manager) => unknown) => cb(manager)) },
}));
vi.mock("../repositories/GrupoRepository", () => ({
  GrupoRepository: { find: vi.fn(), findOneBy: vi.fn(), findByIds: vi.fn(), save: vi.fn(), create: vi.fn((d) => d) },
}));
vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findByIds: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByIds: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/PeriodoAcademicoRepository", () => ({
  PeriodoAcademicoRepository: { find: vi.fn(), findOneBy: vi.fn(), findByIds: vi.fn() },
}));
vi.mock("../repositories/InscripcionRepository", () => ({
  InscripcionRepository: { find: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { findByUsuarioId: vi.fn(), findByIds: vi.fn() },
}));
vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { findOneBy: vi.fn(), findByIds: vi.fn() },
}));

import { GrupoService } from "./GrupoService";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError } from "../utils/errores";
import { AppDataSource } from "../config/data-source";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { PeriodoAcademicoRepository } from "../repositories/PeriodoAcademicoRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";

const COORD = { usuarioId: 2, roles: ["Coordinador"] };
const ADMIN = { usuarioId: 1, roles: ["Administrador"] };

const MATERIA = { id: 3, clave: "BD101", nombre: "Base de Datos", programaEducativoId: 1, creditos: 6 };
const DOCENTE = { id: 2, numeroEmpleado: "EMP0001", nombre: "Ana", apellidoPaterno: "Garcia" };
const PERIODO = { id: 1, nombre: "2026-2027 Semestre 1", activo: true };
const GRUPO = { id: 10, materiaId: 3, docenteId: 2, periodoAcademicoId: 1, seccion: "3A", cupoMaximo: 30 };
const NUEVO = { materiaId: 3, docenteId: 2, periodoAcademicoId: 1, seccion: "3a", cupoMaximo: 25 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(MateriaRepository.findOneBy).mockResolvedValue(MATERIA as never);
  vi.mocked(MateriaRepository.findByIds).mockResolvedValue([MATERIA] as never);
  vi.mocked(DocenteRepository.findOneBy).mockResolvedValue(DOCENTE as never);
  vi.mocked(DocenteRepository.findByIds).mockResolvedValue([DOCENTE] as never);
  vi.mocked(PeriodoAcademicoRepository.findOneBy).mockResolvedValue(PERIODO as never);
  vi.mocked(PeriodoAcademicoRepository.findByIds).mockResolvedValue([PERIODO] as never);
  vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(GrupoRepository.find).mockResolvedValue([GRUPO] as never);
  vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO] as never);
  vi.mocked(GrupoRepository.save).mockImplementation((async (g: object) => ({ id: 10, ...g })) as never);
  vi.mocked(InscripcionRepository.find).mockResolvedValue([]);
  manager.findOne.mockResolvedValue(GRUPO);
  manager.countBy.mockResolvedValue(0);
});

describe("GrupoService.crear", () => {
  it("crea el grupo con la seccion en mayusculas y devuelve el detalle con materia, docente y periodo", async () => {
    const grupo = await GrupoService.crear(COORD, NUEVO);

    expect(GrupoRepository.save).toHaveBeenCalledWith({ materiaId: 3, docenteId: 2, periodoAcademicoId: 1, seccion: "3A", cupoMaximo: 25 });
    expect(grupo).toMatchObject({ id: 10, materia: "Base de Datos", docente: "Garcia, Ana", periodo: "2026-2027 Semestre 1", seccion: "3A", cupoMaximo: 25, inscritos: 0 });
  });

  it("el cupo es opcional: 0 significa sin limite", async () => {
    const { cupoMaximo: _omitido, ...sinCupo } = NUEVO;
    await GrupoService.crear(ADMIN, sinCupo);
    expect(GrupoRepository.save).toHaveBeenCalledWith(expect.objectContaining({ cupoMaximo: 0 }));
  });

  it.each([
    ["sin materia", { ...NUEVO, materiaId: undefined }],
    ["materia no numerica", { ...NUEVO, materiaId: "abc" }],
    ["sin docente", { ...NUEVO, docenteId: undefined }],
    ["sin periodo", { ...NUEVO, periodoAcademicoId: undefined }],
    ["seccion vacia", { ...NUEVO, seccion: "" }],
    ["seccion con simbolos", { ...NUEVO, seccion: "3-A" }],
    ["seccion de mas de 10 caracteres", { ...NUEVO, seccion: "A".repeat(11) }],
    ["cupo negativo", { ...NUEVO, cupoMaximo: -1 }],
    ["cupo no entero", { ...NUEVO, cupoMaximo: 2.5 }],
    ["cupo absurdo", { ...NUEVO, cupoMaximo: 100000 }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(GrupoService.crear(COORD, input)).rejects.toThrow(DatosInvalidosError);
    expect(GrupoRepository.save).not.toHaveBeenCalled();
  });

  it.each([
    ["materia", () => vi.mocked(MateriaRepository.findOneBy).mockResolvedValue(null)],
    ["docente", () => vi.mocked(DocenteRepository.findOneBy).mockResolvedValue(null)],
    ["periodo academico", () => vi.mocked(PeriodoAcademicoRepository.findOneBy).mockResolvedValue(null)],
  ])("rechaza un/a %s que no existe", async (_nombre, quitar) => {
    quitar();
    await expect(GrupoService.crear(COORD, NUEVO)).rejects.toThrow(DatosInvalidosError);
  });

  it("rechaza una oferta repetida (misma materia, docente, periodo y seccion) con un conflicto", async () => {
    vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(GRUPO as never);
    await expect(GrupoService.crear(COORD, NUEVO)).rejects.toThrow(ConflictoError);
    expect(GrupoRepository.save).not.toHaveBeenCalled();
  });

  it("si la base rechaza el duplicado (23505) por una creacion simultanea, tambien es un conflicto", async () => {
    vi.mocked(GrupoRepository.save).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(GrupoService.crear(COORD, NUEVO)).rejects.toThrow(ConflictoError);
  });

  it("quien no es Coordinador ni Administrador no puede crear grupos", async () => {
    await expect(GrupoService.crear({ usuarioId: 9, roles: ["Estudiante"] }, NUEVO)).rejects.toThrow(PermisoDenegadoError);
    await expect(GrupoService.crear({ usuarioId: 8, roles: ["Docente"] }, NUEVO)).rejects.toThrow(PermisoDenegadoError);
  });
});

describe("GrupoService.listar", () => {
  it("lista los grupos con materia, docente, periodo e inscritos sobre cupo", async () => {
    vi.mocked(InscripcionRepository.find).mockResolvedValue([{ grupoId: 10 }, { grupoId: 10 }, { grupoId: 99 }] as never);

    const lista = await GrupoService.listar(COORD);

    expect(lista).toEqual([
      {
        id: 10, materiaId: 3, materia: "Base de Datos", claveMateria: "BD101", docenteId: 2, docente: "Garcia, Ana",
        periodoAcademicoId: 1, periodo: "2026-2027 Semestre 1", seccion: "3A", cupoMaximo: 30, inscritos: 2,
      },
    ]);
  });

  it("filtra por periodo academico cuando se indica", async () => {
    vi.mocked(GrupoRepository.find).mockResolvedValue([GRUPO, { ...GRUPO, id: 11, periodoAcademicoId: 2 }] as never);
    const lista = await GrupoService.listar(COORD, 2);
    expect(lista.map((g) => g.id)).toEqual([11]);
  });

  it("rechaza un filtro de periodo que no es un entero positivo", async () => {
    await expect(GrupoService.listar(COORD, "abc")).rejects.toThrow(DatosInvalidosError);
  });

  it("sin permiso de gestion no lista nada", async () => {
    await expect(GrupoService.listar({ usuarioId: 9, roles: ["Estudiante"] })).rejects.toThrow(PermisoDenegadoError);
  });
});

describe("GrupoService.detalle", () => {
  it("devuelve el grupo con sus inscritos (numero de cuenta, nombre y fecha)", async () => {
    vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(GRUPO as never);
    vi.mocked(InscripcionRepository.find).mockResolvedValue([{ estudianteId: 5, grupoId: 10, fechaInscripcion: "2026-10-23" }] as never);
    vi.mocked(EstudianteRepository.findByIds).mockResolvedValue([{ id: 5, usuarioId: 50, nombre: "Luisa", apellidoPaterno: "Mora", apellidoMaterno: null }] as never);
    vi.mocked(UsuarioRepository.findByIds).mockResolvedValue([{ id: 50, numeroCuenta: "A2026001" }] as never);

    const detalle = await GrupoService.detalle(COORD, 10);

    expect(detalle).toMatchObject({ id: 10, materia: "Base de Datos", inscritos: 1 });
    expect(detalle.alumnos).toEqual([{ estudianteId: 5, numeroCuenta: "A2026001", nombre: "Luisa Mora", fechaInscripcion: "2026-10-23" }]);
  });

  it("un grupo que no existe es 'no encontrado'", async () => {
    vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(null);
    await expect(GrupoService.detalle(COORD, 77)).rejects.toThrow(NoEncontradoError);
  });
});

describe("GrupoService.inscribir (por numero de cuenta)", () => {
  beforeEach(() => {
    vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(GRUPO as never);
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 50, numeroCuenta: "A2026001", activo: true } as never);
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue({ id: 5, nombre: "Luisa", apellidoPaterno: "Mora" } as never);
  });

  it("inscribe al alumno en el grupo", async () => {
    const resultado = await GrupoService.inscribir(COORD, 10, "a2026001");

    expect(UsuarioRepository.findOneBy).toHaveBeenCalledWith({ numeroCuenta: "A2026001" });
    expect(manager.save).toHaveBeenCalledWith(expect.anything(), { estudianteId: 5, grupoId: 10 });
    expect(resultado).toEqual({ grupoId: 10, numeroCuenta: "A2026001", nombre: "Luisa Mora" });
  });

  it("rechaza un numero de cuenta mal formado sin consultar nada", async () => {
    await expect(GrupoService.inscribir(COORD, 10, "a b")).rejects.toThrow(DatosInvalidosError);
    expect(UsuarioRepository.findOneBy).not.toHaveBeenCalled();
  });

  it("rechaza una cuenta que no existe, que esta inactiva o que no es de un alumno", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
    await expect(GrupoService.inscribir(COORD, 10, "ZZZ")).rejects.toThrow(DatosInvalidosError);

    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 50, activo: false } as never);
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).rejects.toThrow(DatosInvalidosError);

    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 50, activo: true } as never);
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue(null);
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).rejects.toThrow(/alumno/);
  });

  it("un grupo que no existe es 'no encontrado'", async () => {
    vi.mocked(GrupoRepository.findOneBy).mockResolvedValue(null);
    await expect(GrupoService.inscribir(COORD, 77, "A2026001")).rejects.toThrow(NoEncontradoError);
  });

  it("rechaza inscribir dos veces al mismo alumno en el grupo", async () => {
    manager.countBy.mockImplementation(async (_e: unknown, where: { estudianteId?: number }) => (where.estudianteId ? 1 : 0));
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).rejects.toThrow(ConflictoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza inscribir cuando el grupo ya esta lleno (cupo > 0)", async () => {
    manager.findOne.mockResolvedValue({ ...GRUPO, cupoMaximo: 2 });
    manager.countBy.mockImplementation(async (_e: unknown, where: { estudianteId?: number }) => (where.estudianteId ? 0 : 2));
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).rejects.toThrow(/lleno/);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("cupo 0 significa sin limite", async () => {
    manager.findOne.mockResolvedValue({ ...GRUPO, cupoMaximo: 0 });
    manager.countBy.mockImplementation(async (_e: unknown, where: { estudianteId?: number }) => (where.estudianteId ? 0 : 5000));
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).resolves.toBeDefined();
  });

  it("una inscripcion simultanea que choca en la base (23505) es un conflicto, no un error 500", async () => {
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(GrupoService.inscribir(COORD, 10, "A2026001")).rejects.toThrow(ConflictoError);
  });

  it("sin permiso de gestion no inscribe", async () => {
    await expect(GrupoService.inscribir({ usuarioId: 9, roles: ["Estudiante"] }, 10, "A2026001")).rejects.toThrow(PermisoDenegadoError);
  });
});

describe("GrupoService.validarGrupoIds / inscribirEnTransaccion (alta de alumnos con grupos)", () => {
  it("sin grupos devuelve una lista vacia", async () => {
    expect(await GrupoService.validarGrupoIds(undefined)).toEqual([]);
    expect(await GrupoService.validarGrupoIds(null)).toEqual([]);
    expect(await GrupoService.validarGrupoIds([])).toEqual([]);
  });

  it("quita repetidos y comprueba que todos existan", async () => {
    vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO, { ...GRUPO, id: 11 }] as never);
    expect(await GrupoService.validarGrupoIds([10, 11, 10])).toEqual([10, 11]);
    expect(GrupoRepository.findByIds).toHaveBeenCalledWith([10, 11]);
  });

  it.each([["no es lista", "10"], ["ids no enteros", [1, "x"]], ["ids no positivos", [0]], ["demasiados", Array.from({ length: 21 }, (_v, i) => i + 1)]])(
    "rechaza grupoIds invalido: %s",
    async (_caso, valor) => {
      await expect(GrupoService.validarGrupoIds(valor)).rejects.toThrow(DatosInvalidosError);
    }
  );

  it("rechaza si algun grupo no existe", async () => {
    vi.mocked(GrupoRepository.findByIds).mockResolvedValue([GRUPO] as never);
    await expect(GrupoService.validarGrupoIds([10, 99])).rejects.toThrow(DatosInvalidosError);
  });

  it("inscribirEnTransaccion inscribe en cada grupo y se detiene si alguno esta lleno", async () => {
    await GrupoService.inscribirEnTransaccion(manager as never, 5, [10, 11]);
    expect(manager.save).toHaveBeenCalledTimes(2);

    vi.clearAllMocks();
    manager.findOne.mockResolvedValue({ ...GRUPO, cupoMaximo: 1 });
    manager.countBy.mockImplementation(async (_e: unknown, where: { estudianteId?: number }) => (where.estudianteId ? 0 : 1));
    await expect(GrupoService.inscribirEnTransaccion(manager as never, 5, [10])).rejects.toThrow(/lleno/);
  });
});
