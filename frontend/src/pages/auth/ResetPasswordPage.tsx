import * as React from "react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/lib/auth-api";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
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
      await resetPassword(token, nuevaPassword);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo restablecer la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <Card className="w-full border-0 bg-transparent text-sidebar-foreground shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl uppercase tracking-wide">Enlace inválido</CardTitle>
            <CardDescription className="text-sidebar-muted">Falta el token de recuperación en la URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/forgot-password" className="text-sm text-sidebar-muted hover:text-sidebar-foreground hover:underline">
              Solicitar un nuevo enlace
            </Link>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="w-full border-0 bg-transparent text-sidebar-foreground shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-wide">Nueva contraseña</CardTitle>
          <CardDescription className="text-sidebar-muted">Elige una contraseña de al menos 8 caracteres</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nuevaPassword">Nueva contraseña</Label>
              <Input
                id="nuevaPassword"
                name="nuevaPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={nuevaPassword}
                onChange={(event) => setNuevaPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmacion">Confirmar contraseña</Label>
              <Input
                id="confirmacion"
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                minLength={8}
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
              {isSubmitting ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
