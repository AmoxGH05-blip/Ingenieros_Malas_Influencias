import * as React from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { breadcrumbsFor } from "@/layouts/nav-config";

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

/** Barra superior: migas de pan, búsqueda rápida, notificaciones y perfil con cierre de sesión. */
export function Topbar({ onOpenMobileMenu }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const crumbs = breadcrumbsFor(pathname);
  const rol = usuario?.roles[0] ?? "";
  const inicial = (usuario?.correo ?? "?").charAt(0).toUpperCase();

  // La búsqueda rápida filtra el listado de docentes (solo existe para el rol Estudiante por ahora).
  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(`/estudiante/evaluaciones${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menú"
        className="rounded-md p-2 hover:bg-secondary lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <nav aria-label="Ruta actual" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {crumbs.map((crumb, index) => (
          <span key={`${crumb}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
            <span className={index === crumbs.length - 1 ? "font-semibold" : "text-muted-foreground"}>{crumb}</span>
          </span>
        ))}
      </nav>

      {rol === "Estudiante" && (
        <form onSubmit={handleSearch} role="search" className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar docente o materia…"
            aria-label="Buscar docente o materia"
            className="h-10 w-full rounded-lg border border-input bg-secondary/60 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      )}

      <div className={rol === "Estudiante" ? "flex items-center gap-2" : "ml-auto flex items-center gap-2"}>
        <button
          type="button"
          aria-label="Notificaciones"
          title="Notificaciones (próximamente)"
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Bell className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
            {inicial}
          </span>
          <div className="hidden min-w-0 leading-tight md:block">
            <p className="max-w-[180px] truncate text-sm font-medium">{usuario?.correo}</p>
            <p className="text-xs text-muted-foreground">{rol}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} aria-label="Cerrar sesión">
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
