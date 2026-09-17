import { beforeEach, describe, expect, it } from "vitest";
import { signToken, verifyToken, type AppJwtPayload } from "./jwt";

const PAYLOAD: AppJwtPayload = {
  sub: 1,
  correo: "usuario@prueba.local",
  tipoCuenta: "Estudiante",
  roles: ["Estudiante"],
  jti: "jti-de-prueba",
};

beforeEach(() => {
  process.env.JWT_SECRET = "secreto-de-pruebas";
  process.env.SESSION_DURATION_HOURS = "8";
});

describe("signToken / verifyToken", () => {
  it("firma y verifica un token, preservando el payload", () => {
    const token = signToken(PAYLOAD);
    const verificado = verifyToken(token);

    expect(verificado.sub).toBe(PAYLOAD.sub);
    expect(verificado.correo).toBe(PAYLOAD.correo);
    expect(verificado.roles).toEqual(PAYLOAD.roles);
    expect(verificado.jti).toBe(PAYLOAD.jti);
  });

  it("rechaza un token firmado con un secreto distinto", () => {
    const token = signToken(PAYLOAD);
    process.env.JWT_SECRET = "otro-secreto";

    expect(() => verifyToken(token)).toThrow();
  });

  it("rechaza un token manipulado", () => {
    const token = signToken(PAYLOAD);
    const tokenManipulado = `${token.slice(0, -2)}xx`;

    expect(() => verifyToken(tokenManipulado)).toThrow();
  });

  it("falla explicitamente si JWT_SECRET no esta configurado", () => {
    delete process.env.JWT_SECRET;

    expect(() => signToken(PAYLOAD)).toThrow("JWT_SECRET no esta configurado");
  });
});
