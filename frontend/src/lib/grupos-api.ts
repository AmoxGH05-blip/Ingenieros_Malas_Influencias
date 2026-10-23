/** Capa de datos de materias, grupos e inscripciones (SCRUM-79): /api/grupos y /api/materias. */
import { apiFetch } from "@/lib/api";

export interface Grupo {
  id: number;
  materiaId: number;
  materia: string;
  claveMateria: string;
  docenteId: number;
  docente: string;
  periodoAcademicoId: number;
  periodo: string;
  seccion: string;
  /** 0 = sin límite de alumnos. */
  cupoMaximo: number;
  inscritos: number;
}

export interface AlumnoInscrito {
  estudianteId: number;
  numeroCuenta: string;
  nombre: string;
  fechaInscripcion: string;
}

export interface GrupoDetalle extends Grupo {
  alumnos: AlumnoInscrito[];
}

export interface NuevoGrupo {
  materiaId: number;
  docenteId: number;
  periodoAcademicoId: number;
  seccion: string;
  cupoMaximo?: number;
}

export interface NuevaMateria {
  programaEducativoId: number;
  clave: string;
  nombre: string;
  creditos?: number;
}

export interface Materia {
  id: number;
  programaEducativoId: number;
  clave: string;
  nombre: string;
  creditos: number;
}

/** Un grupo con cupo y sin lugares libres ya no admite más alumnos. */
export function estaLleno(grupo: Pick<Grupo, "cupoMaximo" | "inscritos">): boolean {
  return grupo.cupoMaximo > 0 && grupo.inscritos >= grupo.cupoMaximo;
}

export function getGrupos(periodoAcademicoId?: number): Promise<Grupo[]> {
  const sufijo = periodoAcademicoId ? `?periodoAcademicoId=${periodoAcademicoId}` : "";
  return apiFetch<Grupo[]>(`/grupos${sufijo}`);
}

export function getGrupo(id: number): Promise<GrupoDetalle> {
  return apiFetch<GrupoDetalle>(`/grupos/${id}`);
}

export function crearGrupo(datos: NuevoGrupo): Promise<Grupo> {
  return apiFetch<Grupo>("/grupos", { method: "POST", body: JSON.stringify(datos) });
}

export function inscribirAlumno(grupoId: number, numeroCuenta: string): Promise<{ grupoId: number; numeroCuenta: string; nombre: string }> {
  return apiFetch(`/grupos/${grupoId}/inscripciones`, { method: "POST", body: JSON.stringify({ numeroCuenta }) });
}

export function crearMateria(datos: NuevaMateria): Promise<Materia> {
  return apiFetch<Materia>("/materias", { method: "POST", body: JSON.stringify(datos) });
}
