import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatoPorcentaje, type CicloTendencia } from "@/lib/estadisticas-api";
import { formatoPromedio } from "@/lib/indicadores-api";

/** "Evaluacion Docente 2026-2027-1" -> "2026-2027-1": el prefijo repetido no cabe en el eje. */
const nombreCorto = (nombre: string): string => nombre.replace(/^(DEMO\s+)?Evaluaci[oó]n Docente\s+/i, "");

/** Promedio institucional de los últimos ciclos (de 0 a 10). La tabla de abajo repite las cifras para quien no ve la gráfica. */
export function GraficaTendencia({ tendencia }: { tendencia: CicloTendencia[] }) {
  const datos = tendencia.map((t) => ({ ciclo: nombreCorto(t.nombre), promedio: t.promedioInstitucional }));
  const conPromedio = tendencia.filter((t) => t.promedioInstitucional !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promedio institucional por ciclo</CardTitle>
        <CardDescription>Promedio de los promedios de cada docente, de 0 a 10, en los últimos ciclos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conPromedio.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay ciclos con evaluaciones para comparar.</p>
        ) : (
          <div aria-hidden className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="ciclo" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" minTickGap={12} padding={{ left: 24, right: 24 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(valor) => [formatoPromedio(Number(valor)), "Promedio"]} />
                <Line type="monotone" dataKey="promedio" stroke="var(--brand)" strokeWidth={3} dot={{ r: 4, fill: "var(--brand)" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla del promedio institucional por ciclo">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Ciclo</th>
                <th scope="col" className="py-2 pr-4 font-medium">Promedio</th>
                <th scope="col" className="py-2 pr-4 font-medium">Docentes</th>
                <th scope="col" className="py-2 font-medium">Evaluaciones enviadas</th>
              </tr>
            </thead>
            <tbody>
              {tendencia.map((t) => (
                <tr key={t.periodoId} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-medium">{t.nombre}</th>
                  <td className="py-2 pr-4 tabular-nums">{formatoPromedio(t.promedioInstitucional)}</td>
                  <td className="py-2 pr-4 tabular-nums">{t.docentesConPromedio}</td>
                  <td className="py-2 tabular-nums">{formatoPorcentaje(t.avanceEvaluaciones)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
