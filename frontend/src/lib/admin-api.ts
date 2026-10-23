/** Capa de datos del panel de administración (SCRUM-43): /api/admin/*. */
import { apiFetch } from "@/lib/api";

export type RolCreable = "Estudiante" | "Docente" | "Coordinador" | "Administrador";

export const ROLES_CREABLES: RolCreable[] = ["Estudiante", "Docente", "Coordinador", "Administrador"];

export interface UsuarioListado {
  id: number;
  correo: string;
  activo: boolean;
  roles: string[];
  numeroCuenta: string;
  nombre: string | null;
}

export interface Catalogos {
  programasEducativos: { id: number; nombre: string; nivelEducativo: string }[];
  facultades: { id: number; nombre: string }[];
}

export interface NuevoUsuario {
  rol: RolCreable;
  /** Matrícula (alumnos), número de empleado (docentes) o el que se asigne al coordinador o administrador. */
  numeroCuenta: string;
  /** Opcional solo para alumnos: sin correo se les asigna a<cuenta>@my.uvm.edu.mx. */
  correo?: string;
  password: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  programaEducativoId?: number;
  facultadId?: number;
}

export function getUsuarios(): Promise<UsuarioListado[]> {
  return apiFetch<UsuarioListado[]>("/admin/usuarios");
}

export function getCatalogos(): Promise<Catalogos> {
  return apiFetch<Catalogos>("/admin/catalogos");
}

export function crearUsuario(datos: NuevoUsuario): Promise<{ id: number; correo: string; rol: RolCreable; numeroCuenta: string }> {
  return apiFetch("/admin/usuarios", { method: "POST", body: JSON.stringify(datos) });
}
