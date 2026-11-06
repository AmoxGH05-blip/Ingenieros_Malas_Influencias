import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, X } from "lucide-react";
import { SolicitudCard } from "@/pages/solicitudes/SolicitudCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { ApiError } from "@/lib/api";
import {
  aprobarSolicitud,
  getSolicitudesPendientes,
  rechazarSolicitud,
  type SolicitudPendiente,
} from "@/lib/solicitudes-password-api";

export type Accion = "aprobar" | "rechazar";

/** Solicitudes de cambio de contraseña por resolver (SCRUM-80). Cada quien ve solo las cuentas que puede gestionar. */
export function SolicitudesPasswordPage() {
  const { refresh: recargarAvisos } = useNotificaciones();
  const [solicitudes, setSolicitudes] = useState<SolicitudPendiente[] | null>(null);
  // Dos errores distintos: recargar la lista con éxito no debe borrar el de una acción que falló.
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const ultimaPeticion = useRef(0);

  const cargar = useCallback(async () => {
    const mia = ++ultimaPeticion.current;
    setCargando(true);
    try {
      const datos = await getSolicitudesPendientes();
      if (mia !== ultimaPeticion.current) return; // llegó una respuesta más nueva
      setSolicitudes(datos.solicitudes);
      setErrorCarga(null);
    } catch {
      if (mia === ultimaPeticion.current) setErrorCarga("No se pudieron cargar las solicitudes.");
    } finally {
      if (mia === ultimaPeticion.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function resolver(solicitud: SolicitudPendiente, accion: Accion, codigo = "") {
    setProcesando(solicitud.id);
    setErrorAccion(null);
    setAviso(null);
    try {
      if (accion === "aprobar") await aprobarSolicitud(solicitud.id, codigo);
      else await rechazarSolicitud(solicitud.id);
      setAviso(
        accion === "aprobar"
          ? `Se aprobó el cambio de ${solicitud.numeroCuenta}: ya puede entrar con su contraseña nueva.`
          : `Se rechazó la solicitud de ${solicitud.numeroCuenta}; su contraseña no cambió.`
      );
    } catch (err) {
      // 409 (ya resuelta, vencida o reemplazada) o 403: lo que se veía en pantalla estaba desactualizado.
      setErrorAccion(err instanceof ApiError ? err.message : "No se pudo resolver la solicitud.");
    }
    // La tarjeta sigue bloqueada hasta que la lista se actualiza: así no queda un instante con botones activos.
    await Promise.all([cargar(), recargarAvisos()]);
    setProcesando(null);
  }

  const error = errorAccion ?? errorCarga;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Personas de las cuentas que gestionas que pidieron una contraseña nueva. Apruébala solo si confirmaste que la persona es quien dice ser.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={cargando}>
          <RefreshCw className={cargando ? "size-4 animate-spin" : "size-4"} aria-hidden /> Actualizar
        </Button>
      </div>

      {aviso && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <span className="flex-1">{aviso}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)} className="rounded p-1 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!solicitudes && !errorCarga && (
        <div role="status" aria-busy className="h-40 animate-pulse rounded-xl bg-card">
          <span className="sr-only">Cargando…</span>
        </div>
      )}

      {solicitudes && solicitudes.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">No hay solicitudes pendientes.</Card>
      )}

      {solicitudes && solicitudes.length > 0 && (
        <ul className="space-y-3">
          {solicitudes.map((s) => (
            <li key={s.id}>
              <SolicitudCard solicitud={s} ocupada={procesando === s.id} onResolver={(accion, codigo) => void resolver(s, accion, codigo)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
