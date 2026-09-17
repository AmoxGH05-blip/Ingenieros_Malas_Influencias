import { Request, Response } from "express";
import { RolService } from "../services/RolService";

export const RolController = {
  async listar(_req: Request, res: Response) {
    const roles = await RolService.listarRoles();
    res.json(roles);
  },
};
