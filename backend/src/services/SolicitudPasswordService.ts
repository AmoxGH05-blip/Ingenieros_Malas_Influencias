import bcrypt from "bcryptjs";
import crypto from "crypto";
import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Rol, Sesion, SolicitudCambioPassword, Usuario } from "../entities";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { RolRepository } from "../repositories/RolRepository";
import { SolicitudCambioPasswordRepository } from "../repositories/SolicitudCambioPasswordRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError, esViolacionDeUnicidad } from "../utils/errores";
import { MENSAJE_POLITICA_PASSWORD, passwordValida } from "../utils/password";
import { exigirGestor, type Actor } from "../utils/permisos";
import { entero, numeroCuentaValido } from "../utils/validaciones";
import { nombreCompleto, puedeGestionar, rolesEnTransaccion } from "./CuentaService";

/** Una solicitud sin resolver deja de valer a los 7 dias: quien la mando debe pedirla de nuevo. */
export const VIGENCIA_SOLICITUD_DIAS = 7;
const DIA_MS = 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
/** Sin 0, O, 1 ni I: el codigo se dicta o se lee en voz alta. 6 de 32 simbolos son unos mil millones de combinaciones. */
const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LONGITUD_CODIGO = 6;
/** Si dos solicitudes de la misma cuenta chocan, se reintenta una vez: la segunda reemplaza a la primera. */
const INTENTOS_GUARDADO = 2;

export type Decision = "aprobar" | "rechazar";

export interface SolicitudPendienteDTO {
  id: number;
  numeroCuenta: string;
  nombre: string | null;
  roles: string[];
  fechaSolicitud: string;
  /** Esta solicitud reemplazo a otra de la misma cuenta que seguia pendiente: señal para confirmar de nuevo la identidad. */
  reemplazaAnterior: boolean;
}

export interface SolicitudResueltaDTO {
  id: number;
  numeroCuenta: string;
  estado: "Aprobada" | "Rechazada";
}

export interface SolicitudEnviada {
  /** El que ve quien manda la solicitud, una sola vez; quien aprueba debe teclearlo. */
  codigo: string;
  /** El guardado ocurre despues de responder, para que el tiempo de respuesta no delate si la cuenta existe. */
  procesada: Promise<void>;
}

const desdeVigencia = (ahora: Date) => new Date(ahora.getTime() - VIGENCIA_SOLICITUD_DIAS * DIA_MS);

function generarCodigo(): string {
  return Array.from({ length: LONGITUD_CODIGO }, () => ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)]).join("");
}

function hashearCodigo(codigo: string): string {
  return crypto.createHash("sha256").update(codigo.trim().toUpperCase()).digest("hex");
}

/** Compara en tiempo constante el codigo tecleado con el hash guardado. */
function codigoCoincide(codigoTecleado: unknown, hashGuardado: string): boolean {
  if (typeof codigoTecleado !== "string") return false;
  const calculado = Buffer.from(hashearCodigo(codigoTecleado), "hex");
  const guardado = Buffer.from(hashGuardado, "hex");
  return calculado.length === guardado.length && crypto.timingSafeEqual(calculado, guardado);
}

/**
 * Quien hace la peticion, leido de la base y no del token: un coordinador al que se le desactivo la cuenta o se le
 * quito el rol no debe seguir aprobando cambios de contrasena (aprobar equivale a tomar la cuenta) hasta que expire su token.
 */
async function actorVigente(actor: Actor): Promise<Actor> {
  const usuario = await UsuarioRepository.findOneBy({ id: actor.usuarioId });
  if (!usuario?.activo) throw new PermisoDenegadoError("Tu cuenta no esta activa");
  const vigente = { usuarioId: usuario.id, roles: await UsuarioRolRepository.findRoleNamesByUsuarioId(usuario.id) };
  exigirGestor(vigente);
  return vigente;
}

