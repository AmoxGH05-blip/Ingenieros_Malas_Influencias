import * as React from "react";
import logoBlanco from "@/assets/branding/dygsis-logo-blanco.png";
import loginBg from "@/assets/branding/dygsis-login-bg.jpg";

/**
 * Marco común de las pantallas de autenticación: una tarjeta centrada estilo
 * "cartel de se busca" sobre un fondo de página con el mismo collage,
 * desenfocado para que no compita con el panel cuadrado nítido.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar p-4 sm:p-6">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-md"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-sidebar/70" aria-hidden />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl lg:grid-cols-2">
        <div
          className="relative hidden aspect-square items-center justify-center bg-cover bg-center lg:flex"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="absolute inset-0 bg-sidebar/55" aria-hidden />
          <img src={logoBlanco} alt="DYGSIS" className="relative w-2/3 max-w-xs drop-shadow-lg" />
        </div>

        <div className="flex flex-col justify-center bg-sidebar p-8 text-sidebar-foreground sm:p-10">
          <div className="mb-6 lg:hidden">
            <img src={logoBlanco} alt="DYGSIS" className="h-12 w-auto" />
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-sidebar-muted">© 2026 Ingenieros Malas Influencias</p>
        </div>
      </div>
    </div>
  );
}
