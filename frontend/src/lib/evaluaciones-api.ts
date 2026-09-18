/**
 * Capa de datos de evaluaciones del estudiante (SCRUM-35 / SCRUM-36).
 *
 * TODO(SCRUM-33/34): las APIs del backend aún no existen. Mientras tanto estas
 * funciones devuelven datos simulados en memoria con la MISMA forma que tendrá la
 * respuesta real. Al publicarse los endpoints, solo hay que reemplazar el cuerpo
 * de cada función por un `apiFetch(...)` — las pantallas no cambian.
 */

export interface Asignacion {
  id: number;
  docente: string;
  materia: string;
  grupo: string;
  completada: boolean;
  fechaEvaluacion: string | null;
}

export interface OpcionRespuesta {
  texto: string;
  valor: number;
}

export interface Pregunta {
  id: number;
  texto: string;
}

export interface Seccion {
  id: number;
  nombre: string;
  preguntas: Pregunta[];
}

export interface Instrumento {
  nombre: string;
  escala: OpcionRespuesta[];
  secciones: Seccion[];
}

/** Respuestas del alumno: id de pregunta → valor elegido de la escala. */
export type Respuestas = Record<number, number>;

const asignaciones: Asignacion[] = [
  { id: 1, docente: "García López, Ana", materia: "Base de Datos", grupo: "3A", completada: true, fechaEvaluacion: "2026-09-15" },
  { id: 2, docente: "Ramírez Soto, Beatriz", materia: "Redes de Computadoras", grupo: "3A", completada: true, fechaEvaluacion: "2026-09-16" },
  { id: 3, docente: "Hernández Cruz, Luis", materia: "Ingeniería de Software", grupo: "3A", completada: false, fechaEvaluacion: null },
  { id: 4, docente: "Martínez Vega, Carlos", materia: "Sistemas Operativos", grupo: "3A", completada: false, fechaEvaluacion: null },
  { id: 5, docente: "Torres Núñez, Elena", materia: "Cálculo Vectorial", grupo: "3A", completada: false, fechaEvaluacion: null },
];

// Instrumento borrador estándar de database/migrations/003_cuestionario_evaluacion_docente.sql
const instrumento: Instrumento = {
  nombre: "Evaluación Docente 2026",
  escala: [
    { texto: "Totalmente en desacuerdo", valor: 0 },
    { texto: "En desacuerdo", valor: 2.5 },
    { texto: "Neutral", valor: 5 },
    { texto: "De acuerdo", valor: 7.5 },
    { texto: "Totalmente de acuerdo", valor: 10 },
  ],
  secciones: [
    {
      id: 1,
      nombre: "Dominio y organización de la materia",
      preguntas: [
        { id: 1, texto: "El docente domina los temas que imparte." },
        { id: 2, texto: "El docente explica los temas con claridad." },
        { id: 3, texto: "El docente relaciona la teoría con ejemplos prácticos." },
        { id: 4, texto: "El docente cumple con el temario y los objetivos del curso." },
      ],
    },
    {
      id: 2,
      nombre: "Metodología y evaluación",
      preguntas: [
        { id: 5, texto: "El docente utiliza materiales y recursos didácticos adecuados." },
        { id: 6, texto: "Las actividades y tareas asignadas contribuyen a mi aprendizaje." },
        { id: 7, texto: "Los criterios de evaluación fueron claros desde el inicio del curso." },
        { id: 8, texto: "La forma de evaluar (exámenes, tareas, proyectos) fue justa." },
      ],
    },
    {
      id: 3,
      nombre: "Puntualidad y responsabilidad",
      preguntas: [
        { id: 9, texto: "El docente es puntual al iniciar y terminar la clase." },
        { id: 10, texto: "El docente asiste regularmente a sus clases." },
        { id: 11, texto: "El docente entrega calificaciones y retroalimentación en tiempo razonable." },
      ],
    },
    {
      id: 4,
      nombre: "Trato y comunicación",
      preguntas: [
        { id: 12, texto: "El docente muestra respeto hacia los estudiantes." },
        { id: 13, texto: "El docente fomenta la participación en clase." },
        { id: 14, texto: "El docente está disponible para resolver dudas fuera de clase." },
        { id: 15, texto: "En general, recomendaría a este docente a otros estudiantes." },
      ],
    },
  ],
};

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAsignaciones(): Promise<Asignacion[]> {
  await delay();
  return asignaciones.map((a) => ({ ...a }));
}

export async function getAsignacion(id: number): Promise<Asignacion | undefined> {
  await delay(100);
  return asignaciones.find((a) => a.id === id);
}

export async function getInstrumento(): Promise<Instrumento> {
  await delay(100);
  return instrumento;
}

export async function enviarEvaluacion(asignacionId: number, respuestas: Respuestas): Promise<void> {
  await delay(500);
  const asignacion = asignaciones.find((a) => a.id === asignacionId);
  if (!asignacion) throw new Error("Asignación no encontrada");
  if (asignacion.completada) throw new Error("Esta evaluación ya fue registrada");
  const total = instrumento.secciones.reduce((n, s) => n + s.preguntas.length, 0);
  if (Object.keys(respuestas).length !== total) throw new Error("Faltan preguntas por responder");
  asignacion.completada = true;
  asignacion.fechaEvaluacion = new Date().toISOString().slice(0, 10);
}
