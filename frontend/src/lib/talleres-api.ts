/** Capa de datos de talleres y laboratorios (RF08): /api/talleres/* (coordinación) y /api/estudiante/talleres/* (alumno). */
import { apiFetch } from "@/lib/api";
import type { Instrumento, Respuestas } from "@/lib/evaluaciones-api";

export type TipoTaller = "Taller" | "Laboratorio";

export interface Taller {
  id: number;
  nombre: string;
  tipo: TipoTaller;
  activo: boolean;
}

export interface CarreraConfiguracion {
  programaEducativoId: number;
  nombre: string;
  evaluaTalleres: boolean;
  alumnos: number;
  talleres: Taller[];
}

export interface Criterio {
  seccionId: number;
  nombre: string;
  promedio: number | null;
}

export interface ResultadoTaller extends Taller {
  /** null mientras haya menos evaluaciones que `minimoRespuestas` (y más de 0): el conteo exacto también se oculta. */
  respuestas: number | null;
  /** Alumnos de la carrera que lo evaluaron, en %; null si la carrera no tiene alumnos o el conteo está oculto. */
  participacion: number | null;
  /** null con menos evaluaciones que `minimoRespuestas`: no se muestra para no poder adivinar quién respondió. */
  promedio: number | null;
  criterios: Criterio[];
  ocultoPorPocasRespuestas: boolean;
}

export interface CarreraResultados {
  programaEducativoId: number;
  nombre: string;
  evaluaTalleres: boolean;
  alumnos: number;
  talleres: ResultadoTaller[];
}

export interface ResultadosTalleres {
  periodo: { id: number; nombre: string } | null;
  minimoRespuestas: number;
  carreras: CarreraResultados[];
}

export interface TallerDelAlumno {
  id: number;
  nombre: string;
  tipo: TipoTaller;
  completada: boolean;
  fechaEvaluacion: string | null;
}

export interface TalleresDelAlumno {
  /** false si la carrera del alumno no tiene encendida la evaluación de talleres. */
  habilitado: boolean;
  periodo: { id: number; nombre: string } | null;
  talleres: TallerDelAlumno[];
}

export function getConfiguracionTalleres(): Promise<CarreraConfiguracion[]> {
  return apiFetch<CarreraConfiguracion[]>("/talleres");
}

export function getResultadosTalleres(periodoId?: number): Promise<ResultadosTalleres> {
  return apiFetch<ResultadosTalleres>(periodoId ? `/talleres/resultados?periodoId=${periodoId}` : "/talleres/resultados");
}

export function crearTaller(datos: { programaEducativoId: number; nombre: string; tipo: TipoTaller }): Promise<Taller> {
  return apiFetch<Taller>("/talleres", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarTaller(id: number, cambios: Partial<Pick<Taller, "nombre" | "tipo" | "activo">>): Promise<Taller> {
  return apiFetch<Taller>(`/talleres/${id}`, { method: "PATCH", body: JSON.stringify(cambios) });
}

export function habilitarTalleresDeCarrera(programaEducativoId: number, evaluaTalleres: boolean): Promise<{ programaEducativoId: number; evaluaTalleres: boolean }> {
  return apiFetch(`/talleres/carreras/${programaEducativoId}`, { method: "PATCH", body: JSON.stringify({ evaluaTalleres }) });
}

export function getTalleresDelAlumno(): Promise<TalleresDelAlumno> {
  return apiFetch<TalleresDelAlumno>("/estudiante/talleres");
}

export function getInstrumentoTalleres(): Promise<Instrumento> {
  return apiFetch<Instrumento>("/estudiante/talleres/instrumento");
}

export async function enviarEvaluacionTaller(tallerId: number, respuestas: Respuestas): Promise<void> {
  await apiFetch<{ mensaje: string }>(`/estudiante/talleres/${tallerId}/respuestas`, { method: "POST", body: JSON.stringify({ respuestas }) });
}