/** Roles y nombre de cada cuenta con una sola consulta por tabla, sin importar cuantas solicitudes haya. */
async function datosDeCuentas(usuarioIds: number[]) {
  const [usuarios, asignaciones, roles, estudiantes, docentes] = await Promise.all([
    UsuarioRepository.findBy({ id: In(usuarioIds) }),
    UsuarioRolRepository.findBy({ usuarioId: In(usuarioIds) }),
    RolRepository.find(),
    EstudianteRepository.findBy({ usuarioId: In(usuarioIds) }),
    DocenteRepository.findBy({ usuarioId: In(usuarioIds) }),
  ]);
  const nombreRol = new Map<number, string>(roles.map((r: Rol) => [r.id, r.nombre]));
  const rolesPorUsuario = new Map<number, string[]>();
  for (const a of asignaciones) rolesPorUsuario.set(a.usuarioId, [...(rolesPorUsuario.get(a.usuarioId) ?? []), nombreRol.get(a.rolId) ?? "?"]);
  const personaPorUsuario = new Map<number, ReturnType<typeof nombreCompleto>>([
    ...estudiantes.map((e) => [e.usuarioId, nombreCompleto(e)] as const),
    ...docentes.map((d) => [d.usuarioId, nombreCompleto(d)] as const),
  ]);
  return { usuarios: new Map(usuarios.map((u) => [u.id, u])), rolesPorUsuario, personaPorUsuario };
}

/** Guarda la solicitud como la unica pendiente de la cuenta; la anterior queda "Reemplazada" y pierde su hash. */
async function guardarSolicitud(numeroCuenta: string, password: string, codigo: string, ahora: Date): Promise<void> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const usuario = await UsuarioRepository.findOneBy({ numeroCuenta });
  if (!usuario || !usuario.activo) return;

  for (let intento = 1; intento <= INTENTOS_GUARDADO; intento++) {
    try {
      await AppDataSource.transaction(async (manager) => {
        await manager.update(
          SolicitudCambioPassword,
          { usuarioId: usuario.id, estado: "Pendiente" },
          { estado: "Reemplazada", fechaResolucion: ahora, nuevaPasswordHash: null }
        );
        await manager.save(
          SolicitudCambioPassword,
          manager.create(SolicitudCambioPassword, {
            usuarioId: usuario.id,
            nuevaPasswordHash: hash,
            codigoHash: hashearCodigo(codigo),
            estado: "Pendiente",
            fechaSolicitud: ahora,
            fechaResolucion: null,
            resueltaPorUsuarioId: null,
          })
        );
      });
      return;
    } catch (error) {
      // Dos solicitudes simultaneas de la misma cuenta: la segunda choca con el indice unico y se reintenta.
      if (!esViolacionDeUnicidad(error)) throw error;
    }
  }
}

