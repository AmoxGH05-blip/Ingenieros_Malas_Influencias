import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, ChevronRight, Star, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Cargando } from "@/components/indicadores/Cargando";
import { BarraPromedio } from "@/components/indicadores/BarraPromedio";
import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { getFiltros, type FiltrosCoordinacion } from "@/lib/coordinacion-api";
import { formatoPromedio, getRanking, type Clasificacion, type Ranking } from "@/lib/indicadores-api";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-96";

const ORDEN: Clasificacion[] = ["Excelente", "Bueno", "Suficiente", "No suficiente"];

/** Ranking de docentes por ciclo, con su promedio y categoría (RF07). Para Coordinación y Administración. */
export function IndicadoresPage() {
  const [filtros, setFiltros] = useState<FiltrosCoordinacion | null>(null);
  const [periodoId, setPeriodoId] = useState("");
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null);
  // Cada respuesta lleva su ciclo: lo que no corresponde al ciclo elegido ahora no se muestra, ni dato ni error.
  const [resultado, setResultado] = useState<{ clave: string; ranking: Ranking | null; error: string | null } | null>(null);

  useEffect(() => {
    getFiltros()
      .then(setFiltros)
      .catch(() => setErrorFiltros("No se pudieron cargar los ciclos."));
  }, []);

  useEffect(() => {
    let vigente = true;
    getRanking(Number(periodoId) || undefined)
      .then((ranking) => {
        if (vigente) setResultado({ clave: periodoId, ranking, error: null });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        const mensaje = err instanceof ApiError && err.status === 404 ? err.message : "No se pudo cargar el ranking.";
        setResultado({ clave: periodoId, ranking: null, error: mensaje });
      });
    return () => {
      vigente = false;
    };
  }, [periodoId]);

  const vigente = resultado?.clave === periodoId ? resultado : null;
  const ranking = vigente?.ranking ?? null;
  const mensajeError = vigente?.error ?? errorFiltros;
  const cicloActivo = filtros?.periodos.find((p) => p.activo);
  const resumen = ranking?.resumen;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Indicadores docentes</h1>
        <p className="text-sm text-muted-foreground">
          {ranking?.periodo ? ranking.periodo.nombre : "Promedio, lugar y categoría de cada docente por ciclo."}
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-ciclo">Ciclo</Label>
          <select id="filtro-ciclo" className={SELECT_CLASS} value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
            <option value="">{cicloActivo ? `Ciclo activo (${cicloActivo.nombre})` : "Ciclo activo"}</option>
            {filtros?.periodos
              .filter((p) => !p.activo)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {mensajeError && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {mensajeError}
        </p>
      )}
      {!ranking && !mensajeError && <Cargando />}

      {ranking && resumen && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Promedio institucional" value={formatoPromedio(resumen.promedioInstitucional)} icon={Star} />
            <MetricCard
              label="Docentes con promedio"
              value={`${resumen.docentesConPromedio} de ${resumen.docentes}`}
              icon={Users}
              alert={resumen.sinEvaluaciones > 0 ? `${resumen.sinEvaluaciones} sin evaluaciones` : undefined}
            />
            <MetricCard label="Excelente" value={resumen.distribucion.Excelente} icon={Award} />
            <MetricCard label="No suficiente" value={resumen.distribucion["No suficiente"]} icon={Award} />
          </div>

          <Card className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="font-medium">Distribución:</span>
            {ORDEN.map((c) => (
              <span key={c} className="inline-flex items-center gap-2">
                <ClasificacionBadge clasificacion={c} />
                <span className="tabular-nums text-muted-foreground">{resumen.distribucion[c]}</span>
              </span>
            ))}
          </Card>

          {ranking.docentes.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">No hay docentes con grupos en este ciclo.</Card>
          ) : (
            <ul className="space-y-3">
              {ranking.docentes.map((d) => (
                <li key={d.docenteId}>
                  <Link
                    to={`/coordinador/indicadores/${d.docenteId}`}
                    className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 outline-none transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring lg:grid-cols-[56px_minmax(0,1.6fr)_minmax(0,2fr)_150px_24px]"
                  >
                    <span className="text-2xl font-semibold tabular-nums text-muted-foreground">{d.ranking === null ? "—" : `${d.ranking}°`}</span>
                    <div className="min-w-0">
                      <p className="break-words font-semibold">{d.docente}</p>
                      <p className="break-words text-xs text-muted-foreground">
                        {d.materias || "Sin materias"} · {d.evaluaciones} evaluaciones
                      </p>
                    </div>
                    <BarraPromedio promedio={d.promedio} clasificacion={d.clasificacion} label={d.docente} />
                    <ClasificacionBadge clasificacion={d.clasificacion} />
                    <ChevronRight className="hidden size-5 text-muted-foreground lg:block" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
