import { DatosInvalidosError } from "./errores";

const NUMERO_CUENTA_REGEX = /^[A-Z0-9]{1,20}$/;
// Mayor entero que cabe en una columna INTEGER de PostgreSQL; con uno mayor la base responde "out of range" (un 500).
const ENTERO_MAXIMO = 2_147_483_647;

/** Texto recortado de hasta `max` caracteres. Con `requerido=false`, vacio o ausente da null. */
export function texto(valor: unknown, campo: string, max: number, requerido = true): string | null {
  if (valor === undefined || valor === null || valor === "") {
    if (requerido) throw new DatosInvalidosError(`${campo} es requerido`);
    return null;
  }
  if (typeof valor !== "string" || valor.trim().length === 0 || valor.trim().length > max) {
    throw new DatosInvalidosError(`${campo} invalido (maximo ${max} caracteres)`);
  }
  return valor.trim();
}

/** Letras y numeros sin espacios, en mayusculas: es lo que se teclea para iniciar sesion. */
export function numeroCuentaValido(valor: unknown): string {
  const numero = texto(valor, "numeroCuenta", 20)!.toUpperCase();
  if (!NUMERO_CUENTA_REGEX.test(numero)) {
    throw new DatosInvalidosError("numeroCuenta solo puede tener letras y numeros, sin espacios (maximo 20)");
  }
  return numero;
}

/**
 * Entero del cuerpo o de la URL: un numero entero o un texto de solo digitos. No acepta true, [3], "0x10" ni "1e3",
 * que Number() daria por buenos.
 */
function aEntero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isInteger(valor) ? valor : null;
  if (typeof valor === "string" && /^\d{1,10}$/.test(valor)) return Number(valor);
  return null;
}

/** Id (entero positivo que cabe en la base). */
export function entero(valor: unknown, campo: string): number {
  const numero = aEntero(valor);
  if (numero === null || numero <= 0 || numero > ENTERO_MAXIMO) {
    throw new DatosInvalidosError(`${campo} es requerido`);
  }
  return numero;
}

/** Entero entre `min` y `max`; si no se manda, `porDefecto`. */
export function enteroEnRango(valor: unknown, campo: string, min: number, max: number, porDefecto: number): number {
  if (valor === undefined || valor === null || valor === "") return porDefecto;
  const numero = aEntero(valor);
  if (numero === null || numero < min || numero > max) {
    throw new DatosInvalidosError(`${campo} debe ser un entero entre ${min} y ${max}`);
  }
  return numero;
}
