import { describe, expect, it } from "vitest";
import { MENSAJE_POLITICA_PASSWORD, mismaPasswordParaBcrypt, passwordValida } from "./password";

describe("passwordValida", () => {
  it("acepta de 8 caracteres y hasta 72 bytes", () => {
    expect(passwordValida("12345678")).toBe(true);
    expect(passwordValida("x".repeat(72))).toBe(true);
  });

  it("rechaza menos de 8 caracteres", () => {
    expect(passwordValida("1234567")).toBe(false);
    expect(passwordValida("")).toBe(false);
  });

  it("rechaza mas de 72 bytes aunque tenga menos de 72 caracteres (acentos y ñ ocupan 2 bytes)", () => {
    expect(passwordValida("ñ".repeat(36))).toBe(true); // 72 bytes exactos
    expect(passwordValida("ñ".repeat(37))).toBe(false); // 74 bytes
    expect(passwordValida("x".repeat(73))).toBe(false);
  });

  it("rechaza lo que no es texto", () => {
    expect(passwordValida(undefined)).toBe(false);
    expect(passwordValida(12345678)).toBe(false);
    expect(passwordValida(null)).toBe(false);
  });

  it("el mensaje de la politica menciona los bytes", () => {
    expect(MENSAJE_POLITICA_PASSWORD).toMatch(/72 bytes/);
  });
});

describe("mismaPasswordParaBcrypt", () => {
  it("detecta contrasenas iguales", () => {
    expect(mismaPasswordParaBcrypt("ClaveSegura1", "ClaveSegura1")).toBe(true);
    expect(mismaPasswordParaBcrypt("ClaveSegura1", "ClaveSegura2")).toBe(false);
  });

  it("bcrypt solo usa los primeros 72 bytes: dos contrasenas que difieren despues son la misma", () => {
    const base = "a".repeat(72);
    expect(mismaPasswordParaBcrypt(base + "X", base + "Y")).toBe(true);
    expect(mismaPasswordParaBcrypt(base + "X", "b" + base.slice(1))).toBe(false);
  });
});
