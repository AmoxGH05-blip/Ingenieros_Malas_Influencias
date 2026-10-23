import * as React from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import type { Catalogos } from "@/lib/cuentas-api";
import { crearGrupo, crearMateria, type Grupo } from "@/lib/grupos-api";

interface GrupoFormProps {
  catalogos: Catalogos;
  /** Pide recargar los catálogos (cuando se crea una materia nueva) y devuelve cuando ya están. */
  onCatalogosCambiaron: () => Promise<void>;
  onCreado: (grupo: Grupo) => void | Promise<void>;
  onCancelar: () => void;
}

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** Alta de un grupo: materia + docente + periodo + sección. Si la materia no existe, se crea aquí mismo. */
export function GrupoForm({ catalogos, onCatalogosCambiaron, onCreado, onCancelar }: GrupoFormProps) {
  const periodoActivo = catalogos.periodosAcademicos.find((p) => p.activo) ?? catalogos.periodosAcademicos[0];
  const [campos, setCampos] = useState<Record<string, string>>({ periodoAcademicoId: periodoActivo ? String(periodoActivo.id) : "" });
  const [materiaNueva, setMateriaNueva] = useState(false);
  const [datosMateria, setDatosMateria] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [guardandoMateria, setGuardandoMateria] = useState(false);

  const valor = (k: string) => campos[k] ?? "";
  const cambiar = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setCampos((p) => ({ ...p, [k]: e.target.value }));
  const valorMateria = (k: string) => datosMateria[k] ?? "";
  const cambiarMateria = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDatosMateria((p) => ({ ...p, [k]: e.target.value }));

  async function handleGuardarMateria() {
    setError(null);
    setGuardandoMateria(true);
    try {
      const materia = await crearMateria({
        programaEducativoId: Number(valorMateria("programaEducativoId")),
        clave: valorMateria("clave"),
        nombre: valorMateria("nombre"),
        creditos: valorMateria("creditos") === "" ? undefined : Number(valorMateria("creditos")),
      });
      await onCatalogosCambiaron();
      setCampos((p) => ({ ...p, materiaId: String(materia.id) }));
      setMateriaNueva(false);
      setDatosMateria({});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la materia");
    } finally {
      setGuardandoMateria(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await onCreado(
        await crearGrupo({
          materiaId: Number(valor("materiaId")),
          docenteId: Number(valor("docenteId")),
          periodoAcademicoId: Number(valor("periodoAcademicoId")),
          seccion: valor("seccion"),
          cupoMaximo: valor("cupoMaximo") === "" ? undefined : Number(valor("cupoMaximo")),
        })
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el grupo");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="materiaId" label="Materia">
          <select id="materiaId" required className={SELECT_CLASS} value={valor("materiaId")} onChange={cambiar("materiaId")}>
            <option value="">Selecciona…</option>
            {catalogos.materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.clave})
              </option>
            ))}
          </select>
          {!materiaNueva && (
            <button type="button" onClick={() => setMateriaNueva(true)} className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
              <Plus className="size-3" aria-hidden /> La materia no está en la lista: crear nueva
            </button>
          )}
        </Campo>

        <Campo id="docenteId" label="Docente">
          <select id="docenteId" required className={SELECT_CLASS} value={valor("docenteId")} onChange={cambiar("docenteId")}>
            <option value="">Selecciona…</option>
            {catalogos.docentes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.numeroEmpleado})
              </option>
            ))}
          </select>
          {catalogos.docentes.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay docentes: da de alta uno en "Alumnos y docentes".</p>}
        </Campo>

        <Campo id="periodoAcademicoId" label="Periodo académico">
          <select id="periodoAcademicoId" required className={SELECT_CLASS} value={valor("periodoAcademicoId")} onChange={cambiar("periodoAcademicoId")}>
            <option value="">Selecciona…</option>
            {catalogos.periodosAcademicos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.activo ? " (activo)" : ""}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="seccion" label="Sección">
          <Input id="seccion" required maxLength={10} pattern="[A-Za-z0-9]+" title="Solo letras y números, sin espacios" placeholder="Ej. 3A" value={valor("seccion")} onChange={cambiar("seccion")} />
        </Campo>

        <Campo id="cupoMaximo" label="Cupo máximo (opcional)">
          <Input id="cupoMaximo" type="number" min={0} max={500} step={1} placeholder="0 o vacío: sin límite" value={valor("cupoMaximo")} onChange={cambiar("cupoMaximo")} />
        </Campo>
      </div>

      {materiaNueva && (
        <fieldset className="space-y-4 rounded-lg border border-border bg-secondary/40 p-4">
          <legend className="px-1 text-sm font-semibold">Nueva materia</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="materiaPrograma" label="Programa educativo">
              <select id="materiaPrograma" className={SELECT_CLASS} value={valorMateria("programaEducativoId")} onChange={cambiarMateria("programaEducativoId")}>
                <option value="">Selecciona…</option>
                {catalogos.programasEducativos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.nivelEducativo})
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id="materiaClave" label="Clave">
              <Input id="materiaClave" maxLength={20} placeholder="Ej. BD101" value={valorMateria("clave")} onChange={cambiarMateria("clave")} />
            </Campo>
            <Campo id="materiaNombre" label="Nombre">
              <Input id="materiaNombre" maxLength={150} value={valorMateria("nombre")} onChange={cambiarMateria("nombre")} />
            </Campo>
            <Campo id="materiaCreditos" label="Créditos (opcional)">
              <Input id="materiaCreditos" type="number" min={0} max={100} step={1} value={valorMateria("creditos")} onChange={cambiarMateria("creditos")} />
            </Campo>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setMateriaNueva(false)}>
              No crear
            </Button>
            <Button type="button" size="sm" disabled={guardandoMateria} onClick={() => void handleGuardarMateria()}>
              {guardandoMateria ? "Guardando..." : "Guardar materia"}
            </Button>
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando} className="bg-brand text-brand-foreground hover:opacity-90">
          {enviando ? "Creando..." : "Crear grupo"}
        </Button>
      </div>
    </form>
  );
}
