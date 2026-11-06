import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarraPromedio } from "@/components/indicadores/BarraPromedio";
import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatoPorcentaje, type CarreraEstadistica } from "@/lib/estadisticas-api";

/** Concentrado por carrera: gráfica de participación y avance, y la tabla con el promedio de cada una. */
export function ConcentradoCarreras({ carreras }: { carreras: CarreraEstadistica[] }) {
  const conAlumnos = carreras.filter((c) => c.alumnos > 0);
  const datos = conAlumnos.map((c) => ({ carrera: c.nombre, participacion: c.participacionAlumnos ?? 0, avance: c.avanceEvaluaciones ?? 0 }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Concentrado por carrera</CardTitle>
        <CardDescription>
          Participación y avance por la carrera del alumno; el promedio es el de las respuestas sobre las materias de la carrera.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {datos.length > 0 && (
          <div aria-hidden className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="carrera" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(c: string) => (c.length > 18 ? `${c.slice(0, 17)}…` : c)} />
                <YAxis domain={[0, 100]} unit=" %" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(valor) => `${valor} %`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="participacion" name="Alumnos que participaron" fill="var(--brand)" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={72} />
                <Bar dataKey="avance" name="Evaluaciones enviadas" fill="var(--success)" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={72} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla del concentrado por carrera">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Carrera</th>
                <th scope="col" className="py-2 pr-4 font-medium">Alumnos</th>
                <th scope="col" className="py-2 pr-4 font-medium">Alumnos que participaron</th>
                <th scope="col" className="py-2 pr-4 font-medium">Evaluaciones enviadas</th>
                <th scope="col" className="w-56 py-2 font-medium">Promedio</th>
              </tr>
            </thead>
            <tbody>
              {carreras.map((c) => (
                <tr key={c.programaEducativoId} className="border-b border-border last:border-0">
                  <th scope="row" className="py-3 pr-4 text-left font-medium">{c.nombre}</th>
                  <td className="py-3 pr-4 tabular-nums">{c.alumnos}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatoPorcentaje(c.participacionAlumnos)}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {c.completadas} de {c.inscripciones} <span className="text-muted-foreground">({formatoPorcentaje(c.avanceEvaluaciones)})</span>
                  </td>
                  <td className="space-y-1.5 py-3">
                    <BarraPromedio promedio={c.promedio} clasificacion={c.clasificacion} label={c.nombre} />
                    <ClasificacionBadge clasificacion={c.clasificacion} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
