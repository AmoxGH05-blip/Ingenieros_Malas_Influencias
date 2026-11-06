import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Clasificacion } from "@/lib/indicadores-api";

const ORDEN: Clasificacion[] = ["Excelente", "Bueno", "Suficiente", "No suficiente"];
const COLOR: Record<Clasificacion, string> = {
  Excelente: "var(--success)",
  Bueno: "var(--brand)",
  Suficiente: "var(--warning)",
  "No suficiente": "var(--destructive)",
};

/** Cuántos docentes hay en cada categoría: dona más la lista con cifras (la lista es la versión accesible de la gráfica). */
export function GraficaDistribucion({ distribucion }: { distribucion: Record<Clasificacion, number> }) {
  const total = ORDEN.reduce((suma, c) => suma + distribucion[c], 0);
  const datos = ORDEN.map((c) => ({ nombre: c, valor: distribucion[c] })).filter((d) => d.valor > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Docentes por categoría</CardTitle>
        <CardDescription>Promedio de cada docente en el ciclo, clasificado de Excelente a No suficiente.</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay docentes con promedio en este ciclo.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div aria-hidden className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius="58%" outerRadius="95%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {datos.map((d) => (
                      <Cell key={d.nombre} fill={COLOR[d.nombre as Clasificacion]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(valor, nombre) => [`${valor} docentes`, nombre]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-48 flex-1 space-y-2">
              {ORDEN.map((c) => (
                <li key={c} className="flex items-center justify-between gap-3 text-sm">
                  <ClasificacionBadge clasificacion={c} />
                  <span className="tabular-nums">
                    <strong>{distribucion[c]}</strong> <span className="text-muted-foreground">de {total}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
