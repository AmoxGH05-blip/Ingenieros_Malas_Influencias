import { Router } from "express";
import { SolicitudPasswordController } from "../controllers/SolicitudPasswordController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const solicitudesPasswordRouter = Router();

// Quien resuelve es Coordinacion o Administracion; el servicio ademas limita a las cuentas que cada uno gestiona.
solicitudesPasswordRouter.use(requireAuth, requireRole("Coordinador", "Administrador"), limitadores.gestion);

solicitudesPasswordRouter.get("/", asyncHandler(SolicitudPasswordController.listar));
solicitudesPasswordRouter.post("/:id/aprobar", asyncHandler(SolicitudPasswordController.aprobar));
solicitudesPasswordRouter.post("/:id/rechazar", asyncHandler(SolicitudPasswordController.rechazar));
