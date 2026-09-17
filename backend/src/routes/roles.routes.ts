import { Router } from "express";
import { RolController } from "../controllers/RolController";

export const rolesRouter = Router();

rolesRouter.get("/", RolController.listar);
