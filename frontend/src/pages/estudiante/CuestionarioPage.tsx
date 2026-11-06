import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreguntasCuestionario } from "@/components/cuestionario/PreguntasCuestionario";
import { totalPreguntas } from "@/lib/cuestionario";
import { useNotificaciones } from "@/context/NotificacionesContext";
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
  const { refresh: refrescarAvisos } = useNotificaciones();

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

  const total = totalPreguntas(instrumento);
  const completo = Object.keys(respuestas).length === total;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!asignacion || !completo) return;
    setError(null);
    setEnviando(true);
    try {
      await enviarEvaluacion(asignacion.id, respuestas);
      // Tras enviar, el aviso de pendientes y el contador del menu deben bajar juntos.
      await Promise.all([refresh(), refrescarAvisos()]);
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

      <PreguntasCuestionario instrumento={instrumento} respuestas={respuestas} onResponder={(id, valor) => setRespuestas((prev) => ({ ...prev, [id]: valor }))} />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!completo && <span className="text-sm text-muted-foreground">Responde las {total} preguntas para enviar.</span>}
        <Button type="submit" size="lg" disabled={!completo || enviando}>
          <Send className="size-4" aria-hidden /> {enviando ? "Enviando..." : "Enviar evaluación"}
        </Button>
      </div>
    </form>
  );
}
