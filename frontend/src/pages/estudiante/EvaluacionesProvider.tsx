import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAsignaciones, type Asignacion } from "@/lib/evaluaciones-api";
import { EvaluacionesContext, type EvaluacionesState } from "@/pages/estudiante/useAsignaciones";

/** Carga una sola vez las asignaciones del alumno. Con `enabled=false` (otros roles) no pide nada. */
export function EvaluacionesProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const [asignaciones, setAsignaciones] = useState<Asignacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAsignaciones(await getAsignaciones());
      setError(null);
    } catch {
      setError("No se pudo cargar tu lista de docentes.");
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const value = useMemo<EvaluacionesState>(
    () => ({ asignaciones, error, isLoading: enabled && asignaciones === null && error === null, refresh }),
    [asignaciones, error, enabled, refresh]
  );

  return <EvaluacionesContext.Provider value={value}>{children}</EvaluacionesContext.Provider>;
}
