import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";
import {
  enviarEvaluacion,
  getAsignacion,
  getInstrumento,
  type Asignacion,
  type Instrumento,
  type Respuestas,
} from "@/lib/evaluaciones-api";

/** SCRUM-35: cuestionario de evaluación docente (escala 0 / 2.5 / 5 / 7.5 / 10). */
export function CuestionarioPage() {
  const { asignacionId } = useParams();
  const navigate = useNavigate();
  const id = Number(asignacionId);
  const { refresh } = useAsignaciones();

  const [asignacion, setAsignacion] = useState<Asignacion | null | undefined>(undefined); // undefined = cargando
  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([getAsignacion(id), getInstrumento()])
      .then(([a, i]) => {
        if (!activo) return;
        setAsignacion(a ?? null);
        setInstrumento(i);
      })
      .catch(() => activo && setError("No se pudo cargar el cuestionario."));
    return () => {
      activo = false;
    };
  }, [id]);

  if (asignacion === null || (asignacion && asignacion.completada)) {
    return <Navigate to="/estudiante/evaluaciones" replace />;
  }
  if (!asignacion || !instrumento) {
    return error ? (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    ) : (
      <div aria-busy className="mx-auto h-96 max-w-3xl animate-pulse rounded-lg bg-card" />
    );
  }

  const totalPreguntas = instrumento.secciones.reduce((n, s) => n + s.preguntas.length, 0);
  const respondidas = Object.keys(respuestas).length;
  const completo = respondidas === totalPreguntas;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!asignacion || !completo) return;
    setError(null);
    setEnviando(true);
    try {
      await enviarEvaluacion(asignacion.id, respuestas);
      await refresh();
      navigate("/estudiante", { replace: true, state: { evaluado: asignacion.docente } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la evaluación.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-8">
      <Link to="/estudiante" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Volver al dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{asignacion.docente}</h1>
        <p className="text-sm text-muted-foreground">
          {asignacion.materia} · Grupo {asignacion.grupo} · {instrumento.nombre}
        </p>
      </div>

      {/* Barra de avance pegada arriba mientras se responde */}
      <div className="sticky top-[72px] z-10 -mx-1 rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Respondidas</span>
          <span>{respondidas} de {totalPreguntas}</span>
        </div>
        <Progress value={(respondidas / totalPreguntas) * 100} label="Preguntas respondidas" />
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
                        onChange={() => setRespuestas((prev) => ({ ...prev, [pregunta.id]: opcion.valor }))}
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

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!completo && <span className="text-sm text-muted-foreground">Responde las {totalPreguntas} preguntas para enviar.</span>}
        <Button type="submit" size="lg" disabled={!completo || enviando}>
          <Send className="size-4" aria-hidden /> {enviando ? "Enviando..." : "Enviar evaluación"}
        </Button>
      </div>
    </form>
  );
}
