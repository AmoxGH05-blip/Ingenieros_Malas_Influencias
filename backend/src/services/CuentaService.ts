import bcrypt from "bcryptjs";
import { In, type EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Docente, Estudiante, Rol, Usuario, UsuarioRol } from "../entities";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { RolRepository } from "../repositories/RolRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";
import { ConflictoError, DatosInvalidosError, PermisoDenegadoError, esViolacionDeUnicidad } from "../utils/errores";
import { MENSAJE_POLITICA_PASSWORD, passwordValida } from "../utils/password";
import type { Actor } from "../utils/permisos";
import { entero, numeroCuentaValido, texto } from "../utils/validaciones";
import { GrupoService } from "./GrupoService";

export const ROLES_ASIGNABLES = ["Estudiante", "Docente", "Coordinador", "Administrador"] as const;
export type RolAsignable = (typeof ROLES_ASIGNABLES)[number];

export interface AltaCuentaInput {
  rol?: unknown;
  /** Matricula (alumnos), numero de empleado (docentes) o el que se asigne al coordinador o administrador. */
  numeroCuenta?: unknown;
  /** Solo para cuentas nuevas: la de una cuenta existente nunca se toca desde aqui. */
  password?: unknown;
  correo?: unknown;
  nombre?: unknown;
  apellidoPaterno?: unknown;
  apellidoMaterno?: unknown;
  programaEducativoId?: unknown;
  facultadId?: unknown;
  /** Solo para alumnos: grupos en los que se inscribe al darlo de alta. */
  grupoIds?: unknown;
}

export interface CuentaListadaDTO {
  id: number;
  numeroCuenta: string;
  correo: string;
  activo: boolean;
  roles: string[];
  nombre: string | null;
}

export interface CuentaCreadaDTO {
  id: number;
  numeroCuenta: string;
  correo: string;
  rol: RolAsignable;
  roles: string[];
  /** true: cuenta nueva; false: se agrego un rol a una cuenta que ya existia. */
  creada: boolean;
  gruposInscritos: number;
}

interface PerfilPersona {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
}

export type BusquedaCuentaDTO =
  | { existe: false; numeroCuenta: string; rolesAsignables: RolAsignable[] }
  | { existe: true; gestionable: false; numeroCuenta: string }
  | {
      existe: true;
      gestionable: true;
      numeroCuenta: string;
      correo: string;
      activo: boolean;
      roles: string[];
      nombre: string | null;
      perfil: PerfilPersona | null;
      perfiles: { estudiante: boolean; docente: boolean };
      rolesAsignables: RolAsignable[];
    };

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMINIO_INSTITUCIONAL_ALUMNOS = "my.uvm.edu.mx";
const BCRYPT_ROUNDS = 10;
const ROLES_DEL_COORDINADOR: RolAsignable[] = ["Estudiante", "Docente"];

/** Roles que este actor puede dar de alta o asignar. El Administrador, todos; el Coordinador, solo alumnos y docentes. */
function rolesAsignablesPara(rolesActor: string[]): RolAsignable[] {
  if (rolesActor.includes("Administrador")) return [...ROLES_ASIGNABLES];
  if (rolesActor.includes("Coordinador")) return [...ROLES_DEL_COORDINADOR];
  return [];
}

/**
 * El Coordinador solo gestiona cuentas de alumnos y docentes; las de coordinadores y administradores son del
 * Administrador. Una cuenta sin ningun rol tampoco es del Coordinador: no hay nada que diga que sea un alumno o un docente.
 */
function puedeGestionar(rolesActor: string[], rolesCuenta: string[]): boolean {
  if (rolesActor.includes("Administrador")) return true;
  if (rolesActor.includes("Coordinador")) {
    return rolesCuenta.length > 0 && rolesCuenta.every((rol) => (ROLES_DEL_COORDINADOR as string[]).includes(rol));
  }
  return false;
}

function exigirAlgunPermiso(actor: Actor): void {
  if (rolesAsignablesPara(actor.roles).length === 0) {
    throw new PermisoDenegadoError("No tienes permiso para gestionar cuentas");
  }
}

