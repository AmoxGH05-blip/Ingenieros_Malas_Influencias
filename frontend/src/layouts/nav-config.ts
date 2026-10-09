import { ClipboardCheck, History, LayoutDashboard, User, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Sin pantalla construida todavía: se muestra deshabilitado. */
  soon?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Inicio de cada rol, y orden de prioridad cuando una cuenta tiene varios. */
export const ROLE_HOME: Record<string, string> = {
  Administrador: "/administrador",
  Coordinador: "/coordinador",
  Docente: "/docente",
  Estudiante: "/estudiante",
};

export const ROL_PRIORIDAD = Object.keys(ROLE_HOME);

/** Rol activo: el de la ruta actual si la cuenta lo tiene; si no, el de mayor prioridad. */
export function rolActivo(roles: string[], pathname: string): string {
  const porRuta = ROL_PRIORIDAD.find((rol) => roles.includes(rol) && pathname.startsWith(ROLE_HOME[rol]));
  return porRuta ?? ROL_PRIORIDAD.find((rol) => roles.includes(rol)) ?? "";
}

/** Navegación del sidebar por rol. Los demás roles crecen aquí conforme avancen los sprints. */
export const NAV_BY_ROLE: Record<string, NavGroup[]> = {
  Estudiante: [
    {
      label: "Evaluación",
      items: [
        { label: "Dashboard", to: "/estudiante", icon: LayoutDashboard },
        { label: "Evaluaciones", to: "/estudiante/evaluaciones", icon: ClipboardCheck },
      ],
    },
    {
      label: "Consulta",
      items: [
        { label: "Historial", to: "/estudiante/historial", icon: History },
        { label: "Perfil", to: "/estudiante/perfil", icon: User },
      ],
    },
  ],
  Docente: [{ label: "General", items: [{ label: "Dashboard", to: "/docente", icon: LayoutDashboard }] }],
  Coordinador: [{ label: "General", items: [{ label: "Dashboard", to: "/coordinador", icon: LayoutDashboard }] }],
  Administrador: [
    {
      label: "Administración",
      items: [
        { label: "Dashboard", to: "/administrador", icon: LayoutDashboard },
        { label: "Usuarios", to: "/administrador/usuarios", icon: Users },
      ],
    },
  ],
};

const CRUMB_LABELS: Record<string, string> = {
  estudiante: "Estudiante",
  docente: "Docente",
  coordinador: "Coordinador",
  administrador: "Administrador",
  evaluaciones: "Evaluaciones",
  evaluar: "Cuestionario",
  historial: "Historial",
  perfil: "Perfil",
  usuarios: "Usuarios",
};

/** Migas de pan a partir de la ruta; los segmentos numéricos (ids) se omiten. La última es el título de la página. */
export function breadcrumbsFor(pathname: string): string[] {
  const crumbs = pathname
    .split("/")
    .filter((segment) => segment && !/^\d+$/.test(segment))
    .map((segment) => CRUMB_LABELS[segment] ?? segment);
  return crumbs.length > 1 ? crumbs : [...crumbs, "Dashboard"];
}
