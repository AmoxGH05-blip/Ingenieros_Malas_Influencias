import type { Instrumento } from "@/lib/evaluaciones-api";

/** Cantidad de preguntas de un instrumento. */
export function totalPreguntas(instrumento: Instrumento): number {
  return instrumento.secciones.reduce((n, s) => n + s.preguntas.length, 0);
}
