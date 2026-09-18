import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { NAV_BY_ROLE } from "@/layouts/nav-config";

const COLLAPSED_KEY = "dygsis.sidebar.collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Shell de las rutas protegidas: Sidebar + Topbar + contenido de la página. */
export function AppLayout() {
  const { usuario } = useAuth();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const rol = usuario?.roles.find((r) => NAV_BY_ROLE[r]) ?? "";
  const items = NAV_BY_ROLE[rol] ?? [];

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
    <div className="flex min-h-screen bg-secondary/40">
      <Sidebar
        items={items}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
