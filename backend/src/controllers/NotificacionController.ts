import { Request, Response } from "express";
import { NotificacionService } from "../services/NotificacionService";

export const NotificacionController = {
  async listar(req: Request, res: Response) {
    const notificaciones = await NotificacionService.obtener(req.usuarioId!, req.roles ?? []);
    return res.json({ notificaciones });
  },
};
