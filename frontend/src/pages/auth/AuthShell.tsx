import * as React from "react";
import { GraduationCap } from "lucide-react";

/**
 * Marco común de las pantallas de autenticación: panel de marca a la izquierda
 * (solo en pantallas grandes) y el formulario centrado a la derecha.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-brand/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">DYGSIS</span>
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
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight">DYGSIS</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
