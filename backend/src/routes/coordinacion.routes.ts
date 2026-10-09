import { Router } from "express";
import { CoordinacionController } from "../controllers/CoordinacionController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const coordinacionRouter = Router();

coordinacionRouter.use(requireAuth, requireRole("Coordinador", "Administrador"));

coordinacionRouter.get("/filtros", asyncHandler(CoordinacionController.filtros));
coordinacionRouter.get("/avance", asyncHandler(CoordinacionController.avance));
