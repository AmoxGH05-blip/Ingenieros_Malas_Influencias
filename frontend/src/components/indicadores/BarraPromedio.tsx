import { COLOR_BARRA } from "@/components/indicadores/ClasificacionBadge";
import { cn } from "@/lib/utils";
import { formatoPromedio, type Clasificacion } from "@/lib/indicadores-api";

interface BarraPromedioProps {
  promedio: number | null;
  clasificacion: Clasificacion | null;
  /** Nombre para el lector de pantalla, por ejemplo el del ciclo o el docente. */
  label: string;
}

/** Barra de 0 a 10; el color sigue a la categoría. Sin promedio queda vacía. */
export function BarraPromedio({ promedio, clasificacion, label }: BarraPromedioProps) {
  const ancho = promedio === null ? 0 : Math.min(100, Math.max(0, promedio * 10));
  return (
    <div className="flex items-center gap-3">
      <div aria-hidden className="h-3 flex-1 overflow-hidden rounded-full bg-secondary" data-label={label}>
        <div className={cn("h-full rounded-full transition-[width] duration-500", clasificacion ? COLOR_BARRA[clasificacion] : "bg-border")} style={{ width: `${ancho}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold tabular-nums">{formatoPromedio(promedio)}</span>
    </div>
  );
}
