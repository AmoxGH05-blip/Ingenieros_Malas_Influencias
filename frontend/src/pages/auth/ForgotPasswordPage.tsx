import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordPage() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMensaje(null);
    setIsSubmitting(true);
    try {
      const respuesta = await forgotPassword(correo);
      setMensaje(respuesta.mensaje);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <Card className="w-full border-0 bg-transparent text-sidebar-foreground shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-wide">Recuperar contraseña</CardTitle>
          <CardDescription className="text-sidebar-muted">Te enviaremos un enlace a tu correo institucional</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                required
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
              />
            </div>
            {mensaje && <p className="text-sm text-sidebar-foreground">{mensaje}</p>}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="bg-brand text-brand-foreground hover:opacity-90">
              {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
            <Link to="/login" className="text-center text-sm text-sidebar-muted hover:text-sidebar-foreground hover:underline">
              Volver a iniciar sesión
            </Link>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
