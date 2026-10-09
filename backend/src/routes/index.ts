import { Router } from "express";
import { rolesRouter } from "./roles.routes";
import { authRouter } from "./auth.routes";
import { estudianteRouter } from "./estudiante.routes";
import { adminRouter } from "./admin.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/roles", rolesRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/estudiante", estudianteRouter);
apiRouter.use("/admin", adminRouter);
