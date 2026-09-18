import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, CircleHelp, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { breadcrumbsFor } from "@/layouts/nav-config";

interface TopbarProps {
  onOpenMobileMenu: () => void;
  /** Hay evaluaciones pendientes: enciende el punto rojo de la campana. */
  hasNotifications: boolean;
}

const ICON_BUTTON = "flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary";

/** Barra superior: título de la página, búsqueda, ayuda, notificaciones y menú del perfil. */
export function Topbar({ onOpenMobileMenu, hasNotifications }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const crumbs = breadcrumbsFor(pathname);
  const titulo = crumbs[crumbs.length - 1];
  const rol = usuario?.roles[0] ?? "";
  const inicial = (usuario?.correo ?? "?").charAt(0).toUpperCase();

  // Cierra el menú del perfil al hacer clic fuera o presionar Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // La búsqueda rápida filtra el listado de docentes (solo existe para el rol Estudiante por ahora).
  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(`/estudiante/evaluaciones${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      <button type="button" onClick={onOpenMobileMenu} aria-label="Abrir menú" className={`${ICON_BUTTON} lg:hidden`}>
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        {crumbs.length > 2 && <p className="hidden truncate text-xs text-muted-foreground sm:block">{crumbs.slice(0, -1).join(" / ")}</p>}
        <h1 className="truncate text-xl font-semibold tracking-tight">{titulo}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {rol === "Estudiante" &&
          (searchOpen ? (
            <form onSubmit={handleSearch} role="search" className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)}
                placeholder="Docente o materia…"
                aria-label="Buscar docente o materia"
                className="h-10 w-40 rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
              />
            </form>
          ) : (
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Buscar" className={ICON_BUTTON}>
              <Search className="size-5" />
            </button>
          ))}

        <button type="button" aria-label="Ayuda" title="Ayuda (próximamente)" className={`${ICON_BUTTON} hidden sm:flex`}>
          <CircleHelp className="size-5" />
        </button>
        <button type="button" aria-label="Notificaciones" title="Notificaciones (próximamente)" className={`${ICON_BUTTON} relative`}>
          <Bell className="size-5" />
          {hasNotifications && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive ring-2 ring-card" aria-hidden />}
        </button>

        <div ref={menuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-secondary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
              {inicial}
            </span>
            <span className="hidden min-w-0 text-left leading-tight md:block">
              <span className="block max-w-[170px] truncate text-sm font-semibold">{usuario?.correo}</span>
              <span className="block text-xs text-muted-foreground">{rol}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground md:block" aria-hidden />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
              >
                <LogOut className="size-4" aria-hidden /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
