import bcrypt from "bcryptjs";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { signToken } from "../utils/jwt";

export class CredencialesInvalidasError extends Error {}

interface LoginResult {
  token: string;
  usuario: {
    id: number;
    correo: string;
    tipoCuenta: "Estudiante" | "Docente";
    roles: string[];
  };
}

async function resolverUsuarioIdPorNumeroCuenta(
  numeroCuenta: string
): Promise<{ usuarioId: number; tipoCuenta: "Estudiante" | "Docente" } | null> {
  const estudiante = await EstudianteRepository.findByMatricula(numeroCuenta);
  if (estudiante) {
    return { usuarioId: estudiante.usuarioId, tipoCuenta: "Estudiante" };
  }

  const docente = await DocenteRepository.findByNumeroEmpleado(numeroCuenta);
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

    const token = signToken({
      sub: usuario.id,
      correo: usuario.correoElectronico,
      tipoCuenta: cuenta.tipoCuenta,
      roles,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        correo: usuario.correoElectronico,
        tipoCuenta: cuenta.tipoCuenta,
        roles,
      },
    };
  },
};
