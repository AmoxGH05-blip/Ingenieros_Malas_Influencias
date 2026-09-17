import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
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
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un enlace a tu correo institucional</CardDescription>
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
            {mensaje && <p className="text-sm text-foreground">{mensaje}</p>}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
            <Link to="/login" className="text-center text-sm text-muted-foreground hover:underline">
              Volver a iniciar sesión
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
