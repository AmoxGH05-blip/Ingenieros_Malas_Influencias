import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { asyncHandler } from "../middlewares/asyncHandler";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(AuthController.login));
authRouter.post("/forgot-password", asyncHandler(AuthController.forgotPassword));
authRouter.post("/reset-password", asyncHandler(AuthController.resetPassword));
