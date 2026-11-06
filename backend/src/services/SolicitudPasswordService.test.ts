import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const manager = {
  findOne: vi.fn(),
  findBy: vi.fn(),
  update: vi.fn(),
  create: vi.fn((_entidad: unknown, datos: object) => ({ ...datos })),
  save: vi.fn((_entidad: unknown, datos: object) => Promise.resolve({ id: 700, ...datos })),
};

vi.mock("../config/data-source", () => ({
  AppDataSource: { transaction: vi.fn((cb: (m: typeof manager) => unknown) => cb(manager)) },
}));
vi.mock("./GrupoService", () => ({ GrupoService: { validarGrupoIds: vi.fn(), inscribirEnTransaccion: vi.fn() } }));
vi.mock("../repositories/UsuarioRepository", () => ({ UsuarioRepository: { findOneBy: vi.fn(), findBy: vi.fn() } }));
vi.mock("../repositories/UsuarioRolRepository", () => ({ UsuarioRolRepository: { findBy: vi.fn(), findRoleNamesByUsuarioId: vi.fn() } }));
vi.mock("../repositories/RolRepository", () => ({ RolRepository: { find: vi.fn(), findOneBy: vi.fn() } }));
vi.mock("../repositories/EstudianteRepository", () => ({ EstudianteRepository: { findBy: vi.fn(), findByUsuarioId: vi.fn() } }));
vi.mock("../repositories/DocenteRepository", () => ({ DocenteRepository: { findBy: vi.fn(), findByUsuarioId: vi.fn() } }));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({ ProgramaEducativoRepository: { findById: vi.fn() } }));
vi.mock("../repositories/FacultadRepository", () => ({ FacultadRepository: { findById: vi.fn() } }));
vi.mock("../repositories/SolicitudCambioPasswordRepository", () => ({
  SolicitudCambioPasswordRepository: { findPendientesDesde: vi.fn(), findReemplazadasDesde: vi.fn() },
}));

import { SolicitudPasswordService, VIGENCIA_SOLICITUD_DIAS } from "./SolicitudPasswordService";
import { AppDataSource } from "../config/data-source";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { RolRepository } from "../repositories/RolRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { SolicitudCambioPasswordRepository } from "../repositories/SolicitudCambioPasswordRepository";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError } from "../utils/errores";

const DIA_MS = 24 * 60 * 60 * 1000;
const AHORA = new Date("2026-11-10T15:00:00Z");
const hace = (dias: number) => new Date(AHORA.getTime() - dias * DIA_MS);
const sha256 = (texto: string) => crypto.createHash("sha256").update(texto).digest("hex");

const ADMIN = { usuarioId: 1, roles: ["Administrador"] };
const COORD = { usuarioId: 2, roles: ["Coordinador"] };
const ALUMNA = { id: 20, numeroCuenta: "A2026001", activo: true };
const PASSWORD_NUEVA = "ClaveNueva123";
const CODIGO = "K7M2QX";

/** Roles por cuenta (lo que hay "ahora" en la base) y usuarios activos o no. */
let rolesPorCuenta: Record<number, string[]> = {};
let usuarios: Record<number, { id: number; numeroCuenta: string; activo: boolean } | undefined> = {};
let consultado = 0;
const entidades = () => manager.update.mock.calls.map((c) => (c[0] as { name: string }).name);

function solicitud(extra: Record<string, unknown> = {}) {
  return { id: 5, usuarioId: 20, nuevaPasswordHash: "hash-ya-cifrado", codigoHash: sha256(CODIGO), estado: "Pendiente", fechaSolicitud: hace(1), ...extra };
}

