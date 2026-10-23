import { Router } from "express";
import { rolesRouter } from "./roles.routes";
import { authRouter } from "./auth.routes";
import { estudianteRouter } from "./estudiante.routes";
import { cuentasRouter } from "./cuentas.routes";
import { catalogosRouter } from "./catalogos.routes";
import { coordinacionRouter } from "./coordinacion.routes";
import { notificacionesRouter } from "./notificaciones.routes";
import { AppDataSource } from "../config/data-source";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Consulta minima a la base: el ping diario de GitHub Actions la usa para que Supabase (plan gratuito) no se pause.
// Va aparte de /health, que Render consulta seguido y no debe depender de la base.
// Es publico, asi que la respuesta se guarda 30 s (una rafaga anonima no llega a la base) y la consulta tiene tope de 5 s.
const HEALTH_DB_CACHE_MS = 30_000;
const HEALTH_DB_TIMEOUT_MS = 5_000;
let healthDb: { ok: boolean; hasta: number } | null = null;

function consultarBase(): Promise<unknown> {
  const tope = new Promise((_resolve, reject) => setTimeout(() => reject(new Error("timeout")), HEALTH_DB_TIMEOUT_MS).unref());
  return Promise.race([AppDataSource.query("SELECT 1"), tope]);
}

apiRouter.get("/health/db", async (_req, res) => {
  if (!healthDb || healthDb.hasta < Date.now()) {
    try {
      await consultarBase();
      healthDb = { ok: true, hasta: Date.now() + HEALTH_DB_CACHE_MS };
    } catch (error) {
      console.error("health/db fallo:", error);
      healthDb = { ok: false, hasta: Date.now() + HEALTH_DB_CACHE_MS };
    }
  }
  res.status(healthDb.ok ? 200 : 503).json({ status: healthDb.ok ? "ok" : "error" });
});

apiRouter.use("/roles", rolesRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/estudiante", estudianteRouter);
apiRouter.use("/cuentas", cuentasRouter);
apiRouter.use("/catalogos", catalogosRouter);
apiRouter.use("/coordinacion", coordinacionRouter);
apiRouter.use("/notificaciones", notificacionesRouter);
