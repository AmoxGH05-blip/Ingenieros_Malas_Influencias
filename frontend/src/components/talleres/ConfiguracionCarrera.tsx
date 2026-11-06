import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  actualizarTaller,
  crearTaller,
  habilitarTalleresDeCarrera,
  type CarreraConfiguracion,
  type Taller,
  type TipoTaller,
} from "@/lib/talleres-api";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40";

interface Props {
  carrera: CarreraConfiguracion;
  /** Se llama tras cada cambio guardado y se espera: la pantalla vuelve a pedir la configuración antes de permitir otro cambio. */
  onCambio: () => Promise<void>;
}

function mensajeDe(error: unknown, porDefecto: string): string {
  return error instanceof Error && error.message ? error.message : porDefecto;
}

/** Una carrera: interruptor de evaluación de talleres, lista de talleres (alta y baja) y formulario para agregar. */
export function ConfiguracionCarrera({ carrera, onCambio }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoTaller>("Taller");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(accion: () => Promise<unknown>, mensajeError: string) {
    setError(null);
    setOcupado(true);
    try {
      await accion();
      await onCambio();
    } catch (err) {
      setError(mensajeDe(err, mensajeError));
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(event: React.FormEvent) {
    event.preventDefault();
    if (!nombre.trim()) return;
    await ejecutar(async () => {
      await crearTaller({ programaEducativoId: carrera.programaEducativoId, nombre: nombre.trim(), tipo });
      setNombre("");
    }, "No se pudo agregar el taller.");
  }

  const idSwitch = `talleres-carrera-${carrera.programaEducativoId}`;
  const idNombre = `nombre-taller-${carrera.programaEducativoId}`;
  const idTipo = `tipo-taller-${carrera.programaEducativoId}`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{carrera.nombre}</CardTitle>
          <CardDescription>
            {carrera.alumnos} alumnos · {carrera.talleres.filter((t) => t.activo).length} talleres activos
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <span id={idSwitch} className="text-sm font-medium">Evaluación de talleres</span>
          <button
            type="button"
            role="switch"
            aria-checked={carrera.evaluaTalleres}
            aria-labelledby={idSwitch}
            disabled={ocupado}
            onClick={() => ejecutar(() => habilitarTalleresDeCarrera(carrera.programaEducativoId, !carrera.evaluaTalleres), "No se pudo cambiar la configuración.")}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full border border-input transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              carrera.evaluaTalleres ? "bg-brand" : "bg-secondary"
            )}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-background shadow transition-all", carrera.evaluaTalleres ? "left-[22px]" : "left-0.5")} />
          </button>
          <Badge variant={carrera.evaluaTalleres ? "success" : "neutral"}>{carrera.evaluaTalleres ? "Habilitada" : "Deshabilitada"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {carrera.talleres.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta carrera todavía no tiene talleres ni laboratorios.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {carrera.talleres.map((taller) => (
              <FilaTaller key={taller.id} taller={taller} ocupado={ocupado} onCambiar={(activo) => ejecutar(() => actualizarTaller(taller.id, { activo }), "No se pudo actualizar el taller.")} />
            ))}
          </ul>
        )}

        <form onSubmit={agregar} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={idNombre}>Nuevo taller o laboratorio</Label>
            <Input id={idNombre} value={nombre} maxLength={150} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Laboratorio de redes" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={idTipo}>Tipo</Label>
            <select id={idTipo} className={SELECT_CLASS} value={tipo} onChange={(e) => setTipo(e.target.value as TipoTaller)}>
              <option value="Taller">Taller</option>
              <option value="Laboratorio">Laboratorio</option>
            </select>
          </div>
          <Button type="submit" disabled={ocupado || !nombre.trim()}>
            <Plus className="size-4" aria-hidden /> Agregar
          </Button>
        </form>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function FilaTaller({ taller, ocupado, onCambiar }: { taller: Taller; ocupado: boolean; onCambiar: (activo: boolean) => void }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={cn("font-medium", !taller.activo && "text-muted-foreground line-through")}>{taller.nombre}</span>
        <Badge variant="neutral">{taller.tipo}</Badge>
        {!taller.activo && <Badge variant="warning">De baja</Badge>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={ocupado}
        aria-label={`${taller.activo ? "Dar de baja" : "Reactivar"} ${taller.nombre}`}
        onClick={() => onCambiar(!taller.activo)}
      >
        {taller.activo ? "Dar de baja" : "Reactivar"}
      </Button>
    </li>
  );
}
