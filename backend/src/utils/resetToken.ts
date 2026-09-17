import crypto from "crypto";

export function generarTokenRecuperacion(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashearToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
