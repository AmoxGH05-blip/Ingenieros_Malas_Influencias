import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatoPorcentaje } from "@/lib/estadisticas-api";
import { formatoPromedio } from "@/lib/indicadores-api";
import type { ResultadosTalleres as Resultados } from "@/lib/talleres-api";

/** Resultados de talleres y laboratorios por carrera: evaluaciones, participación, promedio y promedio por criterio. */
export function ResultadosTalleres({ resultados }: { resultados: Resultados }) {
  const carreras = resultados.carreras.filter((c) => c.talleres.length > 0);

  if (carreras.length === 0) {
    return <Card className="p-6 text-sm text-muted-foreground">Todavía no hay talleres ni laboratorios con resultados en este ciclo.</Card>;
  }

  return (
    <div className="space-y-6">
      {carreras.map((carrera) => (
        <Card key={carrera.programaEducativoId}>
          <CardHeader>
            <CardTitle>{carrera.nombre}</CardTitle>
            <CardDescription>
              {carrera.alumnos} alumnos · la participación es el porcentaje de ellos que evaluó cada taller (se muestra junto con el promedio).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Resultados de talleres de ${carrera.nombre}`}>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">Taller o laboratorio</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Evaluaciones</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Participación</th>
                    <th scope="col" className="w-56 py-2 font-medium">Promedio (de 10)</th>
                  </tr>
                </thead>
                <tbody>
                  {carrera.talleres.map((taller) => (
                    <tr key={taller.id} className="border-b border-border align-top last:border-0">
                      <th scope="row" className="py-3 pr-4 text-left font-medium">
                        {taller.nombre}
                        <span className="block text-xs font-normal text-muted-foreground">{taller.tipo}{taller.activo ? "" : " · de baja"}</span>
                      </th>
                      <td className="py-3 pr-4 tabular-nums">{taller.respuestas ?? "—"}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatoPorcentaje(taller.participacion)}</td>
                      <td className="space-y-2 py-3">
                        {taller.promedio !== null ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div aria-hidden className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, taller.promedio * 10))}%` }} />
                              </div>
                              <span className="w-12 text-right text-sm font-semibold tabular-nums">{formatoPromedio(taller.promedio)}</span>
                            </div>
                            <ul className="space-y-0.5 text-xs text-muted-foreground">
                              {taller.criterios.map((criterio) => (
                                <li key={criterio.seccionId} className="flex justify-between gap-3">
                                  <span>{criterio.nombre}</span>
                                  <span className="tabular-nums">{formatoPromedio(criterio.promedio)}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {taller.ocultoPorPocasRespuestas
                              ? `Se muestra cuando haya al menos ${resultados.minimoRespuestas} evaluaciones y ${resultados.minimoRespuestas} alumnos en la carrera, para que no se pueda saber quién respondió.`
                              : "Sin evaluaciones"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
