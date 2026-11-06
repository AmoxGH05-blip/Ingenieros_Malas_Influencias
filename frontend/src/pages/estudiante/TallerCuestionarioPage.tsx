import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreguntasCuestionario } from "@/components/cuestionario/PreguntasCuestionario";
import { totalPreguntas } from "@/lib/cuestionario";
import type { Instrumento, Respuestas } from "@/lib/evaluaciones-api";
import { enviarEvaluacionTaller, getInstrumentoTalleres, getTalleresDelAlumno, type TallerDelAlumno } from "@/lib/talleres-api";

/** Cuestionario de evaluación de un taller o laboratorio (RF08): mismo formato y escala que el de docentes. */
export function TallerCuestionarioPage() {
  const { tallerId } = useParams();
  const navigate = useNavigate();
  const id = Number(tallerId);

  const [taller, setTaller] = useState<TallerDelAlumno | null | undefined>(undefined); // undefined = cargando
  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.all([getTalleresDelAlumno(), getInstrumentoTalleres()])
      .then(([lista, instrumentoActivo]) => {
        if (!vigente) return;
        setTaller(lista.talleres.find((t) => t.id === id) ?? null);
        setInstrumento(instrumentoActivo);
      })
      .catch(() => vigente && setError("No se pudo cargar el cuestionario."));
    return () => {
      vigente = false;
    };
  }, [id]);

  if (taller === null || (taller && taller.completada)) return <Navigate to="/estudiante/talleres" replace />;
  if (!taller || !instrumento) {
    return error ? (
      <div role="alert" className="mx-auto max-w-3xl space-y-3 text-sm text-destructive">
        <p>{error}</p>
        <Link to="/estudiante/talleres" className="inline-flex items-center gap-1.5 text-muted-foreground underline hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Volver a talleres
        </Link>
      </div>
    ) : (
      <div role="status" aria-busy className="mx-auto h-96 max-w-3xl animate-pulse rounded-lg bg-card">
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  const total = totalPreguntas(instrumento);
  const completo = total > 0 && Object.keys(respuestas).length === total;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!taller || !completo) return;
    setError(null);
    setEnviando(true);
    try {
      await enviarEvaluacionTaller(taller.id, respuestas);
      navigate("/estudiante/talleres", { replace: true, state: { evaluado: taller.nombre } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la evaluación.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-8">
      <Link to="/estudiante/talleres" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Volver a talleres
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{taller.nombre}</h1>
        <p className="text-sm text-muted-foreground">{taller.tipo} · {instrumento.nombre} · los resultados se muestran agrupados, sin tu nombre</p>
      </div>

      <PreguntasCuestionario instrumento={instrumento} respuestas={respuestas} onResponder={(preguntaId, valor) => setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }))} />

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {!completo && <span className="text-sm text-muted-foreground">Responde las {total} preguntas para enviar.</span>}
        <Button type="submit" size="lg" disabled={!completo || enviando}>
          <Send className="size-4" aria-hidden /> {enviando ? "Enviando..." : "Enviar evaluación"}
        </Button>
      </div>
    </form>
  );
}
