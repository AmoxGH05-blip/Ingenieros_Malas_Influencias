import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const manager = {
  create: vi.fn((_entidad: unknown, datos: object) => ({ ...datos })),
  save: vi.fn((_entidad: unknown, datos: object) => Promise.resolve({ id: 1, ...datos })),
};

vi.mock("../config/data-source", () => ({
  AppDataSource: { transaction: vi.fn((cb: (m: typeof manager) => unknown) => cb(manager)) },
}));
vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { findOneBy: vi.fn() },
}));
vi.mock("../repositories/RolRepository", () => ({
  RolRepository: { findOneBy: vi.fn() },
}));

import { AdminInicialService, AdminInicialInvalidoError } from "./AdminInicialService";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { RolRepository } from "../repositories/RolRepository";

const PASSWORD = "ContrasenaTemporal1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 1, nombre: "Administrador" } as never);
});

describe("AdminInicialService.crear", () => {
  it("crea la cuenta con rol Administrador, numero de cuenta en mayusculas y cambio de contrasena obligatorio", async () => {
    const resultado = await AdminInicialService.crear({ numeroCuenta: "admin0001", password: PASSWORD });

    expect(resultado).toEqual({ numeroCuenta: "ADMIN0001", correo: "admin0001@dygsis.local" });
    const guardados = manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);
    expect(guardados).toEqual(["Usuario", "UsuarioRol"]);
    const usuario = manager.create.mock.calls[0][1] as { numeroCuenta: string; debeCambiarPassword: boolean; contrasenaHash: string };
    expect(usuario.numeroCuenta).toBe("ADMIN0001");
    expect(usuario.debeCambiarPassword).toBe(true);
    expect(usuario.contrasenaHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, usuario.contrasenaHash)).toBe(true);
  });

  it("sin numero de cuenta indicado usa ADMIN0001", async () => {
    for (const vacio of [undefined, "", "   "]) {
      vi.clearAllMocks();
      vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
      vi.mocked(RolRepository.findOneBy).mockResolvedValue({ id: 1, nombre: "Administrador" } as never);
      const resultado = await AdminInicialService.crear({ numeroCuenta: vacio, password: PASSWORD });
      expect(resultado.numeroCuenta).toBe("ADMIN0001");
    }
  });

  it("usa el correo indicado cuando se da uno", async () => {
    const resultado = await AdminInicialService.crear({ numeroCuenta: "ADMIN0001", password: PASSWORD, correo: "yo@uvm.mx" });
    expect(resultado.correo).toBe("yo@uvm.mx");
  });

  it.each([
    ["contrasena corta", { numeroCuenta: "ADMIN0001", password: "corta" }],
    ["contrasena de mas de 72 caracteres", { numeroCuenta: "ADMIN0001", password: "x".repeat(73) }],
    ["contrasena de mas de 72 bytes aunque tenga pocos caracteres", { numeroCuenta: "ADMIN0001", password: "ñ".repeat(37) }],
    ["numero de cuenta con simbolos", { numeroCuenta: "ADMIN-1", password: PASSWORD }],
    ["correo sin formato", { numeroCuenta: "ADMIN0001", password: PASSWORD, correo: "no-es-correo" }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(AdminInicialService.crear(input)).rejects.toThrow(AdminInicialInvalidoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("no pisa una cuenta existente: rechaza si el numero de cuenta o el correo ya estan en uso", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 3 } as never);
    await expect(AdminInicialService.crear({ numeroCuenta: "ADMIN0001", password: PASSWORD })).rejects.toThrow(
      AdminInicialInvalidoError
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("si dos ejecuciones simultaneas chocan en la base (23505), una recibe el aviso de cuenta existente", async () => {
    const { AppDataSource } = await import("../config/data-source");
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(AdminInicialService.crear({ numeroCuenta: "ADMIN0001", password: PASSWORD })).rejects.toThrow(
      AdminInicialInvalidoError
    );
  });

  it("falla con un mensaje claro si el rol Administrador no existe en la base", async () => {
    vi.mocked(RolRepository.findOneBy).mockResolvedValue(null);
    await expect(AdminInicialService.crear({ numeroCuenta: "ADMIN0001", password: PASSWORD })).rejects.toThrow(
      /rol Administrador/
    );
  });
});
