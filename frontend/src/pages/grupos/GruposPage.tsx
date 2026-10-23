import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GrupoForm } from "@/pages/grupos/GrupoForm";
import { getCatalogos, type Catalogos } from "@/lib/cuentas-api";
import { estaLleno, getGrupos, type Grupo } from "@/lib/grupos-api";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72";

/** Grupos del periodo: materia + docente + sección, con sus inscritos. Desde aquí se crean grupos y materias (SCRUM-79). */
export function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [periodoId, setPeriodoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);
  const [formAbierto, setFormAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarCatalogos = useCallback(async () => {
    const cat = await getCatalogos();
    setCatalogos(cat);
    setPeriodoId((actual) => actual ?? String((cat.periodosAcademicos.find((p) => p.activo) ?? cat.periodosAcademicos[0])?.id ?? ""));
  }, []);

  const cargarGrupos = useCallback(async () => {
    try {
      setGrupos(await getGrupos());
      setError(null);
    } catch {
      setError("No se pudo cargar la lista de grupos.");
    }
  }, []);

  useEffect(() => {
    void cargarCatalogos().catch(() => setErrorCatalogos("No se pudieron cargar los catálogos."));
    void cargarGrupos();
  }, [cargarCatalogos, cargarGrupos]);

  const visibles = (grupos ?? []).filter((g) => !periodoId || String(g.periodoAcademicoId) === periodoId);

  async function handleCreado(grupo: Grupo) {
    setFormAbierto(false);
    setAviso(`Se creó el grupo ${grupo.seccion} de ${grupo.materia}.`);
    await cargarGrupos();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grupos</h1>
          <p className="text-sm text-muted-foreground">Un grupo es una materia con su docente y sección. Los alumnos se inscriben en los grupos que cursan.</p>
        </div>
        {!formAbierto && (
          <Button onClick={() => setFormAbierto(true)} disabled={!catalogos} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="size-4" aria-hidden /> Nuevo grupo
          </Button>
        )}
      </div>

      {aviso && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
          <span className="flex-1">{aviso}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)} className="rounded p-1 hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
      )}

      {formAbierto && catalogos && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo grupo</CardTitle>
            <CardDescription>Elige la materia, el docente que la imparte, el periodo y la sección. Si la materia aún no existe, créala desde aquí.</CardDescription>
          </CardHeader>
          <CardContent>
            <GrupoForm catalogos={catalogos} onCatalogosCambiaron={cargarCatalogos} onCreado={handleCreado} onCancelar={() => setFormAbierto(false)} />
          </CardContent>
        </Card>
      )}

      {(error ?? errorCatalogos) && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error ?? errorCatalogos}
        </p>
      )}

      {catalogos && catalogos.periodosAcademicos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-periodo" className="text-sm font-medium">
            Periodo académico
          </label>
          <select id="filtro-periodo" className={SELECT_CLASS} value={periodoId ?? ""} onChange={(e) => setPeriodoId(e.target.value)}>
            <option value="">Todos</option>
            {catalogos.periodosAcademicos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.activo ? " (activo)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {!grupos && !error && <div aria-busy className="h-48 animate-pulse rounded-xl bg-card" />}

      {grupos && (
        <ul className="space-y-3">
          {visibles.map((g) => (
            <li key={g.id}>
              <Link
                to={`/coordinador/grupos/${g.id}`}
                className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/30 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_130px]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{g.materia}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {g.claveMateria} · Sección {g.seccion}
                  </p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Docente</p>
                  <p className="mt-1 truncate">{g.docente}</p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Periodo</p>
                  <p className="mt-1 truncate">{g.periodo}</p>
                </div>
                <div className="lg:text-right">
                  <Badge variant={estaLleno(g) ? "warning" : "neutral"}>
                    {g.cupoMaximo > 0 ? `${g.inscritos} / ${g.cupoMaximo}` : `${g.inscritos} inscritos`}
                    {estaLleno(g) ? " · lleno" : ""}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
          {visibles.length === 0 && (
            <li className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No hay grupos en este periodo. Crea el primero con "Nuevo grupo".
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
