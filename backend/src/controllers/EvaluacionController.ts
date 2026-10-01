import { Request, Response } from "express";
import {
  EvaluacionService,
  EstudianteNoEncontradoError,
  AsignacionNoEncontradaError,
  EvaluacionYaCompletadaError,
  RespuestasIncompletasError,
} from "../services/EvaluacionService";

export const EvaluacionController = {
  async listarAsignaciones(req: Request, res: Response) {
    try {
      const asignaciones = await EvaluacionService.listarAsignaciones(req.usuarioId!);
      return res.json(asignaciones);
    } catch (error) {
      if (error instanceof EstudianteNoEncontradoError) {
        return res.status(403).json({ error: "Esta cuenta no tiene un perfil de estudiante" });
      }
      throw error;
    }
  },

  async obtenerAsignacion(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "id invalido" });
    }
    const asignacion = await EvaluacionService.obtenerAsignacion(req.usuarioId!, id);
    if (!asignacion) {
      return res.status(404).json({ error: "Asignacion no encontrada" });
    }
    return res.json(asignacion);
  },

  async progreso(req: Request, res: Response) {
    const resumen = await EvaluacionService.progreso(req.usuarioId!);
    return res.json(resumen);
  },

  async obtenerInstrumento(_req: Request, res: Response) {
    const instrumento = await EvaluacionService.obtenerInstrumentoActivo();
    if (!instrumento) {
      return res.status(404).json({ error: "No hay un instrumento de evaluacion activo" });
    }
    return res.json(instrumento);
  },

  async registrarRespuesta(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { respuestas } = req.body ?? {};
    if (!Number.isInteger(id) || typeof respuestas !== "object" || respuestas === null) {
      return res.status(400).json({ error: "id y respuestas son requeridos" });
    }

    try {
      await EvaluacionService.registrarRespuesta(req.usuarioId!, id, respuestas);
      return res.json({ mensaje: "Evaluacion registrada" });
    } catch (error) {
      if (error instanceof AsignacionNoEncontradaError) {
        return res.status(404).json({ error: "Asignacion no encontrada" });
      }
      if (error instanceof EvaluacionYaCompletadaError) {
        return res.status(409).json({ error: "Esta evaluacion ya fue registrada" });
      }
      if (error instanceof RespuestasIncompletasError) {
        return res.status(400).json({ error: "Faltan preguntas por responder" });
      }
      throw error;
    }
  },
};
