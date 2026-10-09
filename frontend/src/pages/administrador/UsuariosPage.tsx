import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevoUsuarioForm } from "@/pages/administrador/NuevoUsuarioForm";
import { getCatalogos, getUsuarios, type Catalogos, type UsuarioListado } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const FILTROS = ["Todos", "Estudiante", "Docente", "Coordinador", "Administrador"] as const;

/** SCRUM-43: alta y listado de usuarios (solo Administrador). */
export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[] | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");
  const [formAbierto, setFormAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, cat] = await Promise.all([getUsuarios(), getCatalogos()]);
      setUsuarios(lista);
      setCatalogos(cat);
      setError(null);
    } catch {
      setError("No se pudo cargar la lista de usuarios.");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = (usuarios ?? []).filter((u) => filtro === "Todos" || u.roles.includes(filtro));

  async function handleCreado(correo: string) {
    setFormAbierto(false);
    setAviso(`Se creó la cuenta de ${correo}.`);
    await cargar();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Da de alta cuentas de alumnos, docentes, coordinadores y administradores.</p>
        </div>
        {!formAbierto && (
          <Button onClick={() => setFormAbierto(true)} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="size-4" aria-hidden /> Nuevo usuario
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
            <CardTitle>Nuevo usuario</CardTitle>
            <CardDescription>La contraseña inicial se guarda cifrada; compártela con la persona por un medio seguro.</CardDescription>
          </CardHeader>
          <CardContent>
            <NuevoUsuarioForm catalogos={catalogos} onCreado={handleCreado} onCancelar={() => setFormAbierto(false)} />
          </CardContent>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div role="group" aria-label="Filtrar por rol" className="flex w-fit flex-wrap gap-1 rounded-xl bg-secondary p-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              filtro === f ? "border-success/50 bg-card text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {!usuarios && !error && <div aria-busy className="h-48 animate-pulse rounded-xl bg-card" />}

      {usuarios && (
        <ul className="space-y-3">
          {visibles.map((u) => (
            <li
              key={u.id}
              className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_100px]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{u.nombre ?? u.correo}</p>
                {u.nombre && <p className="truncate text-xs text-muted-foreground">{u.correo}</p>}
              </div>
              <div className="min-w-0 text-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Número de cuenta</p>
                <p className="mt-1 truncate">{u.numeroCuenta ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {u.roles.map((rol) => (
                  <Badge key={rol} variant={rol === "Administrador" ? "warning" : "neutral"}>
                    {rol}
                  </Badge>
                ))}
              </div>
              <div className="lg:text-right">
                <Badge variant={u.activo ? "success" : "neutral"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
              </div>
            </li>
          ))}
          {visibles.length === 0 && (
            <li className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No hay usuarios con ese rol.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
