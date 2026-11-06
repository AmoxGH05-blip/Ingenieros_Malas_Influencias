import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Variacion } from "@/components/indicadores/Variacion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatoPromedio, hastaCicloActual, type Ciclo } from "@/lib/indicadores-api";

const CICLOS_COMPARADOS = 3;

/** Promedio de los promedios de los ciclos dados que sí tuvieron respuestas; null si ninguno. */
function promedioDe(ciclos: Ciclo[]): number | null {
  const conPromedio = ciclos.filter((c) => c.promedio !== null);
  if (conPromedio.length === 0) return null;
  return Math.round((conPromedio.reduce((suma, c) => suma + (c.promedio as number), 0) / conPromedio.length) * 100) / 100;
}

/** Ciclo actual contra el anterior y contra los últimos 3 ciclos (incluido el actual). */
export function ComparativoDocente({ ciclos }: { ciclos: Ciclo[] }) {
  const hastaActual = hastaCicloActual(ciclos);
  const actual = hastaActual.at(-1) ?? null;
  // La variación se calcula contra el último ciclo previo que tuvo promedio: esa es la tarjeta "anterior".
  const anterior = hastaActual.slice(0, -1).findLast((c) => c.promedio !== null) ?? null;
  const ultimos = hastaActual.slice(-CICLOS_COMPARADOS);
  const promedioUltimos = promedioDe(ultimos);

  if (!actual) {
    return <Card className="p-6 text-sm text-muted-foreground">Todavía no hay ciclos para comparar.</Card>;
  }

  return (
    <section aria-label="Comparativo histórico" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ciclo actual</p>
          <p className="text-3xl font-semibold tabular-nums">{formatoPromedio(actual.promedio)}</p>
          <p className="break-words text-sm text-muted-foreground">{actual.periodo}</p>
          <ClasificacionBadge clasificacion={actual.clasificacion} />
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ciclo anterior</p>
          <p className="text-3xl font-semibold tabular-nums">{formatoPromedio(anterior?.promedio ?? null)}</p>
          <p className="break-words text-sm text-muted-foreground">{anterior ? anterior.periodo : "No hay un ciclo anterior con promedio"}</p>
          {anterior ? <ClasificacionBadge clasificacion={anterior.clasificacion} /> : null}
          <Variacion valor={actual.variacion} sinDato={actual.promedio === null ? "Aún sin promedio este ciclo" : undefined} />
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Promedio de los últimos {ultimos.length} ciclos
          </p>
          <p className="text-3xl font-semibold tabular-nums">{formatoPromedio(promedioUltimos)}</p>
          <p className="text-sm text-muted-foreground">Cada ciclo cuenta una vez, sin importar cuántas respuestas tuvo.</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos {ultimos.length} ciclos</CardTitle>
          <CardDescription>Lado a lado, del más antiguo al actual.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de los últimos ciclos">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Ciclo</th>
                <th scope="col" className="py-2 pr-4 font-medium">Promedio</th>
                <th scope="col" className="py-2 pr-4 font-medium">Categoría</th>
                <th scope="col" className="py-2 pr-4 font-medium">Lugar</th>
                <th scope="col" className="py-2 font-medium">Evaluaciones</th>
              </tr>
            </thead>
            <tbody>
              {ultimos.map((c) => (
                <tr key={c.periodoId} className="border-b border-border last:border-0">
                  <th scope="row" className="py-3 pr-4 text-left font-medium">{c.periodo}</th>
                  <td className="py-3 pr-4 tabular-nums">{formatoPromedio(c.promedio)}</td>
                  <td className="py-3 pr-4"><ClasificacionBadge clasificacion={c.clasificacion} /></td>
                  <td className="py-3 pr-4">{c.ranking === null ? "—" : `${c.ranking} de ${c.docentesConPromedio}`}</td>
                  <td className="py-3 tabular-nums">{c.evaluaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
