import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const manager = {
  findOne: vi.fn(),
  create: vi.fn((_entidad: unknown, datos: object) => ({ ...datos })),
  save: vi.fn((_entidad: unknown, datos: object) => Promise.resolve({ id: 500, ...datos })),
};

vi.mock("../config/data-source", () => ({
  AppDataSource: { transaction: vi.fn((cb: (m: typeof manager) => unknown) => cb(manager)) },
}));
vi.mock("./GrupoService", () => ({
  GrupoService: { validarGrupoIds: vi.fn(), inscribirEnTransaccion: vi.fn() },
}));
vi.mock("../repositories/UsuarioRepository", () => ({
  UsuarioRepository: { find: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/UsuarioRolRepository", () => ({
  UsuarioRolRepository: { find: vi.fn(), findRoleNamesByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/RolRepository", () => ({
  RolRepository: { find: vi.fn(), findOneBy: vi.fn() },
}));
vi.mock("../repositories/EstudianteRepository", () => ({
  EstudianteRepository: { find: vi.fn(), findByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/DocenteRepository", () => ({
  DocenteRepository: { find: vi.fn(), findByUsuarioId: vi.fn() },
}));
vi.mock("../repositories/ProgramaEducativoRepository", () => ({
  ProgramaEducativoRepository: { find: vi.fn(), findById: vi.fn() },
}));
vi.mock("../repositories/FacultadRepository", () => ({
  FacultadRepository: { find: vi.fn(), findById: vi.fn() },
}));

import { CuentaService } from "./CuentaService";
import { GrupoService } from "./GrupoService";
import { ConflictoError as UsuarioDuplicadoError, DatosInvalidosError, PermisoDenegadoError } from "../utils/errores";
import { AppDataSource } from "../config/data-source";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { UsuarioRolRepository } from "../repositories/UsuarioRolRepository";
import { RolRepository } from "../repositories/RolRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { FacultadRepository } from "../repositories/FacultadRepository";

const ADMIN = { usuarioId: 1, roles: ["Administrador"] };
const COORD = { usuarioId: 2, roles: ["Coordinador"] };

const ALUMNO = {
  rol: "Estudiante",
  numeroCuenta: "a2026001",
  correo: "nuevo@dygsis.local",
  password: "ClaveSegura123",
  nombre: "Luisa",
  apellidoPaterno: "Mora",
  programaEducativoId: 3,
};

const guardados = () => manager.save.mock.calls.map((c) => (c[0] as { name: string }).name);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue(null);
  vi.mocked(RolRepository.findOneBy).mockImplementation((async (where: { nombre: string }) => ({ id: 9, nombre: where.nombre })) as never);
  vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue({ id: 3 } as never);
  vi.mocked(FacultadRepository.findById).mockResolvedValue({ id: 2 } as never);
  vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue([]);
  vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue(null);
  vi.mocked(DocenteRepository.findByUsuarioId).mockResolvedValue(null);
  vi.mocked(GrupoService.validarGrupoIds).mockImplementation((async (ids: unknown) => (Array.isArray(ids) ? ids : [])) as never);
  vi.mocked(GrupoService.inscribirEnTransaccion).mockResolvedValue(undefined);
});

describe("CuentaService.rolesAsignables", () => {
  it("el Administrador asigna cualquier rol; el Coordinador solo Estudiante y Docente", () => {
    expect(CuentaService.rolesAsignables(["Administrador"])).toEqual(["Estudiante", "Docente", "Coordinador", "Administrador"]);
    expect(CuentaService.rolesAsignables(["Coordinador"])).toEqual(["Estudiante", "Docente"]);
  });

  it("si la cuenta tiene ambos roles gana el de Administrador; sin ninguno, nada", () => {
    expect(CuentaService.rolesAsignables(["Coordinador", "Administrador"])).toHaveLength(4);
    expect(CuentaService.rolesAsignables(["Estudiante"])).toEqual([]);
  });
});

describe("CuentaService.crear: cuenta nueva", () => {
  it("crea un estudiante con su rol y perfil, el numero de cuenta en mayusculas, la contrasena con hash y quien lo creo", async () => {
    const resultado = await CuentaService.crear(ADMIN, ALUMNO);

    expect(resultado).toEqual({
      id: 500, numeroCuenta: "A2026001", correo: "nuevo@dygsis.local", rol: "Estudiante", roles: ["Estudiante"], creada: true, gruposInscritos: 0,
    });
    expect(guardados()).toEqual(["Usuario", "UsuarioRol", "Estudiante"]);
    const usuario = manager.create.mock.calls[0][1] as { contrasenaHash: string; numeroCuenta: string; debeCambiarPassword: boolean; creadoPorUsuarioId: number };
    expect(usuario.numeroCuenta).toBe("A2026001");
    expect(usuario.debeCambiarPassword).toBe(true);
    expect(usuario.creadoPorUsuarioId).toBe(ADMIN.usuarioId);
    expect(await bcrypt.compare(ALUMNO.password, usuario.contrasenaHash)).toBe(true);
    expect((manager.create.mock.calls[2][1] as { matricula: string }).matricula).toBe("A2026001");
  });

  it("un alumno sin correo recibe el institucional a<cuenta>@my.uvm.edu.mx", async () => {
    const { correo: _omitido, ...sinCorreo } = ALUMNO;
    const resultado = await CuentaService.crear(COORD, { ...sinCorreo, numeroCuenta: "010181605" });
    expect(resultado.correo).toBe("a010181605@my.uvm.edu.mx");
  });

  it("crea un docente con numero de empleado y facultad", async () => {
    const resultado = await CuentaService.crear(COORD, {
      rol: "Docente", numeroCuenta: "EMP9", correo: "doc@dygsis.local", password: "ClaveSegura123",
      nombre: "Raul", apellidoPaterno: "Diaz", facultadId: 2,
    });
    expect(resultado.roles).toEqual(["Docente"]);
    expect((manager.create.mock.calls[2][1] as { numeroEmpleado: string }).numeroEmpleado).toBe("EMP9");
  });

  it("el Administrador crea un coordinador, sin perfil de estudiante ni docente", async () => {
    const resultado = await CuentaService.crear(ADMIN, { rol: "Coordinador", numeroCuenta: "coord2", correo: "coord@dygsis.local", password: "ClaveSegura123" });
    expect(resultado.numeroCuenta).toBe("COORD2");
    expect(guardados()).toEqual(["Usuario", "UsuarioRol"]);
  });

  it.each([
    ["rol invalido", { ...ALUMNO, rol: "Root" }],
    ["correo sin formato", { ...ALUMNO, correo: "no-es-correo" }],
    ["sin contrasena", { ...ALUMNO, password: undefined }],
    ["contrasena corta", { ...ALUMNO, password: "corta" }],
    ["contrasena de mas de 72 bytes aunque tenga pocos caracteres", { ...ALUMNO, password: "ñ".repeat(37) }],
    ["sin numero de cuenta", { ...ALUMNO, numeroCuenta: "" }],
    ["numero de cuenta con espacios", { ...ALUMNO, numeroCuenta: "A 2026" }],
    ["numero de cuenta con simbolos", { ...ALUMNO, numeroCuenta: "A-2026" }],
    ["numero de cuenta de mas de 20 caracteres", { ...ALUMNO, numeroCuenta: "A".repeat(21) }],
    ["estudiante sin programa", { ...ALUMNO, programaEducativoId: undefined }],
    ["estudiante sin nombre", { ...ALUMNO, nombre: "" }],
    ["coordinador sin correo", { rol: "Coordinador", numeroCuenta: "COORD3", password: "ClaveSegura123" }],
  ])("rechaza datos invalidos: %s", async (_caso, input) => {
    await expect(CuentaService.crear(ADMIN, input)).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("rechaza un programa educativo o una facultad que no existen", async () => {
    vi.mocked(ProgramaEducativoRepository.findById).mockResolvedValue(null);
    await expect(CuentaService.crear(ADMIN, ALUMNO)).rejects.toThrow(DatosInvalidosError);
    vi.mocked(FacultadRepository.findById).mockResolvedValue(null);
    await expect(
      CuentaService.crear(ADMIN, { rol: "Docente", numeroCuenta: "EMP8", correo: "d@x.mx", password: "ClaveSegura123", nombre: "A", apellidoPaterno: "B", facultadId: 99 })
    ).rejects.toThrow(DatosInvalidosError);
  });

  it("rechaza un correo duplicado en una cuenta nueva", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockImplementation(((where: { correoElectronico?: string }) =>
      Promise.resolve(where.correoElectronico ? { id: 1 } : null)) as never);
    await expect(CuentaService.crear(ADMIN, ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("si la base rechaza el duplicado (23505) por una alta simultanea, responde como duplicado y no como error 500", async () => {
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce({ driverError: { code: "23505" } } as never);
    await expect(CuentaService.crear(ADMIN, ALUMNO)).rejects.toThrow(UsuarioDuplicadoError);
  });

  it("otros errores de la base se propagan tal cual", async () => {
    vi.mocked(AppDataSource.transaction).mockRejectedValueOnce(new Error("conexion perdida") as never);
    await expect(CuentaService.crear(ADMIN, ALUMNO)).rejects.toThrow("conexion perdida");
  });
});

describe("CuentaService.crear: permisos por rol", () => {
  it.each(["Coordinador", "Administrador"])("el Coordinador NO puede crear una cuenta de %s", async (rol) => {
    await expect(
      CuentaService.crear(COORD, { rol, numeroCuenta: "X1", correo: "x@x.mx", password: "ClaveSegura123" })
    ).rejects.toThrow(PermisoDenegadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("el permiso se revisa antes que los datos: un coordinador no averigua nada con datos a medias", async () => {
    await expect(CuentaService.crear(COORD, { rol: "Administrador" })).rejects.toThrow(PermisoDenegadoError);
  });

  it("quien no es Administrador ni Coordinador no puede crear nada", async () => {
    await expect(CuentaService.crear({ usuarioId: 9, roles: ["Estudiante"] }, ALUMNO)).rejects.toThrow(PermisoDenegadoError);
  });

  it("el Administrador (respaldo) tambien crea alumnos y docentes", async () => {
    await expect(CuentaService.crear(ADMIN, ALUMNO)).resolves.toMatchObject({ creada: true });
  });
});

describe("CuentaService.crear: cuenta existente (agregar un rol)", () => {
  const existente = { id: 77, numeroCuenta: "A2026001", correoElectronico: "viejo@dygsis.local", activo: true };
  const docente = { rol: "Docente", numeroCuenta: "a2026001", nombre: "Luisa", apellidoPaterno: "Mora", facultadId: 2 };

  beforeEach(() => {
    vi.mocked(UsuarioRepository.findOneBy).mockImplementation(((where: { numeroCuenta?: string }) =>
      Promise.resolve(where.numeroCuenta === "A2026001" ? existente : null)) as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);
  });

  it("agrega el rol y su perfil sin tocar el usuario ni su contrasena", async () => {
    const resultado = await CuentaService.crear(COORD, { ...docente, password: "NoDebeUsarse123" });

    expect(resultado).toEqual({ id: 77, numeroCuenta: "A2026001", correo: "viejo@dygsis.local", rol: "Docente", roles: ["Estudiante", "Docente"], creada: false, gruposInscritos: 0 });
    expect(guardados()).toEqual(["UsuarioRol", "Docente"]);
    expect((manager.create.mock.calls[0][1] as { usuarioId: number }).usuarioId).toBe(77);
  });

  it("pide los datos del perfil cuando la cuenta aun no lo tiene", async () => {
    await expect(CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "A2026001" })).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("si la cuenta ya tiene el perfil, no lo duplica", async () => {
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Coordinador"]);
    vi.mocked(DocenteRepository.findByUsuarioId).mockResolvedValue({ id: 5 } as never);
    const resultado = await CuentaService.crear(ADMIN, { rol: "Docente", numeroCuenta: "A2026001" });
    expect(resultado.roles).toEqual(["Coordinador", "Docente"]);
    expect(guardados()).toEqual(["UsuarioRol"]);
  });

  it("rechaza agregar un rol que la cuenta ya tiene", async () => {
    await expect(CuentaService.crear(COORD, { ...ALUMNO, numeroCuenta: "A2026001" })).rejects.toThrow(UsuarioDuplicadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it.each([["Coordinador"], ["Administrador"]])("el Coordinador no puede tocar una cuenta de %s", async (rolDeLaCuenta) => {
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue([rolDeLaCuenta]);
    await expect(CuentaService.crear(COORD, docente)).rejects.toThrow(PermisoDenegadoError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("el Administrador si puede agregar un rol a un coordinador", async () => {
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Coordinador"]);
    await expect(CuentaService.crear(ADMIN, docente)).resolves.toMatchObject({ creada: false, roles: ["Coordinador", "Docente"] });
  });

  it("rechaza una cuenta inactiva", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ ...existente, activo: false } as never);
    await expect(CuentaService.crear(ADMIN, docente)).rejects.toThrow(DatosInvalidosError);
  });
});

describe("CuentaService.buscar", () => {
  it("cuenta inexistente: dice que es nueva y que roles puede asignar quien busca", async () => {
    expect(await CuentaService.buscar(ADMIN, "zzz1")).toEqual({
      existe: false, numeroCuenta: "ZZZ1", rolesAsignables: ["Estudiante", "Docente", "Coordinador", "Administrador"],
    });
    expect((await CuentaService.buscar(COORD, "ZZZ1")).rolesAsignables).toEqual(["Estudiante", "Docente"]);
  });

  it("cuenta de alumno vista por un coordinador: datos, roles y solo los roles que aun no tiene", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 7, numeroCuenta: "A1", correoElectronico: "a@x.mx", activo: true } as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Estudiante"]);
    vi.mocked(EstudianteRepository.findByUsuarioId).mockResolvedValue({ nombre: "Luisa", apellidoPaterno: "Mora", apellidoMaterno: null } as never);

    expect(await CuentaService.buscar(COORD, "a1")).toEqual({
      existe: true, gestionable: true, numeroCuenta: "A1", correo: "a@x.mx", activo: true, roles: ["Estudiante"],
      nombre: "Luisa Mora", perfil: { nombre: "Luisa", apellidoPaterno: "Mora", apellidoMaterno: null },
      perfiles: { estudiante: true, docente: false }, rolesAsignables: ["Docente"],
    });
  });

  it("cuenta de administrador vista por un coordinador: solo dice que no es gestionable, sin datos", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 1, numeroCuenta: "ADMIN0001", correoElectronico: "a@x.mx", activo: true } as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Administrador"]);
    expect(await CuentaService.buscar(COORD, "ADMIN0001")).toEqual({ existe: true, gestionable: false, numeroCuenta: "ADMIN0001" });
  });

  it("rechaza un numero de cuenta con formato invalido sin consultar la base", async () => {
    await expect(CuentaService.buscar(ADMIN, "a b")).rejects.toThrow(DatosInvalidosError);
    expect(UsuarioRepository.findOneBy).not.toHaveBeenCalled();
  });
});

describe("CuentaService.listar", () => {
  beforeEach(() => {
    vi.mocked(UsuarioRepository.find).mockResolvedValue([
      { id: 1, numeroCuenta: "DEMO0001", correoElectronico: "demo@dygsis.local", activo: true },
      { id: 2, numeroCuenta: "COORD0001", correoElectronico: "coord@dygsis.local", activo: true },
      { id: 3, numeroCuenta: "EMP0001", correoElectronico: "doc@dygsis.local", activo: true },
    ] as never);
    vi.mocked(UsuarioRolRepository.find).mockResolvedValue([
      { usuarioId: 1, rolId: 4 }, { usuarioId: 1, rolId: 1 }, { usuarioId: 2, rolId: 2 }, { usuarioId: 3, rolId: 3 },
    ] as never);
    vi.mocked(RolRepository.find).mockResolvedValue([
      { id: 1, nombre: "Administrador" }, { id: 2, nombre: "Coordinador" }, { id: 3, nombre: "Docente" }, { id: 4, nombre: "Estudiante" },
    ] as never);
    vi.mocked(EstudianteRepository.find).mockResolvedValue([{ usuarioId: 1, nombre: "Estudiante", apellidoPaterno: "Demo" }] as never);
    vi.mocked(DocenteRepository.find).mockResolvedValue([{ usuarioId: 3, nombre: "Ana", apellidoPaterno: "Garcia" }] as never);
  });

  it("el Administrador ve todas las cuentas con roles, numero de cuenta y nombre", async () => {
    const lista = await CuentaService.listar(ADMIN);
    expect(lista.map((c) => c.numeroCuenta)).toEqual(["DEMO0001", "COORD0001", "EMP0001"]);
    expect(lista[0]).toEqual({ id: 1, correo: "demo@dygsis.local", activo: true, roles: ["Estudiante", "Administrador"], numeroCuenta: "DEMO0001", nombre: "Estudiante Demo" });
    expect(lista[1]).toMatchObject({ roles: ["Coordinador"], nombre: null });
  });

  it("el Coordinador solo ve alumnos y docentes: ni coordinadores ni administradores, ni las cuentas con esos roles", async () => {
    const lista = await CuentaService.listar(COORD);
    expect(lista.map((c) => c.numeroCuenta)).toEqual(["EMP0001"]);
  });
});

describe("CuentaService.crear: alumnos con grupos", () => {
  it("al dar de alta a un alumno lo inscribe en los grupos indicados, dentro de la misma transaccion", async () => {
    const resultado = await CuentaService.crear(COORD, { ...ALUMNO, grupoIds: [10, 11] });

    expect(GrupoService.validarGrupoIds).toHaveBeenCalledWith([10, 11]);
    expect(GrupoService.inscribirEnTransaccion).toHaveBeenCalledWith(manager, 500, [10, 11]);
    expect(resultado.gruposInscritos).toBe(2);
  });

  it("si un grupo esta lleno o no existe, el alta completa se cancela (la transaccion lanza el error)", async () => {
    vi.mocked(GrupoService.inscribirEnTransaccion).mockRejectedValueOnce(new UsuarioDuplicadoError("El grupo 3A esta lleno"));
    await expect(CuentaService.crear(COORD, { ...ALUMNO, grupoIds: [10] })).rejects.toThrow(/lleno/);
  });

  it("los grupos se validan antes de abrir la transaccion", async () => {
    vi.mocked(GrupoService.validarGrupoIds).mockRejectedValueOnce(new DatosInvalidosError("Alguno de los grupos no existe"));
    await expect(CuentaService.crear(COORD, { ...ALUMNO, grupoIds: [99] })).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("solo los alumnos se inscriben a grupos: pedirlos para un docente es un error", async () => {
    await expect(
      CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "EMP7", correo: "d@x.mx", password: "ClaveSegura123", nombre: "A", apellidoPaterno: "B", facultadId: 2, grupoIds: [10] })
    ).rejects.toThrow(DatosInvalidosError);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("una lista de grupos vacia para un docente no estorba", async () => {
    await expect(
      CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "EMP7", correo: "d@x.mx", password: "ClaveSegura123", nombre: "A", apellidoPaterno: "B", facultadId: 2, grupoIds: [] })
    ).resolves.toMatchObject({ creada: true, gruposInscritos: 0 });
  });

  it("al agregar el rol de Estudiante a una cuenta existente tambien se pueden indicar grupos", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockImplementation(((where: { numeroCuenta?: string }) =>
      Promise.resolve(where.numeroCuenta === "EMP1" ? { id: 61, numeroCuenta: "EMP1", correoElectronico: "e@x.mx", activo: true } : null)) as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue(["Docente"]);

    await CuentaService.crear(COORD, { rol: "Estudiante", numeroCuenta: "EMP1", nombre: "A", apellidoPaterno: "B", programaEducativoId: 3, grupoIds: [10] });

    expect(GrupoService.inscribirEnTransaccion).toHaveBeenCalledWith(manager, 500, [10]);
  });
});

describe("CuentaService: reglas de seguridad adicionales", () => {
  it("el correo se guarda siempre en minusculas", async () => {
    await CuentaService.crear(ADMIN, { ...ALUMNO, correo: "Nuevo.Alumno@DYGSIS.local" });
    expect((manager.create.mock.calls[0][1] as { correoElectronico: string }).correoElectronico).toBe("nuevo.alumno@dygsis.local");
  });

  it("ids con formato raro (true, listas, hexadecimal, enormes) se rechazan como datos invalidos y no llegan a la base", async () => {
    for (const malo of [true, [3], "0x10", "1e3", 2_147_483_648]) {
      await expect(CuentaService.crear(ADMIN, { ...ALUMNO, programaEducativoId: malo })).rejects.toThrow(DatosInvalidosError);
    }
    expect(ProgramaEducativoRepository.findById).not.toHaveBeenCalled();
  });

  it("una cuenta sin ningun rol no es gestionable por un Coordinador (solo por el Administrador)", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 8, numeroCuenta: "SINROL", correoElectronico: "s@x.mx", activo: true } as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValue([]);

    expect(await CuentaService.buscar(COORD, "SINROL")).toEqual({ existe: true, gestionable: false, numeroCuenta: "SINROL" });
    await expect(
      CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "SINROL", nombre: "A", apellidoPaterno: "B", facultadId: 2 })
    ).rejects.toThrow(PermisoDenegadoError);
    expect((await CuentaService.buscar(ADMIN, "SINROL")) as { gestionable?: boolean }).toMatchObject({ gestionable: true });
  });

  it("carrera critica: si mientras tanto un Administrador le dio otro rol a la cuenta, el Coordinador ya no puede tocarla", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 77, numeroCuenta: "A2026001", correoElectronico: "v@x.mx", activo: true } as never);
    // La primera lectura (antes de abrir la transaccion) dice alumno; la segunda, ya con la cuenta bloqueada, dice Administrador.
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValueOnce(["Estudiante"]).mockResolvedValueOnce(["Estudiante", "Administrador"]);

    await expect(
      CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "A2026001", nombre: "A", apellidoPaterno: "B", facultadId: 2 })
    ).rejects.toThrow(PermisoDenegadoError);
    expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ lock: { mode: "pessimistic_write" } }));
    expect(manager.save).not.toHaveBeenCalled();
  });

  it("carrera critica: si mientras tanto alguien ya le agrego ese mismo rol, es un conflicto", async () => {
    vi.mocked(UsuarioRepository.findOneBy).mockResolvedValue({ id: 77, numeroCuenta: "A2026001", correoElectronico: "v@x.mx", activo: true } as never);
    vi.mocked(UsuarioRolRepository.findRoleNamesByUsuarioId).mockResolvedValueOnce(["Estudiante"]).mockResolvedValueOnce(["Estudiante", "Docente"]);

    await expect(
      CuentaService.crear(COORD, { rol: "Docente", numeroCuenta: "A2026001", nombre: "A", apellidoPaterno: "B", facultadId: 2 })
    ).rejects.toThrow(UsuarioDuplicadoError);
  });
});
