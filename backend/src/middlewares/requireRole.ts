import { NextFunction, Request, Response } from "express";

/** Debe ir despues de requireAuth. Deja pasar solo si el JWT trae alguno de los roles indicados. */
export function requireRole(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tieneRol = (req.roles ?? []).some((rol) => rolesPermitidos.includes(rol));
    if (!tieneRol) {
      return res.status(403).json({ error: "No tienes permiso para esta accion" });
    }
    next();
  };
}
