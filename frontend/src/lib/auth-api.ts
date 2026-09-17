import { apiFetch } from "@/lib/api";

export type TipoCuenta = "Estudiante" | "Docente";

export interface Usuario {
  id: number;
  correo: string;
  tipoCuenta: TipoCuenta;
  roles: string[];
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
