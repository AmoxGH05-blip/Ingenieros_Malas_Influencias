import { useEffect, useState } from "react";
import { Building2, GraduationCap, IdCard, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPerfil, type Perfil } from "@/lib/evaluaciones-api";

function Dato({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

/** SCRUM-36: datos del alumno (solo lectura). */
export function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    getPerfil()
      .then((p) => activo && setPerfil(p))
      .catch(() => activo && setError("No se pudo cargar tu perfil."));
    return () => {
      activo = false;
    };
  }, []);

  const iniciales = perfil
    ? perfil.nombreCompleto
        .split(" ")
        .slice(0, 2)
        .map((parte) => parte.charAt(0))
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Tus datos registrados en la institución.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {!perfil && !error && <div aria-busy className="h-64 animate-pulse rounded-xl bg-card" />}

      {perfil && (
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground">
              {iniciales}
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-xl">{perfil.nombreCompleto}</CardTitle>
              <CardDescription>Estudiante · {perfil.matricula}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Dato icon={IdCard} label="Matrícula" value={perfil.matricula} />
            <Dato icon={Mail} label="Correo" value={perfil.correo} />
            <Dato icon={GraduationCap} label="Programa educativo" value={`${perfil.programaEducativo} (${perfil.nivelEducativo})`} />
            <Dato icon={Building2} label="Facultad" value={perfil.facultad} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
