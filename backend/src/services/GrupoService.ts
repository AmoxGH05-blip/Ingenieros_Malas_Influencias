import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Grupo, Inscripcion } from "../entities";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { PeriodoAcademicoRepository } from "../repositories/PeriodoAcademicoRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, esViolacionDeUnicidad } from "../utils/errores";
import { Actor, exigirGestor } from "../utils/permisos";
import { entero, enteroEnRango, numeroCuentaValido, texto } from "../utils/validaciones";

export interface NuevoGrupoInput {
  materiaId?: unknown;
  docenteId?: unknown;
  periodoAcademicoId?: unknown;
  seccion?: unknown;
  /** 0 o ausente: sin limite de alumnos. */
  cupoMaximo?: unknown;
}

export interface GrupoDTO {
  id: number;
  materiaId: number;
  materia: string;
  claveMateria: string;
  docenteId: number;
  docente: string;
  periodoAcademicoId: number;
  periodo: string;
  seccion: string;
  cupoMaximo: number;
  inscritos: number;
}

export interface AlumnoInscritoDTO {
  estudianteId: number;
  numeroCuenta: string;
  nombre: string;
  fechaInscripcion: string;
}

const SECCION_REGEX = /^[A-Z0-9]{1,10}$/;
const CUPO_MAXIMO = 500;
const GRUPOS_POR_ALTA_MAXIMO = 20;

/** Une cada grupo con el nombre de su materia, docente y periodo, y cuenta sus inscritos. */
async function armarDTOs(grupos: Grupo[], inscripciones: { grupoId: number }[]): Promise<GrupoDTO[]> {
  const [materias, docentes, periodos] = await Promise.all([
    MateriaRepository.findByIds(grupos.map((g) => g.materiaId)),
    DocenteRepository.findByIds(grupos.map((g) => g.docenteId)),
    PeriodoAcademicoRepository.findByIds(grupos.map((g) => g.periodoAcademicoId)),
  ]);
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));
  const docentePorId = new Map(docentes.map((d) => [d.id, d]));
  const periodoPorId = new Map(periodos.map((p) => [p.id, p]));
  const inscritosPorGrupo = new Map<number, number>();
  for (const { grupoId } of inscripciones) inscritosPorGrupo.set(grupoId, (inscritosPorGrupo.get(grupoId) ?? 0) + 1);

  return grupos.map((g) => {
    const docente = docentePorId.get(g.docenteId);
    return {
      id: g.id,
      materiaId: g.materiaId,
      materia: materiaPorId.get(g.materiaId)?.nombre ?? "",
      claveMateria: materiaPorId.get(g.materiaId)?.clave ?? "",
      docenteId: g.docenteId,
      docente: docente ? `${docente.apellidoPaterno}, ${docente.nombre}` : "",
      periodoAcademicoId: g.periodoAcademicoId,
      periodo: periodoPorId.get(g.periodoAcademicoId)?.nombre ?? "",
      seccion: g.seccion,
      cupoMaximo: g.cupoMaximo,
      inscritos: inscritosPorGrupo.get(g.id) ?? 0,
    };
  });
}

function conflictoPorDuplicado(mensaje: string) {
  return (error: unknown): never => {
    if (esViolacionDeUnicidad(error)) throw new ConflictoError(mensaje);
    throw error;
  };
}

