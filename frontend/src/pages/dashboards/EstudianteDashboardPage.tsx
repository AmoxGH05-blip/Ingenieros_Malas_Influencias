import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Clock, TrendingUp, Users, X } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { DocentesTable } from "@/pages/estudiante/DocentesTable";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";

/** Dashboard del estudiante: progreso (SCRUM-36) + docentes por evaluar (SCRUM-35). */
export function EstudianteDashboardPage() {
  const { usuario } = useAuth();
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario?.correo.split("@")[0]}</h1>
        <p className="text-sm text-muted-foreground">Este es el avance de tu evaluación docente del ciclo actual.</p>
      </div>

      {evaluado && !avisoCerrado && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <span className="flex-1">Tu evaluación de <strong>{evaluado}</strong> se registró correctamente. ¡Gracias!</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAvisoCerrado(true)} className="rounded p-1 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <div aria-busy className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[116px] animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : (
        asignaciones && (
          <>
            <section aria-label="Resumen de avance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Docentes totales" value={total} hint="Asignados a tu grupo" icon={Users} />
              <MetricCard label="Evaluados" value={completadas} hint="Cuestionarios enviados" icon={CheckCircle2} tone="success" />
              <MetricCard label="Pendientes" value={pendientes} hint={pendientes ? "Aún por responder" : "Todo al día"} icon={Clock} tone="warning" />
              <MetricCard label="Avance" value={`${avance}%`} hint={`${completadas} de ${total} completadas`} icon={TrendingUp} tone="brand" />
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Mi progreso</CardTitle>
                <CardDescription>
                  {pendientes
                    ? `Te ${pendientes === 1 ? "falta 1 evaluación" : `faltan ${pendientes} evaluaciones`} para terminar.`
                    : "Completaste todas tus evaluaciones."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={avance} label="Avance de evaluaciones completadas" />
              </CardContent>
            </Card>

            <DocentesTable asignaciones={asignaciones} limit={5} verTodasHref="/estudiante/evaluaciones" />
          </>
        )
      )}
    </div>
  );
}
