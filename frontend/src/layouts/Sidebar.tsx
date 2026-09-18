import { NavLink } from "react-router-dom";
import { GraduationCap, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/layouts/nav-config";

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

/**
 * Barra lateral oscura. En escritorio es fija y colapsable (solo iconos);
 * en pantallas pequeñas se comporta como un drawer que abre el Topbar.
 */
export function Sidebar({ items, collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[72px]"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className={cn("truncate font-semibold tracking-tight", collapsed && "lg:hidden")}>DYGSIS</span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Principal" className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className={cn("px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted", collapsed && "lg:hidden")}>
            Menú
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                {item.soon && (
                  <span className={cn("ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px]", collapsed && "lg:hidden")}>
                    Pronto
                  </span>
                )}
              </>
            );
            const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

            if (item.soon) {
              return (
                <span
                  key={item.to}
                  aria-disabled
                  title={collapsed ? `${item.label} (próximamente)` : undefined}
                  className={cn(base, "cursor-not-allowed text-sidebar-muted/60")}
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
                    base,
                    isActive
                      ? "bg-brand text-brand-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )
                }
              >
                {content}
              </NavLink>
            );
          })}
        </nav>

        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-5 shrink-0" /> : <PanelLeftClose className="size-5 shrink-0" />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