beforeEach(() => {
  vi.clearAllMocks();
  rolesPorCuenta = { 1: ["Administrador"], 2: ["Coordinador"], 20: ["Estudiante"], 30: ["Coordinador"], 40: ["Estudiante"] };
  usuarios = {
    1: { id: 1, numeroCuenta: "ADMIN1", activo: true },
    2: { id: 2, numeroCuenta: "COORD1", activo: true },
    20: { ...ALUMNA },
    30: { id: 30, numeroCuenta: "C1", activo: true },
    40: { id: 40, numeroCuenta: "A2", activo: false },
  };
  manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
    entidad.name === "SolicitudCambioPassword" ? solicitud() : (usuarios[opciones.where.id] ?? null)
  );
  manager.findBy.mockImplementation(async (entidad: { name: string }, where: { usuarioId?: number }) => {
    if (entidad.name === "UsuarioRol") {
      consultado = where.usuarioId ?? 0;
      return (rolesPorCuenta[consultado] ?? []).map((_n, i) => ({ usuarioId: consultado, rolId: i + 1 }));
    }
    return (rolesPorCuenta[consultado] ?? []).map((nombre, i) => ({ id: i + 1, nombre }));
  });
  manager.update.mockResolvedValue({ affected: 1 });
  vi.mocked(UsuarioRepository.findOneBy).mockImplementation((async (donde: { id?: number; numeroCuenta?: string }) =>
    donde.id !== undefined ? (usuarios[donde.id] ?? null) : (Object.values(usuarios).find((u) => u?.numeroCuenta === donde.numeroCuenta) ?? null)) as never);
  vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockImplementation((async (id: number) => rolesPorCuenta[id] ?? []) as never);
  vi.mocked(SolicitudCambioPasswordRepository.findReemplazadasDesde).mockResolvedValue([]);
});

