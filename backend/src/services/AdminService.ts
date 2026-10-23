import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/data-source";
import { Docente, Estudiante, Usuario, UsuarioRol } from "../entities";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { RolRepository } from "../repositories/RolRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";
import { esViolacionDeUnicidad } from "../utils/errores";
import { MENSAJE_POLITICA_PASSWORD, passwordValida } from "../utils/password";

export class DatosInvalidosError extends Error {}
export class UsuarioDuplicadoError extends Error {}

export const ROLES_CREABLES = ["Estudiante", "Docente", "Coordinador", "Administrador"] as const;
export type RolCreable = (typeof ROLES_CREABLES)[number];

export interface NuevoUsuarioInput {
  rol?: unknown;
  correo?: unknown;
  password?: unknown;
  /** Matricula (alumnos), numero de empleado (docentes) o el que se asigne al coordinador o administrador. */
  numeroCuenta?: unknown;
  nombre?: unknown;
  apellidoPaterno?: unknown;
  apellidoMaterno?: unknown;
  programaEducativoId?: unknown;
  facultadId?: unknown;
}

export interface UsuarioListadoDTO {
  id: number;
  correo: string;
  activo: boolean;
  roles: string[];
  numeroCuenta: string;
  nombre: string | null;
}

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERO_CUENTA_REGEX = /^[A-Z0-9]{1,20}$/;
const DOMINIO_INSTITUCIONAL_ALUMNOS = "my.uvm.edu.mx";
const BCRYPT_ROUNDS = 10;

function texto(valor: unknown, campo: string, max: number, requerido = true): string | null {
  if (valor === undefined || valor === null || valor === "") {
    if (requerido) throw new DatosInvalidosError(`${campo} es requerido`);
    return null;
  }
  if (typeof valor !== "string" || valor.trim().length === 0 || valor.trim().length > max) {
    throw new DatosInvalidosError(`${campo} invalido (maximo ${max} caracteres)`);
  }
  return valor.trim();
}

/** Letras y numeros sin espacios, en mayusculas: es lo que se teclea para iniciar sesion. */
function numeroCuentaValido(valor: unknown): string {
  const numero = texto(valor, "numeroCuenta", 20)!.toUpperCase();
  if (!NUMERO_CUENTA_REGEX.test(numero)) {
    throw new DatosInvalidosError("numeroCuenta solo puede tener letras y numeros, sin espacios (maximo 20)");
  }
  return numero;
}

function entero(valor: unknown, campo: string): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new DatosInvalidosError(`${campo} es requerido`);
  }
  return numero;
}

