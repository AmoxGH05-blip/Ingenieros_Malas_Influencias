import { useState } from "react";
import { AlertTriangle, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SolicitudPendiente } from "@/lib/solicitudes-password-api";

interface SolicitudCardProps {
  solicitud: SolicitudPendiente;
  /** Se está resolviendo (o recargando la lista): los botones quedan bloqueados. */
  ocupada: boolean;
  /** Aprobar lleva el código que tecleó quien aprueba; rechazar no. */
  onResolver: (accion: "aprobar" | "rechazar", codigo?: string) => void;
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Mexico_City" });
}

/** Una solicitud pendiente. Aprobar pide una segunda confirmación: la identidad se verifica fuera del sistema. */
export function SolicitudCard({ solicitud, ocupada, onResolver }: SolicitudCardProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const quien = solicitud.nombre ?? solicitud.numeroCuenta;

  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="break-words font-semibold">{solicitud.nombre ?? "Sin nombre registrado"}</p>
            <p className="text-sm text-muted-foreground">
              Cuenta {solicitud.numeroCuenta} · solicitada el {formatearFecha(solicitud.fechaSolicitud)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {solicitud.roles.map((rol) => (
            <Badge key={rol} variant="neutral">
              {rol}
            </Badge>
          ))}
        </div>
      </div>

      {solicitud.reemplazaAnterior && (
        <p role="note" className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Esta solicitud reemplazó a otra de la misma cuenta que seguía pendiente. Si ya verificaste a la persona con la anterior, vuelve a confirmar que
            esta también es suya.
          </span>
        </p>
      )}

      {confirmando ? (
        <form
          aria-label={`Confirmar la aprobación de ${quien}`}
          className="flex flex-wrap items-end gap-3 rounded-lg bg-secondary px-4 py-3 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onResolver("aprobar", codigo);
          }}
        >
          <div className="min-w-[12rem] flex-1 space-y-2">
            <p>
              ¿Confirmaste que {quien} es quien pidió el cambio? Pídele el <strong>código de verificación</strong> que vio al enviar su solicitud.
            </p>
            <Label htmlFor={`codigo-${solicitud.id}`}>Código de verificación</Label>
            <Input
              id={`codigo-${solicitud.id}`}
              autoFocus
              required
              autoComplete="off"
              maxLength={12}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.toUpperCase())}
              className="max-w-48 font-mono tracking-widest"
            />
          </div>
          <Button type="submit" size="sm" disabled={ocupada || codigo.trim() === ""} className="bg-brand text-brand-foreground hover:opacity-90">
            {ocupada ? "Aprobando..." : "Sí, aprobar"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={ocupada} onClick={() => setConfirmando(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={ocupada}
            aria-label={`Aprobar la solicitud de ${quien}`}
            onClick={() => setConfirmando(true)}
            className="bg-brand text-brand-foreground hover:opacity-90"
          >
            Aprobar
          </Button>
          <Button size="sm" variant="outline" disabled={ocupada} aria-label={`Rechazar la solicitud de ${quien}`} onClick={() => onResolver("rechazar")}>
            {ocupada ? "Rechazando..." : "Rechazar"}
          </Button>
        </div>
      )}
    </Card>
  );
}
