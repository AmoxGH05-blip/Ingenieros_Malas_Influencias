import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  label: string; // texto accesible
  className?: string;
}

export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}
