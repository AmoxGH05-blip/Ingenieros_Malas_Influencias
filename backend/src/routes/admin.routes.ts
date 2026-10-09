import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("Administrador"));

adminRouter.get("/catalogos", asyncHandler(AdminController.catalogos));
adminRouter.get("/usuarios", asyncHandler(AdminController.listarUsuarios));
adminRouter.post("/usuarios", asyncHandler(AdminController.crearUsuario));
