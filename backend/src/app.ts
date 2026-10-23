import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { apiRouter } from "./routes";

export const app = express();

// Render pone proxies delante (Render y Cloudflare). El limite de intentos usa CF-Connecting-IP (ver limitadores.ts);
// esto evita ademas que express-rate-limit avise por recibir X-Forwarded-For sin proxy de confianza.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Solo el stack: el objeto completo de un error de TypeORM incluye los parametros de la consulta (p. ej. un hash de contrasena).
  console.error(err instanceof Error ? err.stack : err);
  res.status(500).json({ error: "Error interno del servidor" });
});
