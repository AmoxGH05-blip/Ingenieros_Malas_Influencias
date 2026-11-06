import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { solicitarCambioPassword } from "@/lib/solicitudes-password-api";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MIN_CARACTERES = 8;

/** Pantalla pública: quien olvidó su contraseña escribe la nueva y queda pendiente de aprobación (SCRUM-80). */
export function SolicitarCambioPasswordPage() {
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviada, setEnviada] = useState<{ mensaje: string; codigo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (nuevaPassword !== confirmacion) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setIsSubmitting(true);
    try {
      setEnviada(await solicitarCambioPassword(numeroCuenta.trim(), nuevaPassword));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <Card className="w-full border-0 bg-transparent text-sidebar-foreground shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-wide">Cambiar contraseña</CardTitle>
          <CardDescription className="text-sidebar-muted">
            Escribe la contraseña nueva. No se aplica hasta que Coordinación la apruebe; mientras tanto sigue valiendo la actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviada ? (
            <div role="status" className="flex flex-col gap-4">
              <p className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <span>{enviada.mensaje}</span>
              </p>
              <div className="rounded-lg border border-brand/60 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-sidebar-muted">Tu código de verificación</p>
                <p aria-label={`Código de verificación: ${enviada.codigo.split("").join(" ")}`} className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-brand">
                  {enviada.codigo}
                </p>
              </div>
              <p className="text-sm text-sidebar-muted">
                Anótalo: <strong>solo se muestra ahora</strong>. Díselo a Coordinación cuando confirmen que eres tú; sin el código no pueden aprobar tu solicitud. Si lo
                pierdes, envía otra solicitud.
              </p>
              <Link to="/login" className="text-center text-sm text-sidebar-muted hover:text-sidebar-foreground hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="numeroCuenta">Número de cuenta</Label>
                <Input
                  id="numeroCuenta"
                  name="numeroCuenta"
                  autoComplete="username"
                  required
                  maxLength={20}
                  pattern="[A-Za-z0-9]+"
                  title="Solo letras y números, sin espacios"
                  value={numeroCuenta}
                  onChange={(event) => setNumeroCuenta(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nuevaPassword">Contraseña nueva</Label>
                <Input
                  id="nuevaPassword"
                  name="nuevaPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_CARACTERES}
                  value={nuevaPassword}
                  onChange={(event) => setNuevaPassword(event.target.value)}
                />
                <p className="text-xs text-sidebar-muted">Al menos {MIN_CARACTERES} caracteres.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmacion">Repite la contraseña nueva</Label>
                <Input
                  id="confirmacion"
                  name="confirmacion"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting} className="bg-brand text-brand-foreground hover:opacity-90">
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
              <Link to="/login" className="text-center text-sm text-sidebar-muted hover:text-sidebar-foreground hover:underline">
                Volver a iniciar sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
