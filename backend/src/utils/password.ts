/** Politica de contrasenas, compartida por login, altas, cambio y recuperacion. */
export const PASSWORD_MIN_CARACTERES = 8;
// bcrypt solo usa los primeros 72 BYTES: contar caracteres no basta, porque ñ, acentos y emojis ocupan mas de uno.
export const PASSWORD_MAX_BYTES = 72;

export const MENSAJE_POLITICA_PASSWORD = `La contrasena debe tener al menos ${PASSWORD_MIN_CARACTERES} caracteres y no mas de ${PASSWORD_MAX_BYTES} bytes (los acentos, la ñ y los emojis cuentan mas de uno)`;

export function passwordValida(valor: unknown): valor is string {
  return (
    typeof valor === "string" && valor.length >= PASSWORD_MIN_CARACTERES && Buffer.byteLength(valor, "utf8") <= PASSWORD_MAX_BYTES
  );
}

function primerosBytes(valor: string): Buffer {
  return Buffer.from(valor, "utf8").subarray(0, PASSWORD_MAX_BYTES);
}

/** Dos contrasenas son la misma para bcrypt si coinciden en los primeros 72 bytes. */
export function mismaPasswordParaBcrypt(a: string, b: string): boolean {
  return primerosBytes(a).equals(primerosBytes(b));
}
