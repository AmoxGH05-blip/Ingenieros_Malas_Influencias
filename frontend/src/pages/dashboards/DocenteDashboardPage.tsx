import { HistoricoDocente } from "@/components/indicadores/HistoricoDocente";
import { PerfilDocente } from "@/components/indicadores/PerfilDocente";
import { Cargando } from "@/components/indicadores/Cargando";
import { useHistorico } from "@/components/indicadores/useHistorico";
import { cicloActual, getMiHistorico } from "@/lib/indicadores-api";

/** SCRUM-49: perfil del docente (promedio, categoría, lugar) con su histórico de ciclos. Solo ve lo suyo. */
export function DocenteDashboardPage() {
  const { historico, error } = useHistorico(getMiHistorico, "mio");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil docente</h1>
        <p className="text-sm text-muted-foreground">
          {historico ? `${historico.docente.nombre} · ${historico.docente.numeroEmpleado}` : "Tus indicadores de evaluación por ciclo."}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!historico && !error && <Cargando />}

      {historico && (
        <>
          <PerfilDocente ciclo={cicloActual(historico.ciclos)} />
          <HistoricoDocente ciclos={historico.ciclos} />
        </>
      )}
    </div>
  );
}
