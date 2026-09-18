import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Asignacion } from "@/lib/evaluaciones-api";
import { cn } from "@/lib/utils";

type Filtro = "todas" | "pendientes" | "completadas";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "pendientes", label: "Pendientes" },
  { id: "completadas", label: "Completadas" },
];

interface DocentesTableProps {
  asignaciones: Asignacion[];
  /** Muestra solo las primeras N filas (para el dashboard). */
  limit?: number;
  /** Enlace "ver todas" cuando se usa con `limit`. */
  verTodasHref?: string;
}

/** SCRUM-35: listado de docentes a evaluar con filtros, búsqueda (?q=) y acción para abrir el cuestionario. */
export function DocentesTable({ asignaciones, limit, verTodasHref }: DocentesTableProps) {
  const [searchParams] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const filtradas = asignaciones.filter((a) => {
    if (filtro === "pendientes" && a.completada) return false;
    if (filtro === "completadas" && !a.completada) return false;
    return !q || `${a.docente} ${a.materia}`.toLowerCase().includes(q);
  });
  const visibles = limit ? filtradas.slice(0, limit) : filtradas;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Docentes por evaluar</CardTitle>
          <CardDescription>
            {q ? `Resultados para “${searchParams.get("q")}”` : "Elige un docente para responder su cuestionario."}
          </CardDescription>
        </div>
        <div role="group" aria-label="Filtrar por estado" className="flex gap-1 rounded-lg bg-secondary p-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filtro === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 pb-10 pt-4 text-center text-sm text-muted-foreground">
          <Search className="size-6" aria-hidden />
          No hay docentes que coincidan con el filtro.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-y border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-medium">Docente</th>
                <th className="px-3 py-3 font-medium">Materia</th>
                <th className="px-3 py-3 font-medium">Grupo</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 text-right font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.map((a) => (
                <tr key={a.id} className="hover:bg-secondary/40">
                  <td className="px-6 py-4 font-medium">{a.docente}</td>
                  <td className="px-3 py-4 text-muted-foreground">{a.materia}</td>
                  <td className="px-3 py-4 text-muted-foreground">{a.grupo}</td>
                  <td className="px-3 py-4">
                    {a.completada ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3.5" aria-hidden /> Completada
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="size-3.5" aria-hidden /> Pendiente
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {a.completada ? (
                      <span className="text-xs text-muted-foreground">Evaluada el {a.fechaEvaluacion}</span>
                    ) : (
                      <Button asChild size="sm">
                        <Link to={`/estudiante/evaluar/${a.id}`}>Evaluar</Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {limit && verTodasHref && filtradas.length > limit && (
        <div className="border-t border-border px-6 py-3 text-right">
          <Link to={verTodasHref} className="text-sm font-medium hover:underline">
            Ver todas ({filtradas.length})
          </Link>
        </div>
      )}
    </Card>
  );
}
