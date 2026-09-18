import { useEffect, useState } from "react";
import { getAsignaciones, type Asignacion } from "@/lib/evaluaciones-api";

/** Carga las asignaciones (docente + materia) del alumno con estado de carga/error. */
export function useAsignaciones() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    getAsignaciones()
      .then((data) => activo && setAsignaciones(data))
      .catch(() => activo && setError("No se pudo cargar tu lista de docentes."));
    return () => {
      activo = false;
    };
  }, []);

  return { asignaciones, error, isLoading: asignaciones === null && error === null };
}
