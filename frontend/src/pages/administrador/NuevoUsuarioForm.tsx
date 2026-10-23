import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { ROLES_CREABLES, crearUsuario, type Catalogos, type NuevoUsuario, type RolCreable } from "@/lib/admin-api";

interface NuevoUsuarioFormProps {
  catalogos: Catalogos;
  onCreado: (numeroCuenta: string) => void | Promise<void>;
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

/** Formulario de alta: los campos cambian según el rol elegido. */
export function NuevoUsuarioForm({ catalogos, onCreado, onCancelar }: NuevoUsuarioFormProps) {
  const [rol, setRol] = useState<RolCreable>("Estudiante");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esAlumno = rol === "Estudiante";
  const esDocente = rol === "Docente";
  const conPerfil = esAlumno || esDocente;
  const valor = (k: string) => campos[k] ?? "";
  const cambiar = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCampos((prev) => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setEnviando(true);
    const datos: NuevoUsuario = {
      rol,
      numeroCuenta: valor("numeroCuenta"),
      correo: valor("correo") || undefined,
      password: valor("password"),
      ...(conPerfil && {
        nombre: valor("nombre"),
        apellidoPaterno: valor("apellidoPaterno"),
        apellidoMaterno: valor("apellidoMaterno") || undefined,
      }),
      ...(esAlumno && { programaEducativoId: Number(valor("programaEducativoId")) }),
      ...(esDocente && { facultadId: Number(valor("facultadId")) }),
    };
    try {
      const creado = await crearUsuario(datos);
      await onCreado(creado.numeroCuenta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="rol" label="Rol">
          <select
            id="rol"
            className={SELECT_CLASS}
            value={rol}
            onChange={(e) => {
              setRol(e.target.value as RolCreable);
              setError(null);
            }}
          >
            {ROLES_CREABLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="numeroCuenta" label={esAlumno ? "Matrícula (número de cuenta)" : esDocente ? "Número de empleado (número de cuenta)" : "Número de cuenta"}>
          <Input
            id="numeroCuenta"
            required
            maxLength={20}
            pattern="[A-Za-z0-9]+"
            title="Solo letras y números, sin espacios"
            autoComplete="off"
            value={valor("numeroCuenta")}
            onChange={cambiar("numeroCuenta")}
          />
        </Campo>
        <Campo id="correo" label={esAlumno ? "Correo (opcional)" : "Correo"}>
          <Input
            id="correo"
            type="email"
            required={!esAlumno}
            maxLength={150}
            placeholder={esAlumno ? "Vacío: a<matrícula>@my.uvm.edu.mx" : undefined}
            value={valor("correo")}
            onChange={cambiar("correo")}
          />
        </Campo>

        {conPerfil && (
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

        {esAlumno && (
          <>
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
          </>
        )}

        {esDocente && (
          <>
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
          </>
        )}

        <Campo id="password" label="Contraseña temporal (mín. 8 caracteres)">
          <Input id="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={valor("password")} onChange={cambiar("password")} />
        </Campo>
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
        <Button type="submit" disabled={enviando} className="bg-brand text-brand-foreground hover:opacity-90">
          {enviando ? "Creando..." : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
