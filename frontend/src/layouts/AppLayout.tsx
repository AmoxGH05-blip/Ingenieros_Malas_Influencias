import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { NAV_BY_ROLE } from "@/layouts/nav-config";
import { EvaluacionesProvider } from "@/pages/estudiante/EvaluacionesProvider";
import { useAsignaciones } from "@/pages/estudiante/useAsignaciones";

const COLLAPSED_KEY = "dygsis.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Shell de las rutas protegidas: Sidebar + Topbar + contenido. Lee los pendientes del alumno para los contadores. */
function Shell({ rol }: { rol: string }) {
  const { logout } = useAuth();
  const { asignaciones } = useAsignaciones();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendientes = asignaciones?.filter((a) => !a.completada).length ?? 0;
  const badges: Record<string, number> = rol === "Estudiante" ? { "/estudiante/evaluaciones": pendientes } : {};

  function toggleCollapsed() {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, prev ? "0" : "1");
      } catch {
        /* sin storage: el estado solo dura la sesión */
      }
      return !prev;
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        groups={NAV_BY_ROLE[rol] ?? []}
        badges={badges}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} hasNotifications={pendientes > 0} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { usuario } = useAuth();
  const rol = usuario?.roles.find((r) => NAV_BY_ROLE[r]) ?? "";
  return (
    <EvaluacionesProvider enabled={rol === "Estudiante"}>
      <Shell rol={rol} />
    </EvaluacionesProvider>
  );
}
