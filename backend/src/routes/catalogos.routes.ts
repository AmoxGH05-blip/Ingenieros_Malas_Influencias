import { Router } from "express";
import { CuentaController } from "../controllers/CuentaController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const catalogosRouter = Router();

catalogosRouter.get("/", requireAuth, requireRole("Coordinador", "Administrador"), asyncHandler(CuentaController.catalogos));