function nombreCompleto(perfil: PerfilPersona | null): string | null {
  return perfil ? `${perfil.nombre} ${perfil.apellidoPaterno}` : null;
}

/** Nombre y carrera/facultad que necesita el perfil de un alumno o un docente. */
interface DatosPerfil extends PerfilPersona {
  programaEducativoId: number | null;
  facultadId: number | null;
}

async function leerDatosPerfil(input: AltaCuentaInput, rol: RolAsignable): Promise<DatosPerfil | null> {
  if (rol !== "Estudiante" && rol !== "Docente") return null;
  const datos: DatosPerfil = {
    nombre: texto(input.nombre, "nombre", 100)!,
    apellidoPaterno: texto(input.apellidoPaterno, "apellidoPaterno", 100)!,
    apellidoMaterno: texto(input.apellidoMaterno, "apellidoMaterno", 100, false),
    programaEducativoId: rol === "Estudiante" ? entero(input.programaEducativoId, "programaEducativoId") : null,
    facultadId: rol === "Docente" ? entero(input.facultadId, "facultadId") : null,
  };
  if (datos.programaEducativoId !== null && !(await ProgramaEducativoRepository.findById(datos.programaEducativoId))) {
    throw new DatosInvalidosError("programa educativo no existe");
  }
  if (datos.facultadId !== null && !(await FacultadRepository.findById(datos.facultadId))) {
    throw new DatosInvalidosError("facultad no existe");
  }
  return datos;
}

/** Los grupos solo aplican a alumnos: pedirlos para otro rol es un error, no algo que se ignore en silencio. */
async function gruposDelAlta(rol: RolAsignable, valor: unknown): Promise<number[]> {
  if (rol === "Estudiante") return GrupoService.validarGrupoIds(valor);
  if (valor !== undefined && valor !== null && !(Array.isArray(valor) && valor.length === 0)) {
    throw new DatosInvalidosError("Solo los alumnos se inscriben a grupos");
  }
  return [];
}

function guardarPerfil(manager: EntityManager, rol: RolAsignable, usuarioId: number, numeroCuenta: string, datos: DatosPerfil) {
  const comunes = { usuarioId, nombre: datos.nombre, apellidoPaterno: datos.apellidoPaterno, apellidoMaterno: datos.apellidoMaterno };
  if (rol === "Estudiante") {
    return manager.save(Estudiante, manager.create(Estudiante, { ...comunes, programaEducativoId: datos.programaEducativoId!, matricula: numeroCuenta }));
  }
  return manager.save(Docente, manager.create(Docente, { ...comunes, facultadId: datos.facultadId!, numeroEmpleado: numeroCuenta }));
}

/** Roles de una cuenta leidos con la conexion de la transaccion en curso (otra consulta del pool podria agotarlo). */
async function rolesEnTransaccion(manager: EntityManager, usuarioId: number): Promise<string[]> {
  const asignaciones = await manager.findBy(UsuarioRol, { usuarioId });
  if (asignaciones.length === 0) return [];
  const roles = await manager.findBy(Rol, { id: In(asignaciones.map((a) => a.rolId)) });
  return roles.map((r) => r.nombre);
}

/** Dos altas simultaneas con el mismo numero de cuenta o correo: gana una y la otra recibe un 409, no un 500. */
function comoDuplicado(error: unknown): never {
  if (esViolacionDeUnicidad(error)) {
    throw new ConflictoError("Ya existe una cuenta con ese numero de cuenta o ese correo");
  }
  throw error;
}

async function perfilDe(usuarioId: number) {
  const [estudiante, docente] = await Promise.all([
    EstudianteRepository.findByUsuarioId(usuarioId),
    DocenteRepository.findByUsuarioId(usuarioId),
  ]);
  return { estudiante, docente };
}

