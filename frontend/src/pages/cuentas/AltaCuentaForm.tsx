import * as React from "react";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import {
  buscarCuenta,
  crearCuenta,
  type AltaCuenta,
  type BusquedaCuenta,
  type Catalogos,
  type CuentaCreada,
  type RolAsignable,
} from "@/lib/cuentas-api";
import { estaLleno, getGrupos, type Grupo } from "@/lib/grupos-api";

interface AltaCuentaFormProps {
  catalogos: Catalogos;
  onCreada: (resultado: CuentaCreada) => void | Promise<void>;
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

/**
 * Alta de cuenta en dos pasos: primero se busca el número de cuenta; si es nueva se piden todos los datos,
 * y si ya existe se le asigna un rol más (nunca se toca su contraseña). Qué roles se ofrecen lo decide el servidor.
 */
export function AltaCuentaForm({ catalogos, onCreada, onCancelar }: AltaCuentaFormProps) {
  const [numero, setNumero] = useState("");
  const [busqueda, setBusqueda] = useState<BusquedaCuenta | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [rol, setRol] = useState<RolAsignable | "">("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [errorGrupos, setErrorGrupos] = useState(false);
  const [gruposElegidos, setGruposElegidos] = useState<number[]>([]);

  // Los grupos se piden una sola vez, cuando se elige dar de alta a un alumno.
  useEffect(() => {
    if (rol !== "Estudiante" || grupos !== null) return;
    getGrupos()
      .then(setGrupos)
      .catch(() => setErrorGrupos(true));
  }, [rol, grupos]);

  const valor = (k: string) => campos[k] ?? "";
  const cambiar = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCampos((prev) => ({ ...prev, [k]: e.target.value }));

  const esNueva = busqueda?.existe === false;
  const existente = busqueda?.existe && busqueda.gestionable ? busqueda : null;
  const asignables: RolAsignable[] = existente?.rolesAsignables ?? (busqueda?.existe === false ? busqueda.rolesAsignables : []);
  const tienePerfil = { estudiante: existente?.perfiles.estudiante ?? false, docente: existente?.perfiles.docente ?? false };
  const necesitaPerfil = (rol === "Estudiante" && !tienePerfil.estudiante) || (rol === "Docente" && !tienePerfil.docente);

  // Se ofrecen los grupos de los periodos activos (o todos, si ninguno lo esta).
  const periodosActivos = new Set(catalogos.periodosAcademicos.filter((p) => p.activo).map((p) => p.id));
  const gruposVisibles = (grupos ?? []).filter((g) => periodosActivos.size === 0 || periodosActivos.has(g.periodoAcademicoId));
  const alternarGrupo = (id: number) =>
    setGruposElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleBuscar(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBuscando(true);
    try {
      const resultado = await buscarCuenta(numero.trim());
      setBusqueda(resultado);
      const perfil = resultado.existe && resultado.gestionable ? resultado.perfil : null;
      setCampos(perfil ? { nombre: perfil.nombre, apellidoPaterno: perfil.apellidoPaterno, apellidoMaterno: perfil.apellidoMaterno ?? "" } : {});
      const opciones = resultado.existe && !resultado.gestionable ? [] : resultado.rolesAsignables;
      setRol(opciones[0] ?? "");
    } catch (err) {
      setBusqueda(null);
      setError(err instanceof ApiError ? err.message : "No se pudo buscar la cuenta");
    } finally {
      setBuscando(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!busqueda || !rol) return;
    setError(null);
    setEnviando(true);
    const datos: AltaCuenta = {
      rol,
      numeroCuenta: busqueda.numeroCuenta,
      ...(esNueva && { password: valor("password"), correo: valor("correo") || undefined }),
      ...(rol === "Estudiante" && gruposElegidos.length > 0 && { grupoIds: gruposElegidos }),
      ...(necesitaPerfil && {
        nombre: valor("nombre"),
        apellidoPaterno: valor("apellidoPaterno"),
        apellidoMaterno: valor("apellidoMaterno") || undefined,
        ...(rol === "Estudiante" && { programaEducativoId: Number(valor("programaEducativoId")) }),
        ...(rol === "Docente" && { facultadId: Number(valor("facultadId")) }),
      }),
    };
    try {
      await onCreada(await crearCuenta(datos));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la cuenta");
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleBuscar} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-60 flex-1 flex-col gap-2">
          <Label htmlFor="numeroCuenta">Número de cuenta</Label>
          <Input
            id="numeroCuenta"
            required
            maxLength={20}
            pattern="[A-Za-z0-9]+"
            title="Solo letras y números, sin espacios"
            autoComplete="off"
            placeholder="Matrícula, número de empleado o el que se asigne"
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value);
              setBusqueda(null);
              setError(null);
            }}
          />
        </div>
        <Button type="submit" variant="outline" disabled={buscando || numero.trim() === ""}>
          <Search className="size-4" aria-hidden /> {buscando ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {busqueda?.existe && !busqueda.gestionable && (
        <p role="status" className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm">
          La cuenta <strong>{busqueda.numeroCuenta}</strong> ya existe y no la puedes gestionar con tu rol.
        </p>
      )}

      {existente && (
        <div role="status" className="space-y-1 rounded-lg border border-border bg-secondary px-4 py-3 text-sm">
          <p>
            La cuenta <strong>{existente.numeroCuenta}</strong> ya existe{existente.nombre ? `: ${existente.nombre}` : ""}. Solo se le puede agregar un rol; su contraseña no cambia.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Roles actuales:</span>
            {existente.roles.map((r) => (
              <Badge key={r} variant="neutral">
                {r}
              </Badge>
            ))}
          </div>
          {!existente.activo && <p className="text-destructive">La cuenta está inactiva y no se puede modificar.</p>}
        </div>
      )}

      {(esNueva || existente) && asignables.length === 0 && (
        <p role="status" className="text-sm text-muted-foreground">
          Esta cuenta ya tiene todos los roles que puedes asignar.
        </p>
      )}

      {(esNueva || existente) && asignables.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {esNueva && <p className="text-sm text-muted-foreground">Cuenta nueva: se crea con la contraseña temporal que escribas, y la persona la cambia en su primer acceso.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="rol" label={esNueva ? "Rol" : "Rol que se agrega"}>
              <select
                id="rol"
                className={SELECT_CLASS}
                value={rol}
                onChange={(e) => {
                  setRol(e.target.value as RolAsignable);
                  setError(null);
                }}
              >
                {asignables.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Campo>

            {esNueva && (
              <Campo id="correo" label={rol === "Estudiante" ? "Correo (opcional)" : "Correo"}>
                <Input
                  id="correo"
                  type="email"
                  required={rol !== "Estudiante"}
                  maxLength={150}
                  placeholder={rol === "Estudiante" ? "Vacío: a<matrícula>@my.uvm.edu.mx" : undefined}
                  value={valor("correo")}
                  onChange={cambiar("correo")}
                />
              </Campo>
            )}

            {necesitaPerfil && (
              <>
                <Campo id="nombre" label="Nombre">
                  <Input id="nombre" required maxLength={100} value={valor("nombre")} onChange={cambiar("nombre")} />
                </Campo>
                <Campo id="apellidoPaterno" label="Apellido paterno">
                  <Input id="apellidoPaterno" required maxLength={100} value={valor("apellidoPaterno")} onChange={cambiar("apellidoPaterno")} />
                </Campo>
                <Campo id="apellidoMaterno" label="Apellido materno (opcional)">
                  <Input id="apellidoMaterno" maxLength={100} value={valor("apellidoMaterno")} onChange={cambiar("apellidoMaterno")} />
                </Campo>
              </>
            )}

            {necesitaPerfil && rol === "Estudiante" && (
              <Campo id="programaEducativoId" label="Programa educativo">
                <select id="programaEducativoId" required className={SELECT_CLASS} value={valor("programaEducativoId")} onChange={cambiar("programaEducativoId")}>
                  <option value="">Selecciona…</option>
                  {catalogos.programasEducativos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.nivelEducativo})
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            {necesitaPerfil && rol === "Docente" && (
              <Campo id="facultadId" label="Facultad">
                <select id="facultadId" required className={SELECT_CLASS} value={valor("facultadId")} onChange={cambiar("facultadId")}>
                  <option value="">Selecciona…</option>
                  {catalogos.facultades.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            {rol === "Estudiante" && (
              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-sm font-medium">Grupos en los que se inscribe (opcional)</legend>
                {grupos === null && !errorGrupos && <p className="text-xs text-muted-foreground">Cargando grupos…</p>}
                {errorGrupos && (
                  <p role="alert" className="text-xs text-destructive">
                    No se pudieron cargar los grupos. Puedes inscribir al alumno después, desde el grupo.
                  </p>
                )}
                {grupos !== null && gruposVisibles.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aún no hay grupos. Créalos en "Grupos"; luego puedes inscribir al alumno desde el grupo.</p>
                )}
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {gruposVisibles.map((g) => {
                    const lleno = estaLleno(g);
                    return (
                      <li key={g.id}>
                        <label className={`flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm ${lleno ? "opacity-50" : "cursor-pointer hover:bg-secondary"}`}>
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            disabled={lleno}
                            checked={gruposElegidos.includes(g.id)}
                            onChange={() => alternarGrupo(g.id)}
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {g.materia} · {g.seccion}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {g.docente} · {g.cupoMaximo > 0 ? `${g.inscritos}/${g.cupoMaximo}` : `${g.inscritos} inscritos`}
                              {lleno ? " · lleno" : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            )}

            {esNueva && (
              <Campo id="password" label="Contraseña temporal (mín. 8 caracteres)">
                <Input id="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={valor("password")} onChange={cambiar("password")} />
              </Campo>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancelar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando || (existente !== null && !existente.activo)} className="bg-brand text-brand-foreground hover:opacity-90">
              {enviando ? "Guardando..." : esNueva ? "Crear cuenta" : "Agregar rol"}
            </Button>
          </div>
        </form>
      )}

      {!(esNueva || existente) && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!busqueda && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
