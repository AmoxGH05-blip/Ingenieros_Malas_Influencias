/** Capa de datos de las notificaciones al iniciar sesión (SCRUM-40): GET /api/notificaciones. */
import { apiFetch } from "@/lib/api";

export type Severidad = "info" | "aviso" | "urgente";

export interface Notificacion {
  id: string;
  tipo: "evaluaciones-pendientes";
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  enlace: string;
  diasRestantes: number;
  /** Materias sin evaluar, como "Materia (Apellido, Nombre)". */
  pendientes: string[];
}

export function getNotificaciones(): Promise<{ notificaciones: Notificacion[] }> {
  return apiFetch<{ notificaciones: Notificacion[] }>("/notificaciones");
}
