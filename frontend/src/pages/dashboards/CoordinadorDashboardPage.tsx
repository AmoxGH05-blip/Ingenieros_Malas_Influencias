import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleDashed, Clock, RefreshCw, Users } from "lucide-react";
import { BarraAvance } from "@/components/dashboard/BarraAvance";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getAvance, getFiltros, type Avance, type FiltrosCoordinacion } from "@/lib/coordinacion-api";

const REFRESH_MS = 30_000;

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Seleccion {
  periodoId: string;
  programaId: string;
  grupoId: string;
}

/** "Actualizado hace 12 s": se re-renderiza solo, sin arrastrar a toda la página. */
function Actualizado({ desde }: { desde: number | null }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (desde === null) return null;
  const segundos = Math.max(0, Math.round((ahora - desde) / 1000));
  return <span className="text-xs text-muted-foreground">Actualizado hace {segundos} s</span>;
}

/** SCRUM-42: avance de las evaluaciones para Coordinación, con actualización automática cada 30 s. */
export function CoordinadorDashboardPage() {
  const [filtros, setFiltros] = useState<FiltrosCoordinacion | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion>({ periodoId: "", programaId: "", grupoId: "" });
  const [avance, setAvance] = useState<Avance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const peticion = useRef(0);

  const cargar = useCallback(async () => {
    const id = ++peticion.current;
    setCargando(true);
    try {
      const datos = await getAvance({
        periodoId: Number(seleccion.periodoId) || undefined,
        programaEducativoId: Number(seleccion.programaId) || undefined,
        grupoId: Number(seleccion.grupoId) || undefined,
      });
      if (id !== peticion.current) return; // llegó una respuesta más nueva mientras esperábamos
      setAvance(datos);
      setActualizadoEn(Date.now());
      setError(null);
    } catch {
      if (id === peticion.current) setError("No se pudo cargar el avance. Reintentando automáticamente.");
    } finally {
      if (id === peticion.current) setCargando(false);
    }
  }, [seleccion]);

  useEffect(() => {
    getFiltros()
      .then(setFiltros)
      .catch(() => setError("No se pudieron cargar los filtros."));
  }, []);

  useEffect(() => {
    void cargar();
    const intervalo = setInterval(() => {
      if (!document.hidden) void cargar();
    }, REFRESH_MS);
    const alVolver = () => {
      if (!document.hidden) void cargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  const cambiar = (clave: keyof Seleccion) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSeleccion((prev) => ({ ...prev, [clave]: e.target.value }));

  const resumen = avance?.resumen;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avance de evaluaciones</h1>
          <p className="text-sm text-muted-foreground">
            {avance?.periodo ? avance.periodo.nombre : "Seguimiento de participación por carrera y grupo."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Actualizado desde={actualizadoEn} />
          <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={cargando}>
            <RefreshCw className={cargando ? "size-4 animate-spin" : "size-4"} aria-hidden /> Actualizar ahora
          </Button>
        </div>
      </div>

      <Card className="grid gap-4 p-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-periodo">Ciclo</Label>
          <select id="filtro-periodo" className={SELECT_CLASS} value={seleccion.periodoId} onChange={cambiar("periodoId")}>
            <option value="">Ciclo activo</option>
            {filtros?.periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-carrera">Carrera</Label>
          <select id="filtro-carrera" className={SELECT_CLASS} value={seleccion.programaId} onChange={cambiar("programaId")}>
            <option value="">Todas</option>
            {filtros?.programasEducativos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="filtro-grupo">Grupo</Label>
          <select id="filtro-grupo" className={SELECT_CLASS} value={seleccion.grupoId} onChange={cambiar("grupoId")}>
            <option value="">Todos</option>
            {filtros?.grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!avance && !error && <div aria-busy className="h-64 animate-pulse rounded-xl bg-card" />}

      {avance && resumen && (
        <>
          <section aria-label="Resumen de avance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Alumnos" value={resumen.alumnos} icon={Users} />
            <MetricCard label="Concluidos" value={resumen.concluidos} icon={CheckCircle2} />
            <MetricCard label="Parciales" value={resumen.parciales} icon={Clock} />
            <MetricCard label="No iniciados" value={resumen.noIniciados} icon={CircleDashed} />
            <Card className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Participación</p>
                <p className="mt-1 text-xs text-muted-foreground">Al menos una evaluación enviada</p>
              </div>
              <ProgressRing value={resumen.porcentajeParticipacion} label="Participación" />
            </Card>
          </section>

          <Card className="space-y-3 p-5">
            <h2 className="text-lg font-semibold">Avance general</h2>
            <BarraAvance {...resumen} label="Avance general" />
          </Card>

          <section aria-label="Avance por grupo" className="space-y-3">
            <h2 className="text-lg font-semibold">Por grupo</h2>
            {avance.porGrupo.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
                No hay grupos con los filtros elegidos.
              </div>
            ) : (
              <ul className="space-y-3">
                {avance.porGrupo.map((g) => (
                  <li
                    key={g.grupoId}
                    className="grid items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-5 py-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{g.materia}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {g.docente} · Grupo {g.seccion}
                      </p>
                    </div>
                    <BarraAvance
                      compacta
                      concluidos={g.concluidos}
                      parciales={g.parciales}
                      noIniciados={g.noIniciados}
                      label={`Avance de ${g.materia}`}
                    />
                    <p className="text-sm text-muted-foreground lg:text-right">
                      <strong className="text-foreground">{g.concluidos}</strong> concluidos ·{" "}
                      <strong className="text-foreground">{g.parciales}</strong> parciales ·{" "}
                      <strong className="text-foreground">{g.noIniciados}</strong> sin iniciar
                      <span className="block text-xs">{g.inscritos} inscritos</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
