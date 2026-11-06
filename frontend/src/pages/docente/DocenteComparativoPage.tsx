import { ComparativoDocente } from "@/components/indicadores/ComparativoDocente";
import { Cargando } from "@/components/indicadores/Cargando";
import { useHistorico } from "@/components/indicadores/useHistorico";
import { getMiHistorico } from "@/lib/indicadores-api";

/** SCRUM-50: el ciclo actual contra el anterior y contra los últimos 3 ciclos. */
export function DocenteComparativoPage() {
  const { historico, error } = useHistorico(getMiHistorico, "mio");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparativo histórico</h1>
        <p className="text-sm text-muted-foreground">Cómo cambió tu evaluación de un ciclo a otro.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!historico && !error && <Cargando />}
      {historico && <ComparativoDocente ciclos={historico.ciclos} />}
    </div>
  );
}
