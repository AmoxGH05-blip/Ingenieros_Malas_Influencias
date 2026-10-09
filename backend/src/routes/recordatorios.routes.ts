import { Router } from "express";
import { RecordatorioController } from "../controllers/RecordatorioController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAdminOCron } from "../middlewares/requireAdminOCron";

export const recordatoriosRouter = Router();

recordatoriosRouter.post("/ejecutar", requireAdminOCron, asyncHandler(RecordatorioController.ejecutar));
