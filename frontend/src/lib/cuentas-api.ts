/** Capa de datos de altas de cuentas (SCRUM-43 y SCRUM-79): /api/cuentas y /api/catalogos. */
import { apiFetch } from "@/lib/api";

export type RolAsignable = "Estudiante" | "Docente" | "Coordinador" | "Administrador";

export interface CuentaListada {
  id: number;
  numeroCuenta: string;
  correo: string;
  activo: boolean;
  roles: string[];
  nombre: string | null;
}

export interface Catalogos {
  programasEducativos: { id: number; nombre: string; nivelEducativo: string }[];
  facultades: { id: number; nombre: string }[];
  periodosAcademicos: { id: number; nombre: string; activo: boolean }[];
  materias: { id: number; clave: string; nombre: string; creditos: number; programaEducativoId: number }[];
  docentes: { id: number; numeroEmpleado: string; nombre: string }[];
}

export interface PerfilPersona {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
}

export type BusquedaCuenta =
  | { existe: false; numeroCuenta: string; rolesAsignables: RolAsignable[] }
  | { existe: true; gestionable: false; numeroCuenta: string }
  | {
      existe: true;
      gestionable: true;
      numeroCuenta: string;
      correo: string;
      activo: boolean;
      roles: string[];
      nombre: string | null;
      perfil: PerfilPersona | null;
      perfiles: { estudiante: boolean; docente: boolean };
      rolesAsignables: RolAsignable[];
    };

export interface AltaCuenta {
  rol: RolAsignable;
  numeroCuenta: string;
  /** Solo para cuentas nuevas: la contraseña de una cuenta existente no se toca desde aquí. */
  password?: string;
  /** Opcional solo para alumnos nuevos: sin correo se les asigna a<cuenta>@my.uvm.edu.mx. */
  correo?: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  programaEducativoId?: number;
  facultadId?: number;
  /** Solo para alumnos: grupos en los que se inscribe al darlo de alta. */
  grupoIds?: number[];
}

export interface CuentaCreada {
  id: number;
  numeroCuenta: string;
  correo: string;
  rol: RolAsignable;
  roles: string[];
  /** true: cuenta nueva; false: se agregó un rol a una cuenta que ya existía. */
  creada: boolean;
  gruposInscritos: number;
}

export function getCuentas(): Promise<CuentaListada[]> {
  return apiFetch<CuentaListada[]>("/cuentas");
}

export function getCatalogos(): Promise<Catalogos> {
  return apiFetch<Catalogos>("/catalogos");
}

export function buscarCuenta(numeroCuenta: string): Promise<BusquedaCuenta> {
  return apiFetch<BusquedaCuenta>(`/cuentas/buscar?numeroCuenta=${encodeURIComponent(numeroCuenta)}`);
}

export function crearCuenta(datos: AltaCuenta): Promise<CuentaCreada> {
  return apiFetch<CuentaCreada>("/cuentas", { method: "POST", body: JSON.stringify(datos) });
}
