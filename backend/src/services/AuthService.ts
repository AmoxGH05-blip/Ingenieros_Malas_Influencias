import crypto from "crypto";
import bcrypt from "bcryptjs";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { SesionRepository } from "../repositories/SesionRepository";
import { PasswordResetTokenRepository } from "../repositories/PasswordResetTokenRepository";
import { signToken, getSessionDurationHours, type TipoCuenta } from "../utils/jwt";
import { generarTokenRecuperacion, hashearToken } from "../utils/resetToken";
import { EmailService } from "./EmailService";

export class CredencialesInvalidasError extends Error {}
export class TokenRecuperacionInvalidoError extends Error {}

interface LoginResult {
  token: string;
  usuario: {
    id: number;
    correo: string;
    tipoCuenta: TipoCuenta;
    roles: string[];
  };
}

const RESET_TOKEN_DURATION_MINUTOS = 30;

const PRIORIDAD_ROLES: TipoCuenta[] = ["Administrador", "Coordinador", "Docente", "Estudiante"];

/** Con "@" se busca por correo (Coordinador/Administrador no tienen matricula); si no, por matricula o numero de empleado. */
async function resolverUsuarioIdPorNumeroCuenta(
  identificador: string
): Promise<{ usuarioId: number; tipoCuenta: TipoCuenta | null } | null> {
  if (identificador.includes("@")) {
    const usuario = await UsuarioRepository.findOneBy({ correoElectronico: identificador.trim() });
    return usuario ? { usuarioId: usuario.id, tipoCuenta: null } : null;
  }

  const estudiante = await EstudianteRepository.findByMatricula(identificador);
  if (estudiante) {
    return { usuarioId: estudiante.usuarioId, tipoCuenta: "Estudiante" };
  }

  const docente = await DocenteRepository.findByNumeroEmpleado(identificador);
  if (docente) {
    return { usuarioId: docente.usuarioId, tipoCuenta: "Docente" };
  }

  return null;
}

export const AuthService = {
  async login(numeroCuenta: string, password: string): Promise<LoginResult> {
    const cuenta = await resolverUsuarioIdPorNumeroCuenta(numeroCuenta);
    if (!cuenta) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }

    const usuario = await UsuarioRepository.findById(cuenta.usuarioId);
    if (!usuario || !usuario.activo) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }

    const passwordValido = await bcrypt.compare(password, usuario.contrasenaHash);
    if (!passwordValido) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }

    const roles = await UsuarioRolRepository.findRoleNamesByUsuarioId(usuario.id);
    const tipoCuenta = cuenta.tipoCuenta ?? PRIORIDAD_ROLES.find((rol) => roles.includes(rol));
    if (!tipoCuenta) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }
    const jti = crypto.randomUUID();

    const token = signToken({
      sub: usuario.id,
      correo: usuario.correoElectronico,
      tipoCuenta,
      roles,
      jti,
    });

    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + getSessionDurationHours() * 60 * 60 * 1000);

    await SesionRepository.save(
      SesionRepository.create({
        usuarioId: usuario.id,
        jti,
        fechaInicio: ahora,
        fechaExpiracion: expiracion,
        fechaCierre: null,
        activa: true,
      })
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        correo: usuario.correoElectronico,
        tipoCuenta,
        roles,
      },
    };
  },

  async solicitarRecuperacion(correo: string, urlBaseFrontend: string): Promise<void> {
    const usuario = await UsuarioRepository.findOneBy({ correoElectronico: correo });
    if (!usuario || !usuario.activo) {
      // Respuesta silenciosa: no se revela si el correo existe o no.
      return;
    }

    const { token, tokenHash } = generarTokenRecuperacion();
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + RESET_TOKEN_DURATION_MINUTOS * 60 * 1000);

    await PasswordResetTokenRepository.save(
      PasswordResetTokenRepository.create({
        usuarioId: usuario.id,
        tokenHash,
        fechaCreacion: ahora,
        fechaExpiracion: expiracion,
        usado: false,
      })
    );

    const enlaceRecuperacion = `${urlBaseFrontend}/reset-password?token=${token}`;
    await EmailService.enviarCorreoRecuperacion(usuario.correoElectronico, enlaceRecuperacion);
  },

  async restablecerPassword(token: string, nuevaPassword: string): Promise<void> {
    const tokenHash = hashearToken(token);
    const registro = await PasswordResetTokenRepository.findValidByHash(tokenHash);
    if (!registro) {
      throw new TokenRecuperacionInvalidoError("Token invalido o expirado");
    }

    const usuario = await UsuarioRepository.findById(registro.usuarioId);
    if (!usuario) {
      throw new TokenRecuperacionInvalidoError("Token invalido o expirado");
    }

    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    await UsuarioRepository.update({ id: usuario.id }, { contrasenaHash: nuevoHash });

    registro.usado = true;
    await PasswordResetTokenRepository.save(registro);

    await SesionRepository.desactivarTodasDeUsuario(usuario.id);
  },
};
