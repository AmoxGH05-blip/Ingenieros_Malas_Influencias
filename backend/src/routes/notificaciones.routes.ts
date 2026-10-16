import { Router } from "express";
import { NotificacionController } from "../controllers/NotificacionController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";

export const notificacionesRouter = Router();

notificacionesRouter.get("/", requireAuth, asyncHandler(NotificacionController.listar));
