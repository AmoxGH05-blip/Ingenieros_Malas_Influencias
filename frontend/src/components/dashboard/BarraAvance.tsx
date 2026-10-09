import { cn } from "@/lib/utils";

interface BarraAvanceProps {
  concluidos: number;
  parciales: number;
  noIniciados: number;
  /** Texto accesible; la barra se anuncia con sus tres cifras. */
  label: string;
  /** Versión delgada y sin leyenda, para las filas por grupo. */
  compacta?: boolean;
}

const SEGMENTOS = [
  { clave: "concluidos", nombre: "Concluidos", color: "bg-success" },
  { clave: "parciales", nombre: "Parciales", color: "bg-brand" },
  { clave: "noIniciados", nombre: "No iniciados", color: "bg-border" },
] as const;

/** Barra apilada: concluidos (verde), parciales (dorado) y no iniciados (gris). */
export function BarraAvance({ concluidos, parciales, noIniciados, label, compacta = false }: BarraAvanceProps) {
  const valores = { concluidos, parciales, noIniciados };
  const total = concluidos + parciales + noIniciados;

  return (
    <div className="space-y-2">
      <div
        role="img"
        aria-label={`${label}: ${concluidos} concluidos, ${parciales} parciales, ${noIniciados} no iniciados`}
        className={cn("flex w-full overflow-hidden rounded-full bg-secondary", compacta ? "h-2" : "h-4")}
      >
        {total > 0 &&
          SEGMENTOS.map(({ clave, color }) =>
            valores[clave] > 0 ? (
              <div
                key={clave}
                className={cn("h-full transition-[width] duration-500", color)}
                style={{ width: `${(valores[clave] / total) * 100}%` }}
              />
            ) : null
          )}
      </div>
      {!compacta && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {SEGMENTOS.map(({ clave, nombre, color }) => (
            <li key={clave} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", color)} aria-hidden />
              {nombre}: <strong className="font-semibold text-foreground">{valores[clave]}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
