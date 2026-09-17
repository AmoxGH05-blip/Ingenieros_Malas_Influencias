import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold">DYGSIS · Evaluación Docente</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {usuario?.correo} · {usuario?.roles.join(", ")}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
