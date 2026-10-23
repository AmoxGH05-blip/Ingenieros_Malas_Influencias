import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AltaCuentaForm } from "@/pages/cuentas/AltaCuentaForm";
import { getCatalogos, getCuentas, type Catalogos, type CuentaCreada, type CuentaListada } from "@/lib/cuentas-api";
import { cn } from "@/lib/utils";

const FILTROS_ADMINISTRADOR = ["Todos", "Estudiante", "Docente", "Coordinador", "Administrador"] as const;
const FILTROS_COORDINADOR = ["Todos", "Estudiante", "Docente"] as const;

/**
 * Cuentas: alta (cuenta nueva o rol más a una existente) y listado. El Administrador ve y gestiona todas;
 * el Coordinador solo las de alumnos y docentes (SCRUM-43 y SCRUM-79). El servidor aplica los permisos.
 */
export function CuentasPage() {
  const { usuario } = useAuth();
  const esAdministrador = usuario?.roles.includes("Administrador") ?? false;
  const filtros = esAdministrador ? FILTROS_ADMINISTRADOR : FILTROS_COORDINADOR;

  const [cuentas, setCuentas] = useState<CuentaListada[] | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("Todos");
  const [formAbierto, setFormAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, cat] = await Promise.all([getCuentas(), getCatalogos()]);
      setCuentas(lista);
      setCatalogos(cat);
      setError(null);
    } catch {
      setError("No se pudo cargar la lista de cuentas.");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = (cuentas ?? []).filter((c) => filtro === "Todos" || c.roles.includes(filtro));

  async function handleCreada(resultado: CuentaCreada) {
    setFormAbierto(false);
    setAviso(
      resultado.creada
        ? `Se creó la cuenta ${resultado.numeroCuenta}. Deberá cambiar su contraseña en su primer inicio de sesión.`
        : `Se agregó el rol ${resultado.rol} a la cuenta ${resultado.numeroCuenta}.`
    );
    await cargar();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{esAdministrador ? "Usuarios" : "Alumnos y docentes"}</h1>
          <p className="text-sm text-muted-foreground">
            {esAdministrador
              ? "Da de alta coordinadores, administradores, docentes y alumnos."
              : "Da de alta a los alumnos y docentes con su número de cuenta."}
          </p>
        </div>
        {!formAbierto && (
          <Button onClick={() => setFormAbierto(true)} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="size-4" aria-hidden /> Dar de alta cuenta
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
            <CardTitle>Dar de alta cuenta</CardTitle>
            <CardDescription>
              Escribe el número de cuenta y búscalo: si es nuevo se crea, y si ya existe se le agrega un rol. La contraseña temporal se guarda cifrada; compártela con la persona por un medio seguro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AltaCuentaForm catalogos={catalogos} onCreada={handleCreada} onCancelar={() => setFormAbierto(false)} />
          </CardContent>
        </Card>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div role="group" aria-label="Filtrar por rol" className="flex w-fit flex-wrap gap-1 rounded-xl bg-secondary p-1">
        {filtros.map((f) => (
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

      {!cuentas && !error && <div aria-busy className="h-48 animate-pulse rounded-xl bg-card" />}

      {cuentas && (
        <ul className="space-y-3">
          {visibles.map((c) => (
            <li
              key={c.id}
              className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_100px]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{c.nombre ?? c.numeroCuenta}</p>
                <p className="truncate text-xs text-muted-foreground">{c.correo}</p>
              </div>
              <div className="min-w-0 text-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Número de cuenta</p>
                <p className="mt-1 truncate">{c.numeroCuenta}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.roles.map((rol) => (
                  <Badge key={rol} variant={rol === "Administrador" ? "warning" : "neutral"}>
                    {rol}
                  </Badge>
                ))}
              </div>
              <div className="lg:text-right">
                <Badge variant={c.activo ? "success" : "neutral"}>{c.activo ? "Activa" : "Inactiva"}</Badge>
              </div>
            </li>
          ))}
          {visibles.length === 0 && (
            <li className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No hay cuentas con ese rol.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
