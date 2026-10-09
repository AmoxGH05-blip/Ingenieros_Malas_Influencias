import { PeriodoEvaluacionRepository } from "../repositories/PeriodoEvaluacionRepository";
import { GrupoRepository } from "../repositories/GrupoRepository";
import { MateriaRepository } from "../repositories/MateriaRepository";
import { DocenteRepository } from "../repositories/DocenteRepository";
import { InscripcionRepository } from "../repositories/InscripcionRepository";
import { EstudianteRepository } from "../repositories/EstudianteRepository";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { EvaluacionRepository } from "../repositories/EvaluacionRepository";
import { EnvioRecordatorioRepository } from "../repositories/EnvioRecordatorioRepository";
import { EmailService } from "./EmailService";

const DIA_MS = 24 * 60 * 60 * 1000;
/** Avisos a mandar: faltan 7, 3 o 1 dias para el cierre. */
const UMBRALES_DIAS = [1, 3, 7] as const;

export interface OpcionesRecordatorio {
  /** Solo para pruebas; por defecto es el momento actual. */
  ahora?: Date;
  /** Calcula a quien le tocaria el aviso sin enviar ni registrar nada. */
  simular?: boolean;
}

export interface ResultadoPeriodo {
  periodoId: number;
  nombre: string;
  diasRestantes: number;
  umbral: number;
  enviados: number;
  omitidosYaEnviado: number;
  omitidosSinPendientes: number;
  fallidos: { correo: string; error: string }[];
  /** Solo en simulacion: correos que recibirian el aviso. */
  destinatarios: string[];
}

export interface ResultadoRecordatorios {
  simulacion: boolean;
  ejecutadoEn: string;
  periodos: ResultadoPeriodo[];
}

interface PeriodoActivo {
  id: number;
  nombre: string;
  periodoAcademicoId: number;
  fechaFin: Date;
}

interface Pendientes {
  /** Materias que cada alumno aun no evalua, como "Materia (Apellido, Nombre)". */
  porAlumno: Map<number, string[]>;
  /** Alumnos con al menos una inscripcion en el ciclo, para distinguir "sin pendientes" de "no inscrito". */
  inscritos: Set<number>;
}

/** Dias que faltan para el cierre, redondeando hacia arriba (2.2 dias cuentan como 3). */
export function diasRestantes(ahora: Date, fechaFin: Date): number {
  return Math.ceil((fechaFin.getTime() - ahora.getTime()) / DIA_MS);
}

/**
 * Aviso que corresponde a los dias restantes: el umbral mas chico que los cubre. Si una corrida se
 * salta un dia (por ejemplo, el cron fallo), el aviso se manda en cuanto vuelve a correr; nunca antes
 * de que falten 7 dias ni despues del cierre.
 */
export function umbralDeAviso(dias: number): number | null {
  if (dias <= 0) return null;
  return UMBRALES_DIAS.find((umbral) => dias <= umbral) ?? null;
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
}

/**
 * Parte de Inscripcion (quien DEBE evaluar) y no de Evaluacion: las filas de Evaluacion se crean al
 * abrir el dashboard, asi que quien nunca entro no tiene fila y igual debe recibir el aviso.
 */
async function calcularPendientes(periodo: PeriodoActivo): Promise<Pendientes> {
  const grupos = (await GrupoRepository.find()).filter((g) => g.periodoAcademicoId === periodo.periodoAcademicoId);
  const grupoPorId = new Map(grupos.map((g) => [g.id, g]));

  const [inscripciones, completadas, materias, docentes] = await Promise.all([
    InscripcionRepository.find(),
    EvaluacionRepository.find({ where: { periodoEvaluacionId: periodo.id, completada: true } }),
    MateriaRepository.findByIds(grupos.map((g) => g.materiaId)),
    DocenteRepository.findByIds(grupos.map((g) => g.docenteId)),
  ]);
  const materiaPorId = new Map(materias.map((m) => [m.id, m.nombre]));
  const docentePorId = new Map(docentes.map((d) => [d.id, `${d.apellidoPaterno}, ${d.nombre}`]));
  const hechas = new Set(completadas.map((e) => `${e.estudianteId}:${e.grupoId}`));

  const porAlumno = new Map<number, string[]>();
  const inscritos = new Set<number>();
  for (const inscripcion of inscripciones) {
    const grupo = grupoPorId.get(inscripcion.grupoId);
    if (!grupo) continue;
    inscritos.add(inscripcion.estudianteId);
    if (hechas.has(`${inscripcion.estudianteId}:${inscripcion.grupoId}`)) continue;
    const etiqueta = `${materiaPorId.get(grupo.materiaId) ?? "Materia"} (${docentePorId.get(grupo.docenteId) ?? "Docente"})`;
    porAlumno.set(inscripcion.estudianteId, [...(porAlumno.get(inscripcion.estudianteId) ?? []), etiqueta]);
  }
  return { porAlumno, inscritos };
}

