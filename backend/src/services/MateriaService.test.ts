import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/MateriaRepository", () => ({
  MateriaRepository: { findOneBy: vi.fn(), save: vi.fn(), create: vi.fn((d) => d) },
}));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({
  ProgramaEducativoRepository: { findById: vi.fn() },
}));

import { MateriaService } from "./MateriaService";
import { ConflictoError, DatosInvalidosError, PermisoDenegadoError } from "../utils/errores";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";

const COORD = { usuarioId: 2, roles: ["Coordinador"] };
const NUEVA = { programaEducativoId: 1, clave: "bd-101", nombre: "Base de Datos", creditos: 6 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue({ id: 1 } as never);
  vi.mocked(MateriaRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(MateriaRepository.save).mockImplementation((async (m: object) => ({ id: 30, ...m })) as never);
});

describe("MateriaService.crear", () => {
  it("crea la materia con la clave en mayusculas", async () => {
    const materia = await MateriaService.crear(COORD, NUEVA);
    expect(MateriaRepository.save).toHaveBeenCalledWith({ programaEducativoId: 1, clave: "BD-101", nombre: "Base de Datos", creditos: 6 });
    expect(materia).toEqual({ id: 30, programaEducativoId: 1, clave: "BD-101", nombre: "Base de Datos", creditos: 6 });
  });

  it("los creditos son opcionales y valen 0", async () => {
    const { creditos: _omitido, ...sinCreditos } = NUEVA;
    await MateriaService.crear(COORD, sinCreditos);
    expect(MateriaRepository.save).toHaveBeenCalledWith(expect.objectContaining({ creditos: 0 }));
  });

  it.each([
    ["sin programa", { ...NUEVA, programaEducativoId: undefined }],
    ["sin clave", { ...NUEVA, clave: "" }],
    ["clave con espacios", { ...NUEVA, clave: "BD 101" }],
    ["clave de mas de 20 caracteres", { ...NUEVA, clave: "A".repeat(21) }],
    ["sin nombre", { ...NUEVA, nombre: "" }],
    ["nombre de mas de 150 caracteres", { ...NUEVA, nombre: "N".repeat(151) }],
    ["creditos negativos", { ...NUEVA, creditos: -1 }],
    ["creditos no enteros", { ...NUEVA, creditos: 2.5 }],
    ["creditos absurdos", { ...NUEVA, creditos: 500 }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(MateriaService.crear(COORD, input)).rejects.toThrow(DatosInvalidosError);
    expect(MateriaRepository.save).not.toHaveBeenCalled();
  });

  it("rechaza un programa educativo que no existe", async () => {
    vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue(null);
    await expect(MateriaService.crear(COORD, NUEVA)).rejects.toThrow(DatosInvalidosError);
  });

  it("rechaza una clave que ya existe", async () => {
    vi.mocked(MateriaRepository.findOneBy).mockResolvedValue({ id: 1 } as never);
    await expect(MateriaService.crear(COORD, NUEVA)).rejects.toThrow(ConflictoError);
    expect(MateriaRepository.save).not.toHaveBeenCalled();
  });

  it("si la base rechaza el duplicado (23505) por una creacion simultanea, tambien es un conflicto", async () => {
    vi.mocked(MateriaRepository.save).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(MateriaService.crear(COORD, NUEVA)).rejects.toThrow(ConflictoError);
  });

  it("quien no es Coordinador ni Administrador no puede crear materias", async () => {
    await expect(MateriaService.crear({ usuarioId: 9, roles: ["Docente"] }, NUEVA)).rejects.toThrow(PermisoDenegadoError);
  });
});
