interface ProgressRingProps {
  value: number; // 0-100
  label: string;
}

/** Anillo de progreso (SVG) con el porcentaje al centro. */
export function ProgressRing({ value, label }: ProgressRingProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div role="img" aria-label={`${label}: ${Math.round(value)}%`} className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-secondary" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-success transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold">{Math.round(value)}%</span>
    </div>
  );
}
