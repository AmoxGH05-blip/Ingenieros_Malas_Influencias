/** Capa de datos de las estadísticas institucionales (RF06): /api/estadisticas/*. */
import { apiFetch } from "@/lib/api";
import type { Clasificacion } from "@/lib/indicadores-api";

export interface ResumenInstitucional {
  alumnos: number;
  alumnosParticipantes: number;
  /** Alumnos con al menos una evaluación enviada, sobre el total de alumnos inscritos. */
  participacionAlumnos: number | null;
  inscripciones: number;
  completadas: number;
  pendientes: number;
  /** Evaluaciones enviadas sobre las que se debían enviar (una por alumno y grupo). */
  avanceEvaluaciones: number | null;
  docentesConPromedio: number;
  promedioInstitucional: number | null;
}

export interface CarreraEstadistica {
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

export interface CicloTendencia {
  periodoId: number;
  nombre: string;
  promedioInstitucional: number | null;
  docentesConPromedio: number;
  avanceEvaluaciones: number | null;
}

export interface Estadisticas {
  periodo: { id: number; nombre: string } | null;
  resumen: ResumenInstitucional;
  distribucion: Record<Clasificacion, number>;
  porCarrera: CarreraEstadistica[];
  tendencia: CicloTendencia[];
}

export function getEstadisticas(periodoId?: number): Promise<Estadisticas> {
  return apiFetch<Estadisticas>(`/estadisticas/institucional${periodoId ? `?periodoId=${periodoId}` : ""}`);
}

/** "36 %", o un guion cuando no hay nada que medir (no es 0 %). */
export const formatoPorcentaje = (valor: number | null): string => (valor === null ? "—" : `${valor} %`);
