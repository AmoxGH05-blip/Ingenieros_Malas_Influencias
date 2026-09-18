import * as React from "react";
import logoBlanco from "@/assets/branding/dygsis-logo-blanco.png";
import iconoNegro from "@/assets/branding/dygsis-icono-negro.png";

/**
 * Marco común de las pantallas de autenticación: panel de marca a la izquierda
 * (solo en pantallas grandes) y el formulario centrado a la derecha.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="relative">
          <img src={logoBlanco} alt="DYGSIS" className="h-28 w-auto" />
        </div>
        <div className="relative max-w-md space-y-4">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Tu opinión mejora la enseñanza.
          </h2>
          <p className="text-sidebar-muted">
            Sistema de Evaluación Docente Adaptable: evalúa a tus docentes de forma anónima y sigue tu avance en un solo lugar.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-muted">© 2026 Ingenieros Malas Influencias</p>
      </aside>

      <main className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={iconoNegro} alt="" className="size-9 object-contain" />
            <span className="font-semibold tracking-tight">DYGSIS</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
