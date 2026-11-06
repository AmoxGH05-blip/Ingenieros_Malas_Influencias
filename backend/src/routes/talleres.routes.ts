import { Router } from "express";
import { TallerController } from "../controllers/TallerController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const talleresRouter = Router();

// Configurar talleres y ver sus resultados: solo Coordinacion y Administracion.
talleresRouter.use(requireAuth, requireRole("Coordinador", "Administrador"), limitadores.gestion);

talleresRouter.get("/", asyncHandler(TallerController.configuracion));
talleresRouter.get("/resultados", asyncHandler(TallerController.resultados));
talleresRouter.post("/", asyncHandler(TallerController.crear));
talleresRouter.patch("/carreras/:id", asyncHandler(TallerController.habilitarCarrera));
talleresRouter.patch("/:id", asyncHandler(TallerController.actualizar));
