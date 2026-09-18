import { createContext, useContext } from "react";
import type { Asignacion } from "@/lib/evaluaciones-api";

export interface EvaluacionesState {
  asignaciones: Asignacion[] | null;
  error: string | null;
  isLoading: boolean;
  /** Vuelve a pedir las asignaciones (p. ej. tras enviar una evaluación). */
  refresh: () => Promise<void>;
}

export const EvaluacionesContext = createContext<EvaluacionesState | null>(null);

/** Asignaciones (docente + materia) del alumno, compartidas entre sidebar y páginas. */
export function useAsignaciones(): EvaluacionesState {
  const context = useContext(EvaluacionesContext);
  if (!context) throw new Error("useAsignaciones debe usarse dentro de EvaluacionesProvider");
  return context;
}
