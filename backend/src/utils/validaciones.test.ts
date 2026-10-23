import { describe, expect, it } from "vitest";
import { entero, enteroEnRango, numeroCuentaValido, texto } from "./validaciones";
import { DatosInvalidosError } from "./errores";

describe("entero (ids)", () => {
  it("acepta enteros positivos, tambien como texto de digitos", () => {
    expect(entero(7, "id")).toBe(7);
    expect(entero("42", "id")).toBe(42);
  });

  it.each([
    ["cero", 0],
    ["negativo", -3],
    ["decimal", 2.5],
    ["texto", "abc"],
    ["booleano", true],
    ["lista", [3]],
    ["hexadecimal", "0x10"],
    ["notacion cientifica", "1e3"],
    ["con espacios", " 5 "],
    ["mayor que lo que cabe en la base", 2_147_483_648],
    ["vacio", ""],
    ["nulo", null],
    ["ausente", undefined],
  ])("rechaza %s", (_caso, valor) => {
    expect(() => entero(valor, "id")).toThrow(DatosInvalidosError);
  });
});

describe("mensajes de entero", () => {
  it("distingue lo que falta de lo que esta mal escrito", () => {
    expect(() => entero(undefined, "grupoId")).toThrow("grupoId es requerido");
    expect(() => entero("abc", "grupoId")).toThrow("grupoId no es valido");
  });
});

describe("enteroEnRango", () => {
  it("usa el valor por defecto cuando no se manda", () => {
    expect(enteroEnRango(undefined, "cupo", 0, 500, 0)).toBe(0);
    expect(enteroEnRango("", "cupo", 0, 500, 9)).toBe(9);
  });

  it("acepta los extremos y rechaza lo que se sale o no es entero", () => {
    expect(enteroEnRango(0, "cupo", 0, 500, 0)).toBe(0);
    expect(enteroEnRango("500", "cupo", 0, 500, 0)).toBe(500);
    for (const malo of [-1, 501, 2.5, "x", true]) {
      expect(() => enteroEnRango(malo, "cupo", 0, 500, 0)).toThrow(DatosInvalidosError);
    }
  });
});

describe("texto y numeroCuentaValido", () => {
  it("recorta el texto y respeta el maximo", () => {
    expect(texto("  hola ", "campo", 10)).toBe("hola");
    expect(() => texto("x".repeat(11), "campo", 10)).toThrow(DatosInvalidosError);
    expect(texto("", "campo", 10, false)).toBeNull();
    expect(() => texto(undefined, "campo", 10)).toThrow(DatosInvalidosError);
  });

  it("el numero de cuenta va en mayusculas y sin simbolos ni espacios", () => {
    expect(numeroCuentaValido(" a2026-1 ".replace("-", ""))).toBe("A20261");
    for (const malo of ["A 1", "A-1", "", "A".repeat(21), 123 as unknown]) {
      expect(() => numeroCuentaValido(malo)).toThrow(DatosInvalidosError);
    }
  });
});
