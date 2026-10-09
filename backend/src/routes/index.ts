import { Router } from "express";
import { rolesRouter } from "./roles.routes";
import { authRouter } from "./auth.routes";
import { estudianteRouter } from "./estudiante.routes";
import { adminRouter } from "./admin.routes";
import { coordinacionRouter } from "./coordinacion.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/roles", rolesRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/estudiante", estudianteRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/coordinacion", coordinacionRouter);
