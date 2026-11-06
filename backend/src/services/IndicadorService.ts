import { DocenteRepository } from "../repositories/DocenteRepository";
import { FilaIndicador, IndicadorRepository } from "../repositories/IndicadorRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { NoEncontradoError } from "../utils/errores";
import { entero, enteroEnRango } from "../utils/validaciones";

export type Clasificacion = "Excelente" | "Bueno" | "Suficiente" | "No suficiente";

const CLASIFICACIONES: Clasificacion[] = ["Excelente", "Bueno", "Suficiente", "No suficiente"];
const MAXIMO_CICLOS = 20;

export interface IndicadorDocenteDTO {
  docenteId: number;
  docente: string;
  numeroEmpleado: string;
  materias: string;
  grupos: number;
  evaluaciones: number;
  totalRespuestas: number;
  promedio: number | null;
  clasificacion: Clasificacion | null;
  ranking: number | null;
  docentesConPromedio: number;
}

export interface RankingDTO {
  periodo: { id: number; nombre: string } | null;
  resumen: {
    docentes: number;
    docentesConPromedio: number;
    sinEvaluaciones: number;
    promedioInstitucional: number | null;
    distribucion: Record<Clasificacion, number>;
  };
  docentes: IndicadorDocenteDTO[];
}

export interface CicloDTO extends IndicadorDocenteDTO {
  periodoId: number;
  periodo: string;
  /** Es el ciclo de evaluación vigente (los demás ya cerraron o aún no abren). */
  activo: boolean;
  /** Diferencia de promedio con el ciclo anterior que tuvo promedio; null en el primero o si falta uno de los dos. */
  variacion: number | null;
}

export interface HistoricoDTO {
  docente: { id: number; nombre: string; numeroEmpleado: string };
  ciclos: CicloDTO[];
}

const aNumero = (valor: string | number | null): number | null => (valor === null ? null : Number(valor));

function aIndicador(fila: FilaIndicador): IndicadorDocenteDTO {
  return {
    docenteId: fila.DocenteId,
    docente: fila.Docente,
    numeroEmpleado: fila.NumeroEmpleado,
    materias: fila.Materias ?? "",
    grupos: Number(fila.Grupos),
    evaluaciones: Number(fila.Evaluaciones),
    totalRespuestas: Number(fila.TotalRespuestas),
    promedio: aNumero(fila.Promedio),
    clasificacion: fila.Clasificacion as Clasificacion | null,
    ranking: aNumero(fila.Ranking),
    docentesConPromedio: Number(fila.DocentesConPromedio),
  };
}

/** Redondea a 2 decimales como la base, para que la variacion no arrastre error de coma flotante. */
const redondear = (n: number) => Math.round(n * 100) / 100;

function aCiclos(filas: FilaIndicador[]): CicloDTO[] {
  let anterior: number | null = null;
  return filas.map((fila) => {
    const indicador = aIndicador(fila);
    const variacion = anterior !== null && indicador.promedio !== null ? redondear(indicador.promedio - anterior) : null;
    if (indicador.promedio !== null) anterior = indicador.promedio;
    return { ...indicador, periodoId: fila.PeriodoEvaluacionId, periodo: fila.PeriodoEvaluacion, activo: fila.PeriodoActivo, variacion };
  });
}

export const IndicadorService = {
  /** Ranking de docentes de un ciclo (el activo si no se indica). Para Coordinacion y Administracion. */
  async ranking(periodoId?: unknown): Promise<RankingDTO> {
    const periodo =
      periodoId === undefined || periodoId === ""
        ? await PeriodoEvaluacionRepository.findActivo()
        : await PeriodoEvaluacionRepository.findOneBy({ id: entero(periodoId, "periodoId") });
    if (!periodo && periodoId !== undefined && periodoId !== "") throw new NoEncontradoError("Ese ciclo no existe");

    const distribucion = Object.fromEntries(CLASIFICACIONES.map((c) => [c, 0])) as Record<Clasificacion, number>;
    if (!periodo) {
      return {
        periodo: null,
        resumen: { docentes: 0, docentesConPromedio: 0, sinEvaluaciones: 0, promedioInstitucional: null, distribucion },
        docentes: [],
      };
    }

    const docentes = (await IndicadorRepository.porPeriodo(periodo.id)).map(aIndicador);
    const conPromedio = docentes.filter((d) => d.promedio !== null);
    for (const d of conPromedio) distribucion[d.clasificacion as Clasificacion] += 1;
    // Promedio de los promedios de cada docente (cada docente cuenta una vez, sin importar cuantas respuestas tuvo).
    const promedioInstitucional = conPromedio.length
      ? redondear(conPromedio.reduce((suma, d) => suma + (d.promedio as number), 0) / conPromedio.length)
      : null;

    return {
      periodo: { id: periodo.id, nombre: periodo.nombre },
      resumen: {
        docentes: docentes.length,
        docentesConPromedio: conPromedio.length,
        sinEvaluaciones: docentes.length - conPromedio.length,
        promedioInstitucional,
        distribucion,
      },
      docentes,
    };
  },

  /** Ciclos de un docente, del mas antiguo al mas reciente; `ultimos` deja solo los N mas recientes. */
  async historico(docenteId: unknown, ultimos?: unknown): Promise<HistoricoDTO> {
    const id = entero(docenteId, "docenteId");
    const limite = enteroEnRango(ultimos, "ultimos", 1, MAXIMO_CICLOS, MAXIMO_CICLOS);
    const docente = await DocenteRepository.findOneBy({ id });
    if (!docente) throw new NoEncontradoError("Ese docente no existe");

    const ciclos = aCiclos(await IndicadorRepository.porDocente(id)).slice(-limite);
    return { docente: datosDe(docente), ciclos };
  },

  /** El historico del propio docente que inicia sesion. */
  async mio(usuarioId: number): Promise<HistoricoDTO> {
    const docente = await DocenteRepository.findByUsuarioId(usuarioId);
    if (!docente) throw new NoEncontradoError("Tu cuenta no tiene perfil de docente");
    return { docente: datosDe(docente), ciclos: aCiclos(await IndicadorRepository.porDocente(docente.id)) };
  },
};

function datosDe(docente: { id: number; nombre: string; apellidoPaterno: string; apellidoMaterno: string | null; numeroEmpleado: string }) {
  const apellidos = [docente.apellidoPaterno, docente.apellidoMaterno].filter(Boolean).join(" ");
  return { id: docente.id, nombre: `${docente.nombre} ${apellidos}`.trim(), numeroEmpleado: docente.numeroEmpleado };
}
