import { SeccionInstrumentoRepository } from "../repositories/SeccionInstrumentoRepository";
import { PreguntaRepository } from "../repositories/PreguntaRepository";
import { OpcionRespuestaRepository } from "../repositories/OpcionRespuestaRepository";
import type { InstrumentoEvaluacion } from "../entities";

export interface InstrumentoDTO {
  nombre: string;
  escala: { texto: string; valor: number }[];
  secciones: { id: number; nombre: string; preguntas: { id: number; texto: string }[] }[];
}

const aNumero = (valor: string | number): number => (typeof valor === "number" ? valor : Number(valor));

/** Arma lo que ve el alumno de un instrumento (docentes o talleres): secciones, preguntas y la escala de respuesta. */
export async function armarInstrumento(instrumento: InstrumentoEvaluacion): Promise<InstrumentoDTO> {
  const secciones = await SeccionInstrumentoRepository.findByInstrumentoId(instrumento.id);
  const preguntas = await PreguntaRepository.findBySeccionIds(secciones.map((s) => s.id));
  const opciones = await OpcionRespuestaRepository.findByPreguntaIds(preguntas.map((p) => p.id));

  const escalaPorValor = new Map<number, string>();
  for (const opcion of opciones) escalaPorValor.set(aNumero(opcion.valor), opcion.texto);
  const escala = [...escalaPorValor.entries()].sort((a, b) => a[0] - b[0]).map(([valor, texto]) => ({ texto, valor }));

  return {
    nombre: instrumento.nombre,
    escala,
    secciones: secciones.map((seccion) => ({
      id: seccion.id,
      nombre: seccion.nombre,
      preguntas: preguntas.filter((p) => p.seccionInstrumentoId === seccion.id).map((p) => ({ id: p.id, texto: p.texto })),
    })),
  };
}
