import * as React from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { cambiarPassword } from "@/lib/auth-api";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

/** Cambio obligatorio del primer acceso: la contraseña temporal la puso otra persona. */
export function CambiarPasswordPage() {
  const { token, usuario, actualizarSesion, logout } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!token || !usuario) return <Navigate to="/login" replace />;
  if (!usuario.debeCambiarPassword) return <Navigate to="/" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (nueva !== confirmacion) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    setEnviando(true);
    try {
      actualizarSesion(await cambiarPassword(actual, nueva));
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña");
      setEnviando(false);
    }
  }

  return (
    <AuthShell>
      <Card className="w-full border-0 bg-transparent text-sidebar-foreground shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl uppercase tracking-wide">Elige tu contraseña</CardTitle>
          <CardDescription className="text-sidebar-muted">
            Cuenta {usuario.numeroCuenta}. La contraseña con la que entraste es temporal: cámbiala para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="passwordActual">Contraseña temporal</Label>
              <Input
                id="passwordActual"
                type="password"
                autoComplete="current-password"
                required
                value={actual}
                onChange={(e) => setActual(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nuevaPassword">Contraseña nueva ({PASSWORD_MIN} a {PASSWORD_MAX} caracteres)</Label>
              <Input
                id="nuevaPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={PASSWORD_MIN}
                maxLength={PASSWORD_MAX}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmacion">Repite la contraseña nueva</Label>
              <Input
                id="confirmacion"
                type="password"
                autoComplete="new-password"
                required
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={enviando} className="bg-brand text-brand-foreground hover:opacity-90">
              {enviando ? "Guardando..." : "Guardar y entrar"}
            </Button>
            <button type="button" onClick={logout} className="text-center text-sm text-sidebar-muted hover:text-sidebar-foreground hover:underline">
              Salir
            </button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
