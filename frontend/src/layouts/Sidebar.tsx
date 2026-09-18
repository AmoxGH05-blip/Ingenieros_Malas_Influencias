import { NavLink } from "react-router-dom";
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/layouts/nav-config";
import iconoBlanco from "@/assets/branding/dygsis-icono-blanco.png";

interface SidebarProps {
  groups: NavGroup[];
  /** Contador rojo por ruta (p. ej. evaluaciones pendientes). */
  badges: Record<string, number>;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const ITEM_BASE = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors";

/**
 * Barra lateral verde-pizarra con secciones. En escritorio es fija y colapsable (solo iconos);
 * en pantallas pequeñas es un drawer que abre el Topbar.
 */
export function Sidebar({ groups, badges, collapsed, mobileOpen, onToggleCollapsed, onCloseMobile, onLogout }: SidebarProps) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[76px]"
        )}
      >
        <div className={cn("flex h-[72px] items-center gap-3 px-4", collapsed && "lg:justify-center lg:px-0")}>
          <img src={iconoBlanco} alt="" className="size-10 shrink-0 object-contain" />
          <span className={cn("truncate text-lg font-semibold tracking-tight", collapsed && "lg:hidden")}>DYGSIS</span>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className={cn(
              "ml-auto hidden size-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground lg:flex",
              collapsed && "lg:hidden"
            )}
          >
            <PanelLeftClose className="size-4" />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expandir barra lateral"
            className="mx-auto mb-2 hidden size-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-muted hover:text-sidebar-foreground lg:flex"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        )}

        <nav aria-label="Principal" className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p
                className={cn(
                  "flex items-center gap-2 px-3 pb-1 text-xs font-medium uppercase tracking-wider text-sidebar-muted",
                  collapsed && "lg:hidden"
                )}
              >
                <ChevronDown className="size-3.5" aria-hidden />
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const badge = badges[item.to];
                const content = (
                  <>
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                    {item.soon && (
                      <span className={cn("ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px]", collapsed && "lg:hidden")}>
                        Pronto
                      </span>
                    )}
                    {badge ? (
                      <span
                        className={cn(
                          "ml-auto flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-5 text-destructive-foreground",
                          collapsed && "lg:absolute lg:right-1 lg:top-0.5 lg:min-w-4 lg:px-1 lg:text-[10px] lg:leading-4"
                        )}
                        aria-label={`${badge} pendientes`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </>
                );

                if (item.soon) {
                  return (
                    <span
                      key={item.to}
                      aria-disabled
                      title={collapsed ? `${item.label} (próximamente)` : undefined}
                      className={cn(ITEM_BASE, "cursor-not-allowed text-sidebar-muted/50", collapsed && "lg:justify-center")}
                    >
                      {content}
                    </span>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        ITEM_BASE,
                        "relative",
                        collapsed && "lg:justify-center",
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )
                    }
                  >
                    {content}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className={cn("px-3 pb-1 pt-1 text-xs font-medium uppercase tracking-wider text-sidebar-muted", collapsed && "lg:hidden")}>
            Cuenta
          </p>
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(ITEM_BASE, "w-full text-sidebar-foreground/90 hover:bg-sidebar-accent", collapsed && "lg:justify-center")}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className={cn(collapsed && "lg:hidden")}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
