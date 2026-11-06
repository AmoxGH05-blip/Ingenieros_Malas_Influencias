import { TallerRepository, type FilaCriterio, type FilaResultadoTaller } from "../repositories/TallerRepository";
import { ProgramaEducativoRepository } from "../repositories/ProgramaEducativoRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { InstrumentoEvaluacionRepository } from "../repositories/InstrumentoEvaluacionRepository";
import type { Taller, TipoTaller } from "../entities";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, esViolacionDeUnicidad } from "../utils/errores";
import { entero, texto } from "../utils/validaciones";

/**
 * Con menos evaluaciones que esto (o en una carrera con menos alumnos que esto) no se muestra el promedio ni el conteo:
 * con pocas respuestas se podria deducir quien respondio y que califico, comparando resultados antes y despues de cada envio.
 */
export const MINIMO_RESPUESTAS_PUBLICAS = 5;

const TIPOS: TipoTaller[] = ["Taller", "Laboratorio"];
const NOMBRE_MAXIMO = 150;
const MENSAJE_DUPLICADO = "Ya hay un taller o laboratorio con ese nombre en la carrera";

export interface TallerDTO {
  id: number;
  nombre: string;
  tipo: TipoTaller;
  activo: boolean;
}

export interface CarreraConfiguracionDTO {
  programaEducativoId: number;
  nombre: string;
  evaluaTalleres: boolean;
  alumnos: number;
  talleres: TallerDTO[];
}

export interface CriterioDTO {
  seccionId: number;
  nombre: string;
  promedio: number | null;
}

export interface ResultadoTallerDTO extends TallerDTO {
  /** null mientras haya menos evaluaciones que MINIMO_RESPUESTAS_PUBLICAS (pero mas de 0): el conteo exacto tambien se oculta. */
  respuestas: number | null;
  /** Alumnos de la carrera que lo evaluaron, en %; null si la carrera no tiene alumnos o si el conteo esta oculto. */
  participacion: number | null;
  /** null si no hay suficientes evaluaciones o alumnos (ocultoPorPocasRespuestas). */
  promedio: number | null;
  criterios: CriterioDTO[];
  ocultoPorPocasRespuestas: boolean;
}

export interface CarreraResultadosDTO {
  programaEducativoId: number;
  nombre: string;
  evaluaTalleres: boolean;
  alumnos: number;
  talleres: ResultadoTallerDTO[];
}

export interface ResultadosTalleresDTO {
  periodo: { id: number; nombre: string } | null;
  minimoRespuestas: number;
  carreras: CarreraResultadosDTO[];
}

const aTallerDTO = (t: Taller): TallerDTO => ({ id: t.id, nombre: t.nombre, tipo: t.tipo, activo: t.activo });
const numero = (valor: string | number | null | undefined): number => (valor === null || valor === undefined ? 0 : Number(valor));
const decimal = (valor: string | null | undefined): number | null => (valor === null || valor === undefined ? null : Number(valor));

function tipoValido(valor: unknown): TipoTaller {
  if (typeof valor !== "string" || !TIPOS.includes(valor as TipoTaller)) {
    throw new DatosInvalidosError("tipo debe ser Taller o Laboratorio");
  }
  return valor as TipoTaller;
}

function booleano(valor: unknown, campo: string): boolean {
  if (typeof valor !== "boolean") throw new DatosInvalidosError(`${campo} debe ser verdadero o falso`);
  return valor;
}

function cuerpoDe(valor: unknown): Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) throw new DatosInvalidosError("El cuerpo de la peticion no es valido");
  return valor as Record<string, unknown>;
}

async function guardarSinDuplicar(taller: Taller): Promise<Taller> {
  try {
    return await TallerRepository.save(taller);
  } catch (error) {
    // Dos altas simultaneas con el mismo nombre pasan la comprobacion previa; la restriccion unica de la base las frena.
    if (esViolacionDeUnicidad(error)) throw new ConflictoError(MENSAJE_DUPLICADO);
    throw error;
  }
}

/** Resultado de un taller; con pocas evaluaciones o pocos alumnos en la carrera no se publica nada que permita deducir quien respondio. */
function aResultadoTaller(t: FilaResultadoTaller, criterios: FilaCriterio[], alumnos: number): ResultadoTallerDTO {
  const respuestas = numero(t.Respuestas);
  const visible = respuestas >= MINIMO_RESPUESTAS_PUBLICAS && alumnos >= MINIMO_RESPUESTAS_PUBLICAS;
  const sinEvaluaciones = respuestas === 0;
  return {
    id: t.TallerId,
    nombre: t.Nombre,
    tipo: t.Tipo,
    activo: t.Activo,
    respuestas: visible || sinEvaluaciones ? respuestas : null,
    participacion: visible && alumnos > 0 ? Math.round((respuestas / alumnos) * 100) : null,
    promedio: visible ? decimal(t.Promedio) : null,
    criterios: visible
      ? criterios.filter((k) => k.TallerId === t.TallerId).map((k) => ({ seccionId: k.SeccionId, nombre: k.Seccion, promedio: decimal(k.Promedio) }))
      : [],
    ocultoPorPocasRespuestas: !visible && !sinEvaluaciones,
  };
}

