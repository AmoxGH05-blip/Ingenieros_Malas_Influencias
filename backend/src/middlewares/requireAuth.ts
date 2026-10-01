import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuarioId?: number;
      roles?: string[];
    }
  }
}

/** Exige un JWT valido en el header Authorization: Bearer <token>. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const payload = verifyToken(token);
    req.usuarioId = payload.sub;
    req.roles = payload.roles;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }
}
