import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { Usuario, UsuarioRol } from "../entities";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { RolRepository } from "../repositories/RolRepository";
import { esViolacionDeUnicidad } from "../utils/errores";
import { MENSAJE_POLITICA_PASSWORD, passwordValida } from "../utils/password";

export class AdminInicialInvalidoError extends Error {}

export interface AdminInicialInput {
  numeroCuenta?: string;
  password: string;
  correo?: string;
}

const NUMERO_CUENTA_REGEX = /^[A-Z0-9]{1,20}$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERO_CUENTA_POR_DEFECTO = "ADMIN0001";

export const AdminInicialService = {
  /**
   * Crea la primera cuenta de Administrador cuando la base esta vacia. La contrasena es temporal:
   * la cuenta nace con cambio obligatorio en el primer inicio de sesion. Nunca pisa una cuenta existente.
   */
  async crear(input: AdminInicialInput): Promise<{ numeroCuenta: string; correo: string }> {
    const numeroCuenta = (input.numeroCuenta?.trim() || NUMERO_CUENTA_POR_DEFECTO).toUpperCase();
    if (!NUMERO_CUENTA_REGEX.test(numeroCuenta)) {
      throw new AdminInicialInvalidoError("El numero de cuenta solo puede tener letras y numeros, sin espacios (maximo 20)");
    }
    if (!passwordValida(input.password)) {
      throw new AdminInicialInvalidoError(MENSAJE_POLITICA_PASSWORD);
    }
    const correo = input.correo?.trim() || `${numeroCuenta.toLowerCase()}@dygsis.local`;
    if (!CORREO_REGEX.test(correo)) {
      throw new AdminInicialInvalidoError("El correo no tiene un formato valido");
    }

    if ((await UsuarioRepository.findOneBy({ numeroCuenta })) || (await UsuarioRepository.findOneBy({ correoElectronico: correo }))) {
      throw new AdminInicialInvalidoError("Ya existe una cuenta con ese numero de cuenta o ese correo; no se modifica nada");
    }
    const rol = await RolRepository.findOneBy({ nombre: "Administrador" });
    if (!rol) {
      throw new Error("El rol Administrador no existe en la base de datos: aplica primero database/postgres_schema.sql");
    }

    const contrasenaHash = await bcrypt.hash(input.password, 10);
    await AppDataSource.transaction(async (manager) => {
      const usuario = await manager.save(
        Usuario,
        manager.create(Usuario, {
          numeroCuenta,
          correoElectronico: correo,
          contrasenaHash,
          debeCambiarPassword: true,
          activo: true,
          fechaCreacion: new Date(),
        })
      );
      await manager.save(UsuarioRol, manager.create(UsuarioRol, { usuarioId: usuario.id, rolId: rol.id }));
    }).catch((error: unknown) => {
      // Dos ejecuciones a la vez: la base garantiza que una sola cree la cuenta.
      if (esViolacionDeUnicidad(error)) {
        throw new AdminInicialInvalidoError("Ya existe una cuenta con ese numero de cuenta o ese correo; no se modifica nada");
      }
      throw error;
    });

    return { numeroCuenta, correo };
  },
};
