import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { SesionRepository } from "../repositories/SesionRepository";
import type { Usuario } from "../entities";
import { signToken, getSessionDurationHours, type TipoCuenta } from "../utils/jwt";
import { mismaPasswordParaBcrypt, passwordValida } from "../utils/password";

export class CredencialesInvalidasError extends Error {}
export class PasswordActualIncorrectaError extends Error {}
export class PasswordNuevaInvalidaError extends Error {}

export interface LoginResult {
  token: string;
  usuario: {
    id: number;
    numeroCuenta: string;
    correo: string;
    tipoCuenta: TipoCuenta;
    roles: string[];
    debeCambiarPassword: boolean;
  };
}

const NUMERO_CUENTA_REGEX = /^[A-Z0-9]{1,20}$/;
// Hash de una contrasena cualquiera: se compara cuando la cuenta no existe, para que responder
// "cuenta inexistente" no sea notablemente mas rapido que "contrasena incorrecta".
const HASH_SENUELO = "$2a$10$5imIEukw3/Qtlcu46/ROK.1f4GdS7nHrnFgPGOuB439VKzG7a1ElW";

const PRIORIDAD_ROLES: TipoCuenta[] = ["Administrador", "Coordinador", "Docente", "Estudiante"];

/** Registra una sesion nueva y arma la respuesta de login (tambien se usa tras cambiar la contrasena). */
async function abrirSesion(usuario: Usuario, roles: string[]): Promise<LoginResult> {
  const tipoCuenta = PRIORIDAD_ROLES.find((rol) => roles.includes(rol));
  if (!tipoCuenta) {
    throw new CredencialesInvalidasError("Credenciales invalidas");
  }
  const jti = crypto.randomUUID();

  const token = signToken({
    sub: usuario.id,
    numeroCuenta: usuario.numeroCuenta,
    correo: usuario.correoElectronico,
    tipoCuenta,
    roles,
    jti,
    debeCambiarPassword: usuario.debeCambiarPassword,
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
      numeroCuenta: usuario.numeroCuenta,
      correo: usuario.correoElectronico,
      tipoCuenta,
      roles,
      debeCambiarPassword: usuario.debeCambiarPassword,
    },
  };
}

export const AuthService = {
  /** Se entra solo con numero de cuenta (matricula o numero de empleado); el correo ya no sirve. */
  async login(numeroCuenta: string, password: string): Promise<LoginResult> {
    const numero = numeroCuenta.trim().toUpperCase();
    if (!NUMERO_CUENTA_REGEX.test(numero)) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }

    const usuario = await UsuarioRepository.findOneBy({ numeroCuenta: numero });
    const passwordValido = await bcrypt.compare(password, usuario?.contrasenaHash ?? HASH_SENUELO);
    if (!usuario || !usuario.activo || !passwordValido) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }

    const roles = await UsuarioRolRepository.findRoleNamesByUsuarioId(usuario.id);
    return abrirSesion(usuario, roles);
  },

  /**
   * Cambia la contrasena de quien esta dentro (incluido el cambio obligatorio del primer acceso).
   * Cierra todas las sesiones anteriores y devuelve una sesion nueva ya sin la restriccion.
   */
  async cambiarPassword(usuarioId: number, passwordActual: string, nuevaPassword: string): Promise<LoginResult> {
    const usuario = await UsuarioRepository.findById(usuarioId);
    if (!usuario || !usuario.activo) {
      throw new CredencialesInvalidasError("Credenciales invalidas");
    }
    if (!(await bcrypt.compare(passwordActual, usuario.contrasenaHash))) {
      throw new PasswordActualIncorrectaError("La contrasena actual no es correcta");
    }
    if (!passwordValida(nuevaPassword) || mismaPasswordParaBcrypt(nuevaPassword, passwordActual)) {
      throw new PasswordNuevaInvalidaError("La contrasena nueva no es valida");
    }

    const contrasenaHash = await bcrypt.hash(nuevaPassword, 10);
    await UsuarioRepository.update({ id: usuario.id }, { contrasenaHash, debeCambiarPassword: false });
    await SesionRepository.desactivarTodasDeUsuario(usuario.id);

    const roles = await UsuarioRolRepository.findRoleNamesByUsuarioId(usuario.id);
    return abrirSesion({ ...usuario, contrasenaHash, debeCambiarPassword: false }, roles);
  },
};