export const AdminService = {
  async obtenerCatalogos() {
    const [programas, facultades] = await Promise.all([ProgramaEducativoRepository.find(), FacultadRepository.find()]);
    return {
      programasEducativos: programas.map((p) => ({ id: p.id, nombre: p.nombre, nivelEducativo: p.nivelEducativo })),
      facultades: facultades.map((f) => ({ id: f.id, nombre: f.nombre })),
    };
  },

  async listarUsuarios(): Promise<UsuarioListadoDTO[]> {
    const [usuarios, asignaciones, roles, estudiantes, docentes] = await Promise.all([
      UsuarioRepository.find({ order: { id: "ASC" } }),
      UsuarioRolRepository.find(),
      RolRepository.find(),
      EstudianteRepository.find(),
      DocenteRepository.find(),
    ]);
    const nombreRol = new Map(roles.map((r) => [r.id, r.nombre]));
    const estudiantePorUsuario = new Map(estudiantes.map((e) => [e.usuarioId, e]));
    const docentePorUsuario = new Map(docentes.map((d) => [d.usuarioId, d]));

    return usuarios.map((u) => {
      const estudiante = estudiantePorUsuario.get(u.id);
      const docente = docentePorUsuario.get(u.id);
      const perfil = estudiante ?? docente;
      return {
        id: u.id,
        correo: u.correoElectronico,
        activo: u.activo,
        roles: asignaciones.filter((a) => a.usuarioId === u.id).map((a) => nombreRol.get(a.rolId) ?? "?"),
        numeroCuenta: u.numeroCuenta,
        nombre: perfil ? `${perfil.nombre} ${perfil.apellidoPaterno}` : null,
      };
    });
  },

  async crearUsuario(input: NuevoUsuarioInput): Promise<{ id: number; correo: string; rol: RolCreable; numeroCuenta: string }> {
    const rolNombre = ROLES_CREABLES.find((r) => r === input.rol);
    if (!rolNombre) throw new DatosInvalidosError("rol invalido");

    const numeroCuenta = numeroCuentaValido(input.numeroCuenta);
    const esEstudiante = rolNombre === "Estudiante";
    const esDocente = rolNombre === "Docente";
    // Los alumnos no necesitan correo: se les asigna el institucional a<cuenta>@my.uvm.edu.mx.
    const correo = esEstudiante
      ? (texto(input.correo, "correo", 150, false) ?? `a${numeroCuenta.toLowerCase()}@${DOMINIO_INSTITUCIONAL_ALUMNOS}`)
      : texto(input.correo, "correo", 150)!;
    if (!CORREO_REGEX.test(correo)) throw new DatosInvalidosError("correo invalido");
    if (!passwordValida(input.password)) {
      throw new DatosInvalidosError(MENSAJE_POLITICA_PASSWORD);
    }

    const nombre = esEstudiante || esDocente ? texto(input.nombre, "nombre", 100)! : null;
    const apellidoPaterno = esEstudiante || esDocente ? texto(input.apellidoPaterno, "apellidoPaterno", 100)! : null;
    const apellidoMaterno = esEstudiante || esDocente ? texto(input.apellidoMaterno, "apellidoMaterno", 100, false) : null;
    const programaEducativoId = esEstudiante ? entero(input.programaEducativoId, "programaEducativoId") : null;
    const facultadId = esDocente ? entero(input.facultadId, "facultadId") : null;

    if (programaEducativoId !== null && !(await ProgramaEducativoRepository.findById(programaEducativoId))) {
      throw new DatosInvalidosError("programa educativo no existe");
    }
    if (facultadId !== null && !(await FacultadRepository.findById(facultadId))) {
      throw new DatosInvalidosError("facultad no existe");
    }

    // Primero el numero de cuenta: un alumno sin correo recibe uno derivado de su cuenta, y repetirla no debe decir "correo".
    if (await UsuarioRepository.findOneBy({ numeroCuenta })) {
      throw new UsuarioDuplicadoError("Ya existe una cuenta con ese numero de cuenta");
    }
    if (await UsuarioRepository.findOneBy({ correoElectronico: correo })) {
      throw new UsuarioDuplicadoError("Ya existe un usuario con ese correo");
    }

    const rol = await RolRepository.findOneBy({ nombre: rolNombre });
    if (!rol) throw new DatosInvalidosError("rol no configurado en la base de datos");

    const contrasenaHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const usuarioId = await AppDataSource.transaction(async (manager) => {
      const usuario = await manager.save(
        Usuario,
        manager.create(Usuario, {
          numeroCuenta,
          correoElectronico: correo,
          contrasenaHash,
          // La contrasena la pone quien da de alta: la persona la cambia en su primer inicio de sesion.
          debeCambiarPassword: true,
          activo: true,
          fechaCreacion: new Date(),
        })
      );
      await manager.save(UsuarioRol, manager.create(UsuarioRol, { usuarioId: usuario.id, rolId: rol.id }));
      if (esEstudiante) {
        await manager.save(
          Estudiante,
          manager.create(Estudiante, {
            usuarioId: usuario.id,
            programaEducativoId: programaEducativoId!,
            matricula: numeroCuenta,
            nombre: nombre!,
            apellidoPaterno: apellidoPaterno!,
            apellidoMaterno,
          })
        );
      }
      if (esDocente) {
        await manager.save(
          Docente,
          manager.create(Docente, {
            usuarioId: usuario.id,
            facultadId: facultadId!,
            numeroEmpleado: numeroCuenta,
            nombre: nombre!,
            apellidoPaterno: apellidoPaterno!,
            apellidoMaterno,
          })
        );
      }
      return usuario.id;
    }).catch((error: unknown) => {
      // Dos altas simultaneas con el mismo numero de cuenta o correo: gana una y la otra recibe un 409, no un 500.
      if (esViolacionDeUnicidad(error)) {
        throw new UsuarioDuplicadoError("Ya existe una cuenta con ese numero de cuenta o ese correo");
      }
      throw error;
    });

    return { id: usuarioId, correo, rol: rolNombre, numeroCuenta };
  },
};
