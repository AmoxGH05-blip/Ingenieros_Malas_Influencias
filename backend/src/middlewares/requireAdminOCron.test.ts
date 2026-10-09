import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAdminOCron } from "./requireAdminOCron";
import { signToken } from "../utils/jwt";

function respuestaFalsa() {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

function peticion(cabeceras: Record<string, string>) {
  const minusculas = Object.fromEntries(Object.entries(cabeceras).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    headers: minusculas,
    header: (nombre: string) => minusculas[nombre.toLowerCase()],
  } as unknown as Request;
}

describe("requireAdminOCron", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "secreto-de-prueba";
    process.env.CRON_SECRET = "cron-secreto-largo";
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("deja pasar con el secreto correcto del cron", () => {
    const next = vi.fn();
    requireAdminOCron(peticion({ "x-cron-secret": "cron-secreto-largo" }), respuestaFalsa() as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rechaza con 401 si el secreto es incorrecto y no hay sesion", () => {
    const res = respuestaFalsa();
    const next = vi.fn();
    requireAdminOCron(peticion({ "x-cron-secret": "otro" }), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("con CRON_SECRET sin configurar, un secreto vacio no abre la puerta", () => {
    delete process.env.CRON_SECRET;
    const res = respuestaFalsa();
    const next = vi.fn();
    requireAdminOCron(peticion({ "x-cron-secret": "" }), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("deja pasar a un Administrador con sesion", () => {
    const token = signToken({ sub: 1, correo: "a@x.mx", roles: ["Administrador"], tipoCuenta: "Administrador", jti: "j1" });
    const next = vi.fn();
    requireAdminOCron(peticion({ Authorization: `Bearer ${token}` }), respuestaFalsa() as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rechaza con 403 a un usuario con sesion que no es Administrador", () => {
    const token = signToken({ sub: 2, correo: "b@x.mx", roles: ["Estudiante"], tipoCuenta: "Estudiante", jti: "j2" });
    const res = respuestaFalsa();
    const next = vi.fn();
    requireAdminOCron(peticion({ Authorization: `Bearer ${token}` }), res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
