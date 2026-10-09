import { Request, Response } from "express";
import { CoordinacionService } from "../services/CoordinacionService";

/** Convierte un query param opcional a entero; undefined si no viene, null si es invalido. */
function enteroOpcional(valor: unknown): number | undefined | null {
  if (valor === undefined || valor === "") return undefined;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

export const CoordinacionController = {
  async filtros(_req: Request, res: Response) {
    return res.json(await CoordinacionService.obtenerFiltros());
  },

  async avance(req: Request, res: Response) {
    const periodoId = enteroOpcional(req.query.periodoId);
    const programaEducativoId = enteroOpcional(req.query.programaEducativoId);
    const grupoId = enteroOpcional(req.query.grupoId);
    if (periodoId === null || programaEducativoId === null || grupoId === null) {
      return res.status(400).json({ error: "Los filtros deben ser numeros enteros positivos" });
    }
    return res.json(await CoordinacionService.obtenerAvance({ periodoId, programaEducativoId, grupoId }));
  },
};
