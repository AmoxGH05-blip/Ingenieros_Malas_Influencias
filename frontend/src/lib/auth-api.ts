import { apiFetch } from "@/lib/api";

export type TipoCuenta = "Estudiante" | "Docente" | "Coordinador" | "Administrador";

export interface Usuario {
  id: number;
  /** Con esto se inicia sesión (matrícula o número de empleado). */
  numeroCuenta: string;
  correo: string;
  tipoCuenta: TipoCuenta;
  roles: string[];
  /** La contraseña la puso otra persona: hay que cambiarla antes de usar el sistema. */
  debeCambiarPassword: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export function login(numeroCuenta: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ numeroCuenta, password }),
  });
}

/** Cambia la contraseña de la sesión actual; devuelve una sesión nueva (la anterior se cierra). */
export function cambiarPassword(passwordActual: string, nuevaPassword: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/cambiar-password", {
    method: "POST",
    body: JSON.stringify({ passwordActual, nuevaPassword }),
  });
}

export function forgotPassword(correo: string): Promise<{ mensaje: string }> {
  return apiFetch<{ mensaje: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ correo }),
  });
}

export function resetPassword(token: string, nuevaPassword: string): Promise<{ mensaje: string }> {
  return apiFetch<{ mensaje: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, nuevaPassword }),
  });
}
