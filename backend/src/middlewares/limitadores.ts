import type { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export interface OpcionesLimitadores {
  ventanaMs?: number;
  intentosLoginPorIp?: number;
  intentosLoginPorCuenta?: number;
  intentosCambioPassword?: number;
  intentosRecuperacion?: number;
}

const QUINCE_MINUTOS_MS = 15 * 60 * 1000;
const MENSAJE = { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };

function ipDe(req: Request): string {
  return ipKeyGenerator(req.ip ?? "desconocida");
}

/**
 * Limites contra la fuerza bruta. Los numeros de cuenta son predecibles y las contrasenas temporales las
 * elige una persona, asi que sin esto adivinar una contrasena es solo cuestion de tiempo (y cada intento
 * cuesta un bcrypt). Cuentan solo los intentos fallidos; una vez alcanzado el limite, ni la contrasena
 * correcta pasa hasta que termine la ventana. Los contadores viven en memoria (un solo servidor).
 */
export function crearLimitadores(opciones: OpcionesLimitadores = {}) {
  const base = { windowMs: opciones.ventanaMs ?? QUINCE_MINUTOS_MS, standardHeaders: "draft-7" as const, legacyHeaders: false, message: MENSAJE };

  return {
    /** Tope general por IP, aunque se pruebe una cuenta distinta en cada intento. */
    loginPorIp: rateLimit({ ...base, limit: opciones.intentosLoginPorIp ?? 30, skipSuccessfulRequests: true }),
    /** Tope por IP y cuenta: frena probar muchas contrasenas contra una sola cuenta sin dejar fuera a los demas. */
    loginPorCuenta: rateLimit({
      ...base,
      limit: opciones.intentosLoginPorCuenta ?? 5,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${ipDe(req)}:${String(req.body?.numeroCuenta ?? "").trim().toUpperCase()}`,
    }),
    /** Va despues de requireAuth: se limita por usuario, porque quien cambia su contrasena ya tiene sesion. */
    cambioPassword: rateLimit({
      ...base,
      limit: opciones.intentosCambioPassword ?? 10,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => (req.usuarioId ? `usuario:${req.usuarioId}` : ipDe(req)),
    }),
    /** Recuperacion por correo (se retira con SCRUM-80): por IP, cuente o no el intento. */
    recuperacion: rateLimit({ ...base, limit: opciones.intentosRecuperacion ?? 10 }),
  };
}

export const limitadores = crearLimitadores();
