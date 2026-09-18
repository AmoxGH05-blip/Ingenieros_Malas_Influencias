import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, Clock, Search, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Asignacion } from "@/lib/evaluaciones-api";
import { cn } from "@/lib/utils";

type Filtro = "todas" | "pendientes" | "completadas";

interface DocentesTableProps {
  asignaciones: Asignacion[];
  /** Muestra solo las primeras N filas (para el dashboard). */
  limit?: number;
  /** Enlace "ver todas" cuando se usa con `limit`. */
  verTodasHref?: string;
}

/** "García López, Ana" → "AG" */
function iniciales(docente: string): string {
  const [apellidos = "", nombre = ""] = docente.split(",").map((parte) => parte.trim());
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

/** Etiqueta pequeña en mayúsculas sobre cada dato de la fila, como en la referencia visual. */
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

/** SCRUM-35: docentes a evaluar como filas-tarjeta, con filtro por estado, búsqueda (?q=) y acción "Evaluar". */
export function DocentesTable({ asignaciones, limit, verTodasHref }: DocentesTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const busqueda = (searchParams.get("q") ?? "").trim();
  const q = busqueda.toLowerCase();

  const coincideBusqueda = (a: Asignacion) => !q || `${a.docente} ${a.materia}`.toLowerCase().includes(q);
  const buscadas = asignaciones.filter(coincideBusqueda);
  const conteo = {
    todas: buscadas.length,
    pendientes: buscadas.filter((a) => !a.completada).length,
    completadas: buscadas.filter((a) => a.completada).length,
  };
  const filtradas = buscadas.filter((a) => filtro === "todas" || (filtro === "pendientes" ? !a.completada : a.completada));
  const visibles = limit ? filtradas.slice(0, limit) : filtradas;

  const tabs: { id: Filtro; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "pendientes", label: "Pendientes" },
    { id: "completadas", label: "Completadas" },
  ];

  return (
    <section aria-label="Docentes por evaluar" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filtrar por estado" className="flex gap-1 rounded-xl bg-secondary p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filtro === tab.id}
              onClick={() => setFiltro(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                filtro === tab.id
                  ? "border-success/50 bg-card text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-md px-1.5 text-xs",
                  filtro === tab.id ? "bg-success/15 text-success" : "bg-card text-muted-foreground"
                )}
              >
                {conteo[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {busqueda && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
          >
            <Search className="size-3.5" aria-hidden /> “{busqueda}” <X className="size-3.5 text-muted-foreground" aria-label="Quitar búsqueda" />
          </button>
        )}

        <span className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 text-foreground" aria-hidden /> Ciclo agosto – diciembre 2026
        </span>
      </div>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          <Search className="size-6" aria-hidden />
          No hay docentes que coincidan con el filtro.
        </div>
      ) : (
        <ul className="space-y-3">
          {visibles.map((a) => (
            <li
              key={a.id}
              className="grid items-center gap-x-6 gap-y-4 rounded-xl border border-border bg-card px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_80px_minmax(0,1.2fr)_110px]"
            >
              <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-1">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  {iniciales(a.docente)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.docente}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {a.completada ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3.5" aria-hidden /> Completada
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="size-3.5" aria-hidden /> Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Campo label="Materia">
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{a.materia}</span>
                </span>
              </Campo>
              <Campo label="Grupo">
                <span className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden /> {a.grupo}
                </span>
              </Campo>
              <Campo label="Evaluación">
                {a.completada ? (
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="size-4 text-success" aria-hidden /> {a.fechaEvaluacion}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 font-medium text-warning">
                    <Clock className="size-4" aria-hidden /> Sin responder
                  </span>
                )}
              </Campo>

              <div className="sm:col-span-2 lg:col-span-1 lg:text-right">
                {a.completada ? (
                  <span className="text-xs text-muted-foreground">Enviada</span>
                ) : (
                  <Button asChild size="sm" className="w-full lg:w-auto">
                    <Link to={`/estudiante/evaluar/${a.id}`}>Evaluar</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {limit && verTodasHref && filtradas.length > limit && (
        <div className="text-right">
          <Link to={verTodasHref} className="text-sm font-medium underline-offset-4 hover:underline">
            Ver todas ({filtradas.length})
          </Link>
        </div>
      )}
    </section>
  );
}
