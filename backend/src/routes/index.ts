import { Router } from "express";
import { rolesRouter } from "./roles.routes";
import { authRouter } from "./auth.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/roles", rolesRouter);
apiRouter.use("/auth", authRouter);
