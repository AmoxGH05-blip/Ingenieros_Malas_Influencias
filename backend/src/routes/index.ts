import { Router } from "express";
import { rolesRouter } from "./roles.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/roles", rolesRouter);
