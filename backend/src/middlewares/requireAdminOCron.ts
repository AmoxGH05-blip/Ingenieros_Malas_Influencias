import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import { requireAuth } from "./requireAuth";
import { requireRole } from "./requireRole";

const CABECERA_CRON = "x-cron-secret";

function secretoValido(recibido: string | undefined): boolean {
  const esperado = process.env.CRON_SECRET;
  if (!esperado || !recibido) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Deja pasar a un cron externo (cabecera x-cron-secret igual a CRON_SECRET) o, si no la trae,
 * exige sesion de Administrador. Sin CRON_SECRET configurado la via del cron queda cerrada.
 */
export function requireAdminOCron(req: Request, res: Response, next: NextFunction) {
  if (secretoValido(req.header(CABECERA_CRON))) return next();
  requireAuth(req, res, (error?: unknown) => {
    if (error) return next(error);
    requireRole("Administrador")(req, res, next);
  });
}
