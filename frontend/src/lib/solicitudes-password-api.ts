/** Cambio de contraseña con aprobación (SCRUM-80): la pide quien la olvidó y la resuelve Coordinación o Administración. */
import { apiFetch } from "@/lib/api";

export interface SolicitudPendiente {
  id: number;
  numeroCuenta: string;
  nombre: string | null;
  roles: string[];
  fechaSolicitud: string;
  /** Reemplazó a otra solicitud de la misma cuenta que seguía pendiente: conviene volver a confirmar la identidad. */
  reemplazaAnterior: boolean;
}

/**
 * Pública (sin sesión): deja la solicitud pendiente. La respuesta es la misma exista o no la cuenta, y trae un código de
 * verificación que solo se ve ahora: quien aprueba debe teclearlo.
 */
export function solicitarCambioPassword(numeroCuenta: string, nuevaPassword: string): Promise<{ mensaje: string; codigo: string }> {
  return apiFetch<{ mensaje: string; codigo: string }>("/auth/solicitar-cambio-password", {
    method: "POST",
    body: JSON.stringify({ numeroCuenta, nuevaPassword }),
  });
}

export function getSolicitudesPendientes(): Promise<{ solicitudes: SolicitudPendiente[] }> {
  return apiFetch<{ solicitudes: SolicitudPendiente[] }>("/solicitudes-password");
}

/** Aprobar exige el código de verificación que vio quien mandó la solicitud. */
export function aprobarSolicitud(id: number, codigo: string): Promise<{ id: number; numeroCuenta: string; estado: "Aprobada" }> {
  return apiFetch(`/solicitudes-password/${id}/aprobar`, { method: "POST", body: JSON.stringify({ codigo }) });
}

export function rechazarSolicitud(id: number): Promise<{ id: number; numeroCuenta: string; estado: "Rechazada" }> {
  return apiFetch(`/solicitudes-password/${id}/rechazar`, { method: "POST" });
}
