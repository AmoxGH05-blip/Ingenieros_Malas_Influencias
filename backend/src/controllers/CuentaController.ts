import { Request, Response } from "express";
import { CuentaService } from "../services/CuentaService";
import { ConflictoError, DatosInvalidosError, NoEncontradoError, PermisoDenegadoError } from "../utils/errores";
import type { Actor } from "../utils/permisos";

/** Quien hace la peticion sale del token (requireAuth), nunca del cuerpo. */
export function actorDe(req: Request): Actor {
  return { usuarioId: req.usuarioId!, roles: req.roles ?? [] };
}

/** Traduce los errores de negocio de cuentas, materias y grupos a su codigo HTTP; el resto sigue al manejador general (500). */
export function responderError(res: Response, error: unknown) {
  if (error instanceof DatosInvalidosError) return res.status(400).json({ error: error.message });
  if (error instanceof PermisoDenegadoError) return res.status(403).json({ error: error.message });
  if (error instanceof NoEncontradoError) return res.status(404).json({ error: error.message });
  if (error instanceof ConflictoError) return res.status(409).json({ error: error.message });
  throw error;
}

export const CuentaController = {
  async listar(req: Request, res: Response) {
    try {
      return res.json(await CuentaService.listar(actorDe(req)));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async buscar(req: Request, res: Response) {
    try {
      return res.json(await CuentaService.buscar(actorDe(req), req.query.numeroCuenta));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async crear(req: Request, res: Response) {
    try {
      const resultado = await CuentaService.crear(actorDe(req), req.body ?? {});
      return res.status(resultado.creada ? 201 : 200).json(resultado);
    } catch (error) {
      return responderError(res, error);
    }
  },
};