export const GrupoService = {
  async crear(actor: Actor, input: NuevoGrupoInput): Promise<GrupoDTO> {
    exigirGestor(actor);
    const materiaId = entero(input.materiaId, "materiaId");
    const docenteId = entero(input.docenteId, "docenteId");
    const periodoAcademicoId = entero(input.periodoAcademicoId, "periodoAcademicoId");
    const seccion = texto(input.seccion, "seccion", 10)!.toUpperCase();
    if (!SECCION_REGEX.test(seccion)) {
      throw new DatosInvalidosError("seccion solo puede tener letras y numeros, sin espacios (maximo 10)");
    }
    const cupoMaximo = enteroEnRango(input.cupoMaximo, "cupoMaximo", 0, CUPO_MAXIMO, 0);

    if (!(await MateriaRepository.findOneBy({ id: materiaId }))) throw new DatosInvalidosError("materia no existe");
    if (!(await DocenteRepository.findOneBy({ id: docenteId }))) throw new DatosInvalidosError("docente no existe");
    if (!(await PeriodoAcademicoRepository.findOneBy({ id: periodoAcademicoId }))) {
      throw new DatosInvalidosError("periodo academico no existe");
    }

    const mensajeDuplicado = "Ya existe ese grupo (misma materia, docente, periodo y seccion)";
    if (await GrupoRepository.findOneBy({ materiaId, docenteId, periodoAcademicoId, seccion })) {
      throw new ConflictoError(mensajeDuplicado);
    }
    const guardado = await GrupoRepository.save(
      GrupoRepository.create({ materiaId, docenteId, periodoAcademicoId, seccion, cupoMaximo })
    ).catch(conflictoPorDuplicado(mensajeDuplicado));

    return (await armarDTOs([guardado], []))[0];
  },

  /** Lista los grupos (de un periodo academico si se indica), con materia, docente e inscritos sobre cupo. */
  async listar(actor: Actor, periodoAcademicoId?: unknown): Promise<GrupoDTO[]> {
    exigirGestor(actor);
    const filtro = periodoAcademicoId === undefined || periodoAcademicoId === "" ? null : entero(periodoAcademicoId, "periodoAcademicoId");

    const [todos, inscripciones] = await Promise.all([GrupoRepository.find(), InscripcionRepository.find()]);
    const grupos = todos.filter((g) => filtro === null || g.periodoAcademicoId === filtro);
    const dtos = await armarDTOs(grupos, inscripciones);
    return dtos.sort((a, b) => a.materia.localeCompare(b.materia, "es") || a.seccion.localeCompare(b.seccion, "es"));
  },

  async detalle(actor: Actor, grupoIdCrudo: unknown): Promise<GrupoDTO & { alumnos: AlumnoInscritoDTO[] }> {
    exigirGestor(actor);
    const grupoId = entero(grupoIdCrudo, "grupoId");
    const grupo = await GrupoRepository.findOneBy({ id: grupoId });
    if (!grupo) throw new NoEncontradoError("Grupo no encontrado");

    const inscripciones = await InscripcionRepository.find({ where: { grupoId } });
    const estudiantes = await EstudianteRepository.findByIds(inscripciones.map((i) => i.estudianteId));
    const usuarios = await UsuarioRepository.findByIds(estudiantes.map((e) => e.usuarioId));
    const estudiantePorId = new Map(estudiantes.map((e) => [e.id, e]));
    const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));

    const alumnos = inscripciones
      .flatMap((i) => {
        const estudiante = estudiantePorId.get(i.estudianteId);
        if (!estudiante) return [];
        return [
          {
            estudianteId: estudiante.id,
            numeroCuenta: usuarioPorId.get(estudiante.usuarioId)?.numeroCuenta ?? "",
            nombre: `${estudiante.nombre} ${estudiante.apellidoPaterno}`,
            apellido: estudiante.apellidoPaterno,
            fechaInscripcion: i.fechaInscripcion,
          },
        ];
      })
      .sort((a, b) => a.apellido.localeCompare(b.apellido, "es") || a.nombre.localeCompare(b.nombre, "es"))
      .map(({ apellido: _apellido, ...alumno }) => alumno);

    return { ...(await armarDTOs([grupo], inscripciones))[0], alumnos };
  },

  /** Inscribe a un alumno, por su numero de cuenta, en un grupo. */
  async inscribir(actor: Actor, grupoIdCrudo: unknown, numeroCuentaCrudo: unknown) {
    exigirGestor(actor);
    const grupoId = entero(grupoIdCrudo, "grupoId");
    const numeroCuenta = numeroCuentaValido(numeroCuentaCrudo);

    if (!(await GrupoRepository.findOneBy({ id: grupoId }))) throw new NoEncontradoError("Grupo no encontrado");
    const usuario = await UsuarioRepository.findOneBy({ numeroCuenta });
    if (!usuario || !usuario.activo) throw new DatosInvalidosError("No hay una cuenta activa con ese numero de cuenta");
    const estudiante = await EstudianteRepository.findByUsuarioId(usuario.id);
    if (!estudiante) throw new DatosInvalidosError("Esa cuenta no es de un alumno");

    await AppDataSource.transaction((manager) => GrupoService.inscribirEnTransaccion(manager, estudiante.id, [grupoId])).catch(
      conflictoPorDuplicado("El alumno ya esta inscrito en ese grupo")
    );
    return { grupoId, numeroCuenta, nombre: `${estudiante.nombre} ${estudiante.apellidoPaterno}` };
  },

  /** Valida la lista de grupos de un alta de alumno: ids enteros, sin repetidos y todos existentes. */
  async validarGrupoIds(valor: unknown): Promise<number[]> {
    if (valor === undefined || valor === null) return [];
    if (!Array.isArray(valor) || valor.length > GRUPOS_POR_ALTA_MAXIMO) {
      throw new DatosInvalidosError(`grupoIds debe ser una lista de hasta ${GRUPOS_POR_ALTA_MAXIMO} grupos`);
    }
    const ids = [...new Set(valor.map((v) => entero(v, "grupoIds")))];
    if (ids.length === 0) return [];
    if ((await GrupoRepository.findByIds(ids)).length !== ids.length) throw new DatosInvalidosError("Alguno de los grupos no existe");
    return ids;
  },

  /**
   * Inscribe dentro de una transaccion ya abierta. Bloquea cada grupo mientras cuenta sus inscritos, para que dos
   * altas simultaneas no se pasen del cupo (cupo 0 = sin limite).
   */
  async inscribirEnTransaccion(manager: EntityManager, estudianteId: number, grupoIds: number[]): Promise<void> {
    for (const grupoId of grupoIds) {
      const grupo = await manager.findOne(Grupo, { where: { id: grupoId }, lock: { mode: "pessimistic_write" } });
      if (!grupo) throw new DatosInvalidosError("Alguno de los grupos no existe");
      if ((await manager.countBy(Inscripcion, { estudianteId, grupoId })) > 0) {
        throw new ConflictoError("El alumno ya esta inscrito en ese grupo");
      }
      if (grupo.cupoMaximo > 0 && (await manager.countBy(Inscripcion, { grupoId })) >= grupo.cupoMaximo) {
        throw new ConflictoError(`El grupo ${grupo.seccion} esta lleno (cupo de ${grupo.cupoMaximo})`);
      }
      await manager.save(Inscripcion, manager.create(Inscripcion, { estudianteId, grupoId }));
    }
  },
};
