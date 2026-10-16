import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";
import { diasRestantes } from "../utils/fechas";

/** El aviso al alumno empieza cuando faltan 7 dias de calendario o menos para el cierre (0 = cierra hoy). */
const DIAS_AVISO = 7;
const DIAS_AVISO_FUERTE = 3;

export type Severidad = "info" | "aviso" | "urgente";

export interface Notificacion {
  id: string;
  tipo: "evaluaciones-pendientes";
  severidad: Severidad;
  titulo: string;
  mensaje: string;
  enlace: string;
  diasRestantes: number;
  /** Materias sin evaluar, como "Materia (Apellido, Nombre)". */
  pendientes: string[];
}

function severidadPara(dias: number): Severidad {
  if (dias <= 1) return "urgente";
  if (dias <= DIAS_AVISO_FUERTE) return "aviso";
  return "info";
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });
}

/**
 * Evaluaciones que el alumno aun debe enviar en el periodo activo. Solo lee: a diferencia del dashboard
 * no crea filas de Evaluacion, asi que consultar avisos no cambia datos.
 */
async function notificacionDeEvaluaciones(usuarioId: number, ahora: Date): Promise<Notificacion | null> {
  const estudiante = await EstudianteRepository.findByUsuarioId(usuarioId);
  if (!estudiante) return null;

  const periodo = await PeriodoEvaluacionRepository.findActivo();
  if (!periodo || ahora < periodo.fechaInicio || ahora >= periodo.fechaFin) return null;

  const dias = diasRestantes(ahora, periodo.fechaFin);
  if (dias < 0 || dias > DIAS_AVISO) return null;

  const inscripciones = await InscripcionRepository.findByEstudianteId(estudiante.id);
  const grupos = (await GrupoRepository.findByIds(inscripciones.map((i) => i.grupoId))).filter(
    (g) => g.periodoAcademicoId === periodo.periodoAcademicoId
  );
  if (grupos.length === 0) return null;

  const [materias, docentes, evaluaciones] = await Promise.all([
    MateriaRepository.findByIds(grupos.map((g) => g.materiaId)),
    DocenteRepository.findByIds(grupos.map((g) => g.docenteId)),
    EvaluacionRepository.findByEstudianteAndPeriodo(estudiante.id, periodo.id),
  ]);
  const materiaPorId = new Map(materias.map((m) => [m.id, m.nombre]));
  const docentePorId = new Map(docentes.map((d) => [d.id, `${d.apellidoPaterno}, ${d.nombre}`]));
  const completadas = new Set(evaluaciones.filter((e) => e.completada).map((e) => e.grupoId));

  const pendientes = grupos
    .filter((g) => !completadas.has(g.id))
    .map((g) => `${materiaPorId.get(g.materiaId) ?? "Materia"} (${docentePorId.get(g.docenteId) ?? "Docente"})`);
  if (pendientes.length === 0) return null;

  const titulo = dias === 0 ? "Hoy cierra la evaluación docente" : `${dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`} para cerrar la evaluación docente`;
  const cantidad = pendientes.length === 1 ? "1 evaluación pendiente" : `${pendientes.length} evaluaciones pendientes`;
  return {
    id: `evaluaciones-pendientes:${periodo.id}`,
    tipo: "evaluaciones-pendientes",
    severidad: severidadPara(dias),
    titulo,
    mensaje: `Tienes ${cantidad}. La evaluación cierra el ${formatearFecha(periodo.fechaFin)}.`,
    enlace: "/estudiante/evaluaciones",
    diasRestantes: dias,
    pendientes,
  };
}

export const NotificacionService = {
  /** Avisos que se muestran al iniciar sesion, segun los roles de la cuenta. */
  async obtener(usuarioId: number, roles: string[], ahora: Date = new Date()): Promise<Notificacion[]> {
    const avisos: Notificacion[] = [];
    if (roles.includes("Estudiante")) {
      const evaluaciones = await notificacionDeEvaluaciones(usuarioId, ahora);
      if (evaluaciones) avisos.push(evaluaciones);
    }
    return avisos;
  },
};
