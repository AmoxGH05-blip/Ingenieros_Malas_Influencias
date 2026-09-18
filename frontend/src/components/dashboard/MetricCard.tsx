import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  /** Color del icono: usa los tokens de estado del tema. */
  tone?: "default" | "success" | "warning" | "brand";
}

const TONES: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-secondary text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  brand: "bg-brand/20 text-brand",
};

/** Tarjeta de métrica reutilizable para cualquier dashboard (estudiante, coordinación, etc.). */
export function MetricCard({ label, value, hint, icon: Icon, tone = "default" }: MetricCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
    </Card>
  );
}
