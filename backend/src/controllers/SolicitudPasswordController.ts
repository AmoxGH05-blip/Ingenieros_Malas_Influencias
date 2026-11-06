import { Request, Response } from "express";
import { SolicitudPasswordService } from "../services/SolicitudPasswordService";
import { actorDe, responderError } from "./CuentaController";

// Misma respuesta exista o no la cuenta (el codigo se entrega siempre): no se revela cuales numeros de cuenta existen.
const MENSAJE_SOLICITUD =
  "Si la cuenta existe, tu solicitud quedó pendiente. Coordinación la revisará; mientras no la aprueben, sigue valiendo tu contraseña anterior.";

export const SolicitudPasswordController = {
  /** Pública: la manda quien olvidó su contraseña, sin sesión. */
  async solicitar(req: Request, res: Response) {
    try {
      const { codigo, procesada } = await SolicitudPasswordService.solicitar(req.body?.numeroCuenta, req.body?.nuevaPassword);
      // Se responde antes de guardar; si el guardado falla se registra (sin el objeto del error, que trae parametros).
      procesada.catch((error: unknown) =>
        console.error("No se pudo guardar una solicitud de cambio de contraseña:", error instanceof Error ? error.message : error)
      );
      return res.json({ mensaje: MENSAJE_SOLICITUD, codigo });
    } catch (error) {
      return responderError(res, error);
    }
  },

  async listar(req: Request, res: Response) {
    try {
      return res.json({ solicitudes: await SolicitudPasswordService.listarPendientes(actorDe(req)) });
    } catch (error) {
      return responderError(res, error);
    }
  },

  async aprobar(req: Request, res: Response) {
    try {
      return res.json(await SolicitudPasswordService.resolver(actorDe(req), req.params.id, "aprobar", req.body?.codigo));
    } catch (error) {
      return responderError(res, error);
    }
  },

  async rechazar(req: Request, res: Response) {
    try {
      return res.json(await SolicitudPasswordService.resolver(actorDe(req), req.params.id, "rechazar"));
    } catch (error) {
      return responderError(res, error);
    }
  },
};
