import { Router } from "express";
import { GrupoController } from "../controllers/GrupoController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const materiasRouter = Router();

materiasRouter.use(requireAuth, requireRole("Coordinador", "Administrador"), limitadores.gestion);

materiasRouter.post("/", asyncHandler(GrupoController.crearMateria));
