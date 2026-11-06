import { Router } from "express";
import { IndicadorController } from "../controllers/IndicadorController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const indicadoresRouter = Router();

indicadoresRouter.use(requireAuth);

// El docente solo ve lo suyo: no recibe un id, se toma de su sesion.
indicadoresRouter.get("/mio", requireRole("Docente"), asyncHandler(IndicadorController.mio));

// Ranking y historico de cualquier docente: solo Coordinacion y Administracion.
indicadoresRouter.get("/docentes", requireRole("Coordinador", "Administrador"), asyncHandler(IndicadorController.ranking));
indicadoresRouter.get(
  "/docentes/:id/historico",
  requireRole("Coordinador", "Administrador"),
  asyncHandler(IndicadorController.historico)
);