async function crearCuentaNueva(actor: Actor, rolNombre: RolAsignable, numeroCuenta: string, input: AltaCuentaInput): Promise<CuentaCreadaDTO> {
  // Los alumnos no necesitan correo: se les asigna el institucional a<cuenta>@my.uvm.edu.mx. Siempre en minusculas.
  const correo = (
    rolNombre === "Estudiante"
      ? (texto(input.correo, "correo", 150, false) ?? `a${numeroCuenta}@${DOMINIO_INSTITUCIONAL_ALUMNOS}`)
      : texto(input.correo, "correo", 150)!
  ).toLowerCase();
  if (!CORREO_REGEX.test(correo)) throw new DatosInvalidosError("correo invalido");
  if (!passwordValida(input.password)) throw new DatosInvalidosError(MENSAJE_POLITICA_PASSWORD);
  const perfil = await leerDatosPerfil(input, rolNombre);
  const grupoIds = await gruposDelAlta(rolNombre, input.grupoIds);

  if (await UsuarioRepository.findOneBy({ correoElectronico: correo })) {
    throw new ConflictoError("Ya existe un usuario con ese correo");
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
        creadoPorUsuarioId: actor.usuarioId,
        activo: true,
        fechaCreacion: new Date(),
      })
    );
    await manager.save(UsuarioRol, manager.create(UsuarioRol, { usuarioId: usuario.id, rolId: rol.id }));
    if (perfil) {
      const guardado = await guardarPerfil(manager, rolNombre, usuario.id, numeroCuenta, perfil);
      if (rolNombre === "Estudiante") await GrupoService.inscribirEnTransaccion(manager, guardado.id, grupoIds);
    }
    return usuario.id;
  }).catch(comoDuplicado);

  return { id: usuarioId, numeroCuenta, correo, rol: rolNombre, roles: [rolNombre], creada: true, gruposInscritos: grupoIds.length };
}

async function agregarRol(actor: Actor, existente: Usuario, rolNombre: RolAsignable, input: AltaCuentaInput): Promise<CuentaCreadaDTO> {
  const rolesActuales = await UsuarioRolRepository.findRoleNamesByUsuarioId(existente.id);
  if (!puedeGestionar(actor.roles, rolesActuales)) {
    throw new PermisoDenegadoError("Esa cuenta no la puedes gestionar");
  }
  if (!existente.activo) throw new DatosInvalidosError("La cuenta esta inactiva");
  if (rolesActuales.includes(rolNombre)) {
    throw new ConflictoError(`La cuenta ya tiene el rol ${rolNombre}`);
  }

  const perfiles = await perfilDe(existente.id);
  const yaTienePerfil = rolNombre === "Estudiante" ? perfiles.estudiante : rolNombre === "Docente" ? perfiles.docente : true;
  const perfil = yaTienePerfil ? null : await leerDatosPerfil(input, rolNombre);
  const grupoIds = await gruposDelAlta(rolNombre, input.grupoIds);
  const rol = await RolRepository.findOneBy({ nombre: rolNombre });
  if (!rol) throw new DatosInvalidosError("rol no configurado en la base de datos");

  await AppDataSource.transaction(async (manager) => {
    // Se bloquea la cuenta y se vuelven a comprobar sus roles con datos frescos: otro Administrador pudo
    // cambiarlos hace un instante, y el Coordinador no debe terminar tocando una cuenta que ya no puede gestionar.
    await manager.findOne(Usuario, { where: { id: existente.id }, lock: { mode: "pessimistic_write" } });
    const rolesFrescos = await rolesEnTransaccion(manager, existente.id);
    if (!puedeGestionar(actor.roles, rolesFrescos)) throw new PermisoDenegadoError("Esa cuenta no la puedes gestionar");
    if (rolesFrescos.includes(rolNombre)) throw new ConflictoError(`La cuenta ya tiene el rol ${rolNombre}`);

    await manager.save(UsuarioRol, manager.create(UsuarioRol, { usuarioId: existente.id, rolId: rol.id }));
    const guardado = perfil ? await guardarPerfil(manager, rolNombre, existente.id, existente.numeroCuenta, perfil) : null;
    if (rolNombre === "Estudiante") {
      const estudianteId = guardado?.id ?? perfiles.estudiante?.id;
      if (estudianteId !== undefined) await GrupoService.inscribirEnTransaccion(manager, estudianteId, grupoIds);
    }
  }).catch(comoDuplicado);

  return {
    id: existente.id,
    numeroCuenta: existente.numeroCuenta,
    correo: existente.correoElectronico,
    rol: rolNombre,
    roles: [...rolesActuales, rolNombre],
    creada: false,
    gruposInscritos: grupoIds.length,
  };
}

