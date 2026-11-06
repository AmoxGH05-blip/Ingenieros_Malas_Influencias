import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { totalPreguntas } from "@/lib/cuestionario";
import type { Instrumento, Respuestas } from "@/lib/evaluaciones-api";

interface Props {
  instrumento: Instrumento;
  respuestas: Respuestas;
  onResponder: (preguntaId: number, valor: number) => void;
}

/**
 * Barra de avance y secciones con sus preguntas, cada una con la escala del instrumento (0 / 2.5 / 5 / 7.5 / 10).
 * La comparten el cuestionario de docentes y el de talleres.
 */
export function PreguntasCuestionario({ instrumento, respuestas, onResponder }: Props) {
  const total = totalPreguntas(instrumento);
  const respondidas = Object.keys(respuestas).length;

  return (
    <>
      {/* Barra de avance pegada arriba mientras se responde */}
      <div className="sticky top-[72px] z-10 -mx-1 rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Respondidas</span>
          <span>{respondidas} de {total}</span>
        </div>
        <Progress value={total === 0 ? 0 : (respondidas / total) * 100} label="Preguntas respondidas" />
      </div>

      {instrumento.secciones.map((seccion, indice) => (
        <Card key={seccion.id}>
          <CardHeader>
            <CardTitle>{indice + 1}. {seccion.nombre}</CardTitle>
            <CardDescription>{seccion.preguntas.length} preguntas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {seccion.preguntas.map((pregunta) => (
              <fieldset key={pregunta.id} className="space-y-3">
                <legend className="text-sm font-medium">{pregunta.texto}</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {instrumento.escala.map((opcion) => (
                    <label key={opcion.valor} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={opcion.valor}
                        checked={respuestas[pregunta.id] === opcion.valor}
                        onChange={() => onResponder(pregunta.id, opcion.valor)}
                        className="peer sr-only"
                      />
                      <span className="flex h-full flex-col items-center justify-center gap-0.5 rounded-lg border border-input px-2 py-2 text-center text-xs transition-colors hover:bg-secondary peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                        <span className="text-sm font-semibold">{opcion.valor}</span>
                        <span className="leading-tight opacity-80">{opcion.texto}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
