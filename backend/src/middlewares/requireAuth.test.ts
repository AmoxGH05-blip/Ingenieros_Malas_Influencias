import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAuth, requireAuthPermitiendoCambioPassword } from "./requireAuth";
import { signToken } from "../utils/jwt";

function respuestaFalsa() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function peticion(token?: string) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {} } as unknown as Request;
}

function tokenDe(debeCambiarPassword: boolean) {
  return signToken({
    sub: 7,
    numeroCuenta: "A1",
    correo: "a@x.mx",
    tipoCuenta: "Estudiante",
    roles: ["Estudiante"],
    jti: "j",
    debeCambiarPassword,
  });
}

beforeEach(() => {
  process.env.JWT_SECRET = "secreto-de-prueba";
});

describe("requireAuth", () => {
  it("deja pasar un token valido y llena usuarioId y roles", () => {
    const req = peticion(tokenDe(false));
    const next = vi.fn();
    requireAuth(req, respuestaFalsa() as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.usuarioId).toBe(7);
    expect(req.roles).toEqual(["Estudiante"]);
  });

  it("responde 401 sin token o con token invalido", () => {
    for (const req of [peticion(), peticion("token-roto")]) {
      const res = respuestaFalsa();
      const next = vi.fn();
      requireAuth(req, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("responde 403 con un codigo claro mientras la contrasena deba cambiarse", () => {
    const res = respuestaFalsa();
    const next = vi.fn();
    requireAuth(peticion(tokenDe(true)), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "CAMBIO_PASSWORD_REQUERIDO" }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireAuthPermitiendoCambioPassword", () => {
  it("deja pasar aunque la contrasena deba cambiarse (es la ruta para cambiarla)", () => {
    const next = vi.fn();
    requireAuthPermitiendoCambioPassword(peticion(tokenDe(true)), respuestaFalsa() as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("sigue exigiendo un token valido", () => {
    const res = respuestaFalsa();
    const next = vi.fn();
    requireAuthPermitiendoCambioPassword(peticion(), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
