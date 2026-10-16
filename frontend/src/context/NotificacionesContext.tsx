import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNotificaciones, type Notificacion } from "@/lib/notificaciones-api";

interface NotificacionesState {
  notificaciones: Notificacion[];
  /** No se pudieron pedir los avisos: la app sigue funcionando, solo la campana lo indica. */
  error: boolean;
  /** Hay avisos y la ventana de esta sesión todavía no se mostró. */
  mostrarVentana: boolean;
  cerrarVentana: () => void;
  refresh: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesState | null>(null);

const VENTANA_KEY = "dygsis.notificaciones.ventana";

/** La ventana se muestra una vez por inicio de sesión (en cualquier pestaña): la marca depende del token y se guarda en localStorage, igual que la sesión. */
function marcaDeSesion(token: string | null): string {
  return token ? token.slice(-24) : "";
}

function ventanaYaMostrada(token: string | null): boolean {
  try {
    return localStorage.getItem(VENTANA_KEY) === marcaDeSesion(token);
  } catch {
    return false;
  }
}

/** Carga los avisos al entrar, y de nuevo al volver a la pestaña (una pestaña olvidada no queda desactualizada). */
export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [error, setError] = useState(false);
  // Marca de la sesión cuya ventana ya se cerró; con otro inicio de sesión (otro token) vuelve a mostrarse.
  const [cerradaPara, setCerradaPara] = useState<string | null>(null);
  const ventanaCerrada = cerradaPara === marcaDeSesion(token) || ventanaYaMostrada(token);

  const refresh = useCallback(async () => {
    try {
      const respuesta = await getNotificaciones();
      setNotificaciones(respuesta.notificaciones);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void refresh();
  }, [token, refresh]);

  useEffect(() => {
    if (!token) return;
    const alVolver = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [token, refresh]);

  const cerrarVentana = useCallback(() => {
    setCerradaPara(marcaDeSesion(token));
    try {
      localStorage.setItem(VENTANA_KEY, marcaDeSesion(token));
    } catch {
      /* sin storage: la ventana solo se recuerda mientras la página siga abierta */
    }
  }, [token]);

  const value = useMemo<NotificacionesState>(
    () => ({ notificaciones, error, mostrarVentana: notificaciones.length > 0 && !ventanaCerrada, cerrarVentana, refresh }),
    [notificaciones, error, ventanaCerrada, cerrarVentana, refresh]
  );

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>;
}

export function useNotificaciones(): NotificacionesState {
  const context = useContext(NotificacionesContext);
  if (!context) throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return context;
}
