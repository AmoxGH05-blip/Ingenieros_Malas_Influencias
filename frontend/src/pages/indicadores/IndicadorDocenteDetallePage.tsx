import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Cargando } from "@/components/indicadores/Cargando";
import { ComparativoDocente } from "@/components/indicadores/ComparativoDocente";
import { HistoricoDocente } from "@/components/indicadores/HistoricoDocente";
import { PerfilDocente } from "@/components/indicadores/PerfilDocente";
import { useHistorico } from "@/components/indicadores/useHistorico";
import { cicloActual, getHistoricoDocente } from "@/lib/indicadores-api";

/** Perfil, histórico y comparativo de un docente, visto desde Coordinación o Administración. */
export function IndicadorDocenteDetallePage() {
  const { id } = useParams();
  const docenteId = Number(id);
  const idValido = Number.isInteger(docenteId) && docenteId > 0;
  const { historico, error: errorCarga } = useHistorico(
    () => (idValido ? getHistoricoDocente(docenteId) : Promise.reject(new Error("id invalido"))),
    id ?? ""
  );
  const error = idValido ? errorCarga : "Ese docente no existe";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/coordinador/indicadores" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Volver a indicadores
      </Link>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!historico && !error && <Cargando />}

      {historico && (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{historico.docente.nombre}</h1>
            <p className="text-sm text-muted-foreground">Número de empleado {historico.docente.numeroEmpleado}</p>
          </div>
          <PerfilDocente ciclo={cicloActual(historico.ciclos)} />
          <ComparativoDocente ciclos={historico.ciclos} />
          <HistoricoDocente ciclos={historico.ciclos} />
        </>
      )}
    </div>
  );
}
