import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { findByMatricula: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { findByNumeroEmpleado: vi.fn() },
}));
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

import { AuthService, CredencialesInvalidasError, TokenRecuperacionInvalidoError } from "./AuthService";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { SesionRepository } from "../repositories/SesionRepository";
import { PasswordResetTokenRepository } from "../repositories/PasswordResetTokenRepository";
import { EmailService } from "./EmailService";

const PASSWORD_PLANA = "ClaveDePrueba123!";

async function usuarioDePrueba(overrides: Partial<{ activo: boolean }> = {}) {
  return {
    id: 1,
    correoElectronico: "estudiante@prueba.local",
    contrasenaHash: await bcrypt.hash(PASSWORD_PLANA, 10),
    activo: overrides.activo ?? true,
    fechaCreacion: new Date(),
  };
}

beforeEach(() => {
  process.env.JWT_SECRET = "secreto-de-pruebas";
  process.env.SESSION_DURATION_HOURS = "8";
  vi.clearAllMocks();
});

describe("AuthService.login", () => {
  it("inicia sesion y registra la sesion en tabla cuando las credenciales son correctas", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue({
      usuarioId: usuario.id,
    } as never);
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(usuario as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);

    const resultado = await AuthService.login("2024001", PASSWORD_PLANA);

    expect(resultado.token).toEqual(expect.any(String));
    expect(resultado.usuario).toEqual({
      id: usuario.id,
      correo: usuario.correoElectronico,
      tipoCuenta: "Estudiante",
      roles: ["Estudiante"],
    });
    expect(SesionRepository.save).toHaveBeenCalledTimes(1);
    const sesionGuardada = vi.mocked(SesionRepository.save).mock.calls[0][0] as { jti: string; activa: boolean };
    expect(sesionGuardada.activa).toBe(true);
    expect(sesionGuardada.jti).toEqual(expect.any(String));
  });

  it("rechaza un numero de cuenta que no existe como estudiante ni docente", async () => {
    vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue(null);
    vi.mocked(DocenteRepository.findByNumeroEmpleado).mockResolvedValue(null);

    await expect(AuthService.login("noexiste", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
    expect(UsuarioRepository.findById).not.toHaveBeenCalled();
  });

  it("rechaza una contrasena incorrecta sin revelar si la cuenta existe", async () => {
    const usuario = await usuarioDePrueba();
    vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue({ usuarioId: usuario.id } as never);
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(usuario as never);

    await expect(AuthService.login("2024001", "password-incorrecta")).rejects.toThrow(
      CredencialesInvalidasError
    );
    expect(SesionRepository.save).not.toHaveBeenCalled();
  });

  it("rechaza el login de un usuario inactivo aunque la contrasena sea correcta", async () => {
    const usuario = await usuarioDePrueba({ activo: false });
    vi.mocked(EstudianteRepository.findByMatricula).mockResolvedValue({ usuarioId: usuario.id } as never);
    vi.mocked(UsuarioRepository.findById).mockResolvedValue(usuario as never);

    await expect(AuthService.login("2024001", PASSWORD_PLANA)).rejects.toThrow(CredencialesInvalidasError);
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
      { contrasenaHash: expect.any(String) }
    );
    const nuevoHash = vi.mocked(UsuarioRepository.update).mock.calls[0][1].contrasenaHash as string;
    expect(await bcrypt.compare("NuevaClave123!", nuevoHash)).toBe(true);
    expect(PasswordResetTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({ usado: true }));
    expect(SesionRepository.desactivarTodasDeUsuario).toHaveBeenCalledWith(usuario.id);
  });
});
