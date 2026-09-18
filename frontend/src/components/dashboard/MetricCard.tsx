import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Aviso naranja arriba a la derecha (acción requerida). */
  alert?: string;
  /** Si se da, la tarjeta completa lleva a esa ruta y muestra la flecha. */
  to?: string;
}

/** Tarjeta de métrica: icono arriba a la izquierda, aviso opcional, cifra grande y etiqueta. */
export function MetricCard({ label, value, icon: Icon, alert, to }: MetricCardProps) {
  const body = (
    <Card className="flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-foreground/80" aria-hidden />
        {alert && (
          <span className="flex items-center gap-1 text-right text-xs font-medium text-warning">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            {alert}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <div className="flex items-end justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        {to && <ArrowRight className="size-4 text-foreground" aria-hidden />}
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </Link>
  ) : (
    body
  );
}
