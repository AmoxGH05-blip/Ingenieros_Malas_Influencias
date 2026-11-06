/** Capa de datos de los indicadores docentes (RF07): /api/indicadores/*. */
import { apiFetch } from "@/lib/api";

export type Clasificacion = "Excelente" | "Bueno" | "Suficiente" | "No suficiente";

export interface IndicadorDocente {
  docenteId: number;
  docente: string;
  numeroEmpleado: string;
  materias: string;
  grupos: number;
  evaluaciones: number;
  totalRespuestas: number;
  /** null = sin respuestas todavía (no es 0). */
  promedio: number | null;
  clasificacion: Clasificacion | null;
  ranking: number | null;
  docentesConPromedio: number;
}

export interface Ciclo extends IndicadorDocente {
  periodoId: number;
  periodo: string;
  /** Es el ciclo de evaluación vigente (los demás ya cerraron o aún no abren). */
  activo: boolean;
  /** Diferencia de promedio con el ciclo anterior que tuvo promedio. */
  variacion: number | null;
}

export interface Ranking {
  periodo: { id: number; nombre: string } | null;
  resumen: {
    docentes: number;
    docentesConPromedio: number;
    sinEvaluaciones: number;
    promedioInstitucional: number | null;
    distribucion: Record<Clasificacion, number>;
  };
  docentes: IndicadorDocente[];
}

export interface Historico {
  docente: { id: number; nombre: string; numeroEmpleado: string };
  /** Del más antiguo al más reciente: el último es el ciclo actual. */
  ciclos: Ciclo[];
}

export function getRanking(periodoId?: number): Promise<Ranking> {
  return apiFetch<Ranking>(`/indicadores/docentes${periodoId ? `?periodoId=${periodoId}` : ""}`);
}

export function getHistoricoDocente(docenteId: number): Promise<Historico> {
  return apiFetch<Historico>(`/indicadores/docentes/${docenteId}/historico`);
}

/** El historial del docente que inició sesión. */
export function getMiHistorico(): Promise<Historico> {
  return apiFetch<Historico>("/indicadores/mio");
}

export const formatoPromedio = (promedio: number | null): string => (promedio === null ? "—" : promedio.toFixed(2));

/**
 * El ciclo "actual" de un docente: el activo; si ninguno lo está, el más reciente.
 * Un ciclo futuro con grupos ya asignados no cuenta como actual.
 */
export function cicloActual(ciclos: Ciclo[]): Ciclo | null {
  return ciclos.findLast((c) => c.activo) ?? ciclos.at(-1) ?? null;
}

/** Los ciclos hasta el actual inclusive, del más antiguo al actual: la base de los comparativos. */
export function hastaCicloActual(ciclos: Ciclo[]): Ciclo[] {
  const actual = cicloActual(ciclos);
  return actual ? ciclos.slice(0, ciclos.indexOf(actual) + 1) : [];
}
