import { BarraPromedio } from "@/components/indicadores/BarraPromedio";
import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Variacion } from "@/components/indicadores/Variacion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ciclo } from "@/lib/indicadores-api";

/** Histórico: una fila por ciclo, del más reciente al más antiguo. */
export function HistoricoDocente({ ciclos }: { ciclos: Ciclo[] }) {
  const recientesPrimero = [...ciclos].reverse();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico por ciclo</CardTitle>
        <CardDescription>Promedio de 0 a 10, categoría y lugar en cada ciclo en que tuvo grupos.</CardDescription>
      </CardHeader>
      <CardContent>
        {recientesPrimero.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin ciclos registrados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recientesPrimero.map((c) => (
              <li key={c.periodoId} className="grid items-center gap-x-6 gap-y-2 py-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_150px_110px]">
                <div className="min-w-0">
                  <p className="break-words font-medium">{c.periodo}</p>
                  <p className="text-xs text-muted-foreground">{c.evaluaciones} evaluaciones</p>
                </div>
                <BarraPromedio promedio={c.promedio} clasificacion={c.clasificacion} label={c.periodo} />
                <div className="flex flex-col gap-1">
                  <ClasificacionBadge clasificacion={c.clasificacion} />
                  <Variacion valor={c.variacion} />
                </div>
                <p className="text-sm text-muted-foreground lg:text-right">
                  {c.ranking === null ? "Sin lugar" : `Lugar ${c.ranking} de ${c.docentesConPromedio}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