export const CuentaService = {
  rolesAsignables: rolesAsignablesPara,

  async listar(actor: Actor): Promise<CuentaListadaDTO[]> {
    exigirAlgunPermiso(actor);
    const [usuarios, asignaciones, roles, estudiantes, docentes] = await Promise.all([
      UsuarioRepository.find({ order: { id: "ASC" } }),
      UsuarioRolRepository.find(),
      RolRepository.find(),
      EstudianteRepository.find(),
      DocenteRepository.find(),
    ]);
    const nombreRol = new Map(roles.map((r) => [r.id, r.nombre]));
    const rolesPorUsuario = new Map<number, string[]>();
    for (const a of asignaciones) rolesPorUsuario.set(a.usuarioId, [...(rolesPorUsuario.get(a.usuarioId) ?? []), nombreRol.get(a.rolId) ?? "?"]);
    const estudiantePorUsuario = new Map(estudiantes.map((e) => [e.usuarioId, e]));
    const docentePorUsuario = new Map(docentes.map((d) => [d.usuarioId, d]));

    return usuarios
      .map((u) => ({
        id: u.id,
        numeroCuenta: u.numeroCuenta,
        correo: u.correoElectronico,
        activo: u.activo,
        roles: rolesPorUsuario.get(u.id) ?? [],
        nombre: nombreCompleto(estudiantePorUsuario.get(u.id) ?? docentePorUsuario.get(u.id) ?? null),
      }))
      .filter((cuenta) => puedeGestionar(actor.roles, cuenta.roles));
  },

  /** Primer paso del alta: dice si el numero de cuenta ya existe y que puede hacer quien busca. Sin filtrar datos de cuentas ajenas. */
  async buscar(actor: Actor, numeroCuentaCrudo: unknown): Promise<BusquedaCuentaDTO> {
    exigirAlgunPermiso(actor);
    const numeroCuenta = numeroCuentaValido(numeroCuentaCrudo);
    const asignables = rolesAsignablesPara(actor.roles);

    const usuario = await UsuarioRepository.findOneBy({ numeroCuenta });
    if (!usuario) return { existe: false, numeroCuenta, rolesAsignables: asignables };

    const roles = await UsuarioRolRepository.findRoleNamesByUsuarioId(usuario.id);
    if (!puedeGestionar(actor.roles, roles)) return { existe: true, gestionable: false, numeroCuenta };

    const { estudiante, docente } = await perfilDe(usuario.id);
    const persona = estudiante ?? docente;
    const perfil = persona
      ? { nombre: persona.nombre, apellidoPaterno: persona.apellidoPaterno, apellidoMaterno: persona.apellidoMaterno }
      : null;
    return {
      existe: true,
      gestionable: true,
      numeroCuenta,
      correo: usuario.correoElectronico,
      activo: usuario.activo,
      roles,
      nombre: nombreCompleto(perfil),
      perfil,
      perfiles: { estudiante: estudiante !== null, docente: docente !== null },
      rolesAsignables: asignables.filter((rol) => !roles.includes(rol)),
    };
  },

  /**
   * Alta de cuenta o, si el numero de cuenta ya existe, asignacion de un rol mas. El permiso se revisa antes
   * que los datos: lo que un rol no puede hacer se rechaza sin importar lo que traiga la peticion.
   */
  async crear(actor: Actor, input: AltaCuentaInput): Promise<CuentaCreadaDTO> {
    const rolNombre = ROLES_ASIGNABLES.find((r) => r === input.rol);
    if (!rolNombre) throw new DatosInvalidosError("rol invalido");
    if (!rolesAsignablesPara(actor.roles).includes(rolNombre)) {
      throw new PermisoDenegadoError("No tienes permiso para dar de alta o asignar ese rol");
    }

    const numeroCuenta = numeroCuentaValido(input.numeroCuenta);
    const existente = await UsuarioRepository.findOneBy({ numeroCuenta });
    return existente ? agregarRol(actor, existente, rolNombre, input) : crearCuentaNueva(actor, rolNombre, numeroCuenta, input);
  },
};
