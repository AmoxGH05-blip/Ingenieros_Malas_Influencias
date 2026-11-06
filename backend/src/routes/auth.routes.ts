import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { SolicitudPasswordController } from "../controllers/SolicitudPasswordController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { limitadores } from "../middlewares/limitadores";
import { requireAuthPermitiendoCambioPassword } from "../middlewares/requireAuth";

export const authRouter = Router();

authRouter.post("/login", limitadores.loginPorIp, limitadores.loginPorCuenta, asyncHandler(AuthController.login));
authRouter.post(
  "/cambiar-password",
  requireAuthPermitiendoCambioPassword,
  limitadores.cambioPassword,
  asyncHandler(AuthController.cambiarPassword)
);
// Publica: la manda quien olvido su contrasena. No se aplica hasta que Coordinacion o Administracion la aprueba (SCRUM-80).
authRouter.post(
  "/solicitar-cambio-password",
  limitadores.solicitudPasswordPorIp,
  limitadores.solicitudPasswordPorCuenta,
  asyncHandler(SolicitudPasswordController.solicitar)
);
