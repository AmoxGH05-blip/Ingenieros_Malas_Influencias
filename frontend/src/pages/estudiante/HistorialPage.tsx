import { BookOpen, CheckCircle2, History, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";

/** "García López, Ana" → "AG" */
function iniciales(docente: string): string {
  const [apellidos = "", nombre = ""] = docente.split(",").map((parte) => parte.trim());
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

/** SCRUM-36: historial de evaluaciones ya enviadas, de la más reciente a la más antigua. */
export function HistorialPage() {
  const { asignaciones, error, isLoading } = useAsignaciones();

  const enviadas = (asignaciones ?? [])
    .filter((a) => a.completada)
    .sort((a, b) => (b.fechaEvaluacion ?? "").localeCompare(a.fechaEvaluacion ?? ""));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>
        <p className="text-sm text-muted-foreground">Evaluaciones que ya enviaste en el ciclo actual.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {isLoading && <div aria-busy className="h-48 animate-pulse rounded-xl bg-card" />}

      {asignaciones && enviadas.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          <History className="size-6" aria-hidden />
          Todavía no has enviado ninguna evaluación.
        </div>
      )}

      {enviadas.length > 0 && (
        <ul className="space-y-3">
          {enviadas.map((a) => (
            <li
              key={a.id}
              className="grid items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_80px_minmax(0,1.2fr)]"
            >
              <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-1">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  {iniciales(a.docente)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.docente}</p>
                  <Badge variant="success" className="mt-0.5">
                    <CheckCircle2 className="size-3.5" aria-hidden /> Enviada
                  </Badge>
                </div>
              </div>
              <div className="min-w-0 text-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Materia</p>
                <span className="mt-1 flex items-center gap-2">
                  <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{a.materia}</span>
                </span>
              </div>
              <div className="text-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Grupo</p>
                <span className="mt-1 flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden /> {a.grupo}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fecha de envío</p>
                <span className="mt-1 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="size-4 text-success" aria-hidden /> {a.fechaEvaluacion}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
