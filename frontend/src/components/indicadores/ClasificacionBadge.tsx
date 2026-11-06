import { Badge } from "@/components/ui/badge";
import type { Clasificacion } from "@/lib/indicadores-api";

const VARIANTE = {
  Excelente: "success",
  Bueno: "neutral",
  Suficiente: "warning",
  "No suficiente": "danger",
} as const;

/** Color de la barra de promedio según la categoría. */
export const COLOR_BARRA: Record<Clasificacion, string> = {
  Excelente: "bg-success",
  Bueno: "bg-brand",
  Suficiente: "bg-warning",
  "No suficiente": "bg-destructive",
};

export function ClasificacionBadge({ clasificacion }: { clasificacion: Clasificacion | null }) {
  if (!clasificacion) return <Badge variant="neutral">Sin evaluaciones</Badge>;
  return <Badge variant={VARIANTE[clasificacion]}>{clasificacion}</Badge>;
}
