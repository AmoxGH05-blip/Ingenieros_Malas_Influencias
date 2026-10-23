import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { findById: vi.fn(), findOneBy: vi.fn(), update: vi.fn() },
}));
vi.mock("../repositories/UsuarioRolRepository", () => ({
  UsuarioRolRepository: { findRoleNamesByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/SesionRepository", () => ({
  SesionRepository: {
    save: vi.fn(),
    create: vi.fn((entity) => entity),
    desactivarTodasDeUsuario: vi.fn(),
  },
}));
vi.mock("../repositories/PasswordResetTokenRepository", () => ({
  PasswordResetTokenRepository: {
    save: vi.fn(),
    create: vi.fn((entity) => entity),
    findValidByHash: vi.fn(),
  },
}));
vi.mock("./EmailService", () => ({
  EmailService: { enviarCorreoRecuperacion: vi.fn() },
}));

import {
  AuthService,
  CredencialesInvalidasError,
  PasswordActualIncorrectaError,
  PasswordNuevaInvalidaError,
  TokenRecuperacionInvalidoError,
} from "./AuthService";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { SesionRepository } from "../repositories/SesionRepository";
import { PasswordResetTokenRepository } from "../repositories/PasswordResetTokenRepository";
import { EmailService } from "./EmailService";
import { verifyToken } from "../utils/jwt";

const PASSWORD_PLANA = "ClaveDePrueba123!";

async function usuarioDePrueba(overrides: Partial<{ activo: boolean; debeCambiarPassword: boolean }> = {}) {
  return {
    id: 1,
    numeroCuenta: "2024001",
    correoElectronico: "estudiante@prueba.local",
    contrasenaHash: await bcrypt.hash(PASSWORD_PLANA, 10),
    debeCambiarPassword: overrides.debeCambiarPassword ?? false,
    activo: overrides.activo ?? true,
    fechaCreacion: new Date(),
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = "secreto-de-pruebas";
  process.env.SESSION_DURATION_HOURS = "8";
  vi.clearAllMocks();
});

describe("AuthService.login (por numero de cuenta)", () => {
  it("inicia sesion y registra la sesion en tabla cuando las credenciales son correctas", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(usuario as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);

    const resultado = await AuthService.login("2024001", PASSWORD_PLANA);

    expect(UsuarioRepository.findOneBy).toHaveBeenCalledWith({ numeroCuenta: "2024001" });
    expect(resultado.token).toEqual(expect.any(String));
    expect(resultado.usuario).toEqual({
      id: usuario.id,
      numeroCuenta: "2024001",
      correo: usuario.correoElectronico,
      tipoCuenta: "Estudiante",
      roles: ["Estudiante"],
      debeCambiarPassword: false,
    });
    expect(SesionRepository.save).toHaveBeenCalledTimes(1);
    const sesionGuardada = vi.mocked(SesionRepository.save).mock.calls[0][0] as { jti: string; activa: boolean };
    expect(sesionGuardada.activa).toBe(true);
    expect(sesionGuardada.jti).toEqual(expect.any(String));
  });

  it("ignora espacios y mayusculas del numero de cuenta", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ ...usuario, numeroCuenta: "DEMO0001" } as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);

    await AuthService.login("  demo0001 ", PASSWORD_PLANA);

    expect(UsuarioRepository.findOneBy).toHaveBeenCalledWith({ numeroCuenta: "DEMO0001" });
  });

  it("toma el tipo de cuenta del rol de mayor prioridad", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(usuario as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante", "Administrador"]);

    const resultado = await AuthService.login("2024001", PASSWORD_PLANA);

    expect(resultado.usuario.tipoCuenta).toBe("Administrador");
    expect(resultado.usuario.roles).toEqual(["Estudiante", "Administrador"]);
  });

  it("ya no acepta un correo como identificador, ni siquiera consulta la base", async () => {
    await expect(AuthService.login("estudiante@prueba.local", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
    expect(UsuarioRepository.findOneBy).not.toHaveBeenCalled();
  });

  it("rechaza identificadores con caracteres raros o demasiado largos sin consultar la base", async () => {
    for (const malo of ["", "   ", "a b", "x'; DROP TABLE--", "A".repeat(21)]) {
      await expect(AuthService.login(malo, PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
    }
    expect(UsuarioRepository.findOneBy).not.toHaveBeenCalled();
  });

  it("rechaza un numero de cuenta que no existe", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
    await expect(AuthService.login("NOEXISTE", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
  });

  it("rechaza una contrasena incorrecta sin revelar si la cuenta existe", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue((await usuarioDePrueba()) as never);

    await expect(AuthService.login("2024001", "password-incorrecta")).rejects.toThrow(CredencialesInvalidasError);
    expect(SesionRepository.save).not.toHaveBeenCalled();
  });

  it("rechaza el login de un usuario inactivo aunque la contrasena sea correcta", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue((await usuarioDePrueba({ activo: false })) as never);
    await expect(AuthService.login("2024001", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
  });

  it("rechaza una cuenta sin ningun rol asignado", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue((await usuarioDePrueba()) as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue([]);
    await expect(AuthService.login("2024001", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
    expect(SesionRepository.save).not.toHaveBeenCalled();
  });

  it("avisa que debe cambiar la contrasena, tambien dentro del token", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue((await usuarioDePrueba({ debeCambiarPassword: true })) as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);

    const resultado = await AuthService.login("2024001", PASSWORD_PLANA);

    expect(resultado.usuario.debeCambiarPassword).toBe(true);
    expect(verifyToken(resultado.token).debeCambiarPassword).toBe(true);
  });
});

describe("AuthService.cambiarPassword", () => {
  const NUEVA = "OtraClaveNueva456!";

  async function prepararUsuario(extra: Parameters<typeof usuarioDePrueba>[0] = { debeCambiarPassword: true }) {
    const usuario = await usuarioDePrueba(extra);
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(usuario as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);
    return usuario;
  }

  it("cambia la contrasena, quita la marca, cierra las sesiones viejas y entrega una sesion nueva sin bloqueo", async () => {
    const usuario = await prepararUsuario();

    const resultado = await AuthService.cambiarPassword(usuario.id, PASSWORD_PLANA, NUEVA);

    expect(UsuarioRepository.update).toHaveBeenCalledWith(
      { id: usuario.id },
      { contrasenaHash: expect.any(String), debeCambiarPassword: false }
    );
    const nuevoHash = vi.mocked(UsuarioRepository.update).mock.calls[0][1].contrasenaHash as string;
    expect(await bcrypt.compare(NUEVA, nuevoHash)).toBe(true);
    expect(SesionRepository.desactivarTodasDeUsuario).toHaveBeenCalledWith(usuario.id);
    expect(SesionRepository.save).toHaveBeenCalledTimes(1);
    expect(resultado.usuario.debeCambiarPassword).toBe(false);
    expect(verifyToken(resultado.token).debeCambiarPassword).toBe(false);
  });

  it("rechaza si la contrasena actual no es correcta", async () => {
    const usuario = await prepararUsuario();
    await expect(AuthService.cambiarPassword(usuario.id, "no-es-esta", NUEVA)).rejects.toThrow(PasswordActualIncorrectaError);
    expect(UsuarioRepository.update).not.toHaveBeenCalled();
  });

  it.each([
    ["muy corta", "corta"],
    ["demasiado larga", "x".repeat(73)],
    ["de mas de 72 bytes aunque tenga pocos caracteres (ñ ocupa 2)", "ñ".repeat(37)],
    ["igual a la actual", PASSWORD_PLANA],
  ])("rechaza una contrasena nueva %s", async (_caso, nueva) => {
    const usuario = await prepararUsuario();
    await expect(AuthService.cambiarPassword(usuario.id, PASSWORD_PLANA, nueva)).rejects.toThrow(PasswordNuevaInvalidaError);
    expect(UsuarioRepository.update).not.toHaveBeenCalled();
  });

  it("rechaza una cuenta inexistente o inactiva", async () => {
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(null);
    await expect(AuthService.cambiarPassword(99, PASSWORD_PLANA, NUEVA)).rejects.toThrow(CredencialesInvalidasError);

    const inactivo = await usuarioDePrueba({ activo: false });
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(inactivo as never);
    await expect(AuthService.cambiarPassword(inactivo.id, PASSWORD_PLANA, NUEVA)).rejects.toThrow(CredencialesInvalidasError);
  });
});

describe("AuthService.solicitarRecuperacion", () => {
  it("no envia correo ni revela nada cuando el correo no esta registrado", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);

    await AuthService.solicitarRecuperacion("nadie@ejemplo.local", "http://localhost:5173");

    expect(EmailService.enviarCorreoRecuperacion).not.toHaveBeenCalled();
    expect(PasswordResetTokenRepository.save).not.toHaveBeenCalled();
  });

  it("genera un token de un solo uso y envia el correo cuando el usuario existe", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(usuario as never);

    await AuthService.solicitarRecuperacion(usuario.correoElectronico, "http://localhost:5173");

    expect(PasswordResetTokenRepository.save).toHaveBeenCalledTimes(1);
    const tokenGuardado = vi.mocked(PasswordResetTokenRepository.save).mock.calls[0][0] as {
      tokenHash: string;
      usado: boolean;
    };
    // El token crudo nunca debe llegar a la base de datos, solo su hash.
    expect(tokenGuardado.tokenHash).toHaveLength(64); // sha256 en hex
    expect(tokenGuardado.usado).toBe(false);
    expect(EmailService.enviarCorreoRecuperacion).toHaveBeenCalledWith(
      usuario.correoElectronico,
      expect.stringContaining("/reset-password?token=")
    );
  });
});

describe("AuthService.restablecerPassword", () => {
  it("rechaza un token inexistente, ya usado o expirado", async () => {
    vi.mocked(PasswordResetTokenRepository.findValidByHash).mockResolvedValue(null);

    await expect(AuthService.restablecerPassword("token-invalido", "NuevaClave123!")).rejects.toThrow(
      TokenRecuperacionInvalidoError
    );
    expect(UsuarioRepository.update).not.toHaveBeenCalled();
  });

  it("actualiza el hash de la contrasena y desactiva todas las sesiones activas del usuario", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(PasswordResetTokenRepository.findValidByHash).mockResolvedValue({
      id: 1,
      usuarioId: usuario.id,
      tokenHash: "hash-de-prueba",
      fechaCreacion: new Date(),
      fechaExpiracion: new Date(Date.now() + 60_000),
      usado: false,
    } as never);
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(usuario as never);

    await AuthService.restablecerPassword("token-valido", "NuevaClave123!");

    expect(UsuarioRepository.update).toHaveBeenCalledWith(
      { id: usuario.id },
      { contrasenaHash: expect.any(String), debeCambiarPassword: false }
    );
    const nuevoHash = vi.mocked(UsuarioRepository.update).mock.calls[0][1].contrasenaHash as string;
    expect(await bcrypt.compare("NuevaClave123!", nuevoHash)).toBe(true);
    expect(PasswordResetTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ usado: true }));
    expect(SesionRepository.desactivarTodasDeUsuario).toHaveBeenCalledWith(usuario.id);
  });
});