export const SolicitudPasswordService = {
  /**
   * Alguien pide una contrasena nueva para una cuenta. Se guarda ya cifrada y NO se aplica: la aprueba quien
   * gestiona la cuenta. Devuelve un codigo de verificacion que solo ve quien manda la solicitud (aunque la cuenta no
   * exista, para no revelarlo); sin ese codigo no se puede aprobar, asi que una solicitud ajena que reemplace a la real
   * no se aprueba por error. Responde antes de guardar: el tiempo de respuesta no delata si la cuenta existe.
   */
  async solicitar(numeroCuentaCrudo: unknown, passwordCruda: unknown, ahora: Date = new Date()): Promise<SolicitudEnviada> {
    const numeroCuenta = numeroCuentaValido(numeroCuentaCrudo);
    if (!passwordValida(passwordCruda)) throw new DatosInvalidosError(MENSAJE_POLITICA_PASSWORD);

    const codigo = generarCodigo();
    return { codigo, procesada: guardarSolicitud(numeroCuenta, passwordCruda, codigo, ahora) };
  },

  /** Solicitudes vigentes de cuentas que este actor puede gestionar, de la mas antigua a la mas reciente. */
  async listarPendientes(actorToken: Actor, ahora: Date = new Date()): Promise<SolicitudPendienteDTO[]> {
    const actor = await actorVigente(actorToken);
    const desde = desdeVigencia(ahora);
    const solicitudes = await SolicitudCambioPasswordRepository.findPendientesDesde(desde);
    if (solicitudes.length === 0) return [];

    const usuarioIds = [...new Set(solicitudes.map((s) => s.usuarioId))];
    const [{ usuarios, rolesPorUsuario, personaPorUsuario }, reemplazadas] = await Promise.all([
      datosDeCuentas(usuarioIds),
      SolicitudCambioPasswordRepository.findReemplazadasDesde(usuarioIds, desde),
    ]);
    // Una solicitud "reemplaza" a otra cuando la anterior se cerro en el mismo instante en que esta se creo.
    const reemplazos = new Set(reemplazadas.map((r) => `${r.usuarioId}|${r.fechaResolucion?.getTime()}`));

    return solicitudes.flatMap((s) => {
      const usuario = usuarios.get(s.usuarioId);
      const roles = rolesPorUsuario.get(s.usuarioId) ?? [];
      if (!usuario?.activo || usuario.id === actor.usuarioId || !puedeGestionar(actor.roles, roles)) return [];
      return [
        {
          id: s.id,
          numeroCuenta: usuario.numeroCuenta,
          nombre: personaPorUsuario.get(s.usuarioId) ?? null,
          roles,
          fechaSolicitud: s.fechaSolicitud.toISOString(),
          reemplazaAnterior: reemplazos.has(`${s.usuarioId}|${s.fechaSolicitud.getTime()}`),
        },
      ];
    });
  },

  /**
   * Aprueba o rechaza una solicitud. Para aprobar hay que teclear el codigo de verificacion. Al aprobar, la contrasena
   * pedida pasa a ser la de la cuenta (ya no es temporal, la eligio su dueño) y se cierran sus sesiones registradas;
   * la solicitud resuelta pierde su hash. Todo en una transaccion con la solicitud y la cuenta bloqueadas, y con los
   * roles del actor y de la cuenta leidos de nuevo, para no aprobar con permisos que ya no se tienen.
   */
  async resolver(
    actorToken: Actor,
    idCrudo: unknown,
    decision: Decision,
    codigo?: unknown,
    ahora: Date = new Date()
  ): Promise<SolicitudResueltaDTO> {
    exigirGestor(actorToken);
    const id = entero(idCrudo, "id");

    return AppDataSource.transaction(async (manager) => {
      const solicitud = await manager.findOne(SolicitudCambioPassword, { where: { id }, lock: { mode: "pessimistic_write" } });
      if (!solicitud) throw new NoEncontradoError("Esa solicitud no existe");
      const usuario = await manager.findOne(Usuario, { where: { id: solicitud.usuarioId }, lock: { mode: "pessimistic_write" } });
      if (!usuario) throw new NoEncontradoError("La cuenta de esa solicitud ya no existe");

      // Primero los permisos y despues el estado: quien no puede gestionar la cuenta no se entera de en que estado esta.
      const actorActivo = await manager.findOne(Usuario, { where: { id: actorToken.usuarioId } });
      if (!actorActivo?.activo) throw new PermisoDenegadoError("Tu cuenta no esta activa");
      const actor = { usuarioId: actorActivo.id, roles: await rolesEnTransaccion(manager, actorActivo.id) };
      exigirGestor(actor);
      if (usuario.id === actor.usuarioId) throw new PermisoDenegadoError("No puedes resolver tu propia solicitud");
      if (!puedeGestionar(actor.roles, await rolesEnTransaccion(manager, usuario.id))) {
        throw new PermisoDenegadoError("Esa cuenta no la puedes gestionar");
      }

      if (solicitud.estado !== "Pendiente") throw new ConflictoError("Esa solicitud ya fue resuelta");
      if (solicitud.fechaSolicitud <= desdeVigencia(ahora)) {
        throw new ConflictoError("Esa solicitud venció; la persona debe enviarla de nuevo");
      }

      if (decision === "aprobar") {
        if (typeof codigo !== "string" || !codigo.trim()) throw new DatosInvalidosError("El código de verificación es requerido");
        if (!codigoCoincide(codigo, solicitud.codigoHash) || !solicitud.nuevaPasswordHash) {
          throw new DatosInvalidosError("El código no coincide con el de esta solicitud");
        }
        if (!usuario.activo) throw new DatosInvalidosError("La cuenta esta inactiva");
        await manager.update(Usuario, { id: usuario.id }, { contrasenaHash: solicitud.nuevaPasswordHash, debeCambiarPassword: false });
        await manager.update(Sesion, { usuarioId: usuario.id, activa: true }, { activa: false, fechaCierre: ahora });
      }

      const estado = decision === "aprobar" ? "Aprobada" : "Rechazada";
      await manager.update(
        SolicitudCambioPassword,
        { id },
        { estado, fechaResolucion: ahora, resueltaPorUsuarioId: actor.usuarioId, nuevaPasswordHash: null }
      );
      return { id, numeroCuenta: usuario.numeroCuenta, estado };
    });
  },
};
