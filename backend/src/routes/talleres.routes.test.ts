import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";

// Solo se prueba quien entra a cada ruta: los servicios se reemplazan por respuestas fijas.
vi.mock("../services/TallerService", () => ({
  TallerService: {
    configuracion: vi.fn(async () => []),
    resultados: vi.fn(async () => ({ periodo: null, minimoRespuestas: 3, carreras: [] })),
    crear: vi.fn(async () => ({ id: 1 })),
    actualizar: vi.fn(async () => ({ id: 1 })),
    habilitarCarrera: vi.fn(async () => ({ programaEducativoId: 1, evaluaTalleres: true })),
  },
}));
vi.mock("../services/EvaluacionTallerService", () => ({
  EvaluacionTallerService: {
    listar: vi.fn(async () => ({ habilitado: false, periodo: null, talleres: [] })),
    instrumento: vi.fn(async () => ({})),
    registrar: vi.fn(async () => undefined),
  },
}));

import { talleresRouter } from "./talleres.routes";
import { estudianteRouter } from "./estudiante.routes";
import { EvaluacionTallerService } from "../services/EvaluacionTallerService";
import { TallerService } from "../services/TallerService";
import { signToken } from "../utils/jwt";

function tokenDe(...roles: string[]) {
  return signToken({ sub: 7, numeroCuenta: "A1", correo: "a@x.mx", tipoCuenta: roles[0] as never, roles, jti: "j", debeCambiarPassword: false });
}

let servidor: Server;
let base = "";

beforeAll(async () => {
  process.env.JWT_SECRET = "secreto-de-prueba";
  const app = express();
  app.use(express.json());
  app.use("/talleres", talleresRouter);
  app.use("/estudiante", estudianteRouter);
  await new Promise<void>((resolve) => {
    servidor = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(() => {
  servidor.close();
});

async function pedir(metodo: string, ruta: string, token?: string, cuerpo?: unknown) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
    body: cuerpo === undefined || metodo === "GET" ? undefined : JSON.stringify(cuerpo),
  });
  return respuesta.status;
}

const RUTAS_COORDINACION: [string, string, number][] = [
  ["GET", "/talleres", 200],
  ["GET", "/talleres/resultados", 200],
  ["POST", "/talleres", 201],
  ["PATCH", "/talleres/3", 200],
  ["PATCH", "/talleres/carreras/2", 200],
];

describe("permisos de /api/talleres", () => {
  it("sin sesion responde 401", async () => {
    for (const [metodo, ruta] of RUTAS_COORDINACION) expect(await pedir(metodo, ruta, undefined, {}), `${metodo} ${ruta}`).toBe(401);
  });

  it("alumnos y docentes reciben 403 en toda la configuracion y los resultados", async () => {
    for (const rol of ["Estudiante", "Docente"]) {
      for (const [metodo, ruta] of RUTAS_COORDINACION) expect(await pedir(metodo, ruta, tokenDe(rol), {}), `${rol} ${metodo} ${ruta}`).toBe(403);
    }
    expect(vi.mocked(TallerService.crear)).not.toHaveBeenCalled();
  });

  it("Coordinador y Administrador entran a todo", async () => {
    for (const rol of ["Coordinador", "Administrador"]) {
      for (const [metodo, ruta, esperado] of RUTAS_COORDINACION) expect(await pedir(metodo, ruta, tokenDe(rol), {}), `${rol} ${metodo} ${ruta}`).toBe(esperado);
    }
  });
});

describe("talleres del alumno (/api/estudiante/talleres)", () => {
  it("piden sesion", async () => {
    expect(await pedir("GET", "/estudiante/talleres")).toBe(401);
    expect(await pedir("GET", "/estudiante/talleres/instrumento")).toBe(401);
    expect(await pedir("POST", "/estudiante/talleres/5/respuestas", undefined, { respuestas: {} })).toBe(401);
  });

  it("con sesion responden y solo mandan las respuestas al servicio, con el usuario del token", async () => {
    const token = tokenDe("Estudiante");
    expect(await pedir("GET", "/estudiante/talleres", token)).toBe(200);
    expect(await pedir("POST", "/estudiante/talleres/5/respuestas", token, { respuestas: { 1: 10 }, estudianteId: 99 })).toBe(201);
    expect(vi.mocked(EvaluacionTallerService.registrar)).toHaveBeenCalledWith(7, "5", { 1: 10 });
  });
});
