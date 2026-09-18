import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, ClipboardList, GraduationCap, X } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { DocentesTable } from "@/pages/estudiante/DocentesTable";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";

/** Dashboard del estudiante: avance (SCRUM-36) + docentes por evaluar (SCRUM-35). */
export function EstudianteDashboardPage() {
  const { asignaciones, error, isLoading } = useAsignaciones();
  const location = useLocation();
  const evaluado = (location.state as { evaluado?: string } | null)?.evaluado;
  const [avisoCerrado, setAvisoCerrado] = useState(false);

  const total = asignaciones?.length ?? 0;
  const completadas = asignaciones?.filter((a) => a.completada).length ?? 0;
  const pendientes = total - completadas;
  const avance = total ? Math.round((completadas / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {evaluado && !avisoCerrado && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <span className="flex-1">
            Tu evaluación de <strong>{evaluado}</strong> se registró correctamente. ¡Gracias!
          </span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAvisoCerrado(true)} className="rounded p-1 hover:bg-card">
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading && (
        <div aria-busy className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-card" />
          <div className="h-64 animate-pulse rounded-xl bg-card" />
        </div>
      )}

      {asignaciones && (
        <>
          <section aria-labelledby="avance-titulo" className="space-y-3">
            <h2 id="avance-titulo" className="text-[15px] font-semibold">
              Tu avance en el ciclo actual
            </h2>
            <div className="grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-stretch">
              <MetricCard
                label="Pendientes por evaluar"
                value={pendientes}
                icon={ClipboardList}
                alert={pendientes ? "Responde antes del cierre" : undefined}
                to="/estudiante/evaluaciones"
              />
              <MetricCard label="Evaluaciones enviadas" value={completadas} icon={CheckCircle2} />
              <MetricCard label="Docentes asignados" value={total} icon={GraduationCap} />
              <div className="flex items-center justify-center gap-4 rounded-xl border border-border bg-card px-6 py-4">
                <ProgressRing value={avance} label="Avance de evaluaciones" />
                <div className="text-sm">
                  <p className="font-semibold">Avance</p>
                  <p className="text-muted-foreground">
                    {completadas} de {total} completadas
                  </p>
                </div>
              </div>
            </div>
          </section>

          <DocentesTable asignaciones={asignaciones} limit={5} verTodasHref="/estudiante/evaluaciones" />
        </>
      )}
    </div>
  );
}
