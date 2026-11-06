import { Request, Response } from "express";
import { EstadisticaService } from "../services/EstadisticaService";
import { responderError } from "./CuentaController";

export const EstadisticaController = {
  async institucional(req: Request, res: Response) {
    try {
      return res.json(await EstadisticaService.institucional(req.query.periodoId));
    } catch (error) {
      return responderError(res, error);
    }
  },
};
