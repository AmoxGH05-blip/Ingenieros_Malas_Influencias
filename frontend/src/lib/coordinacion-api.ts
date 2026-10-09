/** Capa de datos del dashboard de coordinación (SCRUM-42): /api/coordinacion/*. */
import { apiFetch } from "@/lib/api";

export interface Contadores {
  concluidos: number;
  parciales: number;
  noIniciados: number;
}

export interface AvanceGrupo extends Contadores {
  grupoId: number;
  materia: string;
  docente: string;
  seccion: string;
  inscritos: number;
}

export interface Avance {
  periodo: { id: number; nombre: string } | null;
  resumen: Contadores & { alumnos: number; porcentajeParticipacion: number };
  porGrupo: AvanceGrupo[];
}

export interface FiltrosCoordinacion {
  periodos: { id: number; nombre: string; activo: boolean }[];
  programasEducativos: { id: number; nombre: string }[];
  grupos: { id: number; nombre: string; periodoAcademicoId: number }[];
}

export interface ParametrosAvance {
  periodoId?: number;
  programaEducativoId?: number;
  grupoId?: number;
}

export function getFiltros(): Promise<FiltrosCoordinacion> {
  return apiFetch<FiltrosCoordinacion>("/coordinacion/filtros");
}

export function getAvance(parametros: ParametrosAvance): Promise<Avance> {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor) query.set(clave, String(valor));
  }
  const sufijo = query.size > 0 ? `?${query.toString()}` : "";
  return apiFetch<Avance>(`/coordinacion/avance${sufijo}`);
}
