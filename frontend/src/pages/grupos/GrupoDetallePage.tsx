import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { estaLleno, getGrupo, inscribirAlumno, type GrupoDetalle } from "@/lib/grupos-api";

/** Detalle de un grupo: alumnos inscritos y alta de inscripciones por número de cuenta (SCRUM-79). */
export function GrupoDetallePage() {
  const { id } = useParams();
  const grupoId = Number(id);
  const [grupo, setGrupo] = useState<GrupoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numero, setNumero] = useState("");
  const [errorInscripcion, setErrorInscripcion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setGrupo(await getGrupo(grupoId));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "Ese grupo no existe." : "No se pudo cargar el grupo.");
    }
  }, [grupoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function handleInscribir(event: React.FormEvent) {
    event.preventDefault();
    setErrorInscripcion(null);
    setAviso(null);
    setEnviando(true);
    try {
      const resultado = await inscribirAlumno(grupoId, numero.trim());
      setAviso(`Se inscribió a ${resultado.nombre} (${resultado.numeroCuenta}).`);
      setNumero("");
      await cargar();
    } catch (err) {
      setErrorInscripcion(err instanceof ApiError ? err.message : "No se pudo inscribir al alumno");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/coordinador/grupos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Volver a grupos
      </Link>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!grupo && !error && <div aria-busy className="h-40 animate-pulse rounded-xl bg-card" />}

      {grupo && (
        <>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {grupo.materia} · {grupo.seccion}
            </h1>
            <p className="text-sm text-muted-foreground">
              {grupo.claveMateria} · {grupo.docente} · {grupo.periodo}
            </p>
            <Badge variant={estaLleno(grupo) ? "warning" : "neutral"}>
              {grupo.cupoMaximo > 0 ? `${grupo.inscritos} de ${grupo.cupoMaximo} lugares` : `${grupo.inscritos} inscritos (sin límite)`}
              {estaLleno(grupo) ? " · lleno" : ""}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inscribir alumno</CardTitle>
              <CardDescription>Escribe el número de cuenta (matrícula) de un alumno que ya tenga cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleInscribir} className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-60 flex-1 flex-col gap-2">
                  <Label htmlFor="inscribir-cuenta">Número de cuenta</Label>
                  <Input
                    id="inscribir-cuenta"
                    required
                    maxLength={20}
                    pattern="[A-Za-z0-9]+"
                    title="Solo letras y números, sin espacios"
                    autoComplete="off"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={enviando || estaLleno(grupo)} className="bg-brand text-brand-foreground hover:opacity-90">
                  <UserPlus className="size-4" aria-hidden /> {enviando ? "Inscribiendo..." : "Inscribir"}
                </Button>
              </form>
              {estaLleno(grupo) && <p className="text-sm text-muted-foreground">El grupo está lleno.</p>}
              {errorInscripcion && (
                <p role="alert" className="text-sm text-destructive">
                  {errorInscripcion}
                </p>
              )}
              {aviso && (
                <p role="status" className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-success" aria-hidden /> {aviso}
                </p>
              )}
            </CardContent>
          </Card>

          <section aria-label="Alumnos inscritos" className="space-y-3">
            <h2 className="text-lg font-semibold">Alumnos inscritos ({grupo.alumnos.length})</h2>
            <ul className="space-y-2">
              {grupo.alumnos.map((a) => (
                <li key={a.estudianteId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">{a.numeroCuenta}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Inscrito el {a.fechaInscripcion}</span>
                </li>
              ))}
              {grupo.alumnos.length === 0 && (
                <li className="rounded-xl border border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">Aún no hay alumnos en este grupo.</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
