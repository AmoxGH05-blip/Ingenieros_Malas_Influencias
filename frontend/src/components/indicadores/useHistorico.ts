import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { Historico } from "@/lib/indicadores-api";

interface Estado {
  historico: Historico | null;
  error: string | null;
}

/** Carga un histórico; ignora la respuesta si la pantalla cambió de docente mientras esperaba. */
export function useHistorico(cargar: () => Promise<Historico>, clave: unknown): Estado {
  const [estado, setEstado] = useState<Estado & { clave: unknown }>({ historico: null, error: null, clave });

  useEffect(() => {
    let vigente = true;
    cargar()
      .then((historico) => {
        if (vigente) setEstado({ historico, error: null, clave });
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        const mensaje =
          err instanceof ApiError && err.status === 404 ? err.message : "No se pudieron cargar los indicadores. Intenta de nuevo.";
        setEstado({ historico: null, error: mensaje, clave });
      });
    return () => {
      vigente = false;
    };
    // `cargar` cambia en cada render; la clave identifica qué se está pidiendo.
  }, [clave]);

  // Mientras llega la respuesta de otra clave no se muestran datos viejos.
  return Object.is(estado.clave, clave) ? { historico: estado.historico, error: estado.error } : { historico: null, error: null };
}
