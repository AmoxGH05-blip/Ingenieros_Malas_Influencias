import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const manager = {
  create: vi.fn((_entidad: unknown, datos: object) => ({ ...datos })),
  save: vi.fn((_entidad: unknown, datos: object) => Promise.resolve({ id: 500, ...datos })),
};

vi.mock("../config/data-source", () => ({
  AppDataSource: { transaction: vi.fn((cb: (m: typeof manager) => unknown) => cb(manager)) },
}));
vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { find: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/UsuarioRolRepository", () => ({
  UsuarioRolRepository: { find: vi.fn() },
}));
vi.mock("../repositories/RolRepository", () => ({
  RolRepository: { find: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { find: vi.fn(), findByMatricula: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { find: vi.fn(), findByNumeroEmpleado: vi.fn() },
}));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({
  ProgramaEducativoRepository: { find: vi.fn(), findById: vi.fn() },
}));
vi.mock("../repositories/FacultadRepository", () => ({
  FacultadRepository: { find: vi.fn(), findById: vi.fn() },
}));

import { AdminService, DatosInvalidosError, UsuarioDuplicadoError } from "./AdminService";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { RolRepository } from "../repositories/RolRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";

const ALUMNO = {
  rol: "Estudiante",
  correo: "nuevo@dygsis.local",
  password: "ClaveSegura123",
  nombre: "Luisa",
  apellidoPaterno: "Mora",
  matricula: "A2026001",
  programaEducativoId: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue(null);
  vi.mocked(DocenteRepository.findByNumeroEmpleado).mockResolvedValue(null);
  vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 4, nombre: "Estudiante" } as never);
  vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue({ id: 3 } as never);
  vi.mocked(FacultadRepository.findById).mockResolvedValue({ id: 2 } as never);
});

describe("AdminService.crearUsuario", () => {
  it("crea un estudiante con su rol y perfil, guardando la contrasena con hash", async () => {
    const resultado = await AdminService.crearUsuario(ALUMNO);

    expect(resultado).toEqual({ id: 500, correo: "nuevo@dygsis.local", rol: "Estudiante", numeroCuenta: "A2026001" });
    const guardados = manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);
    expect(guardados).toEqual(["Usuario", "UsuarioRol", "Estudiante"]);
    const usuario = manager.create.mock.calls[0][1] as { contrasenaHash: string };
    expect(usuario.contrasenaHash).not.toBe(ALUMNO.password);
    expect(await bcrypt.compare(ALUMNO.password, usuario.contrasenaHash)).toBe(true);
  });

  it("crea un coordinador sin perfil de estudiante/docente", async () => {
    vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 2, nombre: "Coordinador" } as never);
    const resultado = await AdminService.crearUsuario({ rol: "Coordinador", correo: "coord@dygsis.local", password: "ClaveSegura123" });

    expect(resultado.numeroCuenta).toBeNull();
    const guardados = manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);
    expect(guardados).toEqual(["Usuario", "UsuarioRol"]);
  });

  it("crea un docente con numero de empleado y facultad", async () => {
    vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 3, nombre: "Docente" } as never);
    const resultado = await AdminService.crearUsuario({
      rol: "Docente", correo: "doc@dygsis.local", password: "ClaveSegura123",
      nombre: "Raul", apellidoPaterno: "Diaz", numeroEmpleado: "EMP9", facultadId: 2,
    });
    expect(resultado.numeroCuenta).toBe("EMP9");
  });

  it.each([
    ["rol invalido", { ...ALUMNO, rol: "Root" }],
    ["correo sin formato", { ...ALUMNO, correo: "no-es-correo" }],
    ["password corta", { ...ALUMNO, password: "corta" }],
    ["estudiante sin matricula", { ...ALUMNO, matricula: "" }],
    ["estudiante sin programa", { ...ALUMNO, programaEducativoId: undefined }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(AdminService.crearUsuario(input)).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza un programa educativo que no existe", async () => {
    vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue(null);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(DatosInvalidosError);
  });

  it("rechaza un correo duplicado", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 1 } as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza una matricula que ya existe", async () => {
    vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue({ id: 9 } as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
  });
});

describe("AdminService.listarUsuarios", () => {
  it("une usuarios con sus roles y numero de cuenta", async () => {
    vi.mocked(UsuarioRepository.find).mockResolvedValue([
      { id: 1, correoElectronico: "demo@dygsis.local", activo: true },
      { id: 2, correoElectronico: "coord@dygsis.local", activo: true },
    ] as never);
    vi.mocked(UsuarioRolRepository.find).mockResolvedValue([
      { usuarioId: 1, rolId: 4 }, { usuarioId: 1, rolId: 1 }, { usuarioId: 2, rolId: 2 },
    ] as never);
    vi.mocked(RolRepository.find).mockResolvedValue([
      { id: 1, nombre: "Administrador" }, { id: 2, nombre: "Coordinador" }, { id: 4, nombre: "Estudiante" },
    ] as never);
    vi.mocked(EstudianteRepository.find).mockResolvedValue([
      { usuarioId: 1, matricula: "DEMO0001", nombre: "Estudiante", apellidoPaterno: "Demo" },
    ] as never);
    vi.mocked(DocenteRepository.find).mockResolvedValue([]);

    const lista = await AdminService.listarUsuarios();

    expect(lista[0]).toEqual({
      id: 1, correo: "demo@dygsis.local", activo: true,
      roles: ["Estudiante", "Administrador"], numeroCuenta: "DEMO0001", nombre: "Estudiante Demo",
    });
    expect(lista[1]).toEqual(expect.objectContaining({ roles: ["Coordinador"], numeroCuenta: null, nombre: null }));
  });
});
