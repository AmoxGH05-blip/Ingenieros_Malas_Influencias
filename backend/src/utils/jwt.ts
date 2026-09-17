import jwt from "jsonwebtoken";

export interface AppJwtPayload {
  sub: number;
  correo: string;
  tipoCuenta: "Estudiante" | "Docente";
  roles: string[];
  jti: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no esta configurado");
  }
  return secret;
}

export function getSessionDurationHours(): number {
  return Number(process.env.SESSION_DURATION_HOURS ?? 8);
}

export function signToken(payload: AppJwtPayload): string {
  const expiresIn = `${getSessionDurationHours()}h`;
  return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): AppJwtPayload {
  return jwt.verify(token, getSecret()) as unknown as AppJwtPayload;
}