describe("SolicitudPasswordService.solicitar", () => {
  it("devuelve un codigo legible y guarda la solicitud con la contrasena y el codigo cifrados, reemplazando a la pendiente", async () => {
    const { codigo, procesada } = await SolicitudPasswordService.solicitar(" a2026001 ", PASSWORD_NUEVA, AHORA);
    await procesada;

    expect(codigo).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      { usuarioId: 20, estado: "Pendiente" },
      { estado: "Reemplazada", fechaResolucion: AHORA, nuevaPasswordHash: null }
    );
    const guardada = manager.create.mock.calls[0][1] as { nuevaPasswordHash: string; codigoHash: string; estado: string; usuarioId: number };
    expect(guardada).toMatchObject({ usuarioId: 20, estado: "Pendiente", codigoHash: sha256(codigo) });
    expect(guardada.nuevaPasswordHash).not.toContain(PASSWORD_NUEVA);
    expect(await bcrypt.compare(PASSWORD_NUEVA, guardada.nuevaPasswordHash)).toBe(true);
  });

  it("no cambia la contrasena de la cuenta: solo crea la solicitud", async () => {
    await (await SolicitudPasswordService.solicitar("A2026001", PASSWORD_NUEVA, AHORA)).procesada;
    expect(entidades()).not.toContain("Usuario");
  });

  it("responde antes de guardar: el tiempo de respuesta no depende de si la cuenta existe", async () => {
    let liberar!: () => void;
    vi.mocked(UsuarioRepository.findOneBy).mockImplementationOnce(
      () => new Promise((resolve) => { liberar = () => resolve(usuarios[20] as never); }) as never
    );

    const enviada = await SolicitudPasswordService.solicitar("A2026001", PASSWORD_NUEVA, AHORA); // vuelve aunque la base aun no contesta
    expect(enviada.codigo).toHaveLength(6);
    expect(AppDataSource.transaction).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(liberar).toBeTypeOf("function"));
    liberar();
    await enviada.procesada;
    expect(AppDataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it("entrega un codigo tambien si la cuenta no existe o esta inactiva, y no guarda nada (no revela cuales existen)", async () => {
    const inexistente = await SolicitudPasswordService.solicitar("ZZ9", PASSWORD_NUEVA, AHORA);
    const inactiva = await SolicitudPasswordService.solicitar("A2", PASSWORD_NUEVA, AHORA);
    await Promise.all([inexistente.procesada, inactiva.procesada]);

    expect(inexistente.codigo).toHaveLength(6);
    expect(inactiva.codigo).toHaveLength(6);
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });

  it("rechaza un numero de cuenta o una contrasena que no cumplen, sin consultar la base", async () => {
    await expect(SolicitudPasswordService.solicitar("", PASSWORD_NUEVA)).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(SolicitudPasswordService.solicitar("A 1", PASSWORD_NUEVA)).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(SolicitudPasswordService.solicitar("A1", "corta")).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(SolicitudPasswordService.solicitar("A1", "ñ".repeat(37))).rejects.toBeInstanceOf(DatosInvalidosError); // 74 bytes
    await expect(SolicitudPasswordService.solicitar("A1", undefined)).rejects.toBeInstanceOf(DatosInvalidosError);
    expect(UsuarioRepository.findOneBy).not.toHaveBeenCalled();
  });

  it("si dos solicitudes de la misma cuenta chocan, reintenta una vez; otros fallos si se propagan", async () => {
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce({ code: "23505" });
    await (await SolicitudPasswordService.solicitar("A2026001", PASSWORD_NUEVA, AHORA)).procesada;
    expect(AppDataSource.transaction).toHaveBeenCalledTimes(2);
    expect(manager.save).toHaveBeenCalledTimes(1); // el reintento si guardo

    vi.mocked(AppDataSource.transaction).mockRejectedValue({ code: "23505" });
    await expect((await SolicitudPasswordService.solicitar("A2026001", PASSWORD_NUEVA, AHORA)).procesada).resolves.toBeUndefined();

    vi.mocked(AppDataSource.transaction).mockReset();
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce(new Error("se cayo la base"));
    await expect((await SolicitudPasswordService.solicitar("A2026001", PASSWORD_NUEVA, AHORA)).procesada).rejects.toThrow("se cayo la base");
  });
});

describe("SolicitudPasswordService.listarPendientes", () => {
  function prepararCuentas() {
    vi.mocked(SolicitudCambioPasswordRepository.findPendientesDesde).mockResolvedValue([
      solicitud({ id: 1, usuarioId: 20 }),
      solicitud({ id: 2, usuarioId: 30 }),
      solicitud({ id: 3, usuarioId: 40 }),
    ] as never);
    vi.mocked(UsuarioRepository.findBy).mockResolvedValue([usuarios[20], usuarios[30], usuarios[40]] as never);
    vi.mocked(UsuarioRolRepository.findBy).mockResolvedValue([
      { usuarioId: 20, rolId: 1 },
      { usuarioId: 30, rolId: 2 },
      { usuarioId: 40, rolId: 1 },
    ] as never);
    vi.mocked(RolRepository.find).mockResolvedValue([
      { id: 1, nombre: "Estudiante" },
      { id: 2, nombre: "Coordinador" },
    ] as never);
    vi.mocked(EstudianteRepository.findBy).mockResolvedValue([{ usuarioId: 20, nombre: "Ana", apellidoPaterno: "Lopez" }] as never);
    vi.mocked(DocenteRepository.findBy).mockResolvedValue([]);
  }

  it("el coordinador ve solo las de alumnos y docentes; el administrador, tambien las de coordinadores", async () => {
    prepararCuentas();

    const delCoordinador = await SolicitudPasswordService.listarPendientes(COORD, AHORA);
    expect(delCoordinador.map((s) => s.numeroCuenta)).toEqual(["A2026001"]);
    expect(delCoordinador[0]).toMatchObject({ id: 1, nombre: "Ana Lopez", roles: ["Estudiante"], reemplazaAnterior: false });

    const delAdministrador = await SolicitudPasswordService.listarPendientes(ADMIN, AHORA);
    expect(delAdministrador.map((s) => s.numeroCuenta)).toEqual(["A2026001", "C1"]);
  });

  it("deja fuera las cuentas inactivas y solo pide las solicitudes vigentes (menos de 7 dias)", async () => {
    prepararCuentas();

    const lista = await SolicitudPasswordService.listarPendientes(ADMIN, AHORA);

    expect(lista.map((s) => s.numeroCuenta)).not.toContain("A2");
    expect(SolicitudCambioPasswordRepository.findPendientesDesde).toHaveBeenCalledWith(hace(VIGENCIA_SOLICITUD_DIAS));
  });

  it("no lista la propia solicitud del actor (no puede resolverla)", async () => {
    vi.mocked(SolicitudCambioPasswordRepository.findPendientesDesde).mockResolvedValue([solicitud({ id: 9, usuarioId: 1 })] as never);
    vi.mocked(UsuarioRepository.findBy).mockResolvedValue([usuarios[1]] as never);
    vi.mocked(UsuarioRolRepository.findBy).mockResolvedValue([{ usuarioId: 1, rolId: 3 }] as never);
    vi.mocked(RolRepository.find).mockResolvedValue([{ id: 3, nombre: "Administrador" }] as never);
    vi.mocked(EstudianteRepository.findBy).mockResolvedValue([]);
    vi.mocked(DocenteRepository.findBy).mockResolvedValue([]);

    expect(await SolicitudPasswordService.listarPendientes(ADMIN, AHORA)).toEqual([]);
  });

  it("avisa cuando una solicitud reemplazo a otra de la misma cuenta que seguia pendiente", async () => {
    prepararCuentas();
    const fechaNueva = hace(1);
    vi.mocked(SolicitudCambioPasswordRepository.findReemplazadasDesde).mockResolvedValue([{ usuarioId: 20, fechaResolucion: fechaNueva }] as never);

    const [primera] = await SolicitudPasswordService.listarPendientes(COORD, AHORA);

    expect(primera.reemplazaAnterior).toBe(true);
  });

  it("usa los roles actuales de la base, no los del token: un coordinador degradado ya no ve nada", async () => {
    prepararCuentas();
    rolesPorCuenta[2] = ["Estudiante"]; // al coordinador le quitaron el rol, pero su token sigue diciendo Coordinador
    await expect(SolicitudPasswordService.listarPendientes(COORD, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);

    rolesPorCuenta[2] = ["Coordinador"];
    rolesPorCuenta[1] = ["Coordinador"]; // un administrador degradado pierde lo del administrador aunque su token lo diga
    const comoAdminDegradado = await SolicitudPasswordService.listarPendientes(ADMIN, AHORA);
    expect(comoAdminDegradado.map((s) => s.numeroCuenta)).toEqual(["A2026001"]);
  });

  it("una cuenta de actor desactivada no ve solicitudes aunque su token siga vigente", async () => {
    usuarios[2] = { id: 2, numeroCuenta: "COORD1", activo: false };
    await expect(SolicitudPasswordService.listarPendientes(COORD, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
  });

  it("sin solicitudes no consulta nada mas, y un alumno o docente no puede ver las solicitudes", async () => {
    vi.mocked(SolicitudCambioPasswordRepository.findPendientesDesde).mockResolvedValue([]);
    expect(await SolicitudPasswordService.listarPendientes(COORD, AHORA)).toEqual([]);
    expect(UsuarioRepository.findBy).not.toHaveBeenCalled();

    usuarios[9] = { id: 9, numeroCuenta: "ALU9", activo: true };
    rolesPorCuenta[9] = ["Estudiante"];
    await expect(SolicitudPasswordService.listarPendientes({ usuarioId: 9, roles: ["Estudiante"] }, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
  });
});

describe("SolicitudPasswordService.resolver", () => {
  it("aprobar con el codigo correcto: aplica la contrasena, quita la marca, cierra sesiones y borra el hash de la solicitud", async () => {
    const resultado = await SolicitudPasswordService.resolver(COORD, "5", "aprobar", CODIGO, AHORA);

    expect(resultado).toEqual({ id: 5, numeroCuenta: "A2026001", estado: "Aprobada" });
    const cambiosUsuario = manager.update.mock.calls.find((c) => (c[0] as { name: string }).name === "Usuario")![2];
    expect(cambiosUsuario).toEqual({ contrasenaHash: "hash-ya-cifrado", debeCambiarPassword: false });
    expect(manager.update).toHaveBeenCalledWith(expect.anything(), { usuarioId: 20, activa: true }, { activa: false, fechaCierre: AHORA });
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      { id: 5 },
      { estado: "Aprobada", fechaResolucion: AHORA, resueltaPorUsuarioId: COORD.usuarioId, nuevaPasswordHash: null }
    );
  });

  it("el codigo no distingue mayusculas ni espacios, pero sin el o con otro no se aprueba nada", async () => {
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", " k7m2qx ", AHORA)).resolves.toMatchObject({ estado: "Aprobada" });

    for (const malo of [undefined, "", "   ", "AAAAAA", 123456]) {
      manager.update.mockClear();
      await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", malo, AHORA), String(malo)).rejects.toBeInstanceOf(DatosInvalidosError);
      expect(manager.update).not.toHaveBeenCalled();
    }
  });

  it("una solicitud sin codigo guardado (anterior a esta version) no se puede aprobar", async () => {
    manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
      entidad.name === "SolicitudCambioPassword" ? solicitud({ codigoHash: "" }) : (usuarios[opciones.where.id] ?? null)
    );
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(DatosInvalidosError);
  });

  it("rechazar no pide codigo: solo marca la solicitud, borra su hash y la contrasena de la cuenta no se toca", async () => {
    const resultado = await SolicitudPasswordService.resolver(COORD, 5, "rechazar", undefined, AHORA);

    expect(resultado.estado).toBe("Rechazada");
    expect(entidades()).toEqual(["SolicitudCambioPassword"]);
    expect(manager.update.mock.calls[0][2]).toMatchObject({ estado: "Rechazada", nuevaPasswordHash: null });
  });

  it("bloquea la solicitud y la cuenta mientras la resuelve (nadie la resuelve dos veces a la vez)", async () => {
    await SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA);

    const conBloqueo = manager.findOne.mock.calls.filter((c) => (c[1] as { lock?: { mode: string } }).lock?.mode === "pessimistic_write");
    expect(conBloqueo.map((c) => (c[0] as { name: string }).name).sort()).toEqual(["SolicitudCambioPassword", "Usuario"]);
  });

  it("el coordinador no puede resolver la solicitud de un coordinador; el administrador si", async () => {
    manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
      entidad.name === "SolicitudCambioPassword" ? solicitud({ usuarioId: 30 }) : (usuarios[opciones.where.id] ?? null)
    );
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
    expect(manager.update).not.toHaveBeenCalled();

    await expect(SolicitudPasswordService.resolver(ADMIN, 5, "aprobar", CODIGO, AHORA)).resolves.toMatchObject({ estado: "Aprobada" });
  });

  it("quien no puede gestionar la cuenta recibe 403 aunque la solicitud ya este resuelta o vencida (no se entera de su estado)", async () => {
    manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
      entidad.name === "SolicitudCambioPassword" ? solicitud({ usuarioId: 30, estado: "Aprobada" }) : (usuarios[opciones.where.id] ?? null)
    );
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
  });

  it("usa los roles actuales de la base: al actor degradado o desactivado se le rechaza aunque su token siga diciendo coordinador", async () => {
    rolesPorCuenta[2] = ["Estudiante"];
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);

    rolesPorCuenta[2] = ["Coordinador"];
    usuarios[2] = { id: 2, numeroCuenta: "COORD1", activo: false };
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it("usa los roles actuales de la cuenta: si la hicieron coordinadora despues de pedirla, el coordinador ya no puede", async () => {
    rolesPorCuenta[20] = ["Estudiante", "Coordinador"];
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(PermisoDenegadoError);
  });

  it("nadie resuelve su propia solicitud", async () => {
    usuarios[3] = { id: 3, numeroCuenta: "ADMIN2", activo: true };
    rolesPorCuenta[3] = ["Administrador"];
    manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
      entidad.name === "SolicitudCambioPassword" ? solicitud({ usuarioId: 3 }) : (usuarios[opciones.where.id] ?? null)
    );
    await expect(SolicitudPasswordService.resolver({ usuarioId: 3, roles: ["Administrador"] }, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(
      PermisoDenegadoError
    );
    expect(manager.update).not.toHaveBeenCalled();
  });

  it("responde 404 si no existe, 409 si ya se resolvio o vencio, 400 si la cuenta esta inactiva o el id no es valido", async () => {
    manager.findOne.mockResolvedValueOnce(null);
    await expect(SolicitudPasswordService.resolver(COORD, 99, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(NoEncontradoError);

    const con = (extra: Record<string, unknown>, cuenta = 20) =>
      manager.findOne.mockImplementation(async (entidad: { name: string }, opciones: { where: { id: number } }) =>
        entidad.name === "SolicitudCambioPassword" ? solicitud({ usuarioId: cuenta, ...extra }) : (usuarios[opciones.where.id] ?? null)
      );

    con({ estado: "Aprobada" });
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(ConflictoError);
    con({ estado: "Reemplazada" });
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(ConflictoError);
    con({ fechaSolicitud: hace(8) });
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toThrow(/venció/);

    con({}, 40);
    await expect(SolicitudPasswordService.resolver(COORD, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(DatosInvalidosError);

    await expect(SolicitudPasswordService.resolver(COORD, "abc", "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(DatosInvalidosError);
    await expect(SolicitudPasswordService.resolver(COORD, "1e3", "rechazar", undefined, AHORA)).rejects.toBeInstanceOf(DatosInvalidosError);
  });

  it("un alumno o docente no puede resolver", async () => {
    await expect(SolicitudPasswordService.resolver({ usuarioId: 9, roles: ["Estudiante"] }, 5, "aprobar", CODIGO, AHORA)).rejects.toBeInstanceOf(
      PermisoDenegadoError
    );
    expect(AppDataSource.transaction).not.toHaveBeenCalled();
  });
});
