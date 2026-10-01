import { Router } from "express";
import { EvaluacionController } from "../controllers/EvaluacionController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";

export const estudianteRouter = Router();

estudianteRouter.use(requireAuth);

estudianteRouter.get("/asignaciones", asyncHandler(EvaluacionController.listarAsignaciones));
estudianteRouter.get("/asignaciones/:id", asyncHandler(EvaluacionController.obtenerAsignacion));
estudianteRouter.post("/asignaciones/:id/respuestas", asyncHandler(EvaluacionController.registrarRespuesta));
estudianteRouter.get("/progreso", asyncHandler(EvaluacionController.progreso));
estudianteRouter.get("/instrumento", asyncHandler(EvaluacionController.obtenerInstrumento));
