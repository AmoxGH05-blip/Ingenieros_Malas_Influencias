import { useCallback, useEffect, useRef, useState } from "react";
import { ConfiguracionCarrera } from "@/components/talleres/ConfiguracionCarrera";
import { ResultadosTalleres } from "@/components/talleres/ResultadosTalleres";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getFiltros, type FiltrosCoordinacion } from "@/lib/coordinacion-api";
import { getConfiguracionTalleres, getResultadosTalleres, type CarreraConfiguracion, type ResultadosTalleres as DatosResultadosTalleres } from "@/lib/talleres-api";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-96";

type Pestana = "configuracion" | "resultados";

/** Talleres y laboratorios (RF08) para Coordinación y Administración: configuración por carrera y resultados por ciclo. */
export function TalleresCoordinacionPage() {
  const [pestana, setPestana] = useState<Pestana>("configuracion");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Talleres y laboratorios</h1>
        <p className="text-sm text-muted-foreground">Qué talleres tiene cada carrera, si sus alumnos los evalúan y qué resultados hay.</p>
      </div>

      <nav aria-label="Secciones de talleres" className="flex gap-2">
        {(["configuracion", "resultados"] as const).map((clave) => (
          <Button key={clave} type="button" aria-pressed={pestana === clave} variant={pestana === clave ? "default" : "outline"} size="sm" onClick={() => setPestana(clave)}>
            {clave === "configuracion" ? "Configuración" : "Resultados"}
          </Button>
        ))}
      </nav>

      {pestana === "configuracion" ? <Configuracion /> : <Resultados />}
    </div>
  );
}

function Configuracion() {
  const [carreras, setCarreras] = useState<CarreraConfiguracion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solo cuenta la última petición: si dos refrescos se cruzan, el más viejo no pisa al más nuevo.
  const ultima = useRef(0);

  const cargar = useCallback(async () => {
    const numero = ++ultima.current;
    try {
      const datos = await getConfiguracionTalleres();
      if (numero !== ultima.current) return;
      setCarreras(datos);
      setError(null);
    } catch {
      if (numero === ultima.current) setError("No se pudo cargar la configuración.");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Una carrera con la evaluación <strong>deshabilitada</strong> no muestra talleres a sus alumnos. Dar de baja un taller lo oculta a los alumnos pero conserva las evaluaciones ya enviadas.
      </p>
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void cargar()}>Reintentar</Button>
        </div>
      )}
      {!carreras && !error && <div role="status" aria-busy className="h-48 animate-pulse rounded-xl bg-card"><span className="sr-only">Cargando…</span></div>}
      {carreras?.map((carrera) => <ConfiguracionCarrera key={carrera.programaEducativoId} carrera={carrera} onCambio={cargar} />)}
    </div>
  );
}

interface EstadoResultados {
  clave: string;
  datos: DatosResultadosTalleres | null;
  error: string | null;
}

function Resultados() {
  const [filtros, setFiltros] = useState<FiltrosCoordinacion | null>(null);
  const [periodoId, setPeriodoId] = useState("");
  const [intento, setIntento] = useState(0);
  const [errorCiclos, setErrorCiclos] = useState(false);
  // Cada respuesta lleva su ciclo: lo que no corresponde al ciclo elegido ahora no se muestra, ni dato ni error.
  const [estado, setEstado] = useState<EstadoResultados | null>(null);

  useEffect(() => {
    getFiltros().then(setFiltros).catch(() => setErrorCiclos(true));
  }, []);

  useEffect(() => {
    let vigente = true;
    getResultadosTalleres(Number(periodoId) || undefined)
      .then((datos) => vigente && setEstado({ clave: periodoId, datos, error: null }))
      .catch(() => vigente && setEstado({ clave: periodoId, datos: null, error: "No se pudieron cargar los resultados." }));
    return () => {
      vigente = false;
    };
  }, [periodoId, intento]);

  const actual = estado?.clave === periodoId ? estado : null;
  const cicloActivo = filtros?.periodos.find((p) => p.activo);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-ciclo-talleres">Ciclo</Label>
          <select id="filtro-ciclo-talleres" className={SELECT_CLASS} value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
            <option value="">{cicloActivo ? `Ciclo activo (${cicloActivo.nombre})` : "Ciclo activo"}</option>
            {filtros?.periodos.filter((p) => !p.activo).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      </Card>

      {errorCiclos && <p role="alert" className="text-sm text-destructive">No se pudo cargar la lista de ciclos: solo se puede ver el ciclo activo.</p>}
      {actual?.error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{actual.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => { setEstado(null); setIntento((n) => n + 1); }}>Reintentar</Button>
        </div>
      )}
      {!actual && <div role="status" aria-busy className="h-48 animate-pulse rounded-xl bg-card"><span className="sr-only">Cargando…</span></div>}
      {actual?.datos && actual.datos.periodo === null && (
        <p role="status" className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No hay un ciclo de evaluación activo. Elige un ciclo de la lista para ver sus resultados.
        </p>
      )}
      {actual?.datos?.periodo && (
        <>
          <p className="text-sm text-muted-foreground">{actual.datos.periodo.nombre}. Los resultados de un taller se muestran con {actual.datos.minimoRespuestas} evaluaciones o más.</p>
          <ResultadosTalleres resultados={actual.datos} />
        </>
      )}
    </div>
  );
}
