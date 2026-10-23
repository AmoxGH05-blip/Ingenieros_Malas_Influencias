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

function autenticar(permitirCambioPendiente: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Token invalido o expirado" });
    }

    // La contrasena la puso otra persona: hasta cambiarla, la sesion solo sirve para eso.
    if (payload.debeCambiarPassword && !permitirCambioPendiente) {
      return res
        .status(403)
        .json({ error: "Debes cambiar tu contrasena antes de continuar", codigo: "CAMBIO_PASSWORD_REQUERIDO" });
    }

    req.usuarioId = payload.sub;
    req.roles = payload.roles;
    next();
  };
}

/** Exige un JWT valido en el header Authorization: Bearer <token>, y que la contrasena no este pendiente de cambio. */
export const requireAuth = autenticar(false);

/** Igual que requireAuth, pero deja pasar a quien debe cambiar su contrasena: solo para la ruta que la cambia. */
export const requireAuthPermitiendoCambioPassword = autenticar(true);
