import { Request, Response } from "express";
import { TallerService } from "../services/TallerService";
import { EvaluacionTallerService } from "../services/EvaluacionTallerService";
import { responderError } from "./CuentaController";

/** Configuracion y resultados de talleres (Coordinacion y Administracion) y evaluacion de talleres del alumno. */
export const TallerController = {
  async configuracion(_req: Request, res: Response) {
    try {
      return res.json(await TallerService.configuracion());
    } catch (error) {
      return responderError(res, error);
    }
  },

  async crear(req: Request, res: Response) {
    try {
      return res.status(201).json(await TallerService.crear(req.body));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async actualizar(req: Request, res: Response) {
    try {
      return res.json(await TallerService.actualizar(req.params.id, req.body));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async habilitarCarrera(req: Request, res: Response) {
    try {
      return res.json(await TallerService.habilitarCarrera(req.params.id, req.body));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async resultados(req: Request, res: Response) {
    try {
      return res.json(await TallerService.resultados(req.query.periodoId));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async listarDelAlumno(req: Request, res: Response) {
    try {
      return res.json(await EvaluacionTallerService.listar(req.usuarioId!));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async instrumentoDelAlumno(_req: Request, res: Response) {
    try {
      return res.json(await EvaluacionTallerService.instrumento());
    } catch (error) {
      return responderError(res, error);
    }
  },

  async registrarDelAlumno(req: Request, res: Response) {
    try {
      await EvaluacionTallerService.registrar(req.usuarioId!, req.params.id, (req.body ?? {}).respuestas);
      return res.status(201).json({ mensaje: "Evaluacion registrada" });
    } catch (error) {
      return responderError(res, error);
    }
  },
};
