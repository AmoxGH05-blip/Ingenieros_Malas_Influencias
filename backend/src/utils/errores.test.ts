import { describe, expect, it } from "vitest";
import { esViolacionDeUnicidad } from "./errores";

describe("esViolacionDeUnicidad", () => {
  it("reconoce el codigo 23505 de PostgreSQL, directo o dentro de driverError (TypeORM)", () => {
    expect(esViolacionDeUnicidad({ code: "23505" })).toBe(true);
    expect(esViolacionDeUnicidad({ driverError: { code: "23505" } })).toBe(true);
  });

  it("no confunde otros errores", () => {
    expect(esViolacionDeUnicidad({ code: "23503" })).toBe(false);
    expect(esViolacionDeUnicidad(new Error("boom"))).toBe(false);
    expect(esViolacionDeUnicidad(null)).toBe(false);
    expect(esViolacionDeUnicidad("23505")).toBe(false);
  });
});