async function enviarAviso(
  periodo: PeriodoActivo,
  usuario: { id: number; correoElectronico: string },
  nombre: string,
  dias: number,
  umbral: number,
  pendientes: string[],
  resultado: ResultadoPeriodo
): Promise<void> {
  // Se reserva antes de enviar: la clave unica evita que dos corridas simultaneas manden el mismo correo.
  const reservado = await EnvioRecordatorioRepository.reservar(periodo.id, usuario.id, umbral);
  if (!reservado) {
    resultado.omitidosYaEnviado += 1;
    return;
  }
  try {
    await EmailService.enviarRecordatorioEvaluacion(usuario.correoElectronico, {
      nombre,
      diasRestantes: dias,
      fechaFin: periodo.fechaFin,
      pendientes,
    });
    resultado.enviados += 1;
  } catch (error) {
    // Sin reserva, la siguiente corrida lo reintenta.
    await EnvioRecordatorioRepository.liberar(periodo.id, usuario.id, umbral);
    const mensaje = mensajeDeError(error);
    console.error(`Recordatorio no enviado a ${usuario.correoElectronico}: ${mensaje}`);
    resultado.fallidos.push({ correo: usuario.correoElectronico, error: mensaje });
  }
}

async function procesarPeriodo(periodo: PeriodoActivo, dias: number, umbral: number, simular: boolean): Promise<ResultadoPeriodo> {
  const resultado: ResultadoPeriodo = {
    periodoId: periodo.id,
    nombre: periodo.nombre,
    diasRestantes: dias,
    umbral,
    enviados: 0,
    omitidosYaEnviado: 0,
    omitidosSinPendientes: 0,
    fallidos: [],
    destinatarios: [],
  };

  const [pendientes, estudiantes, usuarios, yaAvisados] = await Promise.all([
    calcularPendientes(periodo),
    EstudianteRepository.find(),
    UsuarioRepository.find(),
    EnvioRecordatorioRepository.find({ where: { periodoEvaluacionId: periodo.id, diasAntes: umbral } }),
  ]);
  const avisados = new Set(yaAvisados.map((envio) => envio.usuarioId));
  const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));

  for (const estudiante of estudiantes) {
    const usuario = usuarioPorId.get(estudiante.usuarioId);
    if (!usuario?.activo) continue;

    const materiasPendientes = pendientes.porAlumno.get(estudiante.id);
    if (!materiasPendientes) {
      if (pendientes.inscritos.has(estudiante.id)) resultado.omitidosSinPendientes += 1;
      continue;
    }
    if (avisados.has(usuario.id)) {
      resultado.omitidosYaEnviado += 1;
      continue;
    }
    if (simular) {
      resultado.destinatarios.push(usuario.correoElectronico);
      continue;
    }
    await enviarAviso(periodo, usuario, estudiante.nombre, dias, umbral, materiasPendientes, resultado);
  }

  return resultado;
}

export const RecordatorioService = {
  async ejecutar({ ahora = new Date(), simular = false }: OpcionesRecordatorio = {}): Promise<ResultadoRecordatorios> {
    const activos = await PeriodoEvaluacionRepository.find({ where: { activo: true } });
    const periodos: ResultadoPeriodo[] = [];

    for (const periodo of activos) {
      if (ahora < periodo.fechaInicio || ahora >= periodo.fechaFin) continue;
      const dias = diasRestantes(ahora, periodo.fechaFin);
      const umbral = umbralDeAviso(dias);
      if (umbral === null) continue;
      periodos.push(await procesarPeriodo(periodo, dias, umbral, simular));
    }

    return { simulacion: simular, ejecutadoEn: ahora.toISOString(), periodos };
  },
};
