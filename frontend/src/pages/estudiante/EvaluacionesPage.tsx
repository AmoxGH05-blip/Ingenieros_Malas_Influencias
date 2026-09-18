import { DocentesTable } from "@/pages/estudiante/DocentesTable";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";

/** Listado completo de docentes a evaluar (destino de la búsqueda rápida y de "Ver todas"). */
export function EvaluacionesPage() {
  const { asignaciones, error, isLoading } = useAsignaciones();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluaciones</h1>
        <p className="text-sm text-muted-foreground">Todos los docentes de tu grupo y el estado de cada evaluación.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {isLoading && <div aria-busy className="h-64 animate-pulse rounded-lg bg-card" />}
      {asignaciones && <DocentesTable asignaciones={asignaciones} />}
    </div>
  );
}
