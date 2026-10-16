import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BellRing, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificaciones } from "@/context/NotificacionesContext";
import type { Severidad } from "@/lib/notificaciones-api";
import { cn } from "@/lib/utils";

export const ESTILO_SEVERIDAD: Record<Severidad, { icono: typeof Clock; color: string; fondo: string }> = {
  info: { icono: BellRing, color: "text-brand", fondo: "bg-brand/15" },
  aviso: { icono: Clock, color: "text-warning", fondo: "bg-warning/15" },
  urgente: { icono: AlertTriangle, color: "text-destructive", fondo: "bg-destructive/15" },
};

const FOCUSABLES = "a[href], button:not([disabled])";

/** Ventana con los avisos pendientes; aparece una vez por inicio de sesión. */
export function NotificacionesVentana() {
  const { notificaciones, mostrarVentana, cerrarVentana } = useNotificaciones();
  const ventana = useRef<HTMLDivElement>(null);

  // Escape cierra, Tab no sale de la ventana y al cerrar el foco vuelve a donde estaba.
  useEffect(() => {
    if (!mostrarVentana) return;
    const previo = document.activeElement as HTMLElement | null;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") return cerrarVentana();
      if (e.key !== "Tab") return;
      const items = Array.from(ventana.current?.querySelectorAll<HTMLElement>(FOCUSABLES) ?? []);
      if (items.length === 0) return;
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      } else if (!ventana.current?.contains(document.activeElement)) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      previo?.focus?.();
    };
  }, [mostrarVentana, cerrarVentana]);

  if (!mostrarVentana) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={cerrarVentana}>
      <div
        ref={ventana}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avisos-titulo"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h2 id="avisos-titulo" className="text-lg font-semibold tracking-tight">
          {notificaciones.length === 1 ? "Tienes un aviso" : `Tienes ${notificaciones.length} avisos`}
        </h2>

        <ul className="space-y-3">
          {notificaciones.map((aviso) => {
            const { icono: Icono, color, fondo } = ESTILO_SEVERIDAD[aviso.severidad];
            return (
              <li key={aviso.id} className="flex gap-3">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", fondo, color)}>
                  <Icono className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold leading-snug">{aviso.titulo}</p>
                  <p className="text-sm text-muted-foreground">{aviso.mensaje}</p>
                  <ul className="list-disc pl-5 text-sm">
                    {aviso.pendientes.map((pendiente, i) => (
                      <li key={`${i}-${pendiente}`}>{pendiente}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end gap-2 pt-2">
          <Button autoFocus variant="outline" onClick={cerrarVentana}>
            Cerrar
          </Button>
          <Button asChild>
            <Link to={notificaciones[0].enlace} onClick={cerrarVentana}>
              Ir a evaluar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
