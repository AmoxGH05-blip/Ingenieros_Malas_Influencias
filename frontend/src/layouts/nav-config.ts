import { ClipboardCheck, History, LayoutDashboard, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Sin ruta construida todavía: se muestra deshabilitado. */
  soon?: boolean;
}

/** Navegación del sidebar por rol. Los demás roles crecen aquí conforme avancen los sprints. */
export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  Estudiante: [
    { label: "Dashboard", to: "/estudiante", icon: LayoutDashboard },
    { label: "Evaluaciones", to: "/estudiante/evaluaciones", icon: ClipboardCheck },
    { label: "Historial", to: "/estudiante/historial", icon: History, soon: true },
    { label: "Perfil", to: "/estudiante/perfil", icon: User, soon: true },
  ],
  Docente: [{ label: "Dashboard", to: "/docente", icon: LayoutDashboard }],
  Coordinador: [{ label: "Dashboard", to: "/coordinador", icon: LayoutDashboard }],
  Administrador: [{ label: "Dashboard", to: "/administrador", icon: LayoutDashboard }],
};

const CRUMB_LABELS: Record<string, string> = {
  estudiante: "Estudiante",
  docente: "Docente",
  coordinador: "Coordinador",
  administrador: "Administrador",
  evaluaciones: "Evaluaciones",
  evaluar: "Cuestionario",
};

/** Migas de pan a partir de la ruta; los segmentos numéricos (ids) se omiten. */
export function breadcrumbsFor(pathname: string): string[] {
  const crumbs = pathname
    .split("/")
    .filter((segment) => segment && !/^\d+$/.test(segment))
    .map((segment) => CRUMB_LABELS[segment] ?? segment);
  return crumbs.length > 1 ? crumbs : [...crumbs, "Dashboard"];
}
