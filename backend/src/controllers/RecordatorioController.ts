import { Request, Response } from "express";
import { RecordatorioService } from "../services/RecordatorioService";

export const RecordatorioController = {
  async ejecutar(req: Request, res: Response) {
    const simular = req.query.simular;
    if (simular !== undefined && simular !== "true" && simular !== "false") {
      return res.status(400).json({ error: "simular debe ser true o false" });
    }
    return res.json(await RecordatorioService.ejecutar({ simular: simular === "true" }));
  },
};
