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
  EstudianteRepository: { find: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { find: vi.fn() },
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
  numeroCuenta: "a2026001",
  correo: "nuevo@dygsis.local",
  password: "ClaveSegura123",
  nombre: "Luisa",
  apellidoPaterno: "Mora",
  programaEducativoId: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 4, nombre: "Estudiante" } as never);
  vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue({ id: 3 } as never);
  vi.mocked(FacultadRepository.findById).mockResolvedValue({ id: 2 } as never);
});

describe("AdminService.crearUsuario", () => {
  it("crea un estudiante con su rol y perfil, el numero de cuenta en mayusculas y la contrasena con hash", async () => {
    const resultado = await AdminService.crearUsuario(ALUMNO);

    expect(resultado).toEqual({ id: 500, correo: "nuevo@dygsis.local", rol: "Estudiante", numeroCuenta: "A2026001" });
    const guardados = manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);
    expect(guardados).toEqual(["Usuario", "UsuarioRol", "Estudiante"]);
    const usuario = manager.create.mock.calls[0][1] as { contrasenaHash: string; numeroCuenta: string };
    expect(usuario.numeroCuenta).toBe("A2026001");
    expect(usuario.contrasenaHash).not.toBe(ALUMNO.password);
    expect(await bcrypt.compare(ALUMNO.password, usuario.contrasenaHash)).toBe(true);
    const estudiante = manager.create.mock.calls[2][1] as { matricula: string };
    expect(estudiante.matricula).toBe("A2026001");
  });

  it("la contrasena la puso otra persona: la cuenta nace con cambio obligatorio", async () => {
    await AdminService.crearUsuario(ALUMNO);
    const usuario = manager.create.mock.calls[0][1] as { debeCambiarPassword: boolean };
    expect(usuario.debeCambiarPassword).toBe(true);
  });

  it("un alumno sin correo recibe el institucional a<cuenta>@my.uvm.edu.mx", async () => {
    const { correo: _omitido, ...sinCorreo } = ALUMNO;
    const resultado = await AdminService.crearUsuario({ ...sinCorreo, numeroCuenta: "010181605" });
    expect(resultado.correo).toBe("a010181605@my.uvm.edu.mx");
  });

  it("crea un coordinador con numero de cuenta y sin perfil de estudiante/docente", async () => {
    vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 2, nombre: "Coordinador" } as never);
    const resultado = await AdminService.crearUsuario({
      rol: "Coordinador", numeroCuenta: "coord2", correo: "coord@dygsis.local", password: "ClaveSegura123",
    });

    expect(resultado.numeroCuenta).toBe("COORD2");
    const guardados = manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);
    expect(guardados).toEqual(["Usuario", "UsuarioRol"]);
  });

  it("crea un docente con numero de empleado y facultad", async () => {
    vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 3, nombre: "Docente" } as never);
    const resultado = await AdminService.crearUsuario({
      rol: "Docente", numeroCuenta: "EMP9", correo: "doc@dygsis.local", password: "ClaveSegura123",
      nombre: "Raul", apellidoPaterno: "Diaz", facultadId: 2,
    });
    expect(resultado.numeroCuenta).toBe("EMP9");
    const docente = manager.create.mock.calls[2][1] as { numeroEmpleado: string };
    expect(docente.numeroEmpleado).toBe("EMP9");
  });

  it.each([
    ["rol invalido", { ...ALUMNO, rol: "Root" }],
    ["correo sin formato", { ...ALUMNO, correo: "no-es-correo" }],
    ["password corta", { ...ALUMNO, password: "corta" }],
    ["password de mas de 72 bytes aunque tenga pocos caracteres", { ...ALUMNO, password: "ñ".repeat(37) }],
    ["sin numero de cuenta", { ...ALUMNO, numeroCuenta: "" }],
    ["numero de cuenta con espacios", { ...ALUMNO, numeroCuenta: "A 2026" }],
    ["numero de cuenta con simbolos", { ...ALUMNO, numeroCuenta: "A-2026" }],
    ["numero de cuenta de mas de 20 caracteres", { ...ALUMNO, numeroCuenta: "A".repeat(21) }],
    ["estudiante sin programa", { ...ALUMNO, programaEducativoId: undefined }],
    ["coordinador sin correo", { rol: "Coordinador", numeroCuenta: "COORD3", password: "ClaveSegura123" }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(AdminService.crearUsuario(input)).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza un programa educativo que no existe", async () => {
    vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue(null);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(DatosInvalidosError);
  });

  it("rechaza un correo duplicado", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockImplementation(((where: { correoElectronico?: string }) =>
      Promise.resolve(where.correoElectronico ? { id: 1 } : null)) as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza un numero de cuenta que ya existe, sea del rol que sea", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockImplementation(((where: { numeroCuenta?: string }) =>
      Promise.resolve(where.numeroCuenta === "A2026001" ? { id: 9 } : null)) as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe("AdminService.crearUsuario: altas simultaneas", () => {
  it("si la base rechaza el duplicado (23505) por una alta simultanea, responde como duplicado y no como error 500", async () => {
    const { AppDataSource } = await import("../config/data-source");
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
  });

  it("otros errores de la base se propagan tal cual", async () => {
    const { AppDataSource } = await import("../config/data-source");
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce(new Error("conexion perdida") as never);
    await expect(AdminService.crearUsuario(ALUMNO)).rejects.toThrow("conexion perdida");
  });
});

describe("AdminService.listarUsuarios", () => {
  it("une usuarios con sus roles y numero de cuenta", async () => {
    vi.mocked(UsuarioRepository.find).mockResolvedValue([
      { id: 1, numeroCuenta: "DEMO0001", correoElectronico: "demo@dygsis.local", activo: true },
      { id: 2, numeroCuenta: "COORD0001", correoElectronico: "coord@dygsis.local", activo: true },
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
    expect(lista[1]).toEqual(expect.objectContaining({ roles: ["Coordinador"], numeroCuenta: "COORD0001", nombre: null }));
  });
});
