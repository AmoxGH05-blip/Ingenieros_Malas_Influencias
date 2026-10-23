import { Request, Response } from "express";
import { CatalogoService } from "../services/CatalogoService";
import { GrupoService } from "../services/GrupoService";
import { MateriaService } from "../services/MateriaService";
import { actorDe, responderError } from "./CuentaController";

export const GrupoController = {
  async catalogos(_req: Request, res: Response) {
    return res.json(await CatalogoService.obtener());
  },

  async listar(req: Request, res: Response) {
    try {
      return res.json(await GrupoService.listar(actorDe(req), req.query.periodoAcademicoId));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async crear(req: Request, res: Response) {
    try {
      return res.status(201).json(await GrupoService.crear(actorDe(req), req.body ?? {}));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async detalle(req: Request, res: Response) {
    try {
      return res.json(await GrupoService.detalle(actorDe(req), req.params.id));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async inscribir(req: Request, res: Response) {
    try {
      const resultado = await GrupoService.inscribir(actorDe(req), req.params.id, req.body?.numeroCuenta);
      return res.status(201).json(resultado);
    } catch (error) {
      return responderError(res, error);
    }
  },

  async crearMateria(req: Request, res: Response) {
    try {
      return res.status(201).json(await MateriaService.crear(actorDe(req), req.body ?? {}));
    } catch (error) {
      return responderError(res, error);
    }
  },
};
