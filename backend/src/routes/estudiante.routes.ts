import { Router } from "express";
import { EvaluacionController } from "../controllers/EvaluacionController";
import { TallerController } from "../controllers/TallerController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuth } from "../middlewares/requireAuth";

export const estudianteRouter = Router();

estudianteRouter.use(requireAuth);

estudianteRouter.get("/asignaciones", asyncHandler(EvaluacionController.listarAsignaciones));
estudianteRouter.get("/asignaciones/:id", asyncHandler(EvaluacionController.obtenerAsignacion));
estudianteRouter.post("/asignaciones/:id/respuestas", asyncHandler(EvaluacionController.registrarRespuesta));
estudianteRouter.get("/progreso", asyncHandler(EvaluacionController.progreso));
estudianteRouter.get("/perfil", asyncHandler(EvaluacionController.perfil));
estudianteRouter.get("/instrumento", asyncHandler(EvaluacionController.obtenerInstrumento));

// Talleres y laboratorios de la carrera del alumno (RF08).
// El envio hace varias consultas: tope por usuario para que un alumno no sature la API.
estudianteRouter.get("/talleres", limitadores.gestion, asyncHandler(TallerController.listarDelAlumno));
estudianteRouter.get("/talleres/instrumento", limitadores.gestion, asyncHandler(TallerController.instrumentoDelAlumno));
estudianteRouter.post("/talleres/:id/respuestas", limitadores.gestion, asyncHandler(TallerController.registrarDelAlumno));
