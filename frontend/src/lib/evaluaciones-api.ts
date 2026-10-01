/**
 * Capa de datos de evaluaciones del estudiante (SCRUM-33/34/35/36).
 *
 * Conectada a las APIs reales en /api/estudiante/*. Las pantallas no cambian
 * respecto a cuando usaban datos simulados: misma forma de respuesta.
 */
import { apiFetch } from "@/lib/api";

export interface Asignacion {
  id: number;
  docente: string;
  materia: string;
  grupo: string;
  completada: boolean;
  fechaEvaluacion: string | null;
}

export interface OpcionRespuesta {
  texto: string;
  valor: number;
}

export interface Pregunta {
  id: number;
  texto: string;
}

export interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

export interface Instrumento {
  nombre: string;
  escala: OpcionRespuesta[];
  secciones: Seccion[];
}

export interface Progreso {
  total: number;
  completadas: number;
  pendientes: number;
}

/** Respuestas del alumno: id de pregunta → valor elegido de la escala. */
export type Respuestas = Record<number, number>;

export function getAsignaciones(): Promise<Asignacion[]> {
  return apiFetch<Asignacion[]>("/estudiante/asignaciones");
}

export async function getAsignacion(id: number): Promise<Asignacion | undefined> {
  try {
    return await apiFetch<Asignacion>(`/estudiante/asignaciones/${id}`);
  } catch {
    return undefined;
  }
}

export function getProgreso(): Promise<Progreso> {
  return apiFetch<Progreso>("/estudiante/progreso");
}

export function getInstrumento(): Promise<Instrumento> {
  return apiFetch<Instrumento>("/estudiante/instrumento");
}

export async function enviarEvaluacion(asignacionId: number, respuestas: Respuestas): Promise<void> {
  await apiFetch<{ mensaje: string }>(`/estudiante/asignaciones/${asignacionId}/respuestas`, {
    method: "POST",
    body: JSON.stringify({ respuestas }),
  });
}
