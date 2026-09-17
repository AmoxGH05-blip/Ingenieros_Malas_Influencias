import { describe, expect, it } from "vitest";
import { generarTokenRecuperacion, hashearToken } from "./resetToken";

describe("generarTokenRecuperacion / hashearToken", () => {
  it("genera un token distinto en cada llamada", () => {
    const primero = generarTokenRecuperacion();
    const segundo = generarTokenRecuperacion();

    expect(primero.token).not.toBe(segundo.token);
  });

  it("el hash guardable coincide con hashear el token crudo por separado", () => {
    const { token, tokenHash } = generarTokenRecuperacion();

    expect(hashearToken(token)).toBe(tokenHash);
  });

  it("el token crudo nunca es igual a su propio hash", () => {
    const { token, tokenHash } = generarTokenRecuperacion();

    expect(token).not.toBe(tokenHash);
  });

  it("produce un hash hexadecimal de 64 caracteres (sha256)", () => {
    const { tokenHash } = generarTokenRecuperacion();

    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
