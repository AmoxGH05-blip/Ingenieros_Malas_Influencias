import { Router } from "express";
import { CuentaController } from "../controllers/CuentaController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const cuentasRouter = Router();

// El Coordinador gestiona alumnos y docentes; el Administrador, todas. El detalle de quien puede que lo decide CuentaService.
cuentasRouter.use(requireAuth, requireRole("Coordinador", "Administrador"));

cuentasRouter.get("/", asyncHandler(CuentaController.listar));
cuentasRouter.get("/buscar", asyncHandler(CuentaController.buscar));
cuentasRouter.post("/", asyncHandler(CuentaController.crear));
