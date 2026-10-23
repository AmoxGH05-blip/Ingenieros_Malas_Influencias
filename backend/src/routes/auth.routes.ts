import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
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
authRouter.post("/forgot-password", limitadores.recuperacion, asyncHandler(AuthController.forgotPassword));
authRouter.post("/reset-password", limitadores.recuperacion, asyncHandler(AuthController.resetPassword));
