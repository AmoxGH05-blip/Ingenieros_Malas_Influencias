import { ClipboardCheck, Layers, Star, Trophy } from "lucide-react";
import { ClasificacionBadge } from "@/components/indicadores/ClasificacionBadge";
import { Variacion } from "@/components/indicadores/Variacion";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/ui/card";
import { formatoPromedio, type Ciclo } from "@/lib/indicadores-api";

interface PerfilDocenteProps {
  /** El ciclo actual (el más reciente); null si el docente aún no tiene grupos en ningún ciclo. */
  ciclo: Ciclo | null;
}

/** Perfil del docente en su ciclo actual: promedio, categoría y lugar en el ranking. */
export function PerfilDocente({ ciclo }: PerfilDocenteProps) {
  if (!ciclo) {
    return <Card className="p-6 text-sm text-muted-foreground">Todavía no hay ciclos con grupos para este docente.</Card>;
  }
  const sinDatos = ciclo.promedio === null;
  return (
    <section aria-label="Perfil del ciclo actual" className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ciclo actual</p>
          <p className="text-lg font-semibold">{ciclo.periodo}</p>
          <p className="text-sm text-muted-foreground">{ciclo.materias || "Sin materias asignadas"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ClasificacionBadge clasificacion={ciclo.clasificacion} />
          <Variacion valor={ciclo.variacion} sinDato={sinDatos ? "Aún sin promedio este ciclo" : undefined} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Promedio general (de 10)" value={formatoPromedio(ciclo.promedio)} icon={Star} />
        <MetricCard
          label={sinDatos ? "Lugar en el ranking" : `Lugar de ${ciclo.docentesConPromedio} docentes`}
          value={ciclo.ranking === null ? "—" : `${ciclo.ranking}°`}
          icon={Trophy}
        />
        <MetricCard label="Evaluaciones recibidas" value={ciclo.evaluaciones} icon={ClipboardCheck} />
        <MetricCard label="Grupos" value={ciclo.grupos} icon={Layers} />
      </div>
      {sinDatos && (
        <p className="text-sm text-muted-foreground">Aún no hay evaluaciones completadas en este ciclo; el promedio aparece con la primera.</p>
      )}
    </section>
  );
}
