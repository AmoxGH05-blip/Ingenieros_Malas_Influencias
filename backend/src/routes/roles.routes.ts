import { Router } from "express";
import { RolController } from "../controllers/RolController";
import { asyncHandler } from "../middlewares/asyncHandler";

export const rolesRouter = Router();

rolesRouter.get("/", asyncHandler(RolController.listar));
