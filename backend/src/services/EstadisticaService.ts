import { EstadisticaRepository } from "../repositories/EstadisticaRepository";
import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { NoEncontradoError } from "../utils/errores";
import { entero } from "../utils/validaciones";

export type Clasificacion = "Excelente" | "Bueno" | "Suficiente" | "No suficiente";
const CLASIFICACIONES: Clasificacion[] = ["Excelente", "Bueno", "Suficiente", "No suficiente"];

export interface ResumenInstitucional {
  alumnos: number;
  alumnosParticipantes: number;
  /** Alumnos con al menos una evaluacion enviada, sobre el total de alumnos inscritos (como el dashboard de coordinacion). */
  participacionAlumnos: number | null;
  inscripciones: number;
  completadas: number;
  pendientes: number;
  /** Evaluaciones enviadas sobre las que se debian enviar (una por alumno y grupo). */
  avanceEvaluaciones: number | null;
  docentesConPromedio: number;
  promedioInstitucional: number | null;
}

export interface CarreraDTO {
  programaEducativoId: number;
  nombre: string;
  alumnos: number;
  participacionAlumnos: number | null;
  inscripciones: number;
  completadas: number;
  avanceEvaluaciones: number | null;
  promedio: number | null;
  clasificacion: Clasificacion | null;
}

export interface CicloTendenciaDTO {
  periodoId: number;
  nombre: string;
  promedioInstitucional: number | null;
  docentesConPromedio: number;
  /** null si el ciclo no tiene inscripciones (por ejemplo, un ciclo historico cargado sin ellas). */
  avanceEvaluaciones: number | null;
}

export interface EstadisticasDTO {
  periodo: { id: number; nombre: string } | null;
  resumen: ResumenInstitucional;
  distribucion: Record<Clasificacion, number>;
  porCarrera: CarreraDTO[];
  tendencia: CicloTendenciaDTO[];
}

const numero = (valor: string | number | null | undefined): number => (valor === null || valor === undefined ? 0 : Number(valor));
const decimal = (valor: string | null | undefined): number | null => (valor === null || valor === undefined ? null : Number(valor));

/** Porcentaje entero de `parte` sobre `total`; null si no hay total (no es 0 %: no hay nada que medir). */
function porcentaje(parte: number, total: number): number | null {
  return total === 0 ? null : Math.round((parte / total) * 100);
}

function vacio(): EstadisticasDTO {
  return {
    periodo: null,
    resumen: {
      alumnos: 0, alumnosParticipantes: 0, participacionAlumnos: null, inscripciones: 0, completadas: 0, pendientes: 0,
      avanceEvaluaciones: null, docentesConPromedio: 0, promedioInstitucional: null,
    },
    distribucion: Object.fromEntries(CLASIFICACIONES.map((c) => [c, 0])) as Record<Clasificacion, number>,
    porCarrera: [],
    tendencia: [],
  };
}

export const EstadisticaService = {
  /** Estadisticas institucionales de un ciclo (el activo si no se indica), para Coordinacion y Administracion. */
  async institucional(periodoId?: unknown): Promise<EstadisticasDTO> {
    const indicado = periodoId !== undefined && periodoId !== "";
    const periodo = indicado
      ? await PeriodoEvaluacionRepository.findOneBy({ id: entero(periodoId, "periodoId") })
      : await PeriodoEvaluacionRepository.findActivo();
    if (!periodo && indicado) throw new NoEncontradoError("Ese ciclo no existe");
    if (!periodo) return vacio();

    const [participacion, carreras, docentes, tendencia] = await Promise.all([
      EstadisticaRepository.participacionDelCiclo(periodo.id),
      EstadisticaRepository.porCarrera(periodo.id),
      EstadisticaRepository.resumenDeDocentes(periodo.id),
      EstadisticaRepository.tendencia(periodo.id),
    ]);

    const alumnos = numero(participacion?.Alumnos);
    const alumnosParticipantes = numero(participacion?.AlumnosParticipantes);
    const inscripciones = numero(participacion?.Inscripciones);
    const completadas = numero(participacion?.Completadas);
    const conteo: Record<Clasificacion, number> = {
      Excelente: numero(docentes?.Excelente),
      Bueno: numero(docentes?.Bueno),
      Suficiente: numero(docentes?.Suficiente),
      "No suficiente": numero(docentes?.NoSuficiente),
    };

    return {
      periodo: { id: periodo.id, nombre: periodo.nombre },
      resumen: {
        alumnos,
        alumnosParticipantes,
        participacionAlumnos: porcentaje(alumnosParticipantes, alumnos),
        inscripciones,
        completadas,
        pendientes: numero(participacion?.Pendientes),
        avanceEvaluaciones: porcentaje(completadas, inscripciones),
        docentesConPromedio: numero(docentes?.DocentesConPromedio),
        promedioInstitucional: decimal(docentes?.PromedioInstitucional),
      },
      distribucion: conteo,
      porCarrera: carreras.map((c) => ({
        programaEducativoId: c.ProgramaEducativoId,
        nombre: c.ProgramaEducativo,
        alumnos: numero(c.Alumnos),
        participacionAlumnos: porcentaje(numero(c.AlumnosParticipantes), numero(c.Alumnos)),
        inscripciones: numero(c.Inscripciones),
        completadas: numero(c.Completadas),
        avanceEvaluaciones: porcentaje(numero(c.Completadas), numero(c.Inscripciones)),
        promedio: decimal(c.Promedio),
        clasificacion: c.Clasificacion as Clasificacion | null,
      })),
      tendencia: tendencia.map((t) => ({
        periodoId: t.PeriodoEvaluacionId,
        nombre: t.PeriodoEvaluacion,
        promedioInstitucional: decimal(t.PromedioInstitucional),
        docentesConPromedio: numero(t.DocentesConPromedio),
        avanceEvaluaciones: porcentaje(numero(t.Completadas), numero(t.Inscripciones)),
      })),
    };
  },
};
