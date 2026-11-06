import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cambio de promedio contra el ciclo anterior: verde si sube, rojo si baja. */
export function Variacion({ valor, sinDato = "Sin ciclo previo" }: { valor: number | null; sinDato?: string }) {
  if (valor === null) return <span className="text-xs text-muted-foreground">{sinDato}</span>;
  if (valor === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="size-3.5" aria-hidden /> Sin cambio
      </span>
    );
  }
  const sube = valor > 0;
  const Icono = sube ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", sube ? "text-success" : "text-destructive")}>
      <Icono className="size-3.5" aria-hidden />
      {sube ? "+" : "−"}
      {Math.abs(valor).toFixed(2)} vs ciclo anterior
    </span>
  );
}
