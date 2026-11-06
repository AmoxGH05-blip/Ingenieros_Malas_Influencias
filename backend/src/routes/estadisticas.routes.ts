import { Router } from "express";
import { EstadisticaController } from "../controllers/EstadisticaController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const estadisticasRouter = Router();

// Cifras de toda la institucion: solo Coordinacion y Administracion.
estadisticasRouter.use(requireAuth, requireRole("Coordinador", "Administrador"));

estadisticasRouter.get("/institucional", asyncHandler(EstadisticaController.institucional));
