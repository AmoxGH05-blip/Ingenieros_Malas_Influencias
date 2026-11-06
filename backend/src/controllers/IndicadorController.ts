import { Request, Response } from "express";
import { IndicadorService } from "../services/IndicadorService";
import { responderError } from "./CuentaController";

export const IndicadorController = {
  async ranking(req: Request, res: Response) {
    try {
      return res.json(await IndicadorService.ranking(req.query.periodoId));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async historico(req: Request, res: Response) {
    try {
      return res.json(await IndicadorService.historico(req.params.id, req.query.ultimos));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async mio(req: Request, res: Response) {
    try {
      return res.json(await IndicadorService.mio(req.usuarioId!));
    } catch (error) {
      return responderError(res, error);
    }
  },
};