export const TallerService = {
  /** Carreras con su interruptor y sus talleres (activos y dados de baja), para configurarlos. */
  async configuracion(): Promise<CarreraConfiguracionDTO[]> {
    const [carreras, talleres] = await Promise.all([TallerRepository.carreras(), TallerRepository.find({ order: { nombre: "ASC", id: "ASC" } })]);
    return carreras.map((c) => ({
      programaEducativoId: c.Id,
      nombre: c.Nombre,
      evaluaTalleres: c.EvaluaTalleres,
      alumnos: numero(c.Alumnos),
      talleres: talleres.filter((t) => t.programaEducativoId === c.Id).map(aTallerDTO),
    }));
  },

  async crear(cuerpo: unknown): Promise<TallerDTO> {
    const datos = cuerpoDe(cuerpo);
    const programaEducativoId = entero(datos.programaEducativoId, "programaEducativoId");
    const nombre = texto(datos.nombre, "nombre", NOMBRE_MAXIMO)!;
    const tipo = datos.tipo === undefined ? "Taller" : tipoValido(datos.tipo);

    if (!(await ProgramaEducativoRepository.findById(programaEducativoId))) throw new NoEncontradoError("La carrera no existe");
    if (await TallerRepository.existeNombre(programaEducativoId, nombre)) throw new ConflictoError(MENSAJE_DUPLICADO);

    return aTallerDTO(await guardarSinDuplicar(TallerRepository.create({ programaEducativoId, nombre, tipo, activo: true })));
  },

  /** Cambia nombre, tipo o si esta activo. Dar de baja (activo=false) conserva las evaluaciones ya enviadas. */
  async actualizar(id: unknown, cuerpo: unknown): Promise<TallerDTO> {
    const tallerId = entero(id, "id");
    const datos = cuerpoDe(cuerpo);
    const cambios = ["nombre", "tipo", "activo"].filter((campo) => datos[campo] !== undefined);
    if (cambios.length === 0) throw new DatosInvalidosError("No hay nada que cambiar: manda nombre, tipo o activo");

    const taller = await TallerRepository.findById(tallerId);
    if (!taller) throw new NoEncontradoError("El taller no existe");

    const actualizado = TallerRepository.create({
      ...taller,
      nombre: datos.nombre === undefined ? taller.nombre : texto(datos.nombre, "nombre", NOMBRE_MAXIMO)!,
      tipo: datos.tipo === undefined ? taller.tipo : tipoValido(datos.tipo),
      activo: datos.activo === undefined ? taller.activo : booleano(datos.activo, "activo"),
    });
    if (actualizado.nombre !== taller.nombre && (await TallerRepository.existeNombre(taller.programaEducativoId, actualizado.nombre, taller.id))) {
      throw new ConflictoError(MENSAJE_DUPLICADO);
    }
    return aTallerDTO(await guardarSinDuplicar(actualizado));
  },

  /** Enciende o apaga la evaluacion de talleres de una carrera. Para encenderla debe haber un instrumento de talleres activo. */
  async habilitarCarrera(id: unknown, cuerpo: unknown): Promise<{ programaEducativoId: number; evaluaTalleres: boolean }> {
    const programaEducativoId = entero(id, "id");
    const evaluaTalleres = booleano(cuerpoDe(cuerpo).evaluaTalleres, "evaluaTalleres");

    const carrera = await ProgramaEducativoRepository.findById(programaEducativoId);
    if (!carrera) throw new NoEncontradoError("La carrera no existe");
    if (evaluaTalleres && !(await InstrumentoEvaluacionRepository.findActivoDeTipo("Taller"))) {
      throw new ConflictoError("No hay un instrumento de evaluacion de talleres activo: no se puede habilitar");
    }
    await ProgramaEducativoRepository.update({ id: carrera.id }, { evaluaTalleres });
    return { programaEducativoId, evaluaTalleres };
  },

  /** Resultados por carrera y taller de un ciclo (el activo si no se indica). Solo agregados; con pocas respuestas no hay promedio. */
  async resultados(periodoId?: unknown): Promise<ResultadosTalleresDTO> {
    const indicado = periodoId !== undefined && periodoId !== "";
    const periodo = indicado
      ? await PeriodoEvaluacionRepository.findOneBy({ id: entero(periodoId, "periodoId") })
      : await PeriodoEvaluacionRepository.findActivo();
    if (!periodo && indicado) throw new NoEncontradoError("Ese ciclo no existe");
    if (!periodo) return { periodo: null, minimoRespuestas: MINIMO_RESPUESTAS_PUBLICAS, carreras: [] };

    const [carreras, talleres, criterios] = await Promise.all([
      TallerRepository.carreras(),
      TallerRepository.resultadosDelCiclo(periodo.id),
      TallerRepository.criteriosDelCiclo(periodo.id),
    ]);

    return {
      periodo: { id: periodo.id, nombre: periodo.nombre },
      minimoRespuestas: MINIMO_RESPUESTAS_PUBLICAS,
      carreras: carreras.map((c) => {
        const alumnos = numero(c.Alumnos);
        return {
          programaEducativoId: c.Id,
          nombre: c.Nombre,
          evaluaTalleres: c.EvaluaTalleres,
          alumnos,
          talleres: talleres
            .filter((t) => t.ProgramaEducativoId === c.Id && (t.Activo || numero(t.Respuestas) > 0))
            .map((t) => aResultadoTaller(t, criterios, alumnos)),
        };
      }),
    };
  },
};
