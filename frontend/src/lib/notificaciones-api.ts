/** Capa de datos de las notificaciones al iniciar sesión (SCRUM-40): GET /api/notificaciones. */
import { apiFetch } from "@/lib/api";

export type Severidad = "info" | "aviso" | "urgente";

export interface Notificacion {
  id: string;
  tipo: "evaluaciones-pendientes" | "solicitudes-password";
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  enlace: string;
  /** Texto del botón de la ventana, por ejemplo "Ir a evaluar". */
  textoEnlace: string;
  /** Solo en el aviso de evaluaciones: días que faltan para el cierre. */
  diasRestantes?: number;
  /** Detalle del aviso: materias sin evaluar ("Materia (Apellido, Nombre)") o cuentas con solicitud ("Nombre (cuenta)"). */
  pendientes: string[];
}

export function getNotificaciones(): Promise<{ notificaciones: Notificacion[] }> {
  return apiFetch<{ notificaciones: Notificacion[] }>("/notificaciones");
}
