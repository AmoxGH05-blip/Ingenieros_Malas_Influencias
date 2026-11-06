import { useEffect, useState } from "react";
import { BarChart3, ClipboardCheck, Star, Users } from "lucide-react";
import { ConcentradoCarreras } from "@/components/estadisticas/ConcentradoCarreras";
import { GraficaDistribucion } from "@/components/estadisticas/GraficaDistribucion";
import { GraficaTendencia } from "@/components/estadisticas/GraficaTendencia";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { getFiltros, type FiltrosCoordinacion } from "@/lib/coordinacion-api";
import { formatoPorcentaje, getEstadisticas, type Estadisticas } from "@/lib/estadisticas-api";
import { formatoPromedio } from "@/lib/indicadores-api";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-96";

interface Resultado {
  clave: string;
  datos: Estadisticas | null;
  error: string | null;
}

/** Estadísticas institucionales de un ciclo con gráficos (RF06). Para Coordinación y Administración. */
export function EstadisticasPage() {  const [filtros, setFiltros] = useState<FiltrosCoordinacion | null>(null);
  const [periodoId, setPeriodoId] = useState("");
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null);
  // Cada respuesta lleva su ciclo: lo que no corresponde al ciclo elegido ahora no se muestra, ni dato ni error.
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    getFiltros()
      .then(setFiltros)
      .catch(() => setErrorFiltros("No se pudieron cargar los ciclos."));
  }, []);

  useEffect(() => {
    let vigente = true;
    getEstadisticas(Number(periodoId) || undefined)
      .then((datos) => {
        if (vigente) setResultado({ clave: periodoId, datos, error: null });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        const error = err instanceof ApiError && err.status === 404 ? err.message : "No se pudieron cargar las estadísticas.";
        setResultado({ clave: periodoId, datos: null, error });
      });
    return () => {
      vigente = false;
    };
  }, [periodoId, intento]);

  // Volver a pedir el mismo ciclo: elegirlo otra vez en la lista no cambia nada, así que el error trae su propio botón.
  const reintentar = () => {
    setResultado(null);
    setIntento((n) => n + 1);
  };

  const actual = resultado?.clave === periodoId ? resultado : null;
  const datos = actual?.datos ?? null;
  const errorEstadisticas = actual?.error ?? null;
  const mensajeError = errorEstadisticas ?? errorFiltros;
  const cicloActivo = filtros?.periodos.find((p) => p.activo);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas institucionales</h1>
        <p className="text-sm text-muted-foreground">{datos?.periodo ? datos.periodo.nombre : "Participación, promedios y tendencia por ciclo."}</p>
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
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{mensajeError}</p>
          {errorEstadisticas && (
            <Button type="button" variant="outline" size="sm" onClick={reintentar}>
              Reintentar
            </Button>
          )}
        </div>
      )}
      {!datos && !errorEstadisticas && (
        <div role="status" aria-busy className="h-64 animate-pulse rounded-xl bg-card">
          <span className="sr-only">Cargando…</span>
        </div>
      )}

      {datos && datos.periodo === null && (
        <p role="status" className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No hay un ciclo de evaluación activo. Elige un ciclo de la lista para ver sus estadísticas.
        </p>
      )}
      {datos?.periodo && <Contenido datos={datos} />}
    </div>
  );
}

function Contenido({ datos }: { datos: Estadisticas }) {
  const r = datos.resumen;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={`Alumnos que participaron (${r.alumnosParticipantes} de ${r.alumnos})`} value={formatoPorcentaje(r.participacionAlumnos)} icon={Users} />
        <MetricCard label={`Evaluaciones enviadas (${r.completadas} de ${r.inscripciones})`} value={formatoPorcentaje(r.avanceEvaluaciones)} icon={ClipboardCheck} />
        <MetricCard label="Promedio institucional (de 10)" value={formatoPromedio(r.promedioInstitucional)} icon={Star} />
        <MetricCard label="Docentes con promedio" value={r.docentesConPromedio} icon={BarChart3} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GraficaDistribucion distribucion={datos.distribucion} />
        <GraficaTendencia tendencia={datos.tendencia} />
      </div>
      <ConcentradoCarreras carreras={datos.porCarrera} />
    </>
  );
}
