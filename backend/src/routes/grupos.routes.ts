import { Router } from "express";
import { GrupoController } from "../controllers/GrupoController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const gruposRouter = Router();

gruposRouter.use(requireAuth, requireRole("Coordinador", "Administrador"), limitadores.gestion);

gruposRouter.get("/", asyncHandler(GrupoController.listar));
gruposRouter.post("/", asyncHandler(GrupoController.crear));
gruposRouter.get("/:id", asyncHandler(GrupoController.detalle));
gruposRouter.post("/:id/inscripciones", asyncHandler(GrupoController.inscribir));
