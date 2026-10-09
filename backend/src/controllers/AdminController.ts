import { Request, Response } from "express";
import { AdminService, DatosInvalidosError, UsuarioDuplicadoError } from "../services/AdminService";

export const AdminController = {
  async catalogos(_req: Request, res: Response) {
    return res.json(await AdminService.obtenerCatalogos());
  },

  async listarUsuarios(_req: Request, res: Response) {
    return res.json(await AdminService.listarUsuarios());
  },

  async crearUsuario(req: Request, res: Response) {
    try {
      const creado = await AdminService.crearUsuario(req.body ?? {});
      return res.status(201).json(creado);
    } catch (error) {
      if (error instanceof DatosInvalidosError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof UsuarioDuplicadoError) {
        return res.status(409).json({ error: error.message });
      }
      throw error;
    }
  },
};
