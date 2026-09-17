import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { apiRouter } from "./routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});
