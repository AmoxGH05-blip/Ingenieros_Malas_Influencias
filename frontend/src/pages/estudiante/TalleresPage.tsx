import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, FlaskConical, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTalleresDelAlumno, type TalleresDelAlumno } from "@/lib/talleres-api";

/** Talleres y laboratorios de la carrera del alumno que puede evaluar en el ciclo activo (RF08). */
export function TalleresPage() {
  const [datos, setDatos] = useState<TalleresDelAlumno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const evaluado = (useLocation().state as { evaluado?: string } | null)?.evaluado;

  useEffect(() => {
    let vigente = true;
    getTalleresDelAlumno()
      .then((respuesta) => vigente && setDatos(respuesta))
      .catch(() => vigente && setError("No se pudieron cargar los talleres."));
    return () => {
      vigente = false;
    };
  }, []);

  const pendientes = datos?.talleres.filter((t) => !t.completada).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Talleres y laboratorios</h1>
        <p className="text-sm text-muted-foreground">
          {datos?.periodo ? `${datos.periodo.nombre} · ${pendientes === 0 ? "sin evaluaciones pendientes" : `${pendientes} por evaluar`}` : "Evalúa los talleres y laboratorios de tu carrera."}
        </p>
      </div>

      {evaluado && (
        <p role="status" className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Tu evaluación de <strong>{evaluado}</strong> se registró correctamente. ¡Gracias!
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!datos && !error && <div role="status" aria-busy className="h-48 animate-pulse rounded-xl bg-card"><span className="sr-only">Cargando…</span></div>}

      {datos && !datos.habilitado && (
        <Card className="p-6 text-sm text-muted-foreground">La evaluación de talleres y laboratorios no está habilitada para tu carrera.</Card>
      )}
      {datos?.habilitado && !datos.periodo && (
        <Card className="p-6 text-sm text-muted-foreground">No hay un ciclo de evaluación activo. Cuando abra, aquí aparecerán los talleres por evaluar.</Card>
      )}
      {datos?.habilitado && datos.periodo && datos.talleres.length === 0 && (
        <Card className="p-6 text-sm text-muted-foreground">Tu carrera todavía no tiene talleres ni laboratorios registrados.</Card>
      )}

      {datos && datos.talleres.length > 0 && (
        <ul className="space-y-3">
          {datos.talleres.map((taller) => {
            const Icono = taller.tipo === "Laboratorio" ? FlaskConical : Wrench;
            return (
              <li key={taller.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Icono className="size-5 text-foreground/70" aria-hidden />
                    <div>
                      <p className="font-medium">{taller.nombre}</p>
                      <p className="text-xs text-muted-foreground">{taller.tipo}</p>
                    </div>
                  </div>
                  {taller.completada ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Evaluado{taller.fechaEvaluacion ? ` el ${taller.fechaEvaluacion}` : ""}
                    </Badge>
                  ) : (
                    <Button asChild size="sm">
                      <Link to={`/estudiante/talleres/${taller.id}/evaluar`}>Evaluar</Link>
                    </Button>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
